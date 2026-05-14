/**
 * Shared API helpers for FixMate frontend
 * ────────────────────────────────────────
 * JWT Token storage strategy:
 *   sessionStorage → per-tab (multi-tab independent logins)
 *
 * On login:  store access token in sessionStorage
 * On logout: clear sessionStorage
 * On 401:    auto-refresh via httpOnly refresh token cookie
 */

export const API = "http://localhost:3000";

const TOKEN_KEY = "fixmate_token";

/** Get the current access token (per-tab only) */
export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || null;
}

/** Store access token in sessionStorage */
export function storeToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
}

/** Clear access token from sessionStorage */
export function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
}

/** Returns headers object with Authorization Bearer if token exists */
export function getAuthHeaders() {
    const token = getToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

/** Convenience: JSON headers + auth */
export function jsonAuthHeaders() {
    return { "Content-Type": "application/json", ...getAuthHeaders() };
}

/**
 * Attempt to refresh the access token using the httpOnly refresh cookie.
 * Returns the new token on success, null on failure.
 */
async function refreshAccessToken() {
    try {
        const res = await fetch(`${API}/auth/refresh`, {
            method: "POST",
            credentials: "include", // sends httpOnly cookie
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.token) {
            storeToken(data.token);
            return data.token;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Generic fetch wrapper with auth headers + auto-refresh on 401
 * Usage: const data = await apiFetch("/admin/dashboard-stats");
 */
export async function apiFetch(url, opts = {}) {
    let res = await fetch(`${API}${url}`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(opts.headers || {}) },
        credentials: "include", // always send refresh cookie
        ...opts,
    });

    // If access token expired, try silent refresh
    if (res.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            // Retry with new token
            res = await fetch(`${API}${url}`, {
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${newToken}`, ...(opts.headers || {}) },
                credentials: "include",
                ...opts,
            });
        }
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}
