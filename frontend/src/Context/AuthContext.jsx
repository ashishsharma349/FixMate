import { createContext, useState, useEffect } from "react";
import { getAuthHeaders, storeToken, clearToken, getToken, API } from "../utils/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [role, setRole] = useState(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const hadToken = !!getToken();

    // Helper: try /check-login with current access token
    const tryCheckLogin = async () => {
      const token = getToken();
      if (!token) return null;
      const res = await fetch(`${API}/check-login`, {
        headers: { "Cache-Control": "no-cache", "Authorization": `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    };

    // Helper: try silent refresh via httpOnly cookie
    const tryRefresh = async () => {
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
    };

    const init = async () => {
      try {
        // Step 1: If we have an access token, try it
        let data = await tryCheckLogin();

        // Step 2: If no token or token expired, try refreshing via cookie
        if (!data) {
          const newToken = await tryRefresh();
          if (newToken) {
            // Retry check-login with the fresh token
            data = await tryCheckLogin();
          }
        }

        // Step 3: Set state based on result
        if (data?.isLoggedIn) {
          setIsLoggedIn(true);
          setRole(data.role);
          setIsFirstLogin(data.isFirstLogin ?? false);
          setSessionExpired(false);
        } else {
          throw new Error("not logged in");
        }
      } catch {
        clearToken();
        setIsLoggedIn(false);
        setRole(null);
        setIsFirstLogin(false);
        if (hadToken) setSessionExpired(true);
      }
    };

    init();
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