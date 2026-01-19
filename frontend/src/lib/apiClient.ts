const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export type ApiError = { status: number; message: string };

function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}
function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}
function setTokens(access: string, refresh?: string) {
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
}
function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function rawFetch(input: string, init: RequestInit) {
  const res = await fetch(`${BASE_URL}${input}`, init);
  return res;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  opts: { auth?: boolean } = { auth: true }
): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");

  if (opts.auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await rawFetch(path, { ...init, headers });

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  // nếu 401 -> thử refresh 1 lần
  if (res.status === 401 && opts.auth) {
    const refresh = getRefreshToken();
    if (!refresh) {
      clearTokens();
      throw { status: 401, message: "No refresh token" } as ApiError;
    }

    // gọi refresh
    const refreshRes = await rawFetch("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!refreshRes.ok) {
      clearTokens();
      throw { status: 401, message: "Refresh failed" } as ApiError;
    }

    const refreshed = (await refreshRes.json()) as {
      accessToken: string;
      refreshToken?: string;
    };

    setTokens(refreshed.accessToken, refreshed.refreshToken);

    // retry request cũ với access mới
    const retryHeaders = new Headers(headers);
    retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);

    const retryRes = await rawFetch(path, { ...init, headers: retryHeaders });
    if (!retryRes.ok) {
      const msg = await retryRes.text().catch(() => "");
      throw {
        status: retryRes.status,
        message: msg || "Request failed",
      } as ApiError;
    }
    return (await retryRes.json()) as T;
  }

  const msg = await res.text().catch(() => "");
  throw { status: res.status, message: msg || "Request failed" } as ApiError;
}

export const tokenStore = { setTokens, clearTokens };
