# index/build_index.py

import os
import sys
import json
import pathlib
import time
import concurrent.futures
from typing import List, Tuple
from urllib.parse import urljoin, urlparse, urlunparse
import traceback

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

from llama_index.core import Document, VectorStoreIndex, StorageContext, Settings
from llama_index.embeddings.fastembed import FastEmbedEmbedding

ROOT = pathlib.Path(__file__).parent.parent
sys.path.append(str(ROOT))
load_dotenv(ROOT / ".env")

# Centralized sites list
from sites.sites_config import SITES

# Local, locally-embedded vector index (replaces the OpenAI-embedded LlamaCloud
# index). Embeddings run on-device via fastembed (ONNX) so there is no API
# rate limit or cost for building or querying; Gemini is used only for the LLM.
INDEX_DIR = ROOT / "index_storage"
SALVAGED_DOCS = ROOT / "salvaged_documents.json"
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5")


def get_embed_model():
    """Local fastembed embeddings — used for both index building and querying."""
    return FastEmbedEmbedding(model_name=EMBED_MODEL)


def load_salvaged_documents() -> List["Document"]:
    """Load the corpus previously exported from LlamaCloud (no re-scrape)."""
    raw = json.loads(SALVAGED_DOCS.read_text(encoding="utf-8"))
    docs = []
    for item in raw:
        text = item.get("text", "")
        if text.strip():
            md = item.get("metadata", {}) or {}
            docs.append(Document(text=text, extra_info=md, doc_id=md.get("url")))
    print(f"Loaded {len(docs)} salvaged documents from {SALVAGED_DOCS.name}")
    return docs

# Crawler settings
UA = {"User-Agent": "AgenticCrawler/0.2"}
MAX_PAGES_PER_SITE = 100
MAX_DEPTH = 2
MAX_WORKERS = 20

def fetch_url(url: str) -> Tuple[str, str | None]:
    try:
        resp = requests.get(url, headers=UA, timeout=10)
        resp.raise_for_status()
        return url, resp.text
    except Exception:
        return url, None

def crawl_site(seed: str, max_pages: int, max_depth: int) -> List[str]:
    """BFS crawl up to max_pages within the same domain, depth-limited."""
    seen = {seed}
    frontier = [seed]
    all_urls = [seed]
    domain = urlparse(seed).netloc

    for depth in range(max_depth + 1):
        if not frontier or len(all_urls) >= max_pages:
            break
        next_frontier = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as exe:
            futures = [exe.submit(fetch_url, url) for url in frontier]
            for fut in concurrent.futures.as_completed(futures):
                url, html = fut.result()
                if not html:
                    continue
                soup = BeautifulSoup(html, "html.parser")
                for a in soup.find_all("a", href=True):
                    link = urljoin(url, a["href"].split("#")[0])
                    parsed = urlparse(link)
                    if parsed.netloc != domain:
                        continue
                    canonical = urlunparse(parsed._replace(fragment="", query=""))
                    if canonical not in seen:
                        seen.add(canonical)
                        all_urls.append(canonical)
                        next_frontier.append(canonical)
                        if len(all_urls) >= max_pages:
                            break
                if len(all_urls) >= max_pages:
                    break
        frontier = next_frontier

    return all_urls[:max_pages]

def gather_documents() -> List[Document]:
    """Fetch and wrap every crawled URL as a clean LlamaIndex Document."""
    docs: List[Document] = []
    for site in SITES:
        name = site["name"]
        seed = site["seed_url"]
        print(f"Crawling {name}: {seed} …")
        urls = crawl_site(seed, MAX_PAGES_PER_SITE, MAX_DEPTH)
        print(f" found {len(urls)} URLs")

        # parallel fetch of page texts
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as exe:
            futures = [exe.submit(fetch_url, url) for url in urls]
            for fut in concurrent.futures.as_completed(futures):
                url, html = fut.result()
                if not html:
                    continue

                soup = BeautifulSoup(html, "html.parser")
                clean_text = soup.get_text(separator="\n", strip=True)

                # filter out very short or very long docs
                if 200 < len(clean_text) < 100_000:
                    docs.append(
                        Document(
                            text=clean_text,
                            extra_info={"url": url, "site": name},
                            doc_id=url
                        )
                    )

    print(f"Gathered {len(docs)} documents total")
    return docs

def build_or_update(use_salvaged: bool = True) -> int:
    """
    Build the local vector index with local (fastembed) embeddings and persist
    it to INDEX_DIR. Prefers the salvaged LlamaCloud corpus (no network); falls
    back to a live crawl of SITES if the salvage file is absent.
    """
    if use_salvaged and SALVAGED_DOCS.exists():
        docs = load_salvaged_documents()
    else:
        docs = gather_documents()

    if not docs:
        print("No documents to ingest.")
        return 0

    Settings.embed_model = get_embed_model()
    print(f"Embedding {len(docs)} documents locally with {EMBED_MODEL} …")
    index = VectorStoreIndex.from_documents(docs, show_progress=True)
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    index.storage_context.persist(persist_dir=str(INDEX_DIR))
    print(f"Persisted local index ({len(docs)} docs) to {INDEX_DIR}")
    return len(docs)


if __name__ == "__main__":
    count = build_or_update()
    print(f"Done. Ingested {count} docs.")
