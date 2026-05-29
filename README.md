# Agentic Legislation Hub

A full-stack app that helps teams track privacy/data-protection regulations and
assess their operational impact. It scrapes legislation and privacy-news
sources, indexes them for retrieval-augmented generation (RAG), and uses an LLM
to answer compliance questions, surface recent/upcoming regulations, detect
conflicts between rules, and audit cookie-banner configurations against the
current regulatory picture.

## Architecture

```
┌─────────────────────────┐        HTTP/JSON        ┌──────────────────────────────┐
│  Next.js 15 frontend    │  ───────────────────▶   │  FastAPI backend             │
│  (React 19, Tailwind,   │   /query  /regulations  │                              │
│   shadcn/ui)            │  ◀───────────────────   │  • RAG over a local vector   │
│  Dashboard + chat UI    │                         │    index (fastembed, local)  │
└─────────────────────────┘                         │  • Groq LLM for synthesis,   │
                                                     │    conflict detection,       │
                                                     │    jurisdiction + banner     │
                                                     │    impact analysis           │
                                                     └──────────────────────────────┘
                                                                    │
                                                     ┌──────────────────────────────┐
                                                     │ Ingestion: BeautifulSoup      │
                                                     │ crawler over 15 privacy/legal │
                                                     │ sources (EDPB, IAPP, UNCTAD,  │
                                                     │ OECD, CPPA, …) → documents     │
                                                     └──────────────────────────────┘
```

### How the AI layer works
- **Embeddings / retrieval** run **locally** via `fastembed` (ONNX,
  `BAAI/bge-small-en-v1.5`) — no API cost or rate limit, instant at query time.
- **Reasoning / synthesis** uses an **OpenAI-compatible LLM** (currently **Groq**,
  `llama-3.3-70b-versatile`); the provider is swappable via env vars, so the
  standard `openai` SDK is reused.
- The vector index is prebuilt and committed (`PythonApplication1/index_storage/`),
  so a deployment serves queries immediately without re-scraping.

## Tech stack
| Layer        | Tech |
|--------------|------|
| Frontend     | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui (Radix) |
| Backend      | Python 3.12, FastAPI, Uvicorn |
| RAG          | LlamaIndex, local fastembed embeddings |
| LLM          | Groq (`llama-3.3-70b-versatile`) — OpenAI-compatible, swappable |
| Ingestion    | requests + BeautifulSoup crawler |

## API
| Method | Route          | Purpose |
|--------|----------------|---------|
| `POST` | `/query`       | Answer a compliance question (RAG + LLM), with sources, impacted components, jurisdictions, and cookie-banner impact. |
| `GET`  | `/regulations` | List recent & upcoming regulations and detect conflicts between them. |
| `POST` | `/refresh`     | (admin) Re-crawl sources and rebuild the index. Requires `ADMIN_TOKEN`. |

## Running locally

### Backend
```bash
cd PythonApplication1
python -m venv .venv
.venv\Scripts\activate            # Windows  (source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
copy .env.example .env            # then add your free Groq API key
uvicorn api.app:app --reload --port 8000
```
Get a free Groq key at https://console.groq.com/keys and set
`LLM_API_KEY` in `.env`.

To rebuild the index from the salvaged corpus (or re-scrape):
```bash
python -m index.build_index
```

### Frontend
```bash
cd FrontEndV0
npm install --legacy-peer-deps
copy .env.local.example .env.local   # set NEXT_PUBLIC_API_URL (default http://127.0.0.1:8000)
npm run dev
```
Open http://localhost:3000.

## Deployment
- **Frontend → Vercel**: import the repo, set **Root Directory = `FrontEndV0`**,
  add env var `NEXT_PUBLIC_API_URL` = your deployed backend URL.
  (`.npmrc` already sets `legacy-peer-deps`.)
- **Backend → Hugging Face Spaces (Docker)** or any container host: build from
  `PythonApplication1/Dockerfile`, set env var `LLM_API_KEY` (and a strong
  `ADMIN_TOKEN`). A `Procfile` + `runtime.txt` are included for Render/Railway.

## Notes
- Secrets are never committed; `.env` is gitignored and `.env.example` documents
  the required variables.
- CORS is currently open (`*`) and `/refresh` uses a simple admin token — both
  would be tightened for a real production deployment.
