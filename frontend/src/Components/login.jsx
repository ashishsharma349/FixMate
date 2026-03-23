// import { useContext, useState } from "react";
// import { Link, useNavigate, Navigate } from "react-router-dom";
// import { AuthContext } from "../Context/AuthContext";

// function Login() {
//   const navigate = useNavigate();
//   const { isLoggedIn, login } = useContext(AuthContext);

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [showPw, setShowPw] = useState(false);

//   if (isLoggedIn) return <Navigate to="/" />;


//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!email || !password) {
//       setError("Email and password are required");
//       return;
//     }

//     try {
//       const res = await fetch("http://localhost:3000/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await res.json();

//       if (data.success) {
//         login(data.role, data.isFirstLogin, data.sessionId);
//         if (data.isFirstLogin) {
//           navigate("/change-password");
//         } else {
//           navigate("/");
//         }
//       } else {
//         setError(data.error || "Invalid email or password");
//       }
//     } catch (err) {
//       console.error(err);
//       setError("Server error");
//     }
//   };

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-0 sm:p-4 font-sans">
//       <div className="relative w-full h-screen sm:h-auto sm:max-w-[420px] sm:min-h-[700px] bg-white sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">

//         {/* Branding Header - Updated Logo */}
//         <div className="flex-1 min-h-[35%] flex flex-col items-center justify-center relative bg-white px-6">
//           <div className="absolute top-0 w-full opacity-20 pointer-events-none">
//             <svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
//               <path d="M0,80 C150,180 350,20 500,80 L500,0 L0,0 Z" fill="#3b82f6"></path>
//             </svg>
//           </div>
//           <div className="z-10 flex flex-col items-center">
//             {/* The Building Logo Badge */}
//             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl border-4 border-[#1a365d] overflow-hidden">
//               <img src="/logo.png" alt="FixMate Logo" className="w-16 h-16 object-contain" />
//             </div>
//             <h1 className="text-4xl font-black text-[#1a365d] tracking-tighter">FixMate</h1>
//             <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Management Portal</p>
//           </div>
//         </div>

//         <div className="bg-[#25334d] rounded-t-[40px] p-8 pb-12 sm:pb-8 flex-[1.5] flex flex-col justify-start shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
//           <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-sm mx-auto">
//             <div className="space-y-4">
//               <div className="group">
//                 <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-1 block">Registered Email</label>
//                 <input
//                   type="email"
//                   placeholder="name@example.com"
//                   className="w-full p-4 rounded-xl bg-[#cbd5e1] text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                 />
//               </div>
//               <div className="group">
//                 <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-1 block">Password</label>
//                 <div className="relative">
//                   <input
//                     type={showPw ? "text" : "password"}
//                     placeholder="••••••••"
//                     className="w-full p-4 pr-12 rounded-xl bg-[#cbd5e1] text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                   />
//                   {/* <input
//                     type="checkbox"
//                     onClick={() => setShowPw(!showPw)}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-lg p-1 transition-colors"
//                     tabIndex={-1}
//                   >
//                     {showPw ? "hid" : "eye"}
//                   </input> */}
//                   <button
//   type="button"
//   onClick={() => setShowPw(!showPw)}
//   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-lg p-1 transition-colors"
//   tabIndex={-1}
// >
//   {showPw ? (
//     // Eye-off icon (password visible → click to hide)
//     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//         d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
//     </svg>
//   ) : (
//     // Eye icon (password hidden → click to show)
//     <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//         d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
//         d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//     </svg>
//   )}
// </button>
//                 </div>
//               </div>
//             </div>

//             {error && (
//               <p className="text-red-300 text-xs text-center font-bold bg-red-900/30 py-3 rounded-xl border border-red-900/50">
//                 {error}
//               </p>
//             )}

//             <button
//               type="submit"
//               className="w-full mt-6 bg-white text-[#25334d] font-black py-5 rounded-full text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em]"
//             >
//               Secure Login
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Login;
import { useContext, useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { isLoggedIn, login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  if (isLoggedIn) return <Navigate to="/" />;


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        login(data.role, data.isFirstLogin, data.sessionId);
        if (data.isFirstLogin) {
          navigate("/change-password");
        } else {
          navigate("/");
        }
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-0 sm:p-4 font-sans">
      <div className="relative w-full h-screen sm:h-auto sm:max-w-[420px] sm:min-h-[700px] bg-white sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">

        {/* Branding Header - Updated Logo */}
        <div className="flex-1 min-h-[35%] flex flex-col items-center justify-center relative bg-white px-6">
          <div className="absolute top-0 w-full opacity-20 pointer-events-none">
            <svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,80 C150,180 350,20 500,80 L500,0 L0,0 Z" fill="#3b82f6"></path>
            </svg>
          </div>
          <div className="z-10 flex flex-col items-center">
            {/* The Building Logo Badge */}
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-xl border-4 border-[#1a365d] overflow-hidden">
              <img src="/logo.png" alt="FixMate Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-4xl font-black text-[#1a365d] tracking-tighter">FixMate</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Management Portal</p>
          </div>
        </div>

        <div className="bg-[#25334d] rounded-t-[40px] p-8 pb-12 sm:pb-8 flex-[1.5] flex flex-col justify-start shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-sm mx-auto">
            <div className="space-y-4">
              <div className="group">
                <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-1 block">Registered Email</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full p-4 rounded-xl bg-[#cbd5e1] text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="group">
                <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-1 block">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full p-4 pr-12 rounded-xl bg-[#cbd5e1] text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 mt-2 ml-1 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={showPw}
                    onChange={() => setShowPw(!showPw)}
                    className="w-3.5 h-3.5 accent-sky-400 cursor-pointer"
                    tabIndex={-1}
                  />
                  <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Show Password</span>
                </label>
              </div>
            </div>

            {error && (
              <p className="text-red-300 text-xs text-center font-bold bg-red-900/30 py-3 rounded-xl border border-red-900/50">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full mt-6 bg-white text-[#25334d] font-black py-5 rounded-full text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-[0.2em]"
            >
              Secure Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;