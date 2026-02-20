// import React, { useContext } from 'react';
// import { Link } from 'react-router-dom';
// import { AuthContext } from '../Context/AuthContext';

// const Home = () => {
//   const { isLoggedIn, role, isFirstLogin } = useContext(AuthContext);

//   const getDashboardLink = () => {
//     if (role === "admin") return { to: "/AssignStaff", label: "Go to Admin Panel" };
//     if (role === "staff") return { to: "/Assigned-Tasks", label: "View My Tasks" };
//     if (role === "user") return { to: "/All-Complains", label: "My Complaints" };
//     return { to: "/", label: "Dashboard" };
//   };

//   const dash = getDashboardLink();

//   return (
//     <div className="min-h-screen bg-gray-50 text-[#1a365d] font-sans overflow-x-hidden">

//       {/* Soft nudge banner for first login */}
//       {isLoggedIn && isFirstLogin && (
//         <div className="w-full bg-amber-400 text-amber-900 px-6 py-3 flex items-center justify-between">
//           <span className="font-bold text-sm">⚠ You are using a temporary password. Please change it to secure your account.</span>
//           <Link to="/change-password" className="bg-amber-900 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-amber-800 transition">
//             Change Now
//           </Link>
//         </div>
//       )}

//       <header className="relative bg-white pt-10 pb-20 px-6 overflow-hidden">
//         <div className="absolute top-0 right-0 w-1/2 opacity-10 pointer-events-none">
//           <svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
//             <path d="M0,80 C150,180 350,20 500,80 L500,0 L0,0 Z" fill="#3b82f6"></path>
//           </svg>
//         </div>

//         <nav className="max-w-6xl mx-auto flex justify-between items-center mb-16 relative z-10">
//           <div className="flex items-center gap-2">
//             <div className="w-10 h-10 bg-[#1a365d] rounded-full flex items-center justify-center shadow-md">
//               <span className="text-white text-xl">⚙️</span>
//             </div>
//             <h1 className="text-2xl font-extrabold tracking-tight">FixMate</h1>
//           </div>

//           <div className="flex items-center gap-4">
//             {isLoggedIn ? (
//               <>
//                 <Link to={dash.to} className="bg-[#25334d] text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-slate-700 shadow-lg transition">
//                   {dash.label}
//                 </Link>
//                 <Link to="/logout" className="text-sm font-bold text-slate-500 hover:text-red-500 transition uppercase tracking-widest">
//                   Logout
//                 </Link>
//               </>
//             ) : (
//               <Link to="/login" className="bg-[#25334d] text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-slate-700 shadow-lg transition">
//                 Login
//               </Link>
//             )}
//           </div>
//         </nav>

//         <div className="max-w-4xl mx-auto text-center relative z-10">
//           <h2 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
//             Report. Track. <span className="text-blue-600">Resolve.</span>
//           </h2>
//           <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
//             The unified platform for residential excellence. Bridging the gap between
//             residents and management with real-time maintenance tracking.
//           </p>
//           <div className="flex justify-center">
//             {isLoggedIn ? (
//               <Link to={dash.to} className="bg-[#25334d] text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
//                 {dash.label}
//               </Link>
//             ) : (
//               <Link to="/login" className="bg-[#25334d] text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
//                 Login to FixMate
//               </Link>
//             )}
//           </div>
//         </div>
//       </header>

//       <main className="max-w-6xl mx-auto px-6 -mt-10 relative z-20 pb-20">
//         <div className="grid md:grid-cols-2 gap-8">
//           <div className="bg-white p-10 rounded-[40px] shadow-xl border-b-8 border-blue-500 transition-transform hover:-translate-y-2">
//             <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-2xl">🏠</div>
//             <h3 className="text-2xl font-bold mb-4">For Residents</h3>
//             <ul className="space-y-4">
//               {['Register complaints with images', 'Real-time status tracking', 'Community announcements', 'Service feedback'].map((item, i) => (
//                 <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
//                   <span className="text-blue-500">✓</span> {item}
//                 </li>
//               ))}
//             </ul>
//           </div>

