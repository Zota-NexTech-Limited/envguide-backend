/**
 * Central API base URL resolver.
 *
 * Priority:
 * 1) Vite env var (if present): import.meta.env.VITE_API_BASE_URL
 * 2) If running the frontend on localhost/127.0.0.1: assume local backend on http://localhost:8000
 * 3) Fallback to production
 */
export function getApiBaseUrl(): string {
  const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL as string | undefined;
  if (envBase && typeof envBase === "string" && envBase.trim()) return envBase.trim().replace(/\/$/, "");

  // Browser context detection
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "http://localhost:8000";
  }

  return "https://enviguide.nextechltd.in";
}

