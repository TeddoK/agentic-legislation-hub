// Base URL for the FastAPI backend.
// Configurable via NEXT_PUBLIC_API_URL for deployed environments;
// falls back to the local dev server.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000"
