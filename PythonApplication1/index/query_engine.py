# index/query_engine.py

import os
import pathlib
from dotenv import load_dotenv

from llama_index.core import StorageContext, load_index_from_storage, Settings
from llama_index.llms.openai_like import OpenAILike
from llama_index.embeddings.fastembed import FastEmbedEmbedding

ROOT = pathlib.Path(__file__).parent.parent
load_dotenv(ROOT / ".env")   # loads GEMINI_API_KEY

# Retrieval uses local (fastembed) embeddings — no API rate limit or cost.
# Gemini (via its OpenAI-compatible endpoint) is used only for answer synthesis.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_BASE_URL = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5")
INDEX_DIR = ROOT / "index_storage"


def _gemini_llm():
    return OpenAILike(
        model=GEMINI_MODEL,
        api_base=GEMINI_BASE_URL,
        api_key=GEMINI_API_KEY,
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
    Settings.llm = _gemini_llm()

    storage = StorageContext.from_defaults(persist_dir=str(INDEX_DIR))
    index = load_index_from_storage(storage)
    return index.as_query_engine(llm=_gemini_llm())
