import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';

const Home = () => {
  const { isLoggedIn, role, isFirstLogin, sessionExpired, dismissExpired } = useContext(AuthContext);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("http://localhost:3000/profile", {
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionStorage.getItem("fixmate_sid") }
    })
      .then(res => res.json())
      .then(data => setProfileName(data.profile?.name || ""))
      .catch(() => {});
  }, [isLoggedIn]);

  const getDashboardLink = () => {
    if (role === "admin") return { to: "/AssignStaff", label: "Go to Admin Panel" };
    if (role === "staff") return { to: "/Assigned-Tasks", label: "View My Tasks" };
    if (role === "user") return { to: "/All-Complains", label: "My Complaints" };
    return { to: "/", label: "Dashboard" };
  };

  const dash = getDashboardLink();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1a365d] font-sans overflow-x-hidden">

      {/* Session Expired Banner */}
      {sessionExpired && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center justify-center gap-3">
          <span className="text-yellow-700 text-sm font-medium">⏰ Your session has expired. Please <Link to="/login" className="text-blue-600 font-bold underline">login again</Link> to continue.</span>
          <button onClick={dismissExpired} className="text-yellow-500 hover:text-yellow-700 font-bold text-lg leading-none">×</button>
        </div>
      )}

      {/* Banner - Only for First Login */}
      {isLoggedIn && isFirstLogin && (
        <div className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-3 flex items-center justify-between shadow-lg sticky top-0 z-[100]">
          <span className="font-bold text-sm flex items-center gap-2">
            <span className="animate-bounce">⚠️</span> Temporary password detected. Please secure your account.
          </span>
          <Link to="/change-password" title="Change Password" className="bg-white text-orange-600 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-sm">
            Change Now
          </Link>
        </div>
      )}

      {/* Navbar — only show when NOT logged in (logged-in users have Header from App.jsx) */}
      {!isLoggedIn && (
        <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3 group">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden border border-slate-100 group-hover:scale-110 transition-transform p-1">
                <img src="/logo.png" alt="FixMate Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-[#1a365d]">FixMate</h1>
            </div>
            <Link to="/login" className="bg-[#1a365d] text-white px-8 py-2 rounded-xl text-sm font-bold uppercase tracking-widest hover:shadow-lg transition-all">
              Login
            </Link>
          </div>
        </nav>
      )}

      <header className="relative bg-white pt-12 pb-20 px-6 overflow-hidden border-b border-slate-100">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
          <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,100 C150,200 350,50 500,150 L500,0 L0,0 Z" fill="#3b82f6"></path>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Hero Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-transparent to-purple-100 rounded-3xl opacity-0 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative w-32 h-24 bg-white/95 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-xl border border-gray-100 overflow-hidden group-hover:shadow-2xl group-hover:border-gray-200 transition-all">
                <img src="/logo.png" alt="FixMate" className="w-20 h-16 object-contain opacity-95 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          <h2 className="text-5xl md:text-6xl font-black mb-5 tracking-tighter leading-none">
            Report. Track. <br />
            <span className="text-blue-600">Resolve.</span>
          </h2>
          <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed mb-8 font-medium">
            The unified platform for residential excellence. Bridging the gap between
            residents and management with real-time maintenance tracking.
          </p>

          {isLoggedIn ? (
            <div className="flex flex-col items-center gap-4">
              {profileName && <p className="text-xl font-bold text-gray-600">Welcome back, {profileName}</p>}
              <Link to={dash.to} className="inline-block bg-[#1a365d] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all text-sm">
                {dash.label}
              </Link>
            </div>
          ) : (
            <Link to="/login" className="inline-block bg-[#1a365d] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all text-sm">
              Login to FixMate
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 -mt-16 relative z-20 pb-32">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Resident Card */}
          <div className="bg-white/90 backdrop-blur-lg p-10 rounded-[48px] shadow-2xl border-t-8 border-blue-500 hover:-translate-y-3 transition-all duration-500">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 text-3xl shadow-inner">🏠</div>
            <h3 className="text-3xl font-black mb-6 tracking-tight">For Residents</h3>
            <ul className="space-y-5">
              {['Register complaints with images', 'Real-time status tracking', 'Community announcements', 'Service feedback'].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-slate-600 font-bold">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Management Card */}
          <div className="bg-[#1a365d] p-10 rounded-[48px] shadow-2xl text-white hover:-translate-y-3 transition-all duration-500">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 text-3xl shadow-inner">📊</div>
            <h3 className="text-3xl font-black mb-6 tracking-tight">For Management</h3>
            <ul className="space-y-5">
              {['Staff task assignment', 'Inventory management', 'Resolution reporting', 'Emergency broadcast'].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-slate-200 font-bold">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-400 text-white rounded-full flex items-center justify-center text-[10px]">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tech Section */}
        <section className="mt-32">
          <div className="bg-white/50 border border-slate-200 py-16 px-10 rounded-[60px] shadow-sm">
            <h3 className="text-center text-xs font-black uppercase tracking-[0.5em] text-slate-400 mb-16">Powered By Modern Stack</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { label: 'Frontend', val: 'React & Tailwind' },
                { label: 'Backend', val: 'Node / Express' },
                { label: 'Database', val: 'MongoDB NoSQL' },
                { label: 'Security', val: 'Session Based' }
              ].map((tech, i) => (
                <div key={i} className="group">
                  <p className="text-[10px] font-black text-blue-500 uppercase mb-2 tracking-widest">{tech.label}</p>
                  <p className="text-lg font-black text-[#1a365d] group-hover:text-blue-600 transition-colors">{tech.val}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white py-16 border-t border-slate-100 text-center">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <img src="/logo.png" alt="Footer Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-sm">FixMate</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            FixMate 2026 – Lucknow, India
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;