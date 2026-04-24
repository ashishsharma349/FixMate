/**
 * Shared API helpers for FixMate frontend
 * ────────────────────────────────────────
 * Session ID storage strategy:
 *   sessionStorage → per-tab (multi-tab independent logins)
 *   localStorage   → persistent (survives browser close, 1 week)
 *
 * On page load: sessionStorage first, fallback to localStorage
 * On login:     write to BOTH
 * On logout:    clear BOTH
 */

export const API = "http://localhost:3000";

const SS_KEY = "fixmate_sid";       // sessionStorage key
const LS_KEY = "fixmate_sid_last";  // localStorage key (persistent)

/** Get the current session ID (per-tab only) */
export function getSessionId() {
    return sessionStorage.getItem(SS_KEY) || null;
}

/** Store session ID in sessionStorage only */
export function storeSessionId(sid) {
    sessionStorage.setItem(SS_KEY, sid);
}

/** Clear session ID from sessionStorage */
export function clearSessionId() {
    sessionStorage.removeItem(SS_KEY);
}

/** Returns headers object with X-Session-Id if logged in */
export function getAuthHeaders() {
    const sid = getSessionId();
    const headers = {};
    if (sid) headers["X-Session-Id"] = sid;
    return headers;
}

/** Convenience: JSON headers + auth */
export function jsonAuthHeaders() {
    return { "Content-Type": "application/json", ...getAuthHeaders() };
}

/**
 * Generic fetch wrapper with auth headers
 * Usage: const data = await apiFetch("/admin/dashboard-stats");
 */
export async function apiFetch(url, opts = {}) {
    const res = await fetch(`${API}${url}`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(opts.headers || {}) },
        ...opts,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}
