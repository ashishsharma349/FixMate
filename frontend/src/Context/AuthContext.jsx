// import { createContext, useState } from "react";    
// import { useEffect } from "react";
// export const AuthContext= createContext();

// export function AuthProvider({children}) {
//     const [isLoggedIn,setIsLoggedIn]= useState(null);
//     const [role,setRole]=useState(null);

//     // const [user,setUser]= useState(null);
    
//   useEffect(() => {
//       fetch("http://localhost:3000/check-login", 
//        { credentials: "include" }
//        )
//       .then(res => res.json())
//       .then(data => {
//         console.log("Session.isLoggedIn(from server) :", data.isLoggedIn);
//         // console.log("Frontend Login State before setting :", isLoggedIn)
 
//         if (data.isLoggedIn) {
//           setIsLoggedIn(true);
//           setRole(data.isLoggedIn? data.role:null);
//         }
//       }).catch(err => {

//         setIsLoggedIn(false);
//         setRole(null);
//       });
//     }, []);

//     useEffect(() => {
//     console.log("Auth state changed:", isLoggedIn, role);
//     }, [isLoggedIn, role]);

//     const login=()=>{
//         console.log("Called login function");
//         setIsLoggedIn(true)
//     }
//     const logout=()=>{
//         console.log("Called logout function");
//         setIsLoggedIn(false)
//     }
    
//    //upar jo context create kara tha first line pe
//     return <>
//         <AuthContext.Provider value={{isLoggedIn,role,login,logout}} > 
//             {children}
//         </AuthContext.Provider>
//     </>
// }

import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [role, setRole] = useState(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/check-login", { credentials: "include" })
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
