# api/app.py

import os
import re
import json
from pathlib import Path
from datetime import date
from typing import List, Dict

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from openai import OpenAI

from index.query_engine import load_engine
from index.build_index import build_or_update
from processing.classify_impact import classify_components

# Configuration
# The LLM is any OpenAI-compatible provider (currently Groq), so the standard
# OpenAI SDK works by pointing it at the provider's base URL.
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
CLIENT = OpenAI(
    api_key=os.getenv("LLM_API_KEY"),
    base_url=LLM_BASE_URL,
)
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "supersecret")
COOKIE_DIR = Path(__file__).parent.parent / "cookie_banners"


def parse_json(content: str):
    """
    Parse a JSON object/array from an LLM response. Gemini (and others) often
    wrap JSON in ```json ... ``` fences or add prose around it, so we strip
    fences and fall back to extracting the first {...} or [...] block.
    Raises json.JSONDecodeError if nothing parseable is found.
    """
    text = (content or "").strip()
    # Strip ```json / ``` code fences
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Fall back to the first balanced-looking JSON block in the text
        match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise


def admin_auth(token: str):
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid admin token")

# FastAPI setup
app = FastAPI(title="Agentic Legislation Hub API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

engine = load_engine()

class QueryBody(BaseModel):
    question: str

# /regulations endpoint with conflict detection
@app.get("/regulations")
async def get_regulations():
    today_iso = date.today().isoformat()
    # 1) RAG to list recent & upcoming regs
    query_text = (
        f"List privacy regulations split into two categories:\n"
        f"  • recent (enacted within the last six months, relative to {today_iso})\n"
        f"  • upcoming (scheduled to take effect after {today_iso})\n"
        "Return EXACTLY one JSON object with keys 'recent' and 'upcoming', each an array of objects "
        "with exactly these four keys: 'title', 'date', 'url', and 'jurisdiction'."
    )
    rag_resp = engine.query(query_text)
    draft = str(rag_resp).strip()

    # 2) GPT to enforce schema
    system_prompt = (
        "You are a world-class legal research assistant with knowledge up through May 2025. "
        "Produce EXACTLY one JSON object with keys 'recent' and 'upcoming'. "
        "Each must be an array of objects with exactly these four keys: 'title', 'date', 'url', and 'jurisdiction'."
    )
    oa_resp = CLIENT.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": draft},
        ],
        temperature=0.0,
    )
    content = oa_resp.choices[0].message.content.strip()
    try:
        regs = parse_json(content)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Unable to parse regulations JSON from GPT response"
        )

    # 3) Conflict detection among regs (Option C)
    all_regs = regs.get("recent", []) + regs.get("upcoming", [])
    compare_messages = [
        {"role": "system", "content": (
            "You are a regulations conflict analyst. Given multiple privacy regulations, "
            "identify any direct conflicts (where one rule requires X and another prohibits X). "
            "Return a JSON array of objects with keys: ruleset_idxs (array of two indices), conflict (string), explanation (string). "
            "If there are no conflicts, return a JSON object with ruleset_idxs as [], and provide an explanation why no conflicts were found."
        )},
        {"role": "user", "content": (
            "Here are the regulations to compare:\n\n" +
            "\n\n".join(f"Ruleset {idx}: {json.dumps(r)}" for idx, r in enumerate(all_regs))
        )}
    ]
    comp_resp = CLIENT.chat.completions.create(
        model=MODEL,
        messages=compare_messages,
        temperature=0.0,
    )
    try:
        conflicts: List[Dict] = parse_json(comp_resp.choices[0].message.content)
    except json.JSONDecodeError:
        # wrap AI's narrative into structured form
        raw = comp_resp.choices[0].message.content.strip()
        conflicts = [{"ruleset_idxs": [], "conflict": None, "explanation": raw}]

    # 4) return regs + conflicts
    return {**regs, "conflicts": conflicts}


