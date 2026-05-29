# Backend container for the Agentic Legislation Hub API.
# Works on Hugging Face Spaces (Docker SDK), Render, Railway, Cloud Run, etc.
FROM python:3.12-slim

# Writable cache locations (Hugging Face Spaces runs as a non-root user).
ENV HOME=/app \
    HF_HOME=/app/.cache/hf \
    FASTEMBED_CACHE_PATH=/app/.cache/fastembed \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (onnxruntime needs libgomp).
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgomp1 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the embedding model so cold starts don't pay for it.
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('BAAI/bge-small-en-v1.5')"

# App code + prebuilt index + salvaged corpus.
COPY . .

# Default to 7860 (Hugging Face Spaces); hosts that inject $PORT override it.
ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "uvicorn api.app:app --host 0.0.0.0 --port ${PORT:-7860}"]
