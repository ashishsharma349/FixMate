import { createContext, useState, useEffect } from "react";
import { getAuthHeaders, storeSessionId, clearSessionId, getSessionId } from "../utils/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [role, setRole] = useState(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const sid = getSessionId();
    if (!sid) {
      setIsLoggedIn(false);
      setRole(null);
      setIsFirstLogin(false);
      return;
    }

    fetch("http://localhost:3000/check-login", {
      headers: { "Cache-Control": "no-cache", ...getAuthHeaders() }
    })
      .then(res => res.json())
      .then(data => {
        if (data.isLoggedIn) {
          setIsLoggedIn(true);
          setRole(data.role);
          setIsFirstLogin(data.isFirstLogin ?? false);
          setSessionExpired(false);
        } else {
          // Session existed locally but server says not logged in = expired
          clearSessionId();
          setIsLoggedIn(false);
          setRole(null);
          setIsFirstLogin(false);
          setSessionExpired(true); // show expired message
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
        setRole(null);
        setIsFirstLogin(false);
      });
  }, []);

  const login = (roleFromServer, firstLogin = false, sessionId = null) => {
    if (sessionId) storeSessionId(sessionId);
    setIsLoggedIn(true);
    setRole(roleFromServer ?? null);
    setIsFirstLogin(firstLogin);
    setSessionExpired(false);
  };

  const logout = () => {
    clearSessionId();
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