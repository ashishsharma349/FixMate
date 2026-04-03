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
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white rounded-full opacity-60"></div>
              <div className="relative w-36 h-24 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-gray-200 overflow-hidden">
                <img src="/logo.png" alt="FixMate" className="w-20 h-16 object-contain opacity-100" />
              </div>
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
                    placeholder="••••••"
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