//           <div className="bg-[#25334d] p-10 rounded-[40px] shadow-xl text-white transition-transform hover:-translate-y-2">
//             <div className="w-12 h-12 bg-slate-600 rounded-2xl flex items-center justify-center mb-6 text-2xl">📊</div>
//             <h3 className="text-2xl font-bold mb-4">For Management</h3>
//             <ul className="space-y-4">
//               {['Staff task assignment', 'Inventory management', 'Resolution reporting', 'Emergency broadcast'].map((item, i) => (
//                 <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
//                   <span className="text-sky-400">✓</span> {item}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>

//         <section className="mt-24 text-center">
//           <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Powered By Modern Stack</h3>
//           <div className="bg-white py-12 px-6 rounded-[40px] shadow-inner grid grid-cols-2 md:grid-cols-4 gap-8">
//             {[
//               { label: 'Frontend', val: 'React & Tailwind' },
//               { label: 'Backend', val: 'Node / Express' },
//               { label: 'Database', val: 'MongoDB NoSQL' },
//               { label: 'Security', val: 'Session Based' }
//             ].map((tech, i) => (
//               <div key={i} className="group cursor-default">
//                 <p className="text-xs font-bold text-blue-500 uppercase mb-1">{tech.label}</p>
//                 <p className="text-lg font-bold text-[#1a365d] group-hover:text-blue-600 transition">{tech.val}</p>
//               </div>
//             ))}
//           </div>
//         </section>
//       </main>

//       <footer className="bg-white py-12 border-t text-center">
//         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
//           FixMate © 2026 – Built for Residential Efficiency
//         </p>
//       </footer>
//     </div>
//   );
// };

// export default Home;

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../Context/AuthContext';

const Home = () => {
  const { isLoggedIn, role, isFirstLogin } = useContext(AuthContext);

  const getDashboardLink = () => {
    if (role === "admin") return { to: "/AssignStaff", label: "Go to Admin Panel" };
    if (role === "staff") return { to: "/Assigned-Tasks", label: "View My Tasks" };
    if (role === "user") return { to: "/All-Complains", label: "My Complaints" };
    return { to: "/", label: "Dashboard" };
  };

  const dash = getDashboardLink();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1a365d] font-sans overflow-x-hidden">
      
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

      {/* Navbar */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden border border-slate-100 group-hover:scale-110 transition-transform">
              <img src="/logo.png" alt="FixMate Logo" className="w-full h-full object-contain p-1" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-[#1a365d]">FixMate</h1>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-6">
                <Link to={dash.to} className="bg-[#1a365d] text-white px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-blue-900 shadow-md transition-all">
                  {dash.label}
                </Link>
                <Link to="/logout" className="text-sm font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest">
                  Logout
                </Link>
              </div>
            ) : (
              <Link to="/login" className="bg-[#1a365d] text-white px-8 py-2 rounded-xl text-sm font-bold uppercase tracking-widest hover:shadow-lg transition-all">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      <header className="relative bg-white pt-20 pb-32 px-6 overflow-hidden border-b border-slate-100">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-5 pointer-events-none">
          <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,100 C150,200 350,50 500,150 L500,0 L0,0 Z" fill="#3b82f6"></path>
          </svg>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Hero Logo */}
          <div className="mb-12 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
              <div className="w-40 h-40 bg-white rounded-[40px] flex items-center justify-center shadow-2xl border border-slate-100 overflow-hidden relative z-10">
                <img src="/logo.png" alt="FixMate" className="w-28 h-28 object-contain" />
              </div>
            </div>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-black mb-8 tracking-tighter leading-none">
            Report. Track. <br/>
            <span className="text-blue-600">Resolve.</span>
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
            The unified platform for residential excellence. Bridging the gap between 
            residents and management with real-time maintenance tracking.
          </p>
          
          {!isLoggedIn && (
            <Link to="/login" className="inline-block bg-[#1a365d] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all">
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
            <img src="/logo.png" alt="Footer Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-sm">FixMate</span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            FixMate © 2026 – Lucknow, India
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;