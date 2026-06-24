// lib/callbackUrl.ts
const CALLBACK_KEY = "croissix_callback";

/**
 * Reads `callback` from the given params (or current URL if omitted).
 * If present, persists it to sessionStorage so it survives any later
 * navigation that drops the query string. If absent, falls back to
 * whatever was last stashed in this session.
 */
export function resolveCallback(
  params?: URLSearchParams | null,
): string | null {
  if (typeof window === "undefined") return null;

  const p = params ?? new URLSearchParams(window.location.search);
  const fromUrl = p.get("callback");

  try {
    if (fromUrl) {
      sessionStorage.setItem(CALLBACK_KEY, fromUrl);
      return fromUrl;
    }
    return sessionStorage.getItem(CALLBACK_KEY);
  } catch {
    // sessionStorage unavailable (private mode, etc.)
    return fromUrl;
  }
}

export function clearStoredCallback() {
  try {
    sessionStorage.removeItem(CALLBACK_KEY);
  } catch {}
}
