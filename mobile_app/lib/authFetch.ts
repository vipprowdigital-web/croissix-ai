// mobile_app\lib\authFetch.ts
//
// Keeps the session alive for every fetch() call that sends a Bearer token.
//
// The access token is a short-lived JWT. Without this, long-running work
// (e.g. bulk AI replies) fails halfway once the token expires. This wraps
// window.fetch once so that:
//   1. a token that is expired / about to expire is refreshed BEFORE the request
//   2. a 401 response triggers one refresh + one retry
//   3. if the refresh token is also dead, the user is sent to /login
// Axios (lib/axiosClient.ts) has its own 401 interceptor.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const REFRESH_MARGIN_MS = 30_000;

let installed = false;
let refreshing: Promise<string | null> | null = null;

function tokenExpiry(jwt: string): number | null {
  try {
    const payload = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

function forceLogin() {
  try {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  } catch {}
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

export function installAuthFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  // One refresh at a time, shared by all concurrent requests
  const refreshAccessToken = (): Promise<string | null> => {
    if (refreshing) return refreshing;

    refreshing = (async () => {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return null;
      try {
        const res = await originalFetch(`${API_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const json = await res.json();
        if (!json?.accessToken) return null;
        localStorage.setItem("accessToken", json.accessToken);
        return json.accessToken as string;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshing = null;
    });

    return refreshing;
  };

  const isOurs = (url: string) =>
    url.startsWith("/") || (!!API_URL && url.startsWith(API_URL));

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Only handle simple string/URL requests that carry a Bearer token
    if (input instanceof Request) return originalFetch(input, init);

    const url = typeof input === "string" ? input : input.href;
    const headers = new Headers(init?.headers);
    const auth = headers.get("Authorization");

    if (
      !auth?.startsWith("Bearer ") ||
      !isOurs(url) ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/login")
    ) {
      return originalFetch(input, init);
    }

    let token = auth.slice(7);

    const send = (t: string) => {
      const h = new Headers(init?.headers);
      h.set("Authorization", `Bearer ${t}`);
      // ngrok's free-tier warning page has no CORS headers; this skips it
      if (API_URL && url.startsWith(API_URL)) {
        h.set("ngrok-skip-browser-warning", "true");
      }
      return originalFetch(input, { ...init, headers: h });
    };

    // 1. Refresh early if the token is expired or about to be
    const exp = tokenExpiry(token);
    if (exp && exp - Date.now() < REFRESH_MARGIN_MS) {
      const fresh = await refreshAccessToken();
      if (!fresh) {
        forceLogin();
        return send(token); // let the caller see the failure
      }
      token = fresh;
    }

    // 2. Send; on 401 refresh once and retry
    const res = await send(token);
    if (res.status !== 401) return res;

    const fresh = await refreshAccessToken();
    if (!fresh) {
      forceLogin();
      return res;
    }
    return send(fresh);
  };
}