# /query endpoint
@app.post("/query")
async def query(body: QueryBody):
    # 1) RAG answer
    rag_resp = engine.query(body.question)
    draft = str(rag_resp).strip()

    # 2) metadata
    components, sources = set(), []
    for node in rag_resp.source_nodes:
        meta = node.node.extra_info or {}
        components.update(meta.get("components", []))
        sources.append({
            "title": meta.get("title") or meta.get("url") or "Unknown",
            "url": meta.get("url", ""),
            "date": meta.get("date", "Publication date not specified"),
            "site": meta.get("site", ""),
        })
    components.update(classify_components(draft))

    # 3) GPT polish
    system_prompt = (
        "You are a world-class legal research assistant with knowledge up through May 2025. "
        "Enrich the draft answer with any additional relevant developments."
    )
    user_prompt = f"Question: {body.question}\n\nDraft answer:\n{draft}"
    oa_resp = CLIENT.chat.completions.create(
        model=MODEL,
        messages=[{"role":"system","content":system_prompt},{"role":"user","content":user_prompt}],
        temperature=0.0,
    )
    polished = oa_resp.choices[0].message.content.strip()

    # 4) extract jurisdictions
    juris_prompt = [
        {"role":"system","content":(
            "Extract exactly one JSON array of jurisdictions (e.g. [\"EU\",\"California\"])."
        )},
        {"role":"user","content":polished}
    ]
    juris_resp = CLIENT.chat.completions.create(model=MODEL, messages=juris_prompt, temperature=0.0)
    try:
        jurisdictions = parse_json(juris_resp.choices[0].message.content)
    except Exception:
        jurisdictions = []

    # 5) cookie banner impact — audit all banners in a single LLM call
    banner_files = sorted(COOKIE_DIR.glob("*.json"))
    # Banner configs can be very large (100s of KB); send only a compact,
    # truncated view so the request stays within the LLM's token limits.
    BANNER_CHARS = 1200
    banners = []
    for path in banner_files:
        try:
            cfg = json.loads(path.read_text(encoding="utf-8", errors="ignore"))
        except json.JSONDecodeError:
            continue
        snippet = json.dumps(cfg, ensure_ascii=False)[:BANNER_CHARS]
        banners.append({"file": path.name, "config": snippet})

    banner_assessments = []
    if banners:
        audit_msgs = [
            {"role": "system", "content": (
                "You are a privacy-compliance auditor. For EACH cookie banner provided, decide whether "
                "the given regulations impact it. Return EXACTLY one JSON array, one object per banner, "
                "in the same order, each: {\"file\": \"<file>\", \"impacted\": true|false, \"explanation\": \"...\"}."
            )},
            {"role": "user", "content": (
                f"Regulations:\n{polished}\n\nBanners:\n" +
                "\n".join(f"- {b['file']}: {b['config']}" for b in banners)
            )},
        ]
        resp = CLIENT.chat.completions.create(model=MODEL, messages=audit_msgs, temperature=0.0)
        try:
            parsed = parse_json(resp.choices[0].message.content)
            if isinstance(parsed, dict):
                parsed = [parsed]
            by_file = {a.get("file"): a for a in parsed if isinstance(a, dict)}
            for b in banners:
                a = by_file.get(b["file"], {})
                banner_assessments.append({
                    "file": b["file"],
                    "impacted": a.get("impacted"),
                    "explanation": a.get("explanation", ""),
                })
        except json.JSONDecodeError:
            banner_assessments = [
                {"file": b["file"], "impacted": None,
                 "explanation": "Could not parse auditor response."} for b in banners
            ]

    # 6) return
    return {
        "answer": draft,
        "openai_answer": polished,
        "components_impacted": list(components),
        "locations_impacted": jurisdictions,
        "sources": sources,
        "banner_assessments": banner_assessments,
    }

# /refresh endpoint
@app.post("/refresh")
async def refresh_index(token: str = Depends(admin_auth)):
    count = build_or_update()
    global engine
    engine = load_engine()
    return {"status": "index rebuilt", "document_count": count}
