import { useState, useEffect, useCallback, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getAuthHeaders } from "../../utils/api";
import { clearSessionId } from "../../utils/api";

const API = "http://localhost:3000";

const apiFetch = async (url, opts = {}) => {
  const res = await fetch(`${API}${url}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

// ── Auto-refresh hook ─────────────────────────────────────────────────────────
// Calls fetchFn immediately on mount, then every intervalMs milliseconds
const usePolling = (fetchFn, intervalMs = 10000) => {
  const savedFn = useRef(fetchFn);
  useEffect(() => { savedFn.current = fetchFn; }, [fetchFn]);
  useEffect(() => {
    savedFn.current();
    const id = setInterval(() => savedFn.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
};

const Badge = ({ children, color = "blue" }) => {
  const map = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
    teal: "bg-teal-100 text-teal-700",
    orange: "bg-orange-100 text-orange-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${map[color] || map.gray}`}>
      {children}
    </span>
  );
};

const Btn = ({ children, onClick, color = "blue", size = "sm", disabled = false, className = "" }) => {
  const colors = {
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
    green: "bg-green-500 hover:bg-green-600 text-white",
    red: "bg-red-500 hover:bg-red-600 text-white",
    gray: "bg-gray-100 hover:bg-gray-200 text-gray-700",
    teal: "bg-teal-500 hover:bg-teal-600 text-white",
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
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
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
// DASHBOARD VIEW — auto-refreshes every 10s
// ══════════════════════════════════════════════════════════════════════════════
function DashboardView({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiFetch("/admin/dashboard-stats");
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchChartData = useCallback(async () => {
    try {
      const data = await apiFetch("/admin/monthly-stats");
      setChartData(data.chartData || []);
    } catch (err) { console.error("Complaints chart:", err); }
    try {
      const revenueData = await apiFetch("/payments/monthly-revenue");
      const revenueMap = {};
      (revenueData.chartData || []).forEach(d => { revenueMap[d.month] = d.revenue; });
      setChartData(prev => prev.map(d => ({ ...d, revenue: revenueMap[d.month] || 0 })));
    } catch (err) { console.error("Revenue chart:", err); }
  }, []);

  // Auto-refresh every 10 seconds
  usePolling(fetchStats, 10000);

  // Chart data loads once (no need to poll every 10s)
  useEffect(() => { fetchChartData(); }, [fetchChartData]);

  const handleEstimateAction = async (complaintId, action) => {
    try {
      await apiFetch("/admin/handle-estimate", { method: "POST", body: JSON.stringify({ complaintId, action }) });
      fetchStats();
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
  const wip = stats?.wipComplaints || [];

  const statCards = [
    { icon: "🏢", label: "Total Complaints", value: s.totalComplaints ?? 0, bg: "bg-blue-50", iconBg: "bg-blue-100" },
    { icon: "🔧", label: "Active Work", value: s.inProgress ?? 0, bg: "bg-yellow-50", iconBg: "bg-yellow-100" },
    { icon: "⏳", label: "Pending Approval", value: s.pendingApproval ?? 0, bg: "bg-purple-50", iconBg: "bg-purple-100", sub: "Unassigned complaints" },
    { icon: "✅", label: "Resolved", value: s.resolvedComplaints ?? 0, bg: "bg-green-50", iconBg: "bg-green-100" },
    { icon: "💳", label: "Pending Estimates", value: s.pendingEstimates ?? 0, bg: "bg-red-50", iconBg: "bg-red-100", sub: "Awaiting admin approval" },
  ];

  return (
    <div className="space-y-4">
      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-end gap-2 text-[10px] text-gray-400">
        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block"></span>
        Auto-refreshing every 10s
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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

      {/* ── Work In Progress Section ── */}
      {wip.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔄</span>
              <h2 className="text-blue-600 font-bold text-sm">Work In Progress ({wip.length})</h2>
            </div>
            <Btn color="gray" size="xs" onClick={() => onNavigate("Complaints")}>View All</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["Title", "Status", "Type", "Staff", "📞 Staff Phone", "Resident", "📞 Res. Phone"].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {wip.slice(0, 8).map(c => (
                  <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-gray-700 max-w-[140px] truncate">{c.title}</td>
                    <td className="px-3 py-2"><Badge color={statusColor(c.status)}>{c.status}</Badge></td>
                    <td className="px-3 py-2">
                      {c.workType ? <Badge color={c.workType === "Personal" ? "blue" : "teal"}>{c.workType === "CommonArea" ? "Common" : "Personal"}</Badge>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{c.assignedStaff?.name || "—"}</td>
                    <td className="px-3 py-2 text-xs text-blue-600 font-medium">{c.assignedStaff?.phone || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{c.resident?.name || "—"}</td>
                    <td className="px-3 py-2 text-xs text-blue-600 font-medium">{c.resident?.phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
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

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-blue-600 font-bold text-sm mb-1">Pending Estimates</h2>
          <p className="text-[10px] text-gray-400 mb-3">CommonArea work — approve before staff proceeds</p>
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
                    <Btn color="red" size="xs" onClick={() => handleEstimateAction(c._id, "Rejected")}>Reject</Btn>
                  </div>
                </div>
              </div>
            ))}
            {estimates.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No pending estimates</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-blue-600 font-bold text-sm mb-1">New Complaints</h2>
          <p className="text-[10px] text-gray-400 mb-3">Unassigned — needs staff assignment</p>
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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-gray-700 font-bold text-sm mb-1">Monthly Complaints</h2>
          <p className="text-[10px] text-gray-400 mb-3">Total complaints filed per month</p>
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
          <h2 className="text-gray-700 font-bold text-sm mb-1">Monthly Revenue (₹)</h2>
          <p className="text-[10px] text-gray-400 mb-3">Maintenance fees collected from residents</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData} barSize={22}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 11 }} formatter={v => [`₹${v.toLocaleString()}`, "Collected"]} />
              <Bar dataKey="revenue" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPLAINTS VIEW — auto-refreshes every 15s
// ══════════════════════════════════════════════════════════════════════════════
function ComplaintsView() {
  const [complaints, setComplaints] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");
  const [assignModal, setAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ staffId: "", workType: "Personal" });
  const [staffFilter, setStaffFilter] = useState({ dept: "All", avail: "All" });
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

  usePolling(fetchData, 15000);

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
    const matchPriority = filterPriority === "All" || c.priority === filterPriority;
    const matchCategory = filterCategory === "All" || c.category === filterCategory;
    return matchSearch && matchStatus && matchPriority && matchCategory;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const allCategories = ["All", ...Array.from(new Set(complaints.map(c => c.category).filter(Boolean)))];
  const allPriorities = ["All", "Low", "Medium", "High", "Emergency"];

  const departments = ["All", ...Array.from(new Set(staff.map(s => s.department).filter(Boolean)))];
  const filteredStaff = staff.filter(s => {
    const matchDept = staffFilter.dept === "All" || s.department === staffFilter.dept;
    const matchAvail = staffFilter.avail === "All" || (staffFilter.avail === "Available" ? s.isAvailable : !s.isAvailable);
    return matchDept && matchAvail;
  });

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {msg}<button className="text-xs underline ml-4" onClick={() => setMsg("")}>dismiss</button>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <input className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Search by title, ID, resident name..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="flex items-center gap-2">
            <Sel className="!py-1.5 !px-3 !rounded-xl !text-xs" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="newest">Latest First</option>
              <option value="oldest">Oldest First</option>
            </Sel>
            <Sel className="!py-1.5 !px-3 !rounded-xl !text-xs" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              {allPriorities.map(p => <option key={p} value={p}>{p === "All" ? "All Priorities" : p}</option>)}
            </Sel>
            <Sel className="!py-1.5 !px-3 !rounded-xl !text-xs" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              {allCategories.map(cat => <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>)}
            </Sel>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap border-t border-gray-50 pt-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-2">Status:</span>
          {["All", "Pending", "Assigned", "InProgress", "Resolved"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${filterStatus === s ? "bg-blue-600 text-white shadow-md" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
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
                    {c.status === "Pending" && <Btn color="blue" size="xs" onClick={() => { setAssignModal(c); setAssignForm({ staffId: "", workType: "Personal" }); setStaffFilter({ dept: "All", avail: "All" }); }}>Assign</Btn>}
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
                  { value: "Personal", icon: "🏠", label: "Personal Flat Work", desc: "Resident deals with cost. Auto-approved estimate." },
                  { value: "CommonArea", icon: "🏢", label: "Common Area Work", desc: "Estimate → admin approval → fund pays." },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setAssignForm(f => ({ ...f, workType: opt.value }))}
                    className={`border-2 rounded-xl p-3 text-left transition-all ${assignForm.workType === opt.value ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <p className="text-sm font-semibold text-gray-700">{opt.icon} {opt.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">Filter Staff</label>
              <div className="flex gap-2">
                <select value={staffFilter.dept} onChange={e => setStaffFilter(f => ({ ...f, dept: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300">
                  {departments.map(d => <option key={d} value={d}>{d === "All" ? "All Departments" : d}</option>)}
                </select>
                <select value={staffFilter.avail} onChange={e => setStaffFilter(f => ({ ...f, avail: e.target.value }))}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <option value="All">All Status</option>
                  <option value="Available">Available Only</option>
                  <option value="Busy">Busy Only</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">
                Select Staff Member <span className="text-gray-400 font-normal">({filteredStaff.length} shown)</span>
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filteredStaff.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No staff match filters</p>}
                {filteredStaff.map(s => (
                  <button key={s._id} onClick={() => setAssignForm(f => ({ ...f, staffId: s._id }))}
                    className={`w-full text-left border-2 rounded-xl px-4 py-2.5 transition-all ${assignForm.staffId === s._id ? "border-blue-500 bg-blue-50" : "border-gray-100 bg-white hover:border-gray-300"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.department}</p>
                      </div>
                      <Badge color={s.isAvailable ? "green" : "red"}>{s.isAvailable ? "Available" : "Busy"}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
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
// INVENTORY VIEW — with new fields: unitPrice, supplier, approvedBy, approvedDate
// ══════════════════════════════════════════════════════════════════════════════
const CATEGORIES = ["All", "Plumbing", "Electrical", "Carpentry", "Cleaning", "Security", "General"];

function InventoryView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [modal, setModal] = useState(null); // "add" | "edit" | "restock" | "view"
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category !== "All") params.append("category", category);
      const data = await apiFetch(`/inventory?${params}`);
      setItems(data.items || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, category]);

  usePolling(fetchItems, 15000);

  const handleSave = async () => {
    setSaving(true); setMsg("");
    try {
      if (modal === "add") {
        await apiFetch("/inventory", { method: "POST", body: JSON.stringify(form) });
      } else if (modal === "edit") {
        await apiFetch(`/inventory/${form._id}`, { method: "PUT", body: JSON.stringify(form) });
      } else if (modal === "restock") {
        await apiFetch("/inventory/restock", { method: "POST", body: JSON.stringify({ itemId: form._id, addQty: form.addQty }) });
      }
      setModal(null);
      fetchItems();
    } catch (err) { setMsg("❌ " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await apiFetch(`/inventory/${id}`, { method: "DELETE" });
      fetchItems();
    } catch (err) { alert(err.message); }
  };

  const f = (key) => ({ value: form[key] ?? "", onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })) });
  const isLow = (item) => item.quantity <= (item.minQuantity ?? item.minimum ?? 5);

  const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2 gap-2 flex-1 min-w-[200px]">
          <span className="text-gray-400 text-sm">🔍</span>
          <input className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
            placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${category === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => {
          setModal("add");
          setForm({ category: "General", unit: "pcs", quantity: 0, minQuantity: 5, description: "", unitPrice: 0, supplier: "", approvedBy: "", approvedDate: "" });
          setMsg("");
        }} className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap">
          + Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg">📦</div>
          <div><p className="text-xs text-gray-400">Total Items</p><p className="text-xl font-black text-gray-800">{items.length}</p></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-lg">⚠️</div>
          <div><p className="text-xs text-gray-400">Low Stock</p><p className="text-xl font-black text-red-600">{items.filter(isLow).length}</p></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg">✅</div>
          <div><p className="text-xs text-gray-400">Well Stocked</p><p className="text-xl font-black text-green-600">{items.filter((i) => !isLow(i)).length}</p></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Item", "Desc", "Category", "Unit", "Qty", "Min", "Unit Price", "Supplier", "Approved By", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className={`border-b border-gray-50 transition-colors ${isLow(item) ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}`}>
                  <td className="px-4 py-3 font-semibold text-gray-700">{item.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate" title={item.description || "—"}>{item.description || "—"}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">{item.category}</span></td>
                  <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                  <td className="px-4 py-3"><span className={`font-black text-base ${isLow(item) ? "text-red-600" : "text-gray-800"}`}>{item.quantity}</span></td>
                  <td className="px-4 py-3 text-gray-500">{item.minQuantity ?? item.minimum ?? 5}</td>
                  <td className="px-4 py-3 text-gray-600">{item.unitPrice ? `₹${item.unitPrice}` : "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{item.supplier || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{item.approvedBy || "—"}</td>
                  <td className="px-4 py-3">
                    {isLow(item)
                      ? <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500 text-white font-semibold">Low Stock</span>
                      : <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">OK</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setModal("view"); setForm({ ...item }); }}
                        className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-blue-100 transition-colors">
                        View
                      </button>
                      <button onClick={() => { setModal("restock"); setForm({ ...item, addQty: "" }); setMsg(""); }}
                        className="bg-teal-50 text-teal-600 border border-teal-200 px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-teal-100 transition-colors">
                        Restock
                      </button>
                      <button onClick={() => { setModal("edit"); setForm({ ...item }); setMsg(""); }}
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-gray-200 transition-colors">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(item._id)}
                        className="bg-red-50 text-red-500 border border-red-200 px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-red-100 transition-colors">
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400 text-sm">No items found. Add items manually.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-base font-bold text-gray-800">{modal === "add" ? "Add New Item" : "Edit Item"}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {msg && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{msg}</p>}
              <Input label="Item Name *" placeholder="e.g. LED Bulb 9W" {...f("name")} />
              <Input label="Description" placeholder="e.g. 4-inch stainless steel, lever action" {...f("description")} />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Category</label>
                  <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" {...f("category")}>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Unit</label>
                  <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" {...f("unit")}>
                    {["pcs", "kg", "m", "L", "rolls"].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <Input label="Quantity" type="number" placeholder="0" {...f("quantity")} />
                <Input label="Min Threshold" type="number" placeholder="5" {...f("minQuantity")} />
                <Input label="Unit Price (₹)" type="number" placeholder="0" {...f("unitPrice")} />
                <Input label="Supplier Name" placeholder="e.g. Sharma Traders" {...f("supplier")} />
                <Input label="Approved By" placeholder="Admin name" {...f("approvedBy")} />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Approved Date</label>
                  <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" {...f("approvedDate")} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-40">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {modal === "view" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-base font-bold text-gray-800">{form.name}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Category", val: form.category },
                  { label: "Unit", val: form.unit },
                  { label: "Quantity", val: `${form.quantity} ${form.unit}` },
                  { label: "Min Stock", val: form.minQuantity ?? form.minimum ?? 5 },
                  { label: "Unit Price", val: form.unitPrice ? `₹${form.unitPrice}` : "—" },
                  { label: "Supplier", val: form.supplier || "—" },
                  { label: "Approved By", val: form.approvedBy || "—" },
                  { label: "Approved Date", val: fmtDate(form.approvedDate) },
                ].map(row => (
                  <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">{row.label}</p>
                    <p className="font-semibold text-gray-700">{row.val}</p>
                  </div>
                ))}
              </div>
              <div className={`mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-center ${isLow(form) ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                {isLow(form) ? "Low Stock — Restock Needed" : "Stock Level OK"}
              </div>
              <div className="flex justify-end mt-4">
                <Btn color="gray" onClick={() => setModal(null)}>Close</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {modal === "restock" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-base font-bold text-gray-800">Restock: {form.name}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {msg && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{msg}</p>}
              <p className="text-sm text-gray-500">Current stock: <strong>{form.quantity} {form.unit}</strong></p>
              <Input label="Add Quantity" type="number" placeholder="e.g. 10"
                value={form.addQty || ""} onChange={(e) => setForm((p) => ({ ...p, addQty: e.target.value }))} />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.addQty} className="px-4 py-2 rounded-xl text-sm bg-teal-500 text-white hover:bg-teal-600 font-semibold disabled:opacity-40">
                  {saving ? "Saving..." : `+ Add ${form.addQty || ""} ${form.unit}`}
                </button>
              </div>
            </div>
          </div>
        </div>
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
        await apiFetch("/admin/create-staff", { method: "POST", body: JSON.stringify(form) });
      else if (modal === "editStaff")
        await apiFetch(`/admin/staff/${form._id}`, { method: "PUT", body: JSON.stringify(form) });
      else if (modal === "createUser")
        await apiFetch("/admin/create-user", { method: "POST", body: JSON.stringify(form) });
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
                        <Btn color="red" size="xs" onClick={() => handleDelete("staff", s._id)}>Delete</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && staff.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">No staff found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

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
                        <Btn color="red" size="xs" onClick={() => handleDelete("users", u._id)}>Delete</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && users.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-gray-400">No residents found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {(modal === "createStaff" || modal === "editStaff") && (
        <Modal title={modal === "createStaff" ? "Add New Staff" : "Edit Staff"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {msg && <p className={`text-sm px-3 py-2 rounded-lg ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name" placeholder="Ramesh Kumar"        {...f("name")} />
              <Input label="Email" type="email" placeholder="staff@example.com" {...f("email")} />
              <Input label="Phone" placeholder="9876543210"          {...f("phone")} />
              <Input label="Aadhaar" placeholder="1234 5678 9012"      {...f("aadhaar")} />
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

      {(modal === "createUser" || modal === "editUser") && (
        <Modal title={modal === "createUser" ? "Add New Resident" : "Edit Resident"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            {msg && <p className={`text-sm px-3 py-2 rounded-lg ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</p>}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name" placeholder="Ashish Sharma"         {...f("name")} />
              <Input label="Email" type="email" placeholder="res@example.com" {...f("email")} />
              <Input label="Age" type="number" placeholder="30"       {...f("age")} />
              <Input label="Phone" placeholder="9876543210"             {...f("phone")} />
              <Input label="Flat No." placeholder="101 / A-202"            {...f("flatNumber")} />
              <Input label="Aadhaar" placeholder="1234 5678 9012"         {...f("aadhaar")} />
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
// PAYMENTS VIEW
// ══════════════════════════════════════════════════════════════════════════════
function PaymentsView() {
  const [tab, setTab] = useState("maintenance");
  const [maintenance, setMaintenance] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState(5000);
  const [viewModal, setViewModal] = useState(null);
  const [markModal, setMarkModal] = useState(null);
  const [markingPaid, setMarkingPaid] = useState(null);

  const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const statusBadgeColor = s => ({ Paid: "green", Pending: "yellow", Overdue: "red" }[s] || "gray");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/payments/list");
      setMaintenance(data.maintenance || []);
      setPersonal(data.personal || []);
    } catch (err) { console.error("Payments fetch:", err); }
    finally { setLoading(false); }
  }, []);

  usePolling(fetchPayments, 15000);

  const handleGenerateMonthly = async () => {
    setGenerating(true); setGenMsg("");
    try {
      const res = await apiFetch("/payments/generate-monthly", { method: "POST", body: JSON.stringify({ amount: Number(monthlyAmount) }) });
      setGenMsg(`✅ Done — ${res.created} new records created, ${res.skipped} already existed for ${res.month}/${res.year}`);
      fetchPayments();
    } catch (err) { setGenMsg("❌ " + err.message); }
    finally { setGenerating(false); }
  };

  const handleMarkPaid = async () => {
    if (!markModal) return;
    setMarkingPaid(markModal._id);
    try {
      await apiFetch("/payments/mark-paid", { method: "POST", body: JSON.stringify({ paymentId: markModal._id }) });
      setMarkModal(null);
      fetchPayments();
    } catch (err) { alert("❌ " + err.message); }
    finally { setMarkingPaid(null); }
  };

  const totalFund = maintenance.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const totalCollected = personal.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const totalOverdue = personal.filter(p => p.status === "Overdue").reduce((s, p) => s + p.amount, 0);
  const totalPending = personal.filter(p => p.status === "Pending").length;

  return (
    <div className="space-y-4">
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

      <div className="flex items-center gap-3 flex-wrap">
        {[{ key: "maintenance", label: "🏛️ Maintenance Fund" }, { key: "personal", label: "🏠 Personal Payments" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t.key ? "bg-blue-600 text-white" : "bg-white text-gray-600 shadow-sm hover:bg-gray-50"}`}>
            {t.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {tab === "personal" && (
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl shadow-sm border border-gray-100">
              <span className="text-xs text-gray-500 font-semibold pl-2">₹</span>
              <input type="number" value={monthlyAmount} onChange={e => setMonthlyAmount(e.target.value)} className="w-16 bg-transparent text-sm outline-none font-bold text-gray-700 placeholder-gray-300" placeholder="5000" />
              <Btn color="teal" size="sm" onClick={handleGenerateMonthly} disabled={generating}>
                {generating ? "Generating..." : "⟳ Generate"}
              </Btn>
            </div>
          )}
          <Btn color="gray" size="sm" onClick={fetchPayments}>↻ Refresh</Btn>
        </div>
      </div>

      {genMsg && (
        <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${genMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {genMsg}<button className="text-xs underline ml-4" onClick={() => setGenMsg("")}>dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
      ) : (
        <>
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
                      No maintenance payments yet. They auto-create when CommonArea complaints are completed by staff.
                    </td></tr>
                  ) : maintenance.map((p, i) => (
                    <tr key={p._id || i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 text-blue-600 font-semibold text-xs">{p.refId}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(p.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{p.purpose || "—"}</td>
                      <td className="px-4 py-3 font-bold text-gray-700">₹{p.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge color={statusBadgeColor(p.status)}>{p.status}</Badge></td>
                      <td className="px-4 py-3 text-gray-600">{p.workerName || p.worker?.name || "—"}</td>
                      <td className="px-4 py-3"><Btn color="gray" size="xs" onClick={() => setViewModal({ type: "man", data: p })}>View</Btn></td>
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

          {tab === "personal" && (
            <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-700 text-sm">Resident Maintenance Fee</h3>
                <span className="text-xs text-gray-400">
                  {personal.length === 0 ? "Click 'Generate Monthly Requests'" : `${personal.length} records · ${personal.filter(p => p.status === "Paid").length} paid`}
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
                      <td className="px-4 py-3"><Badge color="blue">{p.flatNumber || p.resident?.flatNumber || "—"}</Badge></td>
                      <td className="px-4 py-3 text-gray-700">{p.resident?.name || "—"}</td>
                      <td className="px-4 py-3 font-bold text-gray-700">₹{p.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3"><Badge color={statusBadgeColor(p.status)}>{p.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(p.dueDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Btn color="gray" size="xs" onClick={() => setViewModal({ type: "per", data: p })}>View</Btn>
                          {p.status !== "Paid" && (
                            <>
                              <span className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-yellow-50 text-yellow-600 border border-yellow-200 whitespace-nowrap">
                                Awaiting resident
                              </span>
                              <Btn color="green" size="xs" disabled={markingPaid === p._id} onClick={() => setMarkModal(p)}>
                                {markingPaid === p._id ? "..." : "Mark Paid"}
                              </Btn>
                            </>
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

      {markModal && (
        <Modal title="Confirm Payment" onClose={() => setMarkModal(null)}>
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-green-500 font-semibold uppercase tracking-wide mb-1">Confirming Payment For</p>
              <p className="text-xl font-black text-green-700">{markModal.refId}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Resident", val: markModal.resident?.name || "—" },
                { label: "Flat No.", val: markModal.flatNumber || "—" },
                { label: "Amount", val: `₹${markModal.amount?.toLocaleString()}` },
                { label: "Due Date", val: fmtDate(markModal.dueDate) },
              ].map(row => (
                <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{row.label}</p>
                  <p className="font-semibold text-gray-700">{row.val}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              Admin confirming this payment as received (cash/offline). Will mark as Paid.
            </p>
            <div className="flex justify-end gap-2">
              <Btn color="gray" onClick={() => setMarkModal(null)}>Cancel</Btn>
              <Btn color="green" onClick={handleMarkPaid} disabled={!!markingPaid}>
                {markingPaid ? "Processing..." : "Confirm Paid"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

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
                { label: "Purpose", val: viewModal.data.purpose || "—" },
                { label: "Amount", val: `₹${viewModal.data.amount?.toLocaleString()}` },
                { label: "Worker", val: viewModal.data.workerName || "—" },
                { label: "Department", val: viewModal.data.worker?.department || "—" },
                { label: "Date", val: fmtDate(viewModal.data.createdAt) },
                { label: "Paid On", val: fmtDate(viewModal.data.paidAt) },
              ].map(row => (
                <div key={row.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">{row.label}</p>
                  <p className="font-semibold text-gray-700">{row.val}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end"><Btn color="gray" onClick={() => setViewModal(null)}>Close</Btn></div>
          </div>
        </Modal>
      )}

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
                { label: "Flat No.", val: viewModal.data.flatNumber || "—" },
                { label: "Phone", val: viewModal.data.resident?.phone || "—" },
                { label: "Amount", val: `₹${viewModal.data.amount?.toLocaleString()}` },
                { label: "Due Date", val: fmtDate(viewModal.data.dueDate) },
                { label: "Paid On", val: fmtDate(viewModal.data.paidAt) },
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
            <div className="flex justify-end"><Btn color="gray" onClick={() => setViewModal(null)}>Close</Btn></div>
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

  const fetchReports = useCallback(async () => {
    try {
      const d = await apiFetch("/admin/reports-data");
      setData(d);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  usePolling(fetchReports, 30000);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
    </div>
  );

  const c = data?.complaints || {};
  const s = data?.staff || {};
  const cats = data?.categoryBreakdown || [];
  const invCats = data?.inventoryCategories || [];
  const totalIncome = data?.fund?.totalIncome || 0;
  const totalExpense = data?.fund?.totalExpense || 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-700 text-sm mb-4">📊 Work Summary</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-green-600">{c.resolved || 0}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-1">Resolved</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-yellow-600">{c.inProgress || 0}</p>
              <p className="text-[10px] text-gray-500 font-medium mt-1">Active Work</p>
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

        {/* Maintenance Fund Log — now shows real income */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-gray-700 text-sm mb-4">🏛️ Maintenance Fund Log</h2>
          <div className="space-y-2">
            <div className="bg-green-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Total Income</span>
              <span className="text-lg font-black text-green-600">₹{totalIncome.toLocaleString()}</span>
            </div>
            <div className="bg-red-50 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-600 font-medium">Total Expenses</span>
              <span className="text-lg font-black text-red-500">-₹{totalExpense.toLocaleString()}</span>
            </div>
            <div className="bg-blue-600 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-white font-bold">Net Balance</span>
              <span className="text-lg font-black text-white">₹{(totalIncome - totalExpense).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
                      <span className="text-gray-400">{cat.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 text-center py-8">No data yet</p>
          )}
        </div>

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
      setMsg("❌ New passwords do not match"); return;
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
    } catch (err) { setMsg("❌ " + err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-4">
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
          {msg && <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}
          <div className="flex justify-end pt-2">
            <Btn color="blue" size="md" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Btn>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-gray-700 text-sm mb-3">System Info</h3>
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex justify-between py-2 border-b border-gray-50"><span>App Name</span><span className="font-semibold text-gray-700">FixMate</span></div>
          <div className="flex justify-between py-2 border-b border-gray-50"><span>Version</span><span className="font-semibold text-gray-700">1.0.0</span></div>
          <div className="flex justify-between py-2 border-b border-gray-50"><span>Stack</span><span className="font-semibold text-gray-700">React + Node.js + MongoDB</span></div>
          <div className="flex justify-between py-2"><span>Session Auth</span><span className="font-semibold text-green-600">Active</span></div>
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
    { label: "Dashboard", icon: "📊" },
    { label: "Complaints", icon: "📋" },
    { label: "User Management", icon: "👥" },
    { label: "Payments", icon: "💳" },
    { label: "Inventory", icon: "📦" },
    { label: "Reports", icon: "📈" },
    { label: "Settings", icon: "⚙️" },
    { label: "Logout", icon: "🚪" },
  ];

  const handleLogout = async () => {
    try { await fetch(`${API}/logout`, { method: "POST", headers: getAuthHeaders() }); } catch (_) { }
    clearSessionId();
    window.location.href = "/";
  };

  const renderView = () => {
    switch (activeNav) {
      case "Dashboard": return <DashboardView onNavigate={setActiveNav} />;
      case "Complaints": return <ComplaintsView />;
      case "User Management": return <UserManagementView />;
      case "Payments": return <PaymentsView />;
      case "Inventory": return <InventoryView />;
      case "Reports": return <ReportsView />;
      case "Settings": return <SettingsView />;
      default: return null;
    }
  };

  const [profileName, setProfileName] = useState("Admin");
  useEffect(() => {
    apiFetch("/profile").then(p => setProfileName(p.profile?.name || "Admin")).catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <aside className="w-56 bg-white flex flex-col shadow-md z-10 flex-shrink-0">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg">🔧</div>
          <span className="text-blue-700 font-black text-xl tracking-tight">FixMate</span>
        </div>
        <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ label, icon, isLink }) => (
            <button key={label}
              onClick={() => {
                if (label === "Logout") handleLogout();
                else if (isLink) window.location.href = "/";
                else setActiveNav(label);
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left
                ${activeNav === label && !isLink && label !== "Logout" ? "bg-blue-600 text-white shadow-sm"
                  : label === "Logout" ? "text-red-500 hover:bg-red-50"
                    : isLink ? "text-blue-600 hover:bg-blue-50"
                      : "text-gray-500 hover:bg-blue-50 hover:text-blue-700"}`}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white px-6 py-3 flex items-center justify-between shadow-sm border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-slate-100 px-4 py-2 rounded-xl">
             <span className="font-semibold text-blue-600">FixMate Dashboard</span>
             <span>&rsaquo;</span>
             <span>{activeNav}</span>
          </div>
          
          <div className="flex items-center justify-end gap-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-white">
              {profileName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-gray-700">{profileName}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-5">
          {renderView()}
        </main>
      </div>
    </div>
  );
}