import { createContext, useState, useEffect } from "react";
import { getAuthHeaders, storeToken, clearToken, getToken, API } from "../utils/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [role, setRole] = useState(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoggedIn(false);
      setRole(null);
      setIsFirstLogin(false);
      return;
    }

    // Verify token with the server
    fetch(`${API}/check-login`, {
      headers: { "Cache-Control": "no-cache", ...getAuthHeaders() },
      credentials: "include",
    })
      .then(res => {
        if (!res.ok) {
          // 401 = token invalid/expired → try silent refresh
          return fetch(`${API}/auth/refresh`, { method: "POST", credentials: "include" })
            .then(refreshRes => {
              if (!refreshRes.ok) throw new Error("refresh failed");
              return refreshRes.json();
            })
            .then(refreshData => {
              if (refreshData.token) {
                storeToken(refreshData.token);
                // Retry check-login with new token
                return fetch(`${API}/check-login`, {
                  headers: { "Cache-Control": "no-cache", "Authorization": `Bearer ${refreshData.token}` },
                  credentials: "include",
                }).then(r => r.json());
              }
              throw new Error("no token in refresh");
            });
        }
        return res.json();
      })
      .then(data => {
        if (data.isLoggedIn) {
          setIsLoggedIn(true);
          setRole(data.role);
          setIsFirstLogin(data.isFirstLogin ?? false);
          setSessionExpired(false);
        } else {
          throw new Error("not logged in");
        }
      })
      .catch(() => {
        clearToken();
        setIsLoggedIn(false);
        setRole(null);
        setIsFirstLogin(false);
        // Only show expired banner if there WAS a token (user was previously logged in)
        if (token) setSessionExpired(true);
      });
  }, []);

  const login = (roleFromServer, firstLogin = false, token = null) => {
    if (token) storeToken(token);
    setIsLoggedIn(true);
    setRole(roleFromServer ?? null);
    setIsFirstLogin(firstLogin);
    setSessionExpired(false);
  };

  const logout = () => {
    clearToken();
    setIsLoggedIn(false);
    setRole(null);
    setIsFirstLogin(false);
    setSessionExpired(false);
  };

  const clearFirstLogin = () => setIsFirstLogin(false);
  const dismissExpired = () => setSessionExpired(false);

  return (
    <AuthContext.Provider value={{
      isLoggedIn, role, isFirstLogin, sessionExpired,
      login, logout, clearFirstLogin, dismissExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
}