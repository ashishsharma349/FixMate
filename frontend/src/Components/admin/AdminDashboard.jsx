// import { useState, useEffect, useCallback } from "react";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
// // import at top
// import { InventoryView } from "./InventoryView"; // or paste inline

// // in renderView()


// const API = "http://localhost:3000";

// // ── Generic fetch with session credentials ───────────────────────────────────
// const apiFetch = async (url, opts = {}) => {
//   const res = await fetch(`${API}${url}`, {
//     credentials: "include",
//     headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
//     ...opts,
//   });
//   const data = await res.json();
//   if (!res.ok) throw new Error(data.error || "Request failed");
//   return data;
// };

// // ── Shared UI atoms ───────────────────────────────────────────────────────────
// const Badge = ({ children, color = "blue" }) => {
//   const map = {
//     blue:   "bg-blue-100 text-blue-700",
//     green:  "bg-green-100 text-green-700",
//     yellow: "bg-yellow-100 text-yellow-700",
//     red:    "bg-red-100 text-red-700",
//     purple: "bg-purple-100 text-purple-700",
//     teal:   "bg-teal-100 text-teal-700",
//     orange: "bg-orange-100 text-orange-700",
//     gray:   "bg-gray-100 text-gray-600",
//   };
//   return (
//     <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${map[color] || map.gray}`}>
//       {children}
//     </span>
//   );
// };

// const Btn = ({ children, onClick, color = "blue", size = "sm", disabled = false, className = "" }) => {
//   const colors = {
//     blue:   "bg-blue-600 hover:bg-blue-700 text-white",
//     green:  "bg-green-500 hover:bg-green-600 text-white",
//     red:    "bg-red-500 hover:bg-red-600 text-white",
//     gray:   "bg-gray-100 hover:bg-gray-200 text-gray-700",
//     teal:   "bg-teal-500 hover:bg-teal-600 text-white",
//     orange: "bg-orange-400 hover:bg-orange-500 text-white",
//   };
//   const sizes = { xs: "px-2 py-1 text-[11px]", sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
//   return (
//     <button
//       onClick={onClick}
//       disabled={disabled}
//       className={`rounded-lg font-semibold transition-colors ${colors[color]} ${sizes[size]} disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
//     >
//       {children}
//     </button>
//   );
// };

// const Modal = ({ title, onClose, children }) => (
//   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
//     <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
//       <div className="flex items-center justify-between px-6 py-4 border-b">
//         <h3 className="text-base font-bold text-gray-800">{title}</h3>
//         <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
//       </div>
//       <div className="px-6 py-5">{children}</div>
//     </div>
//   </div>
// );

// const Input = ({ label, ...props }) => (
//   <div className="flex flex-col gap-1">
//     {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
//     <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50" {...props} />
//   </div>
// );

// const Sel = ({ label, children, ...props }) => (
//   <div className="flex flex-col gap-1">
//     {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
//     <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50" {...props}>
//       {children}
//     </select>
//   </div>
// );

// // Status → badge color mapping
// const statusColor = (s) => ({ Pending: "yellow", Assigned: "blue", EstimatePending: "orange", EstimateApproved: "teal", InProgress: "purple", Resolved: "green" }[s] || "gray");
// const priorityColor = (p) => ({ Low: "green", Medium: "orange", High: "red", Emergency: "red" }[p] || "gray");

// // ══════════════════════════════════════════════════════════════════════════════
// // DASHBOARD VIEW
// // ══════════════════════════════════════════════════════════════════════════════
// function DashboardView({ onNavigate }) {
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Chart uses real monthly complaint count — padded with mock revenue for now
// //   const chartData = [
// //     { month: "Jan", complaints: 10, revenue: 8000 },
// //     { month: "Feb", complaints: 18, revenue: 25000 },
// //     { month: "Mar", complaints: 14, revenue: 40000 },
// //     { month: "Apr", complaints: stats?.stats?.totalComplaints || 0, revenue: 52400 },
// //   ];
// const [chartData, setChartData] = useState([]);
// useEffect(() => {
//   apiFetch("/admin/monthly-stats").then(d => setChartData(d.chartData)).catch(console.error);
// }, []);

//   useEffect(() => {
//     // Fetch real dashboard stats from admin endpoint
//     apiFetch("/admin/dashboard-stats")
//       .then(setStats)
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, []);

//   const handleEstimateAction = async (complaintId, action) => {
//     try {
//       await apiFetch("/admin/handle-estimate", {
//         method: "POST",
//         body: JSON.stringify({ complaintId, action }),
//       });
//       // Re-fetch stats after action
//       apiFetch("/admin/dashboard-stats").then(setStats).catch(console.error);
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   if (loading)
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
//       </div>
//     );

//   const s = stats?.stats || {};
//   const recent = stats?.recentComplaints || [];
//   const estimates = stats?.pendingEstimatesList || [];
//   const newPending = recent.filter((c) => c.status === "Pending");

//   const statCards = [
//     { icon: "🏢", label: "Total Complaints",  value: s.totalComplaints ?? 0, bg: "bg-blue-50",   iconBg: "bg-blue-100" },
//     { icon: "🔧", label: "In Progress",        value: s.inProgress ?? 0,      bg: "bg-yellow-50", iconBg: "bg-yellow-100" },
//     { icon: "⏳", label: "Pending Approval",   value: s.pendingApproval ?? 0, bg: "bg-purple-50", iconBg: "bg-purple-100" },
//     { icon: "💳", label: "Pending Estimates",  value: s.pendingEstimates ?? 0, bg: "bg-red-50",   iconBg: "bg-red-100", sub: "CommonArea" },
//   ];

//   return (
//     <div className="space-y-4">
//       {/* Stat Cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
//         {statCards.map((c) => (
//           <div key={c.label} className={`${c.bg} rounded-2xl flex items-center gap-3 px-4 py-4 shadow-sm`}>
//             <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${c.iconBg}`}>{c.icon}</div>
//             <div>
//               <p className="text-[11px] text-gray-500 font-medium">{c.label}</p>
//               <p className="text-2xl font-black text-gray-800 leading-tight">{c.value}</p>
//               {c.sub && <p className="text-[10px] text-gray-400">{c.sub}</p>}
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Three panel row */}
//       <div className="grid grid-cols-3 gap-4">
//         {/* Today's Tasks */}
//         <div className="bg-white rounded-2xl shadow-sm p-5">
//           <div className="flex items-center justify-between mb-3">
//             <h2 className="text-blue-600 font-bold text-sm">Today's Tasks</h2>
//             <Btn color="gray" size="xs" onClick={() => onNavigate("Complaints")}>View All</Btn>
//           </div>
//           <div className="space-y-3">
//             {recent.slice(0, 3).map((c) => (
//               <div key={c._id} className="border border-gray-100 rounded-xl p-3">
//                 <div className="flex items-start justify-between gap-2">
//                   <p className="text-sm font-semibold text-gray-700 truncate flex-1">{c.title}</p>
//                   <Badge color={statusColor(c.status)}>{c.status}</Badge>
//                 </div>
//                 <div className="flex gap-3 mt-1 text-xs text-gray-400">
//                   <span>👤 {c.resident?.name || "—"}</span>
//                   <span>🔧 {c.assignedStaff?.name || "Unassigned"}</span>
//                 </div>
//               </div>
//             ))}
//             {recent.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No complaints yet</p>}
//           </div>
//         </div>

//         {/* Pending Estimates — CommonArea only */}
//         <div className="bg-white rounded-2xl shadow-sm p-5">
//           <h2 className="text-blue-600 font-bold text-sm mb-3">Pending Estimates</h2>
//           <div className="space-y-3">
//             {estimates.slice(0, 3).map((c) => (
//               <div key={c._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
//                 <div className="flex items-center justify-between">
//                   <p className="text-sm font-semibold text-gray-700 truncate flex-1">{c.title}</p>
//                   <span className="text-sm font-bold text-gray-700 ml-2">₹{c.estimatedCost ?? "—"}</span>
//                 </div>
//                 <div className="flex items-center justify-between mt-2">
//                   <span className="text-xs text-gray-400">👤 {c.assignedStaff?.name || "—"}</span>
//                   <div className="flex gap-1">
//                     <Btn color="green" size="xs" onClick={() => handleEstimateAction(c._id, "Approved")}>Approve</Btn>
//                     <Btn color="red"   size="xs" onClick={() => handleEstimateAction(c._id, "Rejected")}>Reject</Btn>
//                   </div>
//                 </div>
//               </div>
//             ))}
//             {estimates.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No pending estimates</p>}
//           </div>
//         </div>

