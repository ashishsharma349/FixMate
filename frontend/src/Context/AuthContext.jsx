// import { createContext, useState, useEffect } from "react";

// export const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [isLoggedIn, setIsLoggedIn] = useState(null);
//   const [role, setRole] = useState(null);
//   const [isFirstLogin, setIsFirstLogin] = useState(false);

//   useEffect(() => {
//     fetch("http://localhost:3000/check-login", { credentials: "include" })
//       .then(res => res.json())
//       .then(data => {
//         setIsLoggedIn(data.isLoggedIn);
//         setRole(data.isLoggedIn ? data.role : null);
//         setIsFirstLogin(data.isFirstLogin ?? false);
//       })
//       .catch(() => {
//         setIsLoggedIn(false);
//         setRole(null);
//         setIsFirstLogin(false);
//       });
//   }, []);

//   const login = (roleFromServer, firstLogin = false) => {
//     setIsLoggedIn(true);
//     setRole(roleFromServer ?? null);
//     setIsFirstLogin(firstLogin);
//   };

//   const logout = () => {
//     setIsLoggedIn(false);
//     setRole(null);
//     setIsFirstLogin(false);
//   };

//   const clearFirstLogin = () => setIsFirstLogin(false);

//   return (
//     <AuthContext.Provider value={{ isLoggedIn, role, isFirstLogin, login, logout, clearFirstLogin }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }


import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [role, setRole] = useState(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/check-login", {
      credentials: "include",
      headers: { "Cache-Control": "no-cache" }
    })
      .then(res => res.json())
      .then(data => {
        setIsLoggedIn(data.isLoggedIn);
        setRole(data.isLoggedIn ? data.role : null);
        setIsFirstLogin(data.isFirstLogin ?? false);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setRole(null);
        setIsFirstLogin(false);
      });
  }, []);

  const login = (roleFromServer, firstLogin = false) => {
    setIsLoggedIn(true);
    setRole(roleFromServer ?? null);
    setIsFirstLogin(firstLogin);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setRole(null);
    setIsFirstLogin(false);
  };

  const clearFirstLogin = () => setIsFirstLogin(false);

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, isFirstLogin, login, logout, clearFirstLogin }}>
      {children}
    </AuthContext.Provider>
  );
}