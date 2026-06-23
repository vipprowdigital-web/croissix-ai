export interface AdminInfo {
  id: string;
  name: string;
  email: string;
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function getAdminInfo(): AdminInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("admin_info");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, admin: AdminInfo) {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_info", JSON.stringify(admin));
}

export function clearAuth() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_info");
}