//         {/* New Complaints awaiting assignment */}
//         <div className="bg-white rounded-2xl shadow-sm p-5">
//           <h2 className="text-blue-600 font-bold text-sm mb-3">New Complaints</h2>
//           <div className="space-y-3">
//             {newPending.slice(0, 3).map((c) => (
//               <div key={c._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
//                 <div className="flex items-center justify-between gap-2">
//                   <p className="text-sm font-semibold text-gray-700 truncate flex-1">{c.title}</p>
//                   <Btn color="green" size="xs" onClick={() => onNavigate("Complaints")}>Assign</Btn>
//                 </div>
//                 <div className="flex items-center gap-2 mt-1">
//                   <span className="text-xs text-gray-400">🕐 {new Date(c.createdAt).toLocaleDateString()}</span>
//                   <Badge color={priorityColor(c.priority)}>{c.priority}</Badge>
//                 </div>
//               </div>
//             ))}
//             {newPending.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No new complaints</p>}
//           </div>
//         </div>
//       </div>

//       {/* Charts row */}
//       <div className="grid grid-cols-2 gap-4">
//         <div className="bg-white rounded-2xl shadow-sm p-5">
//           <h2 className="text-gray-700 font-bold text-sm mb-3">Monthly Complaints</h2>
//           <ResponsiveContainer width="100%" height={150}>
//             <BarChart data={chartData} barSize={22}>
//               <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
//               <YAxis hide />
//               <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 11 }} />
//               <Bar dataKey="complaints" fill="#6088f4" radius={[4, 4, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//         <div className="bg-white rounded-2xl shadow-sm p-5">
//           <h2 className="text-gray-700 font-bold text-sm mb-3">Monthly Revenue (₹)</h2>
//           <ResponsiveContainer width="100%" height={150}>
//             <BarChart data={chartData} barSize={22}>
//               <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
//               <YAxis hide />
//               <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 11 }} formatter={(v) => [`₹${v.toLocaleString()}`, ""]} />
//               <Bar dataKey="revenue" fill="#34d399" radius={[4, 4, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════════════════════
// // COMPLAINTS VIEW
// // ══════════════════════════════════════════════════════════════════════════════
// function ComplaintsView() {
//   const [complaints, setComplaints] = useState([]);
//   const [staff, setStaff] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [filterStatus, setFilterStatus] = useState("All");
//   const [assignModal, setAssignModal] = useState(null);
//   const [assignForm, setAssignForm] = useState({ staffId: "", workType: "Personal" });
//   const [assigning, setAssigning] = useState(false);
//   const [msg, setMsg] = useState("");

//   const fetchData = useCallback(async () => {
//     setLoading(true);
//     try {
//       // Uses admin endpoints for full complaint list with populated fields
//       const [cData, sData] = await Promise.all([
//         apiFetch("/admin/complaints"),
//         apiFetch("/admin/staff"),
//       ]);
//       setComplaints(cData.complaints || []);
//       setStaff(sData.staff || []);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { fetchData(); }, [fetchData]);

//   const handleAssign = async () => {
//     if (!assignForm.staffId) return;
//     setAssigning(true);
//     try {
//       await apiFetch("/admin/assign-complaint", {
//         method: "POST",
//         body: JSON.stringify({ complaintId: assignModal._id, ...assignForm }),
//       });
//       setMsg("✅ Assigned successfully!");
//       setAssignModal(null);
//       fetchData();
//     } catch (err) {
//       setMsg("❌ " + err.message);
//     } finally {
//       setAssigning(false);
//     }
//   };

