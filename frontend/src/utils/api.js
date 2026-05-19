

export const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const TOKEN_KEY = "fixmate_token";


export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY) || null;
}


export function storeToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token);
}


export function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
}


export function getAuthHeaders() {
    const token = getToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}


export function jsonAuthHeaders() {
    return { "Content-Type": "application/json", ...getAuthHeaders() };
}


async function refreshAccessToken() {
    try {
        const res = await fetch(`${API}/auth/refresh`, {
            method: "POST",
            credentials: "include",
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


export async function apiFetch(url, opts = {}) {
    let res = await fetch(`${API}${url}`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(opts.headers || {}) },
        credentials: "include",
        ...opts,
    });
    if (res.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
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
