// import React from 'react';
// import { Link } from 'react-router-dom';

// const Home = () => {
//   return (
//     <div className="min-h-screen bg-gray-50 text-[#1a365d] font-sans overflow-x-hidden">
//       {/* --- HERO SECTION --- */}
//       <header className="relative bg-white pt-10 pb-20 px-6 overflow-hidden">
//         {/* Abstract Background Waves from Design System */}
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
//           <div className="flex items-center gap-4 sm:gap-8">
//             <Link to="/login" className="font-bold text-sm uppercase tracking-widest hover:text-blue-600 transition">Login</Link>
//             <Link to="/signup" className="bg-[#25334d] text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-slate-700 shadow-lg transition">Join</Link>
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
//           <div className="flex flex-col sm:flex-row justify-center gap-4">
//             <Link to="/login" className="bg-white border-2 border-[#25334d] text-[#25334d] px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-gray-50 transition">Log Complaint</Link>
//             <Link to="/signup" className="bg-[#25334d] text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Get Started</Link>
//           </div>
//         </div>
//       </header>

//       {/* --- FEATURES GRID --- */}
//       <main className="max-w-6xl mx-auto px-6 -mt-10 relative z-20 pb-20">
//         <div className="grid md:grid-cols-2 gap-8">
          
//           {/* Resident Card */}
//           <div className="bg-white p-10 rounded-[40px] shadow-xl border-b-8 border-blue-500 transition-transform hover:-translate-y-2">
//             <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-2xl">🏠</div>
//             <h3 className="text-2xl font-bold mb-4">For Residents</h3>
//             <ul className="space-y-4">
//               {['Register complaints with images', 'Real-time status tracking', 'Community announcements', 'Service feedback'].map((item, i) => (
//                 <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
//                   <span className="text-blue-500">✔</span> {item}
//                 </li>
//               ))}
//             </ul>
//           </div>

//           {/* Management Card */}
//           <div className="bg-[#25334d] p-10 rounded-[40px] shadow-xl text-white transition-transform hover:-translate-y-2">
//             <div className="w-12 h-12 bg-slate-600 rounded-2xl flex items-center justify-center mb-6 text-2xl">📊</div>
//             <h3 className="text-2xl font-bold mb-4">For Management</h3>
//             <ul className="space-y-4">
//               {['Staff task assignment', 'Inventory management', 'Resolution reporting', 'Emergency broadcast'].map((item, i) => (
//                 <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
//                   <span className="text-sky-400">✔</span> {item}
//                 </li>
//               ))}
//             </ul>
//           </div>
//         </div>

//         {/* --- TECH STACK SECTION --- */}
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
//           FixMate © 2026 — Built for Residential Efficiency 
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
    <div className="min-h-screen bg-gray-50 text-[#1a365d] font-sans overflow-x-hidden">

      {/* Soft nudge banner for first login */}
      {isLoggedIn && isFirstLogin && (
        <div className="w-full bg-amber-400 text-amber-900 px-6 py-3 flex items-center justify-between">
          <span className="font-bold text-sm">⚠ You are using a temporary password. Please change it to secure your account.</span>
          <Link to="/change-password" className="bg-amber-900 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-amber-800 transition">
            Change Now
          </Link>
        </div>
      )}

      <header className="relative bg-white pt-10 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 opacity-10 pointer-events-none">
          <svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,80 C150,180 350,20 500,80 L500,0 L0,0 Z" fill="#3b82f6"></path>
          </svg>
        </div>

        <nav className="max-w-6xl mx-auto flex justify-between items-center mb-16 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#1a365d] rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xl">⚙️</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">FixMate</h1>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link to={dash.to} className="bg-[#25334d] text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-slate-700 shadow-lg transition">
                  {dash.label}
                </Link>
                <Link to="/logout" className="text-sm font-bold text-slate-500 hover:text-red-500 transition uppercase tracking-widest">
                  Logout
                </Link>
              </>
            ) : (
              <Link to="/login" className="bg-[#25334d] text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-slate-700 shadow-lg transition">
                Login
              </Link>
            )}
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Report. Track. <span className="text-blue-600">Resolve.</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            The unified platform for residential excellence. Bridging the gap between
            residents and management with real-time maintenance tracking.
          </p>
          <div className="flex justify-center">
            {isLoggedIn ? (
              <Link to={dash.to} className="bg-[#25334d] text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                {dash.label}
              </Link>
            ) : (
              <Link to="/login" className="bg-[#25334d] text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                Login to FixMate
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 -mt-10 relative z-20 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[40px] shadow-xl border-b-8 border-blue-500 transition-transform hover:-translate-y-2">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-2xl">🏠</div>
            <h3 className="text-2xl font-bold mb-4">For Residents</h3>
            <ul className="space-y-4">
              {['Register complaints with images', 'Real-time status tracking', 'Community announcements', 'Service feedback'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-600 font-medium">
                  <span className="text-blue-500">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#25334d] p-10 rounded-[40px] shadow-xl text-white transition-transform hover:-translate-y-2">
            <div className="w-12 h-12 bg-slate-600 rounded-2xl flex items-center justify-center mb-6 text-2xl">📊</div>
            <h3 className="text-2xl font-bold mb-4">For Management</h3>
            <ul className="space-y-4">
              {['Staff task assignment', 'Inventory management', 'Resolution reporting', 'Emergency broadcast'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                  <span className="text-sky-400">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mt-24 text-center">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Powered By Modern Stack</h3>
          <div className="bg-white py-12 px-6 rounded-[40px] shadow-inner grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Frontend', val: 'React & Tailwind' },
              { label: 'Backend', val: 'Node / Express' },
              { label: 'Database', val: 'MongoDB NoSQL' },
              { label: 'Security', val: 'Session Based' }
            ].map((tech, i) => (
              <div key={i} className="group cursor-default">
                <p className="text-xs font-bold text-blue-500 uppercase mb-1">{tech.label}</p>
                <p className="text-lg font-bold text-[#1a365d] group-hover:text-blue-600 transition">{tech.val}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white py-12 border-t text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          FixMate © 2026 – Built for Residential Efficiency
        </p>
      </footer>
    </div>
  );
};

export default Home;