//   const handleResolve = async (complaintId) => {
//     if (!window.confirm("Mark this complaint as Resolved?")) return;
//     try {
//       await apiFetch("/admin/resolve-complaint", { method: "POST", body: JSON.stringify({ complaintId }) });
//       fetchData();
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   const filtered = complaints.filter((c) => {
//     const s = search.toLowerCase();
//     const matchSearch = c.title?.toLowerCase().includes(s) || c._id?.toLowerCase().includes(s) || c.resident?.name?.toLowerCase().includes(s);
//     const matchStatus = filterStatus === "All" || c.status === filterStatus;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="space-y-4">
//       {msg && (
//         <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
//           {msg}
//           <button className="text-xs underline ml-4" onClick={() => setMsg("")}>dismiss</button>
//         </div>
//       )}

//       {/* Filters */}
//       <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 flex-wrap">
//         <input
//           className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
//           placeholder="Search by title, ID, resident name..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//         {["All", "Pending", "Assigned", "EstimatePending", "EstimateApproved", "InProgress", "Resolved"].map((s) => (
//           <button
//             key={s}
//             onClick={() => setFilterStatus(s)}
//             className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
//           >
//             {s}
//           </button>
//         ))}
//       </div>

//       {/* Complaints table */}
//       <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
//         {loading ? (
//           <div className="flex items-center justify-center h-40">
//             <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" />
//           </div>
//         ) : (
//           <table className="w-full text-sm min-w-[800px]">
//             <thead className="bg-gray-50 border-b border-gray-100">
//               <tr>
//                 {["#", "Title", "Resident", "Priority", "Status", "Work Type", "Assigned Staff", "Est. Cost", "Date", "Action"].map((h) => (
//                   <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map((c, i) => (
//                 <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
//                   <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
//                   <td className="px-4 py-3 font-semibold text-gray-700 max-w-[140px] truncate">{c.title}</td>
//                   <td className="px-4 py-3 text-gray-600">{c.resident?.name || "—"}</td>
//                   <td className="px-4 py-3"><Badge color={priorityColor(c.priority)}>{c.priority}</Badge></td>
//                   <td className="px-4 py-3"><Badge color={statusColor(c.status)}>{c.status}</Badge></td>
//                   <td className="px-4 py-3">
//                     {c.workType
//                       ? <Badge color={c.workType === "Personal" ? "blue" : "teal"}>{c.workType === "CommonArea" ? "Common" : "Personal"}</Badge>
//                       : <span className="text-gray-300 text-xs">—</span>}
//                   </td>
//                   <td className="px-4 py-3 text-gray-600">{c.assignedStaff?.name || <span className="text-gray-300">—</span>}</td>
//                   <td className="px-4 py-3 text-gray-600">{c.estimatedCost ? `₹${c.estimatedCost}` : <span className="text-gray-300">—</span>}</td>
//                   <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
//                   <td className="px-4 py-3">
//                     {c.status === "Pending" && (
//                       <Btn color="blue" size="xs" onClick={() => { setAssignModal(c); setAssignForm({ staffId: "", workType: "Personal" }); }}>
//                         Assign
//                       </Btn>
//                     )}
//                     {c.status === "InProgress" && (
//                       <Btn color="green" size="xs" onClick={() => handleResolve(c._id)}>Resolve</Btn>
//                     )}
//                     {!["Pending", "InProgress"].includes(c.status) && <span className="text-xs text-gray-300">—</span>}
//                   </td>
//                 </tr>
//               ))}
//               {filtered.length === 0 && (
//                 <tr><td colSpan={10} className="text-center py-12 text-gray-400 text-sm">No complaints found</td></tr>
//               )}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {/* Assign Staff Modal */}
//       {assignModal && (
//         <Modal title={`Assign Staff — ${assignModal.title}`} onClose={() => setAssignModal(null)}>
//           <div className="space-y-4">
//             {/* Complaint snapshot */}
//             <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
//               <p><span className="text-gray-500 font-medium">Resident:</span> {assignModal.resident?.name || "—"}</p>
//               <p><span className="text-gray-500 font-medium">Priority:</span> <Badge color={priorityColor(assignModal.priority)}>{assignModal.priority}</Badge></p>
//               <p className="text-gray-500 text-xs mt-1">{assignModal.description}</p>
//             </div>

//             {/* Work Type selector — key feature */}
//             <div>
//               <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">Work Type</label>
//               <div className="grid grid-cols-2 gap-2">
//                 {[
//                   { value: "Personal",   icon: "🏠", label: "Personal Flat Work",  desc: "Resident deals with cost directly. No payment in app." },
//                   { value: "CommonArea", icon: "🏢", label: "Common Area Work",     desc: "Staff submits estimate → admin approves → paid from fund." },
//                 ].map((opt) => (
//                   <button
//                     key={opt.value}
//                     onClick={() => setAssignForm((f) => ({ ...f, workType: opt.value }))}
//                     className={`border-2 rounded-xl p-3 text-left transition-all ${assignForm.workType === opt.value ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
//                   >
//                     <p className="text-sm font-semibold text-gray-700">{opt.icon} {opt.label}</p>
//                     <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Staff selector */}
//             <Sel label="Select Staff Member" value={assignForm.staffId} onChange={(e) => setAssignForm((f) => ({ ...f, staffId: e.target.value }))}>
//               <option value="">— Choose staff —</option>
//               {staff.map((s) => (
//                 <option key={s._id} value={s._id}>
//                   {s.name} · {s.department} {s.isAvailable ? "✅" : "🔴 Busy"}
//                 </option>
//               ))}
//             </Sel>

//             {/* Context reminder */}
//             {assignForm.workType && assignForm.staffId && (
//               <div className={`text-xs rounded-xl px-3 py-2 font-medium ${assignForm.workType === "Personal" ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700"}`}>
//                 {assignForm.workType === "Personal"
//                   ? "ℹ️ Staff will submit an estimate. Resident can revoke if cost is unfair."
//                   : "ℹ️ Staff will submit estimate → you approve → they submit proof → maintenance fund pays."}
//               </div>
//             )}

//             <div className="flex justify-end gap-2 pt-2">
//               <Btn color="gray" onClick={() => setAssignModal(null)}>Cancel</Btn>
//               <Btn color="blue" onClick={handleAssign} disabled={!assignForm.staffId || assigning}>
//                 {assigning ? "Assigning..." : "Confirm Assignment"}
//               </Btn>
//             </div>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// // ══════════════════════════════════════════════════════════════════════════════
// // USER MANAGEMENT VIEW (Staff + Residents CRUD)
// // ══════════════════════════════════════════════════════════════════════════════
// function UserManagementView() {
//   const [tab, setTab] = useState("staff");
//   const [staff, setStaff] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [modal, setModal] = useState(null);
//   const [form, setForm] = useState({});
//   const [saving, setSaving] = useState(false);
//   const [msg, setMsg] = useState("");

//   const fetchAll = useCallback(async () => {
//     setLoading(true);
//     try {
//       const [sd, ud] = await Promise.all([apiFetch("/admin/staff"), apiFetch("/admin/users")]);
//       setStaff(sd.staff || []);
//       setUsers(ud.users || []);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { fetchAll(); }, [fetchAll]);

//   const openModal = (type, data = {}) => { setModal(type); setForm(data); setMsg(""); };

// const handleSave = async () => {
//   setSaving(true);
//   try {
//     if (modal === "createStaff")
//       await apiFetch("/admin/create-user", {
//         method: "POST",
//         body: JSON.stringify({ ...form, userType: "staff" }),
//       });
//     else if (modal === "editStaff")
//       await apiFetch(`/admin/staff/${form._id}`, { method: "PUT", body: JSON.stringify(form) });
//     else if (modal === "createUser")
//       await apiFetch("/admin/create-user", {
//         method: "POST",
//         body: JSON.stringify({ ...form, userType: "user" }),
//       });
//     else if (modal === "editUser")
//       await apiFetch(`/admin/users/${form._id}`, { method: "PUT", body: JSON.stringify(form) });

//     setModal(null);
//     fetchAll();
//   } catch (err) {
//     setMsg("❌ " + err.message);
//   } finally {
//     setSaving(false);
//   }
// };

//   const handleDelete = async (type, id) => {
//     if (!window.confirm(`Delete this ${type}? Cannot be undone.`)) return;
//     try {
//       await apiFetch(`/admin/${type}/${id}`, { method: "DELETE" });
//       fetchAll();
//     } catch (err) {
//       alert(err.message);
//     }
//   };

//   // Controlled input helper
//   const f = (key) => ({ value: form[key] ?? "", onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })) });

//   return (
//     <div className="space-y-4">
//       {/* Tabs */}
//       <div className="flex items-center gap-3">
//         {[{ key: "staff", label: "👷 Staff" }, { key: "users", label: "🏠 Residents" }].map((t) => (
//           <button
//             key={t.key}
//             onClick={() => setTab(t.key)}
//             className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm ${tab === t.key ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
//           >
//             {t.label}
//           </button>
//         ))}
//         <div className="ml-auto">
//           <Btn color="blue" size="sm" onClick={() => openModal(tab === "staff" ? "createStaff" : "createUser")}>
//             + Add {tab === "staff" ? "Staff" : "Resident"}
//           </Btn>
//         </div>
//       </div>

//       {msg && (
//         <div className={`px-4 py-2 rounded-xl text-sm font-medium ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
//           {msg} <button className="ml-2 text-xs underline" onClick={() => setMsg("")}>dismiss</button>
//         </div>
//       )}

//       {/* Staff Table */}
//       {tab === "staff" && (
//         <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
//           <table className="w-full text-sm min-w-[700px]">
//             <thead className="bg-gray-50 border-b border-gray-100">
//               <tr>{["Name", "Email", "Dept", "Phone", "Aadhaar", "Available", "Actions"].map((h) => (
//                 <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
//               ))}</tr>
//             </thead>
//             <tbody>
//               {loading ? <tr><td colSpan={7} className="text-center py-10"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></td></tr>
//                 : staff.map((s) => (
//                   <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
//                     <td className="px-4 py-3 font-semibold text-gray-700">{s.name}</td>
//                     <td className="px-4 py-3 text-gray-500 text-xs">{s.authId?.email}</td>
//                     <td className="px-4 py-3"><Badge color="blue">{s.department}</Badge></td>
//                     <td className="px-4 py-3 text-gray-600">{s.phone}</td>
//                     <td className="px-4 py-3 text-gray-500 text-xs">{s.aadhaar}</td>
//                     <td className="px-4 py-3"><Badge color={s.isAvailable ? "green" : "red"}>{s.isAvailable ? "Available" : "Busy"}</Badge></td>
//                     <td className="px-4 py-3">
//                       <div className="flex gap-1">
//                         <Btn color="gray" size="xs" onClick={() => openModal("editStaff", { ...s, email: s.authId?.email })}>Edit</Btn>
//                         <Btn color="red"  size="xs" onClick={() => handleDelete("staff", s._id)}>Delete</Btn>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               {!loading && staff.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No staff found</td></tr>}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Residents Table */}
//       {tab === "users" && (
//         <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
//           <table className="w-full text-sm min-w-[600px]">
//             <thead className="bg-gray-50 border-b border-gray-100">
//               <tr>{["Name", "Email", "Age", "Phone", "Aadhaar", "Joined", "Actions"].map((h) => (
//                 <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
//               ))}</tr>
//             </thead>
//             <tbody>
//               {loading ? <tr><td colSpan={7} className="text-center py-10"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></td></tr>
//                 : users.map((u) => (
//                   <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50">
//                     <td className="px-4 py-3 font-semibold text-gray-700">{u.name}</td>
//                     <td className="px-4 py-3 text-gray-500 text-xs">{u.authId?.email}</td>
//                     <td className="px-4 py-3 text-gray-600">{u.age}</td>
//                     <td className="px-4 py-3 text-gray-600">{u.phone}</td>
//                     <td className="px-4 py-3 text-gray-500 text-xs">{u.aadhaar}</td>
//                     <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
//                     <td className="px-4 py-3">
//                       <div className="flex gap-1">
//                         <Btn color="gray" size="xs" onClick={() => openModal("editUser", { ...u, email: u.authId?.email })}>Edit</Btn>
//                         <Btn color="red"  size="xs" onClick={() => handleDelete("users", u._id)}>Delete</Btn>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               {!loading && users.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No residents found</td></tr>}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Create/Edit Staff Modal */}
//       {(modal === "createStaff" || modal === "editStaff") && (
//         <Modal title={modal === "createStaff" ? "Add New Staff" : "Edit Staff"} onClose={() => setModal(null)}>
//           <div className="space-y-3">
//             {msg && <p className={`text-sm px-3 py-2 rounded-lg ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</p>}
//             <div className="grid grid-cols-2 gap-3">
//               <Input label="Full Name"     placeholder="Ramesh Kumar"       {...f("name")} />
//               <Input label="Email"         type="email" placeholder="staff@example.com" {...f("email")} />
//               <Input label="Phone"         placeholder="9876543210"         {...f("phone")} />
//               <Input label="Aadhaar"       placeholder="1234 5678 9012"     {...f("aadhaar")} />
//             </div>
//             <Sel label="Department" {...f("department")}>
//               <option value="">— Select —</option>
//               {["Plumbing", "Electrical", "Carpentry", "Cleaning", "Security"].map((d) => (
//                 <option key={d} value={d}>{d}</option>
//               ))}
//             </Sel>
//             {modal === "editStaff" && (
//               <Sel label="Availability" value={form.isAvailable ? "true" : "false"} onChange={(e) => setForm((p) => ({ ...p, isAvailable: e.target.value === "true" }))}>
//                 <option value="true">Available</option>
//                 <option value="false">Busy</option>
//               </Sel>
//             )}
//             {modal === "createStaff" && (
//               <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
//                 📧 Auto-generated temp password will be emailed to the staff member.
//               </p>
//             )}
//             <div className="flex justify-end gap-2 pt-2">
//               <Btn color="gray" onClick={() => setModal(null)}>Cancel</Btn>
//               <Btn color="blue" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Btn>
//             </div>
//           </div>
//         </Modal>
//       )}

//       {/* Create/Edit Resident Modal */}
//       {(modal === "createUser" || modal === "editUser") && (
//         <Modal title={modal === "createUser" ? "Add New Resident" : "Edit Resident"} onClose={() => setModal(null)}>
//           <div className="space-y-3">
//             {msg && <p className={`text-sm px-3 py-2 rounded-lg ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</p>}
//             <div className="grid grid-cols-2 gap-3">
//               <Input label="Full Name"  placeholder="Ashish Sharma"         {...f("name")} />
//               <Input label="Email"      type="email" placeholder="res@example.com" {...f("email")} />
//               <Input label="Age"        type="number" placeholder="30"      {...f("age")} />
//               <Input label="Phone"      placeholder="9876543210"            {...f("phone")} />
//             </div>
//             <Input label="Aadhaar" placeholder="1234 5678 9012"            {...f("aadhaar")} />
//             {modal === "createUser" && (
//               <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
//                 📧 Auto-generated temp password will be emailed to the resident.
//               </p>
//             )}
//             <div className="flex justify-end gap-2 pt-2">
//               <Btn color="gray" onClick={() => setModal(null)}>Cancel</Btn>
//               <Btn color="blue" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Btn>
//             </div>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// }

// // ── Placeholder for future sections ──────────────────────────────────────────
// const PlaceholderView = ({ title }) => (
//   <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
//     <p className="text-4xl mb-3">🚧</p>
//     <p className="text-gray-500 font-semibold">{title} — Coming Soon</p>
//   </div>
// );

// // ══════════════════════════════════════════════════════════════════════════════
// // MAIN SHELL
// // ══════════════════════════════════════════════════════════════════════════════
// export default function AdminDashboard() {
//   const [activeNav, setActiveNav] = useState("Dashboard");

//   const navItems = [
//     { label: "Dashboard",       icon: "🏠" },
//     { label: "Complaints",      icon: "📋" },
//     { label: "User Management", icon: "👥" }, // renamed from Staff Management
//     { label: "Payments",        icon: "💳" },
//     { label: "Inventory",       icon: "📦" },
//     { label: "Reports",         icon: "📊" },
//     { label: "Settings",        icon: "⚙️" },
//     { label: "Logout",          icon: "🚪" },
//   ];

//   const handleLogout = async () => {
//     try { await fetch(`${API}/logout`, { method: "POST", credentials: "include" }); } catch (_) {}
//     window.location.href = "/login";
//   };

//   const renderView = () => {
//     switch (activeNav) {
//       case "Dashboard":       return <DashboardView onNavigate={setActiveNav} />;
//       case "Complaints":      return <ComplaintsView />;
//       case "User Management": return <UserManagementView />;
//       case "Inventory": return <InventoryView />;
//       default:                return <PlaceholderView title={activeNav} />;
//     }
//   };

//   return (
//     <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
//       {/* Sidebar */}
//       <aside className="w-56 bg-white flex flex-col shadow-md z-10 flex-shrink-0">
//         <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
//           <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg">🔧</div>
//           <span className="text-blue-700 font-black text-xl tracking-tight">FixMate</span>
//         </div>
//         <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5 overflow-y-auto">
//           {navItems.map(({ label, icon }) => (
//             <button
//               key={label}
//               onClick={() => label === "Logout" ? handleLogout() : setActiveNav(label)}
//               className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left
//                 ${activeNav === label && label !== "Logout"
//                   ? "bg-blue-600 text-white shadow-sm"
//                   : label === "Logout"
//                   ? "text-red-500 hover:bg-red-50"
//                   : "text-gray-500 hover:bg-blue-50 hover:text-blue-700"
//                 }`}
//             >
//               <span>{icon}</span>
//               {label}
//             </button>
//           ))}
//         </nav>
//       </aside>

//       {/* Main content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Topbar */}
//         <header className="bg-white px-6 py-3 flex items-center gap-4 shadow-sm border-b border-gray-100 flex-shrink-0">
//           <div className="flex-1 flex items-center bg-slate-100 rounded-xl px-4 py-2 gap-2">
//             <span className="text-gray-400 text-sm">🔍</span>
//             <input className="bg-transparent text-sm text-gray-500 outline-none w-full placeholder-gray-400" placeholder="Search by Flat No, Complaint ID, etc." />
//           </div>
//           <div className="relative cursor-pointer">
//             <span className="text-xl">🔔</span>
//             <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">!</span>
//           </div>
//           <div className="flex items-center gap-2 cursor-pointer">
//             <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">A</div>
//             <span className="text-sm font-semibold text-gray-700">Admin</span>
//             <span className="text-gray-400 text-xs">▾</span>
//           </div>
//         </header>

//         {/* Breadcrumb */}
//         <div className="px-6 py-2 flex items-center gap-2 text-xs text-gray-400 bg-slate-100 border-b border-slate-200">
//           <span className="font-semibold text-blue-600">FixMate</span>
//           <span>›</span>
//           <span>{activeNav}</span>
//         </div>

//         {/* Page content */}
//         <main className="flex-1 overflow-y-auto px-6 py-5">
//           {renderView()}
//         </main>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { InventoryView } from "./InventoryView";

const API = "http://localhost:3000";

// ── Generic fetch ─────────────────────────────────────────────────────────────
const apiFetch = async (url, opts = {}) => {
  const res = await fetch(`${API}${url}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

// ── Shared UI atoms ───────────────────────────────────────────────────────────
const Badge = ({ children, color = "blue" }) => {
  const map = {
    blue:   "bg-blue-100 text-blue-700",
    green:  "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red:    "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
    teal:   "bg-teal-100 text-teal-700",
    orange: "bg-orange-100 text-orange-700",
    gray:   "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${map[color] || map.gray}`}>
      {children}
    </span>
  );
};

const Btn = ({ children, onClick, color = "blue", size = "sm", disabled = false, className = "" }) => {
  const colors = {
    blue:   "bg-blue-600 hover:bg-blue-700 text-white",
    green:  "bg-green-500 hover:bg-green-600 text-white",
    red:    "bg-red-500 hover:bg-red-600 text-white",
    gray:   "bg-gray-100 hover:bg-gray-200 text-gray-700",
    teal:   "bg-teal-500 hover:bg-teal-600 text-white",
    orange: "bg-orange-400 hover:bg-orange-500 text-white",
  };
  const sizes = { xs: "px-2 py-1 text-[11px]", sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-lg font-semibold transition-colors ${colors[color]} ${sizes[size]} disabled:opacity-40 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
    <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50" {...props} />
  </div>
);

const Sel = ({ label, children, ...props }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
    <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50" {...props}>
      {children}
    </select>
  </div>
);

const statusColor = (s) => ({ Pending: "yellow", Assigned: "blue", EstimatePending: "orange", EstimateApproved: "teal", InProgress: "purple", Resolved: "green" }[s] || "gray");
const priorityColor = (p) => ({ Low: "green", Medium: "orange", High: "red", Emergency: "red" }[p] || "gray");

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEW
// ══════════════════════════════════════════════════════════════════════════════
function DashboardView({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    apiFetch("/admin/monthly-stats").then(d => setChartData(d.chartData)).catch(console.error);
  }, []);

  useEffect(() => {
    apiFetch("/admin/dashboard-stats")
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleEstimateAction = async (complaintId, action) => {
    try {
      await apiFetch("/admin/handle-estimate", { method: "POST", body: JSON.stringify({ complaintId, action }) });
      apiFetch("/admin/dashboard-stats").then(setStats).catch(console.error);
    } catch (err) { alert(err.message); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  const s = stats?.stats || {};
  const recent = stats?.recentComplaints || [];
  const estimates = stats?.pendingEstimatesList || [];
  const newPending = recent.filter(c => c.status === "Pending");
  const lowStock = stats?.lowStockItems || [];

  const statCards = [
    { icon: "🏢", label: "Total Complaints",  value: s.totalComplaints ?? 0, bg: "bg-blue-50",   iconBg: "bg-blue-100" },
    { icon: "🔧", label: "In Progress",        value: s.inProgress ?? 0,      bg: "bg-yellow-50", iconBg: "bg-yellow-100" },
    { icon: "⏳", label: "Pending Approval",   value: s.pendingApproval ?? 0, bg: "bg-purple-50", iconBg: "bg-purple-100" },
    { icon: "💳", label: "Pending Estimates",  value: s.pendingEstimates ?? 0, bg: "bg-red-50",   iconBg: "bg-red-100", sub: "CommonArea" },
  ];

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl flex items-center gap-3 px-4 py-4 shadow-sm`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${c.iconBg}`}>{c.icon}</div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">{c.label}</p>
              <p className="text-2xl font-black text-gray-800 leading-tight">{c.value}</p>
              {c.sub && <p className="text-[10px] text-gray-400">{c.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-orange-500 text-lg">⚠️</span>
            <h3 className="text-orange-700 font-bold text-sm">Low Stock Alert ({lowStock.length} items)</h3>
            <Btn color="orange" size="xs" className="ml-auto" onClick={() => onNavigate("Inventory")}>View Inventory</Btn>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(item => (
              <div key={item._id} className="bg-white border border-orange-200 rounded-xl px-3 py-1.5 text-xs">
                <span className="font-semibold text-gray-700">{item.name}</span>
                <span className="text-orange-600 ml-1">({item.quantity} {item.unit} left)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Three panel row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Today's Tasks */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-blue-600 font-bold text-sm">Today's Tasks</h2>
            <Btn color="gray" size="xs" onClick={() => onNavigate("Complaints")}>View All</Btn>
          </div>
          <div className="space-y-3">
            {recent.slice(0, 3).map(c => (
              <div key={c._id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-700 truncate flex-1">{c.title}</p>
                  <Badge color={statusColor(c.status)}>{c.status}</Badge>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-gray-400">
                  <span>👤 {c.resident?.name || "—"}</span>
                  <span>🔧 {c.assignedStaff?.name || "Unassigned"}</span>
                </div>
              </div>
            ))}
            {recent.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No complaints yet</p>}
          </div>
        </div>

        {/* Pending Estimates */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-blue-600 font-bold text-sm mb-3">Pending Estimates</h2>
          <div className="space-y-3">
            {estimates.slice(0, 3).map(c => (
              <div key={c._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700 truncate flex-1">{c.title}</p>
                  <span className="text-sm font-bold text-gray-700 ml-2">₹{c.estimatedCost ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">👤 {c.assignedStaff?.name || "—"}</span>
                  <div className="flex gap-1">
                    <Btn color="green" size="xs" onClick={() => handleEstimateAction(c._id, "Approved")}>Approve</Btn>
                    <Btn color="red"   size="xs" onClick={() => handleEstimateAction(c._id, "Rejected")}>Reject</Btn>
                  </div>
                </div>
              </div>
            ))}
            {estimates.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No pending estimates</p>}
          </div>
        </div>

        {/* New Complaints */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-blue-600 font-bold text-sm mb-3">New Complaints</h2>
          <div className="space-y-3">
            {newPending.slice(0, 3).map(c => (
              <div key={c._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-700 truncate flex-1">{c.title}</p>
                  <Btn color="green" size="xs" onClick={() => onNavigate("Complaints")}>Assign</Btn>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-400">🕐 {new Date(c.createdAt).toLocaleDateString()}</span>
                  <Badge color={priorityColor(c.priority)}>{c.priority}</Badge>
                </div>
              </div>
            ))}
            {newPending.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No new complaints</p>}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-gray-700 font-bold text-sm mb-3">Monthly Complaints</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData} barSize={22}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 11 }} />
              <Bar dataKey="complaints" fill="#6088f4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-gray-700 font-bold text-sm mb-3">Monthly Revenue (₹)</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData} barSize={22}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 11 }} formatter={v => [`₹${v.toLocaleString()}`, ""]} />
              <Bar dataKey="revenue" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPLAINTS VIEW
// ══════════════════════════════════════════════════════════════════════════════
function ComplaintsView() {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [assignModal, setAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ staffId: "", workType: "Personal" });
  const [assigning, setAssigning] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cData, sData] = await Promise.all([apiFetch("/admin/complaints"), apiFetch("/admin/staff")]);
      setComplaints(cData.complaints || []);
      setStaff(sData.staff || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async () => {
    if (!assignForm.staffId) return;
    setAssigning(true);
    try {
      await apiFetch("/admin/assign-complaint", { method: "POST", body: JSON.stringify({ complaintId: assignModal._id, ...assignForm }) });
      setMsg("✅ Assigned successfully!");
      setAssignModal(null);
      fetchData();
    } catch (err) { setMsg("❌ " + err.message); }
    finally { setAssigning(false); }
  };

  const handleResolve = async (complaintId) => {
    if (!window.confirm("Mark this complaint as Resolved?")) return;
    try {
      await apiFetch("/admin/resolve-complaint", { method: "POST", body: JSON.stringify({ complaintId }) });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const filtered = complaints.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = c.title?.toLowerCase().includes(s) || c._id?.toLowerCase().includes(s) || c.resident?.name?.toLowerCase().includes(s);
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}<button className="text-xs underline ml-4" onClick={() => setMsg("")}>dismiss</button>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 flex-wrap">
        <input className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Search by title, ID, resident name..." value={search} onChange={e => setSearch(e.target.value)} />
        {["All", "Pending", "Assigned", "EstimatePending", "EstimateApproved", "InProgress", "Resolved"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filterStatus === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
        ) : (
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["#", "Title", "Resident", "Flat", "Priority", "Status", "Work Type", "Staff", "Est. Cost", "Date", "Action"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-gray-700 max-w-[140px] truncate">{c.title}</td>
                  <td className="px-4 py-3 text-gray-600">{c.resident?.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.resident?.flatNumber || "—"}</td>
                  <td className="px-4 py-3"><Badge color={priorityColor(c.priority)}>{c.priority}</Badge></td>
                  <td className="px-4 py-3"><Badge color={statusColor(c.status)}>{c.status}</Badge></td>
                  <td className="px-4 py-3">
                    {c.workType ? <Badge color={c.workType === "Personal" ? "blue" : "teal"}>{c.workType === "CommonArea" ? "Common" : "Personal"}</Badge>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.assignedStaff?.name || <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-gray-600">{c.estimatedCost ? `₹${c.estimatedCost}` : <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {c.status === "Pending" && <Btn color="blue" size="xs" onClick={() => { setAssignModal(c); setAssignForm({ staffId: "", workType: "Personal" }); }}>Assign</Btn>}
                    {c.status === "InProgress" && <Btn color="green" size="xs" onClick={() => handleResolve(c._id)}>Resolve</Btn>}
                    {!["Pending", "InProgress"].includes(c.status) && <span className="text-xs text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={11} className="text-center py-12 text-gray-400 text-sm">No complaints found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {assignModal && (
        <Modal title={`Assign Staff — ${assignModal.title}`} onClose={() => setAssignModal(null)}>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
              <p><span className="text-gray-500 font-medium">Resident:</span> {assignModal.resident?.name || "—"}</p>
              <p><span className="text-gray-500 font-medium">Priority:</span> <Badge color={priorityColor(assignModal.priority)}>{assignModal.priority}</Badge></p>
              <p className="text-gray-500 text-xs mt-1">{assignModal.description}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">Work Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "Personal",   icon: "🏠", label: "Personal Flat Work",  desc: "Resident deals with cost directly." },
                  { value: "CommonArea", icon: "🏢", label: "Common Area Work",     desc: "Estimate → admin approval → fund pays." },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setAssignForm(f => ({ ...f, workType: opt.value }))}
                    className={`border-2 rounded-xl p-3 text-left transition-all ${assignForm.workType === opt.value ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <p className="text-sm font-semibold text-gray-700">{opt.icon} {opt.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <Sel label="Select Staff Member" value={assignForm.staffId} onChange={e => setAssignForm(f => ({ ...f, staffId: e.target.value }))}>
              <option value="">— Choose staff —</option>
              {staff.map(s => <option key={s._id} value={s._id}>{s.name} · {s.department} {s.isAvailable ? "✅" : "🔴 Busy"}</option>)}
            </Sel>
            <div className="flex justify-end gap-2 pt-2">
              <Btn color="gray" onClick={() => setAssignModal(null)}>Cancel</Btn>
              <Btn color="blue" onClick={handleAssign} disabled={!assignForm.staffId || assigning}>{assigning ? "Assigning..." : "Confirm"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT VIEW
// ══════════════════════════════════════════════════════════════════════════════
function UserManagementView() {
  const [tab, setTab] = useState("staff");
  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sd, ud] = await Promise.all([apiFetch("/admin/staff"), apiFetch("/admin/users")]);
      setStaff(sd.staff || []);
      setUsers(ud.users || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openModal = (type, data = {}) => { setModal(type); setForm(data); setMsg(""); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "createStaff")
        await apiFetch("/admin/create-user", { method: "POST", body: JSON.stringify({ ...form, userType: "staff" }) });
      else if (modal === "editStaff")
        await apiFetch(`/admin/staff/${form._id}`, { method: "PUT", body: JSON.stringify(form) });
      else if (modal === "createUser")
        await apiFetch("/admin/create-user", { method: "POST", body: JSON.stringify({ ...form, userType: "user" }) });
      else if (modal === "editUser")
        await apiFetch(`/admin/users/${form._id}`, { method: "PUT", body: JSON.stringify(form) });
      setModal(null);
      fetchAll();
    } catch (err) { setMsg("❌ " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Delete this ${type}? Cannot be undone.`)) return;
    try {
      await apiFetch(`/admin/${type}/${id}`, { method: "DELETE" });
      fetchAll();
    } catch (err) { alert(err.message); }
  };

  const f = key => ({ value: form[key] ?? "", onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {[{ key: "staff", label: "👷 Staff" }, { key: "users", label: "🏠 Residents" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm ${tab === t.key ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto">
          <Btn color="blue" size="sm" onClick={() => openModal(tab === "staff" ? "createStaff" : "createUser")}>
            + Add {tab === "staff" ? "Staff" : "Resident"}
          </Btn>
        </div>
      </div>

      {msg && <div className={`px-4 py-2 rounded-xl text-sm font-medium ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}

      {/* Staff Table */}
      {tab === "staff" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Name", "Email", "Dept", "Phone", "Aadhaar", "Available", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-10"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></td></tr>
                : staff.map(s => (
                  <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-700">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.authId?.email}</td>
                    <td className="px-4 py-3"><Badge color="blue">{s.department}</Badge></td>
                    <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.aadhaar}</td>
                    <td className="px-4 py-3"><Badge color={s.isAvailable ? "green" : "red"}>{s.isAvailable ? "Available" : "Busy"}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Btn color="gray" size="xs" onClick={() => openModal("editStaff", { ...s, email: s.authId?.email })}>Edit</Btn>
                        <Btn color="red"  size="xs" onClick={() => handleDelete("staff", s._id)}>Delete</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && staff.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No staff found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Residents Table */}
      {tab === "users" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Name", "Email", "Flat No.", "Age", "Phone", "Aadhaar", "Joined", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-10"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" /></td></tr>
                : users.map(u => (
                  <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-700">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.authId?.email}</td>
                    <td className="px-4 py-3"><Badge color="blue">{u.flatNumber || "—"}</Badge></td>
                    <td className="px-4 py-3 text-gray-600">{u.age}</td>
                    <td className="px-4 py-3 text-gray-600">{u.phone}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{u.aadhaar}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Btn color="gray" size="xs" onClick={() => openModal("editUser", { ...u, email: u.authId?.email })}>Edit</Btn>
                        <Btn color="red"  size="xs" onClick={() => handleDelete("users", u._id)}>Delete</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && users.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No residents found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Staff Modal */}
      {(modal === "createStaff" || modal === "editStaff") && (
        <Modal title={modal === "createStaff" ? "Add New Staff" : "Edit Staff"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {msg && <p className={`text-sm px-3 py-2 rounded-lg ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name"  placeholder="Ramesh Kumar"        {...f("name")} />
              <Input label="Email"      type="email" placeholder="staff@example.com" {...f("email")} />
              <Input label="Phone"      placeholder="9876543210"          {...f("phone")} />
              <Input label="Aadhaar"    placeholder="1234 5678 9012"      {...f("aadhaar")} />
            </div>
            <Sel label="Department" {...f("department")}>
              <option value="">— Select —</option>
              {["Plumbing", "Electrical", "Carpentry", "Cleaning", "Security"].map(d => <option key={d} value={d}>{d}</option>)}
            </Sel>
            {modal === "editStaff" && (
              <Sel label="Availability" value={form.isAvailable ? "true" : "false"} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.value === "true" }))}>
                <option value="true">Available</option>
                <option value="false">Busy</option>
              </Sel>
            )}
            {modal === "createStaff" && <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">📧 Auto-generated temp password will be emailed to the staff member.</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Btn color="gray" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn color="blue" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Create/Edit Resident Modal */}
      {(modal === "createUser" || modal === "editUser") && (
        <Modal title={modal === "createUser" ? "Add New Resident" : "Edit Resident"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {msg && <p className={`text-sm px-3 py-2 rounded-lg ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name"   placeholder="Ashish Sharma"         {...f("name")} />
              <Input label="Email"       type="email" placeholder="res@example.com" {...f("email")} />
              <Input label="Age"         type="number" placeholder="30"       {...f("age")} />
              <Input label="Phone"       placeholder="9876543210"             {...f("phone")} />
              <Input label="Flat No."    placeholder="101 / A-202"            {...f("flatNumber")} />
              <Input label="Aadhaar"     placeholder="1234 5678 9012"         {...f("aadhaar")} />
            </div>
            {modal === "createUser" && <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">📧 Auto-generated temp password will be emailed to the resident.</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Btn color="gray" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn color="blue" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAYMENTS VIEW (UI only — gateway integration later)
// ══════════════════════════════════════════════════════════════════════════════
function PaymentsView() {
  const [tab, setTab] = useState("maintenance");
  const [maintenance, setMaintenance] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState("");

  // Modal state — view only, no record modal
  const [viewModal, setViewModal] = useState(null); // { type: "man"|"per", data }

  const fmtDate = d =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const statusBadgeColor = s => ({ Paid: "green", Pending: "yellow", Overdue: "red" }[s] || "gray");

  // ── Fetch all payments ─────────────────────────────────────────────────
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/payments/list");
      setMaintenance(data.maintenance || []);
      setPersonal(data.personal || []);
    } catch (err) {
      console.error("Payments fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  // ── Generate monthly records for all real residents ────────────────────
  const handleGenerateMonthly = async () => {
    setGenerating(true);
    setGenMsg("");
    try {
      const res = await apiFetch("/payments/generate-monthly", { method: "POST" });
      setGenMsg(`✅ Done — ${res.created} new records created, ${res.skipped} already existed for ${res.month}/${res.year}`);
      fetchPayments();
    } catch (err) {
      setGenMsg("❌ " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const totalFund      = maintenance.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const totalCollected = personal.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const totalOverdue   = personal.filter(p => p.status === "Overdue").reduce((s, p) => s + p.amount, 0);
  const totalPending   = personal.filter(p => p.status === "Pending").length;

  return (
    <div className="space-y-4">

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg">🏛️</div>
          <div>
            <p className="text-xs text-orange-600 font-semibold">Fund Deducted</p>
            <p className="text-2xl font-black text-orange-700">₹{totalFund.toLocaleString()}</p>
            <p className="text-[10px] text-orange-400">Maintenance payments</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg">💰</div>
          <div>
            <p className="text-xs text-green-600 font-semibold">Collected</p>
            <p className="text-2xl font-black text-green-700">₹{totalCollected.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">From residents</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">⚠️</div>
          <div>
            <p className="text-xs text-red-600 font-semibold">Overdue</p>
            <p className="text-2xl font-black text-red-600">₹{totalOverdue.toLocaleString()}</p>
            <p className="text-[10px] text-gray-400">{totalPending} pending requests</p>
          </div>
        </div>
      </div>

      {/* ── Tabs + Generate button ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { key: "maintenance", label: "🏛️ Maintenance Fund" },
          { key: "personal",    label: "🏠 Personal Payments" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.key ? "bg-blue-600 text-white" : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"}`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {tab === "personal" && (
            <Btn color="teal" size="sm" onClick={handleGenerateMonthly} disabled={generating}>
              {generating ? "Generating..." : "⟳ Generate Monthly Requests"}
            </Btn>
          )}
          <Btn color="gray" size="sm" onClick={fetchPayments}>↻ Refresh</Btn>
        </div>
      </div>

      {/* Gen message */}
      {genMsg && (
        <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${genMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {genMsg}
          <button className="text-xs underline ml-4" onClick={() => setGenMsg("")}>dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* ── Maintenance Fund Table ── */}
          {tab === "maintenance" && (
            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-700 text-sm">Maintenance Fund Expenditure</h3>
                <span className="text-xs text-gray-400">CommonArea work payments from society fund</span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{["Reference ID", "Date", "Purpose", "Amount", "Status", "Worker", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {maintenance.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                      No maintenance payments yet. They auto-create when CommonArea complaints are resolved.
                    </td></tr>
                  ) : maintenance.map((p, i) => (
                    <tr key={p._id || i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-blue-600 font-semibold text-xs">{p.refId}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(p.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{p.purpose || "—"}</td>
                      <td className="px-4 py-3 font-bold text-gray-700">₹{p.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge color={statusBadgeColor(p.status)}>{p.status}</Badge></td>
                      <td className="px-4 py-3 text-gray-600">{p.workerName || p.worker?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <Btn color="gray" size="xs" onClick={() => setViewModal({ type: "man", data: p })}>View</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {maintenance.length > 0 && (
                  <tfoot className="border-t border-gray-100 bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-600">Total Deducted</td>
                      <td className="px-4 py-3 text-lg font-black text-orange-600">₹{totalFund.toLocaleString()}</td>
                      <td colSpan={3} className="px-4 py-3 text-xs text-gray-400">{maintenance.length} entries</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* ── Personal Payments Table ── */}
          {tab === "personal" && (
            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-700 text-sm">Resident Maintenance Fee</h3>
                <span className="text-xs text-gray-400">
                  {personal.length === 0
                    ? "Click 'Generate Monthly Requests' to create records for all residents"
                    : `${personal.length} records · ${personal.filter(p => p.status === "Paid").length} paid`}
                </span>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{["Reference ID", "Flat No.", "Resident", "Amount", "Status", "Due Date", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {personal.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-sm">
                      <p className="text-gray-400 mb-3">No payment records yet.</p>
                      <Btn color="teal" size="sm" onClick={handleGenerateMonthly} disabled={generating}>
                        {generating ? "Generating..." : "⟳ Generate Monthly Requests"}
                      </Btn>
                    </td></tr>
                  ) : personal.map((p, i) => (
                    <tr key={p._id || i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-blue-600 font-semibold text-xs">{p.refId}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700">
                        <Badge color="blue">{p.flatNumber || p.resident?.flatNumber || "—"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{p.resident?.name || "—"}</td>
                      <td className="px-4 py-3 font-bold text-gray-700">₹{p.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge color={statusBadgeColor(p.status)}>{p.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(p.dueDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Btn color="gray" size="xs" onClick={() => setViewModal({ type: "per", data: p })}>View</Btn>
                          {p.status !== "Paid" && (
                            <span className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-yellow-50 text-yellow-600 border border-yellow-200 whitespace-nowrap">
                              ⏳ Awaiting resident
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {personal.length > 0 && (
                  <tfoot className="border-t border-gray-100 bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-600">Total Collected</td>
                      <td className="px-4 py-3 text-lg font-black text-green-600">₹{totalCollected.toLocaleString()}</td>
                      <td colSpan={3} className="px-4 py-3 text-xs text-gray-400">{personal.length} entries</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </>
      )}

      {/* ── MAN View Modal ── */}
      {viewModal?.type === "man" && (
        <Modal title="Maintenance Payment Receipt" onClose={() => setViewModal(null)}>
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide">Reference ID</p>
                <p className="text-xl font-black text-orange-700">{viewModal.data.refId}</p>
              </div>
              <Badge color={statusBadgeColor(viewModal.data.status)}>{viewModal.data.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Purpose",    val: viewModal.data.purpose || "—" },
                { label: "Amount",     val: `₹${viewModal.data.amount?.toLocaleString()}` },
                { label: "Worker",     val: viewModal.data.workerName || viewModal.data.worker?.name || "—" },
                { label: "Department", val: viewModal.data.worker?.department || "—" },
                { label: "Date",       val: fmtDate(viewModal.data.createdAt) },
                { label: "Paid On",    val: fmtDate(viewModal.data.paidAt) },
              ].map(row => (
                <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{row.label}</p>
                  <p className="font-semibold text-gray-700">{row.val}</p>
                </div>
              ))}
            </div>
            {viewModal.data.complaint?.title && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-400 mb-1">Linked Complaint</p>
                <p className="font-semibold text-blue-700">{viewModal.data.complaint.title}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Btn color="gray" onClick={() => setViewModal(null)}>Close</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* ── PER View Modal ── */}
      {viewModal?.type === "per" && (
        <Modal title="Resident Payment Details" onClose={() => setViewModal(null)}>
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-green-500 font-semibold uppercase tracking-wide">Reference ID</p>
                <p className="text-xl font-black text-green-700">{viewModal.data.refId}</p>
              </div>
              <Badge color={statusBadgeColor(viewModal.data.status)}>{viewModal.data.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Resident", val: viewModal.data.resident?.name || "—" },
                { label: "Flat No.", val: viewModal.data.flatNumber || viewModal.data.resident?.flatNumber || "—" },
                { label: "Phone",    val: viewModal.data.resident?.phone || "—" },
                { label: "Amount",   val: `₹${viewModal.data.amount?.toLocaleString()}` },
                { label: "Due Date", val: fmtDate(viewModal.data.dueDate) },
                { label: "Paid On",  val: fmtDate(viewModal.data.paidAt) },
              ].map(row => (
                <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{row.label}</p>
                  <p className="font-semibold text-gray-700">{row.val}</p>
                </div>
              ))}
            </div>
            {viewModal.data.razorpayPaymentId && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-400 mb-1">Razorpay Payment ID</p>
                <p className="font-mono text-blue-700 text-xs break-all">{viewModal.data.razorpayPaymentId}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Btn color="gray" onClick={() => setViewModal(null)}>Close</Btn>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS VIEW
// ══════════════════════════════════════════════════════════════════════════════
function ReportsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/admin/reports-data")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  const c = data?.complaints || {};
  const s = data?.staff || {};
  const cats = data?.categoryBreakdown || [];
  const invCats = data?.inventoryCategories || [];
  const totalExpense = data?.fund?.totalExpense || 0;

  return (
    <div className="space-y-4">
      {/* Top row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Work Feedback */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-700 text-sm mb-4">📊 Work Summary</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-green-600">{c.resolved || 0}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-1">Resolved</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-yellow-600">{c.inProgress || 0}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-1">In Progress</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-red-500">{c.pending || 0}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-1">Pending</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-500">
            <div className="flex justify-between"><span>Total Complaints</span><span className="font-bold text-gray-700">{c.total || 0}</span></div>
            <div className="flex justify-between"><span>Staff Available</span><span className="font-bold text-green-600">{s.available || 0}</span></div>
            <div className="flex justify-between"><span>Staff Busy</span><span className="font-bold text-red-500">{s.busy || 0}</span></div>
            <div className="flex justify-between"><span>Total Staff</span><span className="font-bold text-gray-700">{s.total || 0}</span></div>
          </div>
        </div>

        {/* Maintenance Fund Log */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-700 text-sm mb-4">🏛️ Maintenance Fund Log</h2>
          <div className="space-y-2">
            <div className="bg-green-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Total Income</span>
              <span className="text-lg font-black text-green-600">₹0</span>
            </div>
            <div className="bg-red-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Total Expenses</span>
              <span className="text-lg font-black text-red-500">-₹{totalExpense.toLocaleString()}</span>
            </div>
            <div className="bg-blue-600 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-white font-bold">Net Balance</span>
              <span className="text-lg font-black text-white">₹{(0 - totalExpense).toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-gray-500">
            <div className="flex justify-between"><span>• Staff Wages</span><span className="text-red-400 font-semibold">-₹{Math.round(totalExpense * 0.5).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>• Repair Costs</span><span className="text-red-400 font-semibold">-₹{Math.round(totalExpense * 0.35).toLocaleString()}</span></div>
            <div className="flex justify-between"><span>• Materials</span><span className="text-red-400 font-semibold">-₹{Math.round(totalExpense * 0.15).toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Complaints by Department */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-700 text-sm mb-4">📋 Complaints by Department</h2>
          {cats.length > 0 ? (
            <div className="space-y-3">
              {cats.map(cat => {
                const pct = c.total ? Math.round((cat.count / c.total) * 100) : 0;
                return (
                  <div key={cat._id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{cat._id}</span>
                      <span className="text-gray-400">{cat.count} complaints ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-8">No data yet — assign complaints to staff to see department breakdown</p>
          )}
        </div>

        {/* Inventory Purchased */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-700 text-sm mb-4">📦 Inventory by Category</h2>
          {invCats.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {invCats.map(cat => (
                <div key={cat._id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-xs font-bold text-gray-700 truncate">{cat._id}</p>
                  <p className="text-lg font-black text-blue-600 mt-1">{cat.totalItems}</p>
                  <p className="text-[10px] text-gray-400">{cat.totalQty} units total</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-8">No inventory data</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS VIEW
// ══════════════════════════════════════════════════════════════════════════════
function SettingsView() {
  const [profileForm, setProfileForm] = useState({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const pf = key => ({ value: profileForm[key], onChange: e => setProfileForm(p => ({ ...p, [key]: e.target.value })) });

  const handleSave = async () => {
    setMsg("");
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      setMsg("❌ New passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const payload = {};
      if (profileForm.email) payload.email = profileForm.email;
      if (profileForm.newPassword) {
        payload.currentPassword = profileForm.currentPassword;
        payload.newPassword = profileForm.newPassword;
      }
      await apiFetch("/admin/settings/profile", { method: "PUT", body: JSON.stringify(payload) });
      setMsg("✅ Profile updated successfully");
      setProfileForm({ email: "", currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Profile Settings */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-black">A</div>
          <div>
            <h2 className="font-bold text-gray-800">Admin Profile</h2>
            <p className="text-xs text-gray-400">Update your account details</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Change Email</h3>
            <Input label="New Email Address" type="email" placeholder="admin@fixmate.com" {...pf("email")} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Change Password</h3>
            <div className="space-y-3">
              <Input label="Current Password" type="password" placeholder="Enter current password" {...pf("currentPassword")} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="New Password" type="password" placeholder="Min 8 characters" {...pf("newPassword")} />
                <Input label="Confirm New Password" type="password" placeholder="Repeat new password" {...pf("confirmPassword")} />
              </div>
            </div>
          </div>

          {msg && (
            <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {msg}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Btn color="blue" size="md" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Btn>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-gray-700 text-sm mb-3">⚙️ System Info</h3>
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex justify-between py-2 border-b border-gray-50"><span>App Name</span><span className="font-semibold text-gray-700">FixMate</span></div>
          <div className="flex justify-between py-2 border-b border-gray-50"><span>Version</span><span className="font-semibold text-gray-700">1.0.0</span></div>
          <div className="flex justify-between py-2 border-b border-gray-50"><span>Stack</span><span className="font-semibold text-gray-700">React + Node.js + MongoDB</span></div>
          <div className="flex justify-between py-2"><span>Session Auth</span><span className="font-semibold text-green-600">Active ✅</span></div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SHELL
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  const navItems = [
    { label: "Dashboard",       icon: "🏠" },
    { label: "Complaints",      icon: "📋" },
    { label: "User Management", icon: "👥" },
    { label: "Payments",        icon: "💳" },
    { label: "Inventory",       icon: "📦" },
    { label: "Reports",         icon: "📊" },
    { label: "Settings",        icon: "⚙️" },
    { label: "Logout",          icon: "🚪" },
  ];

  const handleLogout = async () => {
    try { await fetch(`${API}/logout`, { method: "POST", credentials: "include" }); } catch (_) {}
    window.location.href = "/login";
  };

  const renderView = () => {
    switch (activeNav) {
      case "Dashboard":       return <DashboardView onNavigate={setActiveNav} />;
      case "Complaints":      return <ComplaintsView />;
      case "User Management": return <UserManagementView />;
      case "Payments":        return <PaymentsView />;
      case "Inventory":       return <InventoryView />;
      case "Reports":         return <ReportsView />;
      case "Settings":        return <SettingsView />;
      default:                return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white flex flex-col shadow-md z-10 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg">🔧</div>
          <span className="text-blue-700 font-black text-xl tracking-tight">FixMate</span>
        </div>
        <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ label, icon }) => (
            <button key={label}
              onClick={() => label === "Logout" ? handleLogout() : setActiveNav(label)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left
                ${activeNav === label && label !== "Logout" ? "bg-blue-600 text-white shadow-sm"
                  : label === "Logout" ? "text-red-500 hover:bg-red-50"
                  : "text-gray-500 hover:bg-blue-50 hover:text-blue-700"}`}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white px-6 py-3 flex items-center gap-4 shadow-sm border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 flex items-center bg-slate-100 rounded-xl px-4 py-2 gap-2">
            <span className="text-gray-400 text-sm">🔍</span>
            <input className="bg-transparent text-sm text-gray-500 outline-none w-full placeholder-gray-400" placeholder="Search by Flat No, Complaint ID, etc." />
          </div>
          <div className="relative cursor-pointer">
            <span className="text-xl">🔔</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">!</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">A</div>
            <span className="text-sm font-semibold text-gray-700">Admin</span>
            <span className="text-gray-400 text-xs">▾</span>
          </div>
        </header>

        <div className="px-6 py-2 flex items-center gap-2 text-xs text-gray-400 bg-slate-100 border-b border-slate-200">
          <span className="font-semibold text-blue-600">FixMate</span>
          <span>›</span>
          <span>{activeNav}</span>
        </div>

        <main className="flex-1 overflow-y-auto px-6 py-5">
          {renderView()}
        </main>
      </div>
    </div>
  );
}