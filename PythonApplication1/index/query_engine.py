# index/query_engine.py

import os
import pathlib
from dotenv import load_dotenv

from llama_index.core import StorageContext, load_index_from_storage, Settings
from llama_index.llms.openai_like import OpenAILike
from llama_index.embeddings.fastembed import FastEmbedEmbedding

ROOT = pathlib.Path(__file__).parent.parent
load_dotenv(ROOT / ".env")   # loads LLM_API_KEY etc.

# Retrieval uses local (fastembed) embeddings — no API rate limit or cost.
# The LLM (any OpenAI-compatible provider; currently Groq) is used only for
# answer synthesis.
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5")
INDEX_DIR = ROOT / "index_storage"


def _llm():
    return OpenAILike(
        model=LLM_MODEL,
        api_base=LLM_BASE_URL,
        api_key=LLM_API_KEY,
        is_chat_model=True,
        is_function_calling_model=False,
        context_window=128_000,
        temperature=0.0,
    )


def _embed_model():
    # Must match the model used at build time so query vectors share the
    # document vector space.
    return FastEmbedEmbedding(model_name=EMBED_MODEL)


def load_engine():
    """
    Build a query engine backed by the local Gemini-embedded vector index,
    using Gemini for answer synthesis.
    """
    # The embed model must match the one used at build time so query vectors
    # land in the same space as the stored document vectors.
    Settings.embed_model = _embed_model()
    Settings.llm = _llm()

    storage = StorageContext.from_defaults(persist_dir=str(INDEX_DIR))
    index = load_index_from_storage(storage)
    return index.as_query_engine(llm=_llm())
