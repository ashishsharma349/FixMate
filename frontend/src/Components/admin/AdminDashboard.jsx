import { useState, useEffect, useCallback, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { getAuthHeaders } from "../../utils/api";
import { clearSessionId } from "../../utils/api";
import AnnouncementBoard from "../announcements/AnnouncementBoard";
import AnnouncementForm from "../announcements/AnnouncementForm";


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

const statusColor = (s) => ({
  Pending: "yellow",
  Assigned: "blue",
  EstimateSubmitted: "orange",
  EstimateApproved: "teal",
  InProgress: "purple",
  PaymentPending: "yellow",
  Resolved: "green"
}[s] || "gray");
const priorityColor = (p) => ({ Low: "green", Medium: "orange", High: "red" }[p] || "gray");

function DashboardView({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [viewEstimateModal, setViewEstimateModal] = useState(null);
  const [viewWipModal, setViewWipModal] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiFetch("/admin/dashboard-stats");
      setStats(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchChartData = useCallback(async () => {
    try {
      const [complaintRes, revenueRes] = await Promise.all([
        apiFetch("/admin/monthly-stats"),
        apiFetch("/payments/monthly-revenue"),
      ]);
      const complaints = complaintRes.chartData || [];
      const revenues = revenueRes.chartData || [];
      const revMap = {};
      revenues.forEach((r) => {
        if (r.monthNum != null && r.year != null) revMap[`${r.monthNum}-${r.year}`] = r.revenue;
      });
      const now = new Date();
      const curM = now.getMonth() + 1;
      const curY = now.getFullYear();

      setChartData(
        complaints
          .map((c) => ({
            ...c,
            revenue: revMap[`${c.monthNum}-${c.year}`] || 0,
          }))
          .filter((d) => d.monthNum === curM && d.year === curY)
      );
    } catch (err) {
      console.error("Chart:", err);
    }
  }, []);

  usePolling(fetchStats, 10000);

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
  const efficiency = stats?.efficiency || { personalWork: 0, publicWork: 0 };
  const recent = stats?.recentComplaints || [];
  const estimates = stats?.pendingEstimatesList || [];
  const newPending = recent.filter(c => c.status === "Pending");
  const lowStock = stats?.lowStockItems || [];
  const wip = stats?.wipComplaints || [];

  const statCards = [
    { icon: "", label: "Total Complaints", value: s.totalComplaints ?? 0, bg: "bg-blue-50", iconBg: "bg-blue-100" },
    { icon: "", label: "Total Residents", value: s.totalResidents ?? 0, bg: "bg-indigo-50", iconBg: "bg-indigo-100" },
    { icon: "", label: "Total Staff", value: s.totalStaff ?? 0, bg: "bg-teal-50", iconBg: "bg-teal-100" },
    { icon: "", label: "Active Work", value: s.inProgress ?? 0, bg: "bg-yellow-50", iconBg: "bg-yellow-100" },
    { icon: "", label: "Resolved", value: s.resolvedComplaints ?? 0, bg: "bg-green-50", iconBg: "bg-green-100" },
  ];

  return (
    <div className="space-y-4">
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
            <span className="text-orange-500 text-lg">!</span>
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

      {wip.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg"></span>
              <h2 className="text-blue-600 font-bold text-sm">Work In Progress ({wip.length})</h2>
            </div>
            <Btn color="gray" size="xs" onClick={() => onNavigate("Complaints")}>View All</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{["Title", "Status", "Scheduled Visit", "Type", "Staff", "Staff Phone", "Resident", "Res. Phone"].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {wip.slice(0, 8).map(c => (
                  <tr key={c._id} onClick={() => setViewWipModal(c)}
                    className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors group">
                    <td className="px-3 py-2 font-semibold text-gray-700 max-w-[140px] truncate group-hover:text-blue-600">{c.title}</td>
                    <td className="px-3 py-2"><Badge color={statusColor(c.status)}>{c.status}</Badge></td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        {c.scheduledAt && <span className="text-[10px] font-bold text-purple-600">{new Date(c.scheduledAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>}
                        <span className="text-[9px] text-gray-400 font-medium uppercase">{c.scheduledSlot || (c.status === "Pending" ? "Pending Slot" : "No Slot")}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {c.workType ? <Badge color={c.workType === "Personal" ? "blue" : "teal"}>{c.workType === "CommonArea" ? "Common" : "Personal"}</Badge>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{c.assignedStaff?.[0]?.name || "—"}</td>
                    <td className="px-3 py-2 text-xs text-blue-600 font-medium">{c.assignedStaff?.[0]?.phone || "—"}</td>
                    <td className="px-3 py-2 text-gray-600 font-medium">{c.residentName || c.resident?.name || "—"}</td>
                    <td className="px-3 py-2 text-xs text-blue-600 font-bold">{c.residentPhone || c.resident?.phone || "—"}</td>
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
                <div className="flex flex-col gap-1 mt-2 text-[10px] text-gray-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-4"></span>
                    <span className="truncate font-bold text-gray-700">{c.residentName || c.resident?.name || "—"}</span>
                    <span className="text-blue-600 font-bold ml-auto">{c.residentPhone || c.resident?.phone || ""}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4"></span>
                    <span className="truncate">{c.assignedStaff?.[0]?.name || "Unassigned"}</span>
                    {c.assignedStaff?.[0]?.phone && <span className="text-teal-600 font-bold ml-auto">{c.assignedStaff[0].phone}</span>}
                  </div>
                  {c.scheduledSlot && (
                    <div className="flex items-center gap-2 text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-lg mt-1 w-fit">
                      <span></span> {c.scheduledSlot}
                    </div>
                  )}
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
            {estimates.map(c => (
              <div key={c._id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1 truncate">
                    <p className="text-sm font-semibold text-gray-700 truncate">{c.title}</p>
                    <Badge color={c.workType === "Personal" ? "blue" : "teal"}>{c.workType}</Badge>
                  </div>
                  <span className="text-sm font-bold text-gray-700 ml-2">₹{c.estimatedCost ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Staff</span>
                    <span className="text-xs text-blue-600 font-bold">{c.assignedStaff?.[0]?.name || "—"}</span>
                  </div>
                  <div className="flex gap-1">
                    <Btn color="gray" size="xs" onClick={() => setViewEstimateModal(c)}>View</Btn>
                    {c.workType === "CommonArea" && (
                      <>
                        <Btn color="green" size="xs" onClick={() => handleEstimateAction(c._id, "Approved")}>Approve</Btn>
                        <Btn color="red" size="xs" onClick={() => handleEstimateAction(c._id, "Rejected")}>Reject</Btn>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {estimates.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No pending estimates requiring admin action</p>}
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
                  <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
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
          <h2 className="text-gray-700 font-bold text-sm mb-1">Complaints &amp; monthly fees</h2>
          <p className="text-[10px] text-gray-400 mb-3">Complaints filed per month (blue) vs resident maintenance fees collected (green)</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} barSize={18}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" hide />
              <YAxis yAxisId="right" hide orientation="right" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="complaints" name="Complaints" fill="#6088f4" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="revenue" name="Fees collected (₹)" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h2 className="text-gray-700 font-bold text-sm">Maintenance Fund (Pooled)</h2>
              <button onClick={() => onNavigate("Payments")} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-bold hover:bg-blue-100 transition-colors">Details &rsaquo;</button>
            </div>
            <p className="text-[10px] text-gray-400 mb-2 font-medium italic">Monthly fund summary for {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][new Date().getMonth()]} {new Date().getFullYear()}</p>
            {stats?.residentMonthlyFees && (
              <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[10px] text-slate-600 leading-relaxed">
                <span className="font-black text-slate-500 uppercase tracking-wide">Resident monthly fees · {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][stats.residentMonthlyFees.month - 1]} {stats.residentMonthlyFees.year}</span>
                <p className="mt-1"><span className="text-emerald-600 font-bold">₹{(stats.residentMonthlyFees.collectedAmount ?? 0).toLocaleString()}</span> collected ({stats.residentMonthlyFees.paidCount ?? 0} flats paid)</p>
                <p><span className="text-amber-600 font-bold">₹{(stats.residentMonthlyFees.pendingAmount ?? 0).toLocaleString()}</span> outstanding ({stats.residentMonthlyFees.pendingCount ?? 0} pending)</p>
                <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col gap-1">
                  <p className="font-black text-blue-600 uppercase tracking-widest text-[9px]">Overall Society Status</p>
                  <p className="text-slate-800">Total Fund (Real Money): <span className="font-bold">₹{(stats.residentMonthlyFees.overallBalance ?? 0).toLocaleString()}</span></p>
                  <p className="text-slate-800">Left to Collect Overall: <span className="font-bold">₹{(stats.residentMonthlyFees.overallPending ?? 0).toLocaleString()}</span></p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-3xl font-black text-blue-600">₹{stats?.fund?.balance?.toLocaleString() || 0}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Current Month Balance</p>
            </div>

            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-100 mb-2">
              <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${Math.min(100, (stats?.fund?.spent / stats?.fund?.limit) * 100)}%` }} />
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold">
              <div className="flex flex-col">
                <span className="text-gray-400 uppercase tracking-widest">Total Pooled</span>
                <span className="text-gray-600">₹{stats?.fund?.limit?.toLocaleString() || 0}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-gray-400 uppercase tracking-widest text-red-400">Total Spent</span>
                <span className="text-red-500 font-black">₹{stats?.fund?.spent?.toLocaleString() || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="text-gray-700 font-bold text-sm mb-1">Work Efficiency</h2>
        <p className="text-[10px] text-gray-400 mb-3">Personal vs Common Area work efficiency (solved/total × 100)</p>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="50%" height={150}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Personal Work', value: efficiency.personalWork },
                  { name: 'Common Area Work', value: efficiency.publicWork }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#6088f4" />
                <Cell fill="#22c55e" />
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 11 }} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center">
          <p className="text-[10px] text-gray-600">
            <span className="text-blue-600 font-bold">Personal:</span> {efficiency.personalWork}% |
            <span className="text-green-600 font-bold"> Common:</span> {efficiency.publicWork}%
          </p>
        </div>
      </div>

      {viewEstimateModal && (
        <Modal title={`Estimate Approval: ${viewEstimateModal.title}`} onClose={() => setViewEstimateModal(null)}>
          <div className="space-y-4 text-sm text-gray-700">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase">Requested By</p>
                  <p className="font-bold text-gray-800">{viewEstimateModal.resident?.name || "—"} (Flat {viewEstimateModal.resident?.flatNumber || "—"})</p>
                </div>
                <Badge color={viewEstimateModal.workType === "Personal" ? "blue" : "teal"}>{viewEstimateModal.workType}</Badge>
              </div>
              <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100">{viewEstimateModal.description}</p>
            </div>

            <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-900/10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Staff Estimate Breakdown</h4>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-slate-400 font-medium">Labour Cost</span>
                  <span className="font-black text-lg">₹{viewEstimateModal.labourEstimate || 0}</span>
                </div>
                {viewEstimateModal.inventoryEstimate?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Materials</p>
                    {viewEstimateModal.inventoryEstimate.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">{item.name} <span className="text-[10px] text-slate-500">x{item.qty}</span></span>
                        <span className="font-bold text-slate-200">₹{(item.price || 0) * (item.qty || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-dashed border-white/20">
                <span className="font-black text-xs uppercase tracking-widest">Total Estimated</span>
                <span className="text-3xl font-black text-blue-400">₹{viewEstimateModal.estimatedCost || 0}</span>
              </div>
            </div>

            {(viewEstimateModal.status === "Resolved" || (viewEstimateModal.actualCost > 0)) && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                <p className="text-[10px] font-black uppercase text-emerald-700 mb-2 tracking-widest">Final pay (actual)</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-800 font-medium">Settled amount</span>
                  <span className="text-2xl font-black text-emerald-700">₹{viewEstimateModal.actualCost ?? 0}</span>
                </div>
                {(viewEstimateModal.estimatedCost > 0) && (
                  <p className="text-[10px] text-gray-500 mt-2">Compared to estimate: ₹{viewEstimateModal.estimatedCost}</p>
                )}
              </div>
            )}

            {viewEstimateModal.workType === "Personal" ? (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-700 font-medium italic">This is a private repair. The resident must approve this estimate, not the admin. You are seeing this for monitoring purposes.</p>
              </div>
            ) : (
              <div className="flex justify-end gap-3 pt-2">
                <Btn color="gray" className="!rounded-xl !px-6" onClick={() => setViewEstimateModal(null)}>Close</Btn>
                <Btn color="red" className="!rounded-xl !px-6" onClick={() => { handleEstimateAction(viewEstimateModal._id, "Rejected"); setViewEstimateModal(null); }}>Reject</Btn>
                <Btn color="green" className="!rounded-xl !px-8" onClick={() => { handleEstimateAction(viewEstimateModal._id, "Approved"); setViewEstimateModal(null); }}>Approve & Proceed</Btn>
              </div>
            )}
          </div>
        </Modal>
      )}

      {viewWipModal && (
        <Modal title={`Complaint Details: ${viewWipModal.title}`} onClose={() => setViewWipModal(null)}>
          <div className="space-y-4">
            {viewWipModal.image_url && (
              <div className="w-full h-48 rounded-2xl overflow-hidden bg-gray-100 mb-4">
                <img src={`${API}${viewWipModal.image_url}`} alt="Evidence" className="w-full h-full object-cover" />
              </div>
            )}
            {viewWipModal.scheduledAt && (
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-purple-400 font-bold uppercase mb-0.5">Scheduled Visit</p>
                  <p className="text-sm font-bold text-purple-700">
                    {new Date(viewWipModal.scheduledAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} · {viewWipModal.scheduledSlot}
                  </p>
                </div>
                <span className="text-xl"></span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Status</p>
                <Badge color={statusColor(viewWipModal.status)}>{viewWipModal.status}</Badge>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Priority</p>
                <Badge color={priorityColor(viewWipModal.priority)}>{viewWipModal.priority}</Badge>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <h4 className="text-xs font-bold text-blue-700 uppercase mb-3">Resident Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-blue-400 font-semibold mb-0.5">Name</p>
                  <p className="text-sm font-bold text-gray-800">{viewWipModal.residentName || viewWipModal.resident?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-blue-400 font-semibold mb-0.5">Flat Number</p>
                  <p className="text-sm font-bold text-gray-800">{viewWipModal.flatNumber || viewWipModal.resident?.flatNumber || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-blue-400 font-semibold mb-0.5">Contact</p>
                  <p className="text-sm font-bold text-gray-800">{viewWipModal.residentPhone || viewWipModal.resident?.phone || "—"}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Complaint Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{viewWipModal.description}</p>
            </div>

            <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
              <h4 className="text-xs font-bold text-teal-700 uppercase mb-3">Work & Staff</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-teal-400 font-semibold mb-0.5">Work Type</p>
                  <Badge color={viewWipModal.workType === "CommonArea" ? "teal" : "blue"}>{viewWipModal.workType || "Unassigned"}</Badge>
                </div>
                <div>
                  <p className="text-[10px] text-teal-400 font-semibold mb-0.5">Assigned Staff</p>
                  <p className="text-sm font-bold text-gray-800">{viewWipModal.assignedStaff?.[0]?.name || "Unassigned"}</p>
                </div>
                {viewWipModal.assignedStaff?.[0]?.phone && (
                  <div className="col-span-2">
                    <p className="text-[10px] text-teal-400 font-semibold mb-0.5">Staff Contact</p>
                    <p className="text-sm font-bold text-gray-800">{viewWipModal.assignedStaff?.[0]?.phone}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Btn color="gray" onClick={() => setViewWipModal(null)}>Close</Btn>
              <Btn color="blue" onClick={() => { setViewWipModal(null); onNavigate("Complaints"); }}>Management View</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

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
  const [assignForm, setAssignForm] = useState({ staffIds: [], workType: "Personal", scheduledAt: "", scheduledSlot: "" });
  const [staffFilter, setStaffFilter] = useState({ dept: "All", avail: "All" });
  const [assigning, setAssigning] = useState(false);
  const [busyStaffIds, setBusyStaffIds] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedDetail, setSelectedDetail] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [cData, sData] = await Promise.all([apiFetch("/admin/complaints"), apiFetch("/admin/staff")]);
      setComplaints(cData.complaints || []);
      setStaff(sData.staff || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  usePolling(fetchData, 15000);

  useEffect(() => {
    if (!assignModal || !assignForm.scheduledAt || !assignForm.scheduledSlot) return;
    const checkAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const data = await apiFetch(`/admin/staff-availability?date=${assignForm.scheduledAt}&slot=${assignForm.scheduledSlot}`);
        setBusyStaffIds(data.busyStaffIds || []);
      } catch (err) { console.error("Availability check failed:", err); }
      finally { setCheckingAvailability(false); }
    };
    const timer = setTimeout(checkAvailability, 500); // Debounce
    return () => clearTimeout(timer);
  }, [assignModal, assignForm.scheduledAt, assignForm.scheduledSlot]);

  const handleAssign = async () => {
    if (assignForm.staffIds.length < 1) {
      alert("Please select at least 1 staff member");
      return;
    }
    setAssigning(true);
    try {
      await apiFetch("/admin/assign-complaint", { method: "POST", body: JSON.stringify({ complaintId: assignModal._id, ...assignForm }) });
      setMsg("Assigned successfully to " + assignForm.staffIds.length + " technicians!");
      setAssignModal(null);
      fetchData();
    } catch (err) { setMsg(err.message); }
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
  const allPriorities = ["All", "Low", "Medium", "High"];

  const departments = ["All", ...Array.from(new Set(staff.map(s => s.department).filter(Boolean)))];
  const filteredStaff = staff.filter(s => {
    const matchDept = staffFilter.dept === "All" || s.department === staffFilter.dept;
    const matchAvail = staffFilter.avail === "All" || (staffFilter.avail === "Available" ? s.isAvailable : !s.isAvailable);
    return matchDept && matchAvail;
  });

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-between ${msg.includes("successfully") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
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
          {["All", "Pending", "Assigned", "EstimateSubmitted", "EstimateApproved", "InProgress", "PaymentPending", "Resolved"].map(s => (
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
              <tr>{["#", "Title", "Visit Slot", "Resident", "Phone", "Flat", "Priority", "Status", "Work Type", "Staff", "Est. Cost", "Date", "Action"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate font-semibold">{c.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      {c.scheduledAt && <span className="text-[10px] font-black text-purple-600">{new Date(c.scheduledAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>}
                      <span className="text-[9px] text-gray-400 leading-none font-bold uppercase">{c.scheduledSlot || "No Slot"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-medium">{c.residentName || c.resident?.name || "—"}</td>
                  <td className="px-4 py-3 text-xs text-blue-600 font-bold">{c.residentPhone || c.resident?.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-bold font-mono">{c.flatNumber || c.resident?.flatNumber || "—"}</td>
                  <td className="px-4 py-3"><Badge color={priorityColor(c.priority)}>{c.priority}</Badge></td>
                  <td className="px-4 py-3"><Badge color={statusColor(c.status)}>{c.status}</Badge></td>
                  <td className="px-4 py-3">
                    {c.workType ? <Badge color={c.workType === "Personal" ? "blue" : "teal"}>{c.workType === "CommonArea" ? "Common" : "Personal"}</Badge>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-700">{c.assignedStaff?.[0]?.name || <span className="text-gray-300">—</span>}</span>
                      {c.assignedStaff?.[0]?.phone && <span className="text-[10px] text-blue-500 font-bold">{c.assignedStaff[0].phone}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.estimatedCost !== null && c.estimatedCost !== undefined ? `₹${c.estimatedCost}` : <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedDetail(c)}
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-[11px] font-bold hover:bg-gray-200 transition-colors">
                        View
                      </button>
                      {c.status === "Pending" && <Btn color="blue" size="xs" onClick={() => { setAssignModal(c); setAssignForm({ staffIds: [], workType: "Personal", scheduledAt: new Date().toISOString().split("T")[0], scheduledSlot: c.scheduledSlot || "10 AM - 1 PM", staffIncentive: 0 }); setStaffFilter({ dept: "All", avail: "All" }); }}>Assign</Btn>}
                      {c.status === "InProgress" && <Btn color="green" size="xs" onClick={() => handleResolve(c._id)}>Resolve</Btn>}
                    </div>
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
            <div className="bg-gray-50 rounded-xl p-3 text-sm flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-700">{assignModal.resident?.name || "—"}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase">{assignModal.resident?.flatNumber || "No Flat"}</p>
              </div>
              <Badge color={priorityColor(assignModal.priority)}>{assignModal.priority}</Badge>
            </div>
            <p className="text-gray-500 text-xs px-1">{assignModal.description}</p>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">Work Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "Personal", icon: "", label: "Personal Flat Work", desc: "Resident deals with cost. Auto-approved estimate." },
                  { value: "CommonArea", icon: "", label: "Common Area Work", desc: "Estimate → admin approval → fund pays." },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setAssignForm(f => ({ ...f, workType: opt.value }))}
                    className={`border-2 rounded-xl p-3 text-left transition-all ${assignForm.workType === opt.value ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                    <p className="text-sm font-semibold text-gray-700">{opt.icon} {opt.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">Visit Date</label>
                <input type="date" value={assignForm.scheduledAt} onChange={e => setAssignForm(f => ({ ...f, scheduledAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">Time Slot</label>
                <select value={assignForm.scheduledSlot} onChange={e => setAssignForm(f => ({ ...f, scheduledSlot: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300">
                  {["10 AM - 1 PM", "1 PM - 4 PM", "4 PM - 7 PM", "7 PM - 10 PM"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">Select Staff Member</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {staff.map(s => {
                  const isSelected = assignForm.staffIds.includes(s._id);
                  return (
                    <button key={s._id}
                      onClick={() => {
                        setAssignForm(f => {
                          const ids = isSelected ? f.staffIds.filter(id => id !== s._id) : [...f.staffIds, s._id];
                          return { ...f, staffIds: ids };
                        });
                      }}
                      className={`w-full text-left border-2 rounded-xl px-4 py-2 transition-all ${isSelected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-100 bg-white text-gray-600 hover:border-gray-300"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">{s.name}</p>
                          <p className="text-[10px] uppercase font-black opacity-60">{s.department} · {s.isAvailable ? "Available" : "Busy"}</p>
                        </div>
                        {isSelected && <span className="text-xs font-black">SELECTED</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t mt-2">
              <span className="text-[10px] font-black text-gray-400">{assignForm.staffIds.length} Selected</span>
              <div className="flex gap-2">
                <Btn color="gray" onClick={() => setAssignModal(null)}>Cancel</Btn>
                <Btn color="blue" onClick={handleAssign} disabled={assignForm.staffIds.length < 1 || assigning}>
                  {assigning ? "Assigning..." : "Assign Staff"}
                </Btn>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {selectedDetail && (
        <Modal title="Complaint Full Details" onClose={() => setSelectedDetail(null)}>
          <div className="space-y-4">
            {selectedDetail.image_url && (
              <div className="w-full h-48 rounded-2xl overflow-hidden bg-gray-100 mb-2">
                <img src={`${API}${selectedDetail.image_url}`} alt="Evidence" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-[10px] text-blue-400 font-black uppercase mb-1">Resident Info</p>
                <p className="font-bold text-gray-800">{selectedDetail.resident?.name || "—"}</p>
                <p className="text-xs text-gray-500 font-bold">Flat: {selectedDetail.resident?.flatNumber || "—"}</p>
                <p className="text-xs text-gray-400 font-medium">{selectedDetail.resident?.phone || ""}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Assignment</p>
                <p className="font-bold text-gray-800">{selectedDetail.assignedStaff?.[0]?.name || "Unassigned"}</p>
                <p className="text-xs text-gray-500">{selectedDetail.assignedStaff?.[0]?.department || "—"}</p>
                <Badge color={statusColor(selectedDetail.status)} className="mt-1">{selectedDetail.status}</Badge>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] text-gray-400 font-black uppercase mb-2">Problem Description</p>
              <p className="text-sm text-gray-700 leading-relaxed font-medium">{selectedDetail.description || "No description provided."}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-3">
                <p className="text-[10px] text-teal-500 font-black mb-1">ESTIMATED COST</p>
                <p className="text-lg font-black text-teal-700">₹{selectedDetail.estimatedCost || 0}</p>
              </div>
              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-3">
                <p className="text-[10px] text-teal-500 font-black mb-1">ACTUAL COST</p>
                <p className="text-lg font-black text-teal-700">₹{selectedDetail.actualCost || 0}</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Btn color="blue" onClick={() => setSelectedDetail(null)}>Close</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

const CATEGORIES = ["All", "Plumbing", "Electrical", "Carpentry", "Cleaning", "Security", "General"];

function InventoryView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchItems = useCallback(async () => {
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
        await apiFetch("/inventory", { method: "POST", body: JSON.stringify({ ...form, supplier: "Default Supplier" }) });
      } else if (modal === "edit") {
        await apiFetch(`/inventory/${form._id}`, { method: "PUT", body: JSON.stringify({ ...form, supplier: "Default Supplier" }) });
      } else if (modal === "restock") {
        const formData = new FormData();
        formData.append("itemId", form._id);
        formData.append("addQty", form.addQty);
        formData.append("costPerUnit", form.costPerUnit);
        if (form.billFile) formData.append("billImage", form.billFile);

        const res = await fetch(`${API}/inventory/restock`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || "Restock failed");
      }
      setModal(null);
      fetchItems();
    } catch (err) { setMsg(err.message); }
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
      <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2 gap-2 flex-1 min-w-[200px]">
          <span className="text-gray-400 text-sm"></span>
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

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg"></div>
          <div><p className="text-xs text-gray-400">Total Items</p><p className="text-xl font-black text-gray-800">{items.length}</p></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-lg"></div>
          <div><p className="text-xs text-gray-400">Low Stock</p><p className="text-xl font-black text-red-600">{items.filter(isLow).length}</p></div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg"></div>
          <div><p className="text-xs text-gray-400">Well Stocked</p><p className="text-xl font-black text-green-600">{items.filter((i) => !isLow(i)).length}</p></div>
        </div>
      </div>

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
              {form.description && (
                <div className="bg-gray-50 rounded-xl p-3 mt-3 text-sm">
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="font-semibold text-gray-700">{form.description}</p>
                </div>
              )}
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

      {modal === "restock" && (
        <Modal title={`Restock: ${form.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            {msg && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg font-bold">{msg}</p>}
            <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Current Stock</p>
                <p className="text-lg font-bold text-gray-700">{form.quantity} {form.unit}</p>
              </div>
              <Badge color="blue">Default Supplier</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Add Quantity *" type="number" placeholder="e.g. 10"
                value={form.addQty || ""} onChange={(e) => setForm((p) => ({ ...p, addQty: e.target.value }))} />
              <Input label="Cost Per Unit (₹) *" type="number" placeholder="e.g. 45"
                value={form.costPerUnit || ""} onChange={(e) => setForm((p) => ({ ...p, costPerUnit: e.target.value }))} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Upload Bill Image (Optional)</label>
              <input type="file" accept="image/*"
                onChange={(e) => setForm((p) => ({ ...p, billFile: e.target.files[0] }))}
                className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
            </div>

            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-50">
              <p className="text-[10px] text-blue-500 font-bold leading-tight uppercase">
                ℹ️ This restocking will automatically create a <b>Society Expense</b> record for audit.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.addQty || !form.costPerUnit} className="px-4 py-2 rounded-xl text-sm bg-teal-500 text-white hover:bg-teal-600 font-bold disabled:opacity-40 shadow-lg shadow-teal-100">
                {saving ? "Restocking..." : `Confirm Restock`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

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
      if (modal === "createStaff") {
        const payload = { ...form, userType: "staff", contact: form.phone };
        await apiFetch("/admin/create-staff", { method: "POST", body: JSON.stringify(payload) });
      } else if (modal === "editStaff") {
        await apiFetch(`/admin/staff/${form._id}`, { method: "PUT", body: JSON.stringify(form) });
      } else if (modal === "createUser") {
        const payload = { ...form, userType: "user", contact: form.phone };
        await apiFetch("/admin/create-user", { method: "POST", body: JSON.stringify(payload) });
      } else if (modal === "editUser") {
        await apiFetch(`/admin/users/${form._id}`, { method: "PUT", body: JSON.stringify(form) });
      }
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
        {[{ key: "staff", label: "👷 Staff", count: staff.length }, { key: "users", label: "🏠 Residents", count: users.length }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 ${tab === t.key ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            <span>{t.label}</span>
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${tab === t.key ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"}`}>
              {t.count}
            </span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
          ) : staff.map((s, idx) => (
            <div key={s._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl font-bold text-blue-600 shadow-inner">
                    {s.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-base">{s.name}</h4>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{s.department}</p>
                  </div>
                </div>
                <Badge color="blue" className="!px-2 !py-0.5 text-[10px]">{idx + 1}</Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-gray-300">📧</span>
                  <span className="truncate">{s.authId?.email || "No Email"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-300">📞</span>
                  <span className="font-black text-blue-600 tracking-tight">{s.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <span className="text-gray-300">🆔</span>
                  <span>Aadhaar: {s.aadhaar || "—"}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-50">
                <button onClick={() => openModal("editStaff", { ...s, email: s.authId?.email })}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  Edit Profile
                </button>
                <button onClick={() => handleDelete("staff", s._id)}
                  className="px-3 bg-red-50 hover:bg-red-100 text-red-500 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {!loading && staff.length === 0 && <div className="col-span-full text-center py-20 text-gray-400">No staff found. Click "Add Staff" to begin.</div>}
        </div>
      )}

      {tab === "users" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
          ) : users.map((u, idx) => (
            <div key={u._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-xl font-bold text-teal-600 shadow-inner">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-base">{u.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-teal-600 font-black px-1.5 py-0.5 bg-teal-50 rounded-md">FLAT {u.flatNumber || "—"}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Age: {u.age}</span>
                    </div>
                  </div>
                </div>
                <Badge color="gray" className="!px-2 !py-0.5 text-[10px]">{idx + 1}</Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-gray-300">📧</span>
                  <span className="truncate">{u.authId?.email || "No Email"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-300">📞</span>
                  <span className="font-black text-blue-600 tracking-tight">{u.phone}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">🆔</span>
                    <span>{u.aadhaar || "—"}</span>
                  </div>
                  <span>Joined: {new Date(u.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-50">
                <button onClick={() => openModal("editUser", { ...u, email: u.authId?.email })}
                  className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  Edit Details
                </button>
                <button onClick={() => handleDelete("users", u._id)}
                  className="px-3 bg-red-50 hover:bg-red-100 text-red-500 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {!loading && users.length === 0 && <div className="col-span-full text-center py-20 text-gray-400">No residents found. Click "Add Resident" to begin.</div>}
        </div>
      )}

      {(modal === "createStaff" || modal === "editStaff") && (
        <Modal title={modal === "createStaff" ? "Add New Staff" : "Edit Staff"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Input label="Full Name *" placeholder="e.g. Rahul Sharma" {...f("name")} />
            <Input label="Email Address *" placeholder="rahul@fixmate.com" {...f("email")} />
            <Input label="Phone Number *" placeholder="+91 XXXX-XXXXXX" {...f("phone")} />
            <Input label="Aadhaar ID" placeholder="XXXX-XXXX-XXXX" {...f("aadhaar")} />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Department</label>
                <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-300" {...f("department")}>
                  {["Plumbing", "Electrical", "Cleaning", "Carpentry", "Security", "Other"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <Input label="Base Salary (₹)" type="number" placeholder="8000" {...f("baseSalary")} />
            </div>
            {msg && <p className="text-xs font-bold text-red-500">{msg}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Btn color="gray" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn color="blue" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Staff Member"}</Btn>
            </div>
          </div>
        </Modal>
      )}

      {(modal === "createUser" || modal === "editUser") && (
        <Modal title={modal === "createUser" ? "Add New Resident" : "Edit Resident"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Input label="Full Name *" placeholder="e.g. Sameer Khanna" {...f("name")} />
            <Input label="Email Address *" placeholder="sameer@fixmate.com" {...f("email")} />
            <Input label="Phone Number *" placeholder="+91 XXXX-XXXXXX" {...f("phone")} />
            <Input label="Aadhaar ID" placeholder="XXXX-XXXX-XXXX" {...f("aadhaar")} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Flat Number *" placeholder="B-102" {...f("flatNumber")} />
              <Input label="Age" type="number" placeholder="30" {...f("age")} />
            </div>
            {msg && <p className="text-xs font-bold text-red-500">{msg}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Btn color="gray" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn color="blue" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Resident"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PaymentsView() {
  const now = new Date();
  const [tab, setTab] = useState("expenses");
  const [finYear, setFinYear] = useState(String(now.getFullYear()));
  const [finMonth, setFinMonth] = useState(String(now.getMonth() + 1));

  const [data, setData] = useState({ staff: [], expenses: [], salaries: [], personalPayments: [], stats: { totalIncome: 0, totalSpent: 0, balance: 0, fundLimit: 0 }, filters: {} });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState("");
  const [salaryModal, setSalaryModal] = useState(null);
  const [salaryForm, setSalaryForm] = useState({ amount: "", month: now.getMonth() + 1, year: now.getFullYear(), description: "" });

  const [addExpenseModal, setAddExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: "", category: "CommonRepair", amount: "", date: "" });
  const [billFile, setBillFile] = useState(null);

  const [editFinance, setEditFinance] = useState(null);

  const [monthlyPersonal, setMonthlyPersonal] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [mYear, setMYear] = useState(String(now.getFullYear()));
  const [mMonth, setMMonth] = useState(String(now.getMonth() + 1));
  const [viewPayment, setViewPayment] = useState(null);

  const buildFinQuery = () => {
    if (!finYear || finYear === "all") return "";
    if (finMonth && finMonth !== "all") return `?month=${finMonth}&year=${finYear}`;
    return `?year=${finYear}`;
  };

  const fetchData = useCallback(async () => {
    try {
      const d = await apiFetch(`/admin/finances-data${buildFinQuery()}`);
      setData(d);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [finYear, finMonth]);

  const fetchMonthly = useCallback(async () => {
    setMonthlyLoading(true);
    try {
      const d = await apiFetch(`/payments/list?month=${mMonth}&year=${mYear}`);
      setMonthlyPersonal(d.personal || []);
    } catch (err) { console.error(err); }
    finally { setMonthlyLoading(false); }
  }, [mMonth, mYear]);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, 15000);

  useEffect(() => {
    if (tab === "monthly") fetchMonthly();
  }, [tab, fetchMonthly]);

  const handlePayout = async (financeId) => {
    if (!window.confirm("Confirm payment from Maintenance Fund?")) return;
    setProcessing(true); setMsg("");
    try {
      await apiFetch("/admin/payout-expense", { method: "POST", body: JSON.stringify({ financeId }) });
      setMsg("✅ Payout successful. Fund balance updated.");
      fetchData();
    } catch (err) { setMsg("❌ " + err.message); }
    finally { setProcessing(false); }
  };

  const handleSaveEditFinance = async () => {
    if (!editFinance?._id) return;
    setProcessing(true); setMsg("");
    try {
      await apiFetch(`/admin/finance/${editFinance._id}`, {
        method: "PUT",
        body: JSON.stringify({
          description: editFinance.description,
          amount: Number(editFinance.amount),
          transactionCategory: editFinance.transactionCategory,
          status: editFinance.status,
          date: editFinance.date || undefined,
        }),
      });
      setMsg("✅ Record updated.");
      setEditFinance(null);
      fetchData();
    } catch (err) { setMsg("❌ " + err.message); }
    finally { setProcessing(false); }
  };

  const handleDeleteFinance = async (id) => {
    if (!window.confirm("Delete this record permanently?")) return;
    setProcessing(true); setMsg("");
    try {
      await apiFetch(`/admin/finance/${id}`, { method: "DELETE" });
      setMsg("✅ Record deleted.");
      fetchData();
    } catch (err) { setMsg("❌ " + err.message); }
    finally { setProcessing(false); }
  };

  const handleMarkPaidMonthly = async (paymentId) => {
    setProcessing(true); setMsg("");
    try {
      await apiFetch("/payments/mark-paid", { method: "POST", body: JSON.stringify({ paymentId }) });
      setMsg("✅ Marked as paid (offline).");
      fetchMonthly();
      fetchData();
    } catch (err) { setMsg("❌ " + err.message); }
    finally { setProcessing(false); }
  };

  const handleRecordSalary = async () => {
    if (!salaryForm.amount || !salaryModal) return;
    setProcessing(true); setMsg("");
    try {
      await apiFetch("/admin/record-salary", {
        method: "POST",
        body: JSON.stringify({ staffId: salaryModal._id, ...salaryForm })
      });
      setMsg("Salary recorded for " + salaryModal.name);
      setSalaryModal(null);
      fetchData();
    } catch (err) { setMsg(err.message); }
    finally { setProcessing(false); }
  };

  const handleAddExpense = async () => {
    if (!expenseForm.title || !expenseForm.amount) return setMsg("Title and amount are required");
    setProcessing(true); setMsg("");
    try {
      const fd = new FormData();
      fd.append("title", expenseForm.title);
      fd.append("category", expenseForm.category);
      fd.append("amount", expenseForm.amount);
      if (expenseForm.date) fd.append("date", expenseForm.date);
      if (billFile) fd.append("billImage", billFile);

      const API = "http://localhost:3000";
      const authHeaderMap = getAuthHeaders();
      const res = await fetch(`${API}/admin/add-expense`, {
        method: "POST",
        headers: {
          ...authHeaderMap,
        },
        body: fd
      });
      const returnedData = await res.json();
      if (!res.ok) throw new Error(returnedData.error || "Failed to add expense");

      setMsg("✅ Record added successfully.");
      setAddExpenseModal(false);
      setExpenseForm({ title: "", category: "CommonRepair", amount: "", date: "" });
      setBillFile(null);
      fetchData();
    } catch (err) { setMsg("❌ " + err.message); }
    finally { setProcessing(false); }
  };

  const handleGenerateMonthly = async () => {
    const hasExisting = monthlyPersonal.length > 0;
    const confirmMsg = hasExisting
      ? `Records already exist for ${mMonth}/${mYear}. Generate for any missing residents only?`
      : `Generate maintenance dues for ${mMonth}/${mYear}?`;

    if (!window.confirm(confirmMsg)) return;
    setProcessing(true); setMsg("");
    try {
      const amount = prompt("Enter maintenance amount:", "5000");
      if (amount === null) return; // cancelled

      const res = await apiFetch("/payments/generate-monthly", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) })
      });
      setMsg(`Generated ${res.created} records. Skipped ${res.skipped} already existing.`);
      fetchMonthly();
    } catch (err) { setMsg(err.message); } finally { setProcessing(false); }
  };

  const fExt = (field) => ({
    value: expenseForm[field] || "",
    onChange: (e) => setExpenseForm(prev => ({ ...prev, [field]: e.target.value }))
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—");
  const { stats, expenses, salaries, personalPayments, staff } = data;
  const pendingPayoutSum = expenses.filter((e) => e.status === "Pending").reduce((s, e) => s + e.amount, 0);
  const filterHint = finYear === "all" ? "All periods" : (finMonth && finMonth !== "all" ? `Month filter` : `Year ${finYear}`);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-5 rounded-3xl shadow-xl shadow-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Society Fund (Real Money)</p>
          <p className="text-2xl font-black text-white">₹{(stats.overallBalance ?? 0).toLocaleString()}</p>
          <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase italic">Actual cash in hand (All time)</p>
        </div>
        <div className="bg-amber-50 p-5 rounded-3xl shadow-sm border border-amber-100">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Total Outstanding Dues (All Months)</p>
          <p className="text-2xl font-black text-amber-700">₹{(stats.overallPending ?? 0).toLocaleString()}</p>
          <p className="text-[9px] text-amber-400 font-bold mt-1 uppercase italic">Unpaid records from all history</p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pending Payouts</p>
          <p className="text-2xl font-black text-orange-600">₹{pendingPayoutSum.toLocaleString()}</p>
          <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase italic">Approved common area costs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Monthly Fee Collected this month ({filterHint})</p>
          <p className="text-2xl font-black text-blue-600">₹{(stats.balance ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Collected This Month ({filterHint})</p>
          <p className="text-2xl font-black text-green-600">₹{(stats.totalIncome ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Spent ({filterHint})</p>
          <p className="text-2xl font-black text-red-600">₹{(stats.totalSpent ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expense / salary records</span>
        <select value={finYear} onChange={(e) => setFinYear(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50">
          <option value="all">All years</option>
          {[2024, 2025, 2026, 2027, 2028].map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
        <select value={finMonth} onChange={(e) => setFinMonth(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50" disabled={!finYear || finYear === "all"}>
          <option value="all">Whole year</option>
          {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
            <option key={m} value={String(i + 1)}>{m}</option>
          ))}
        </select>
        <span className="text-[10px] text-gray-400">{filterHint}</span>
      </div>

      <div className="flex flex-wrap items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100 gap-1">
        {[
          { id: "expenses", label: "Expenses" },
          { id: "salaries", label: "Salaries" },
          { id: "personal", label: "Resident work pay" },
          { id: "monthly", label: "Monthly maintenance" },
        ].map(({ id, label }) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
            ${tab === id ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-gray-400 hover:text-gray-600"}`}>
            {label}
          </button>
        ))}
      </div>

      {msg && <div className={`px-5 py-3 rounded-2xl text-sm font-bold border ${msg.startsWith("✅") ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"}`}>{msg}</div>}

      {/* SECTION: EXPENSES */}
      {tab === "expenses" && (
        <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-50 flex flex-col">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Common Work & Inventory Payouts</h3>
            <div className="flex items-center gap-3">
              <Badge color="blue">{expenses.length} Records</Badge>
              <Btn color="blue" size="xs" onClick={() => setAddExpenseModal(true)}>+ Add Bill</Btn>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50">
                <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-4">Date</th>
                  <th className="px-8 py-4">Description</th>
                  <th className="px-8 py-4 text-center">Amount</th>
                  <th className="px-8 py-4 text-center">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 text-[11px] font-bold text-gray-500">{fmtDate(e.date)}</td>
                    <td className="px-8 py-5">
                      <p className="font-black text-gray-800 text-xs uppercase">{e.description}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{e.transactionCategory}</p>
                    </td>
                    <td className="px-8 py-5 text-center font-black text-gray-800">₹{e.amount.toLocaleString()}</td>
                    <td className="px-8 py-5 text-center">
                      <Badge color={e.status === "Paid" ? "green" : "yellow"}>{e.status}</Badge>
                    </td>
                    <td className="px-8 py-5 text-right space-x-1">
                      {e.status === "Pending" && (
                        <Btn color="blue" size="xs" onClick={() => handlePayout(e._id)} disabled={processing}>Pay</Btn>
                      )}
                      <Btn color="gray" size="xs" onClick={() => setEditFinance({
                        _id: e._id,
                        description: e.description,
                        amount: e.amount,
                        transactionCategory: e.transactionCategory,
                        status: e.status,
                        date: e.date ? new Date(e.date).toISOString().slice(0, 10) : "",
                      })}>Edit</Btn>
                      <Btn color="red" size="xs" onClick={() => handleDeleteFinance(e._id)} disabled={processing}>Del</Btn>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={5} className="py-20 text-center text-gray-300 font-black uppercase text-[10px]">No Expenses Logged</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION: SALARIES */}
      {tab === "salaries" && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Record new payroll</h3>
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{staff.length} staff</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((s) => {
                const alreadyPaid = salaries.some((f) => String(f.handledBy?._id || f.handledBy) === String(s._id));
                return (
                  <div key={s._id} className="border border-gray-100 rounded-[2rem] p-6 hover:shadow-lg transition-all bg-gradient-to-br from-white to-slate-50/50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-black text-gray-800 uppercase tracking-tight">{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.department}</p>
                      </div>
                      <Badge color={alreadyPaid ? "green" : "gray"}>{alreadyPaid ? "PAID (period)" : "AWAITING"}</Badge>
                    </div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] uppercase font-black text-gray-400">Base salary</span>
                      <span className="text-xl font-black text-gray-700">₹{s.baseSalary || 8000}</span>
                    </div>
                    <Btn color={alreadyPaid ? "gray" : "blue"} className="w-full !rounded-2xl py-3" onClick={() => setSalaryModal(s)} disabled={alreadyPaid}>
                      {alreadyPaid ? "Salary in period" : "Record Payment"}
                    </Btn>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-50">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Salary ledger</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-1">Edit or remove entries for the selected period</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50">
                  <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Staff</th>
                    <th className="px-6 py-3">Period</th>
                    <th className="px-6 py-3 text-center">Amount</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {salaries.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-[11px] font-bold text-gray-500">{fmtDate(row.date)}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{row.handledBy?.name || "—"}</td>
                      <td className="px-6 py-4 text-xs text-gray-600">{row.month}/{row.year}</td>
                      <td className="px-6 py-4 text-center font-black">₹{row.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <Btn color="gray" size="xs" onClick={() => setEditFinance({
                          _id: row._id,
                          description: row.description,
                          amount: row.amount,
                          transactionCategory: "Salary",
                          status: row.status,
                          date: row.date ? new Date(row.date).toISOString().slice(0, 10) : "",
                        })}>Edit</Btn>
                        <Btn color="red" size="xs" onClick={() => handleDeleteFinance(row._id)} disabled={processing}>Del</Btn>
                      </td>
                    </tr>
                  ))}
                  {salaries.length === 0 && (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-300 font-black uppercase text-[10px]">No salary rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: RESIDENT PAYMENTS */}
      {tab === "personal" && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col">
          <div className="p-8 border-b border-gray-50">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Resident Personal Work Log</h3>
            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Tracking direct payments (Resident to Staff)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/20 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4 text-left">Repair Task</th>
                  <th className="px-8 py-4 text-left">Resident & Staff</th>
                  <th className="px-8 py-4 text-center">User Log</th>
                  <th className="px-8 py-4 text-center">Staff Log</th>
                  <th className="px-8 py-4 text-right">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[11px]">
                {personalPayments.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-black text-gray-800 uppercase tracking-tight">{p.title}</p>
                      <p className="text-[9px] text-gray-400 font-bold border border-gray-100 inline-block px-1 rounded mt-1">#{p._id.slice(-6)}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-600">R: {p.resident?.name} ({p.resident?.flatNumber})</p>
                      <p className="font-bold text-blue-500">S: {p.assignedStaff?.[0]?.name || "—"}</p>
                    </td>
                    <td className="px-8 py-5 text-center font-black text-gray-700">₹{p.userPaymentAmount ?? "—"}</td>
                    <td className="px-8 py-5 text-center font-black text-gray-700">₹{p.staffPaymentAmount ?? "—"}</td>
                    <td className="px-8 py-5 text-right font-black">
                      <Badge color={p.paymentMatchStatus === "Match" ? "green" : (p.userPaymentAmount ? "red" : "gray")}>
                        {p.paymentMatchStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "monthly" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Maintenance fee records</span>
            <select value={mYear} onChange={(e) => setMYear(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold bg-gray-50">
              {[2024, 2025, 2026, 2027, 2028].map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
            <select value={mMonth} onChange={(e) => setMMonth(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold bg-gray-50">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                <option key={m} value={String(i + 1)}>{m}</option>
              ))}
            </select>
            <Btn color="gray" size="xs" onClick={() => fetchMonthly()}>Refresh</Btn>
            <Btn color="blue" size="xs" onClick={handleGenerateMonthly} disabled={processing}>
              {processing ? "Generating..." : "Generate Dues"}
            </Btn>
          </div>
          <p className="text-[10px] text-gray-500 px-1">Online payments trigger a receipt email when verified (Razorpay). Offline collections: use Mark paid.</p>
          <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden border border-gray-50">
            {monthlyLoading ? (
              <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="bg-gray-50/50">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">
                      <th className="px-6 py-4">Ref</th>
                      <th className="px-6 py-4">Resident</th>
                      <th className="px-6 py-4 text-center">Amount</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Due</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthlyPersonal.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono text-xs">{p.refId}</td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-800">{p.resident?.name || "—"}</p>
                          <p className="text-[10px] text-gray-400">Flat {p.flatNumber || p.resident?.flatNumber || "—"}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-black">₹{p.amount?.toLocaleString?.() ?? p.amount}</td>
                        <td className="px-6 py-4 text-center"><Badge color={p.status === "Paid" ? "green" : p.status === "Overdue" ? "red" : "yellow"}>{p.status}</Badge></td>
                        <td className="px-6 py-4 text-center text-[11px] text-gray-500">{p.dueDate ? fmtDate(p.dueDate) : "—"}</td>
                        <td className="px-6 py-4 text-right space-x-1">
                          <Btn color="gray" size="xs" onClick={() => setViewPayment(p)}>View</Btn>
                          {p.status !== "Paid" && (
                            <Btn color="green" size="xs" onClick={() => handleMarkPaidMonthly(p._id)} disabled={processing}>Mark paid</Btn>
                          )}
                        </td>
                      </tr>
                    ))}
                    {monthlyPersonal.length === 0 && (
                      <tr><td colSpan={6} className="py-20 text-center text-gray-300 font-black uppercase text-[10px]">No monthly fee rows (generate dues or pick another month)</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {viewPayment && (
        <Modal title={`Payment ${viewPayment.refId}`} onClose={() => setViewPayment(null)}>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-gray-400">Resident</span>
              <span className="font-bold">{viewPayment.resident?.name}</span>
              <span className="text-gray-400">Flat</span>
              <span className="font-bold">{viewPayment.flatNumber || viewPayment.resident?.flatNumber}</span>
              <span className="text-gray-400">Amount</span>
              <span className="font-bold">₹{viewPayment.amount?.toLocaleString?.() ?? viewPayment.amount}</span>
              <span className="text-gray-400">Status</span>
              <span className="font-bold">{viewPayment.status}</span>
              <span className="text-gray-400">Month / Year</span>
              <span className="font-bold">{viewPayment.month}/{viewPayment.year}</span>
              <span className="text-gray-400">Paid at</span>
              <span className="font-bold">{viewPayment.paidAt ? fmtDate(viewPayment.paidAt) : "—"}</span>
              <span className="text-gray-400">Razorpay order</span>
              <span className="font-mono text-[10px] break-all">{viewPayment.razorpayOrderId || "—"}</span>
              <span className="text-gray-400">Razorpay payment id</span>
              <span className="font-mono text-[10px] break-all">{viewPayment.razorpayPaymentId || "—"}</span>
            </div>
            <Btn color="gray" className="w-full mt-2" onClick={() => setViewPayment(null)}>Close</Btn>
          </div>
        </Modal>
      )}

      {editFinance && (
        <Modal title="Edit finance record" onClose={() => setEditFinance(null)}>
          <div className="space-y-3">
            <Input label="Description" value={editFinance.description} onChange={(e) => setEditFinance((prev) => ({ ...prev, description: e.target.value }))} />
            <Input label="Amount (₹)" type="number" value={editFinance.amount} onChange={(e) => setEditFinance((prev) => ({ ...prev, amount: e.target.value }))} />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Category</label>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50"
                value={editFinance.transactionCategory}
                onChange={(e) => setEditFinance((prev) => ({ ...prev, transactionCategory: e.target.value }))}
              >
                {["Salary", "CommonRepair", "Inventory", "FundTopUp", "DirectPayment", "Incentive"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Status</label>
              <select
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50"
                value={editFinance.status}
                onChange={(e) => setEditFinance((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
            <Input label="Date" type="date" value={editFinance.date || ""} onChange={(e) => setEditFinance((prev) => ({ ...prev, date: e.target.value }))} />
            <div className="flex gap-2 pt-2">
              <Btn color="gray" className="flex-1" onClick={() => setEditFinance(null)}>Cancel</Btn>
              <Btn color="blue" className="flex-1" onClick={handleSaveEditFinance} disabled={processing}>Save</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Salary Record Modal */}
      {salaryModal && (
        <Modal title={`Record Salary: ${salaryModal.name}`} onClose={() => setSalaryModal(null)}>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-[10px] text-blue-400 font-black uppercase mb-1">Standard Pay Rate</p>
              <p className="text-xl font-black text-blue-700">₹{salaryModal.baseSalary || 8000}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Month</label>
                <select className="col-span-1 w-full border border-gray-100 bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold"
                  value={salaryForm.month} onChange={e => setSalaryForm({ ...salaryForm, month: e.target.value })}>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Year</label>
                <select className="col-span-1 w-full border border-gray-100 bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold"
                  value={salaryForm.year} onChange={e => setSalaryForm({ ...salaryForm, year: e.target.value })}>
                  {[2024, 2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Actual Amount Paid (₹)</label>
              <input type="number" className="w-full border border-gray-100 bg-slate-50 rounded-xl px-4 py-2 text-sm font-black text-gray-700"
                placeholder={salaryModal.baseSalary || 8000} value={salaryForm.amount} onChange={e => setSalaryForm({ ...salaryForm, amount: e.target.value })} />
            </div>

            <div className="flex gap-2 pt-2">
              <Btn color="gray" className="flex-1" onClick={() => setSalaryModal(null)}>Cancel</Btn>
              <Btn color="blue" className="flex-1" onClick={handleRecordSalary} disabled={processing || !salaryForm.amount}>
                {processing ? "Processing..." : "Confirm Payout"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {addExpenseModal && (
        <Modal title="Manually Log Expense Bill" onClose={() => setAddExpenseModal(false)}>
          <div className="space-y-4">
            <Input label="Description / Title *" placeholder="Paint Supplies" {...fExt("title")} />
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Category</label>
                <select className="border border-gray-100 bg-slate-50 rounded-xl px-3 py-2 text-xs font-bold" {...fExt("category")}>
                  <option value="CommonRepair">Common Repair</option>
                  <option value="Inventory">Inventory Supply</option>
                  <option value="DirectPayment">Direct Payment</option>
                  <option value="Incentive">Incentive</option>
                </select>
              </div>
              <Input label="Total Amount (₹) *" type="number" placeholder="1500" {...fExt("amount")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Date of Purchase</label>
              <input type="date" className="border border-gray-100 rounded-xl px-3 py-2 text-sm bg-slate-50 uppercase font-black text-gray-700" {...fExt("date")} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Upload Bill Receipt (Optional)</label>
              <input type="file" accept="image/*" onChange={(e) => setBillFile(e.target.files[0])} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            {msg && <p className="text-xs font-bold text-red-500">{msg}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Btn color="gray" onClick={() => setAddExpenseModal(false)}>Cancel</Btn>
              <Btn color="blue" onClick={handleAddExpense} disabled={processing}>{processing ? "Saving..." : "Log Expense"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ScheduleCalendar({ schedule = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState(null);

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  const totalDays = daysInMonth(month, year);
  const startDay = firstDayOfMonth(month, year);

  // Padding for start of month
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const getTasksForDay = (day) => {
    if (!day) return [];
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedule.filter(s => s.scheduledAt && s.scheduledAt.startsWith(dStr));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-700 text-sm">📅 Staff Schedule</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">&lsaquo;</button>
          <span className="text-xs font-bold text-gray-600 min-w-[100px] text-center">{monthNames[month]} {year}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">&rsaquo;</button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7 gap-1 text-center mb-4 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
          <div key={d} className="text-[10px] font-bold text-gray-400 uppercase py-1">{d}</div>
        ))}
        {days.map((day, idx) => {
          const tasks = getTasksForDay(day);
          const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
          return (
            <div key={idx}
              onClick={() => day && tasks.length > 0 && setSelectedDayTasks({ day, tasks })}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative transition-all
                ${day ? "hover:bg-gray-50 cursor-default" : ""}
                ${isToday ? "ring-2 ring-blue-600 ring-inset" : ""}
                ${tasks.length > 0 ? "bg-blue-600 text-white shadow-md cursor-pointer hover:bg-blue-700 font-black z-10" : "text-gray-500"}
              `}>
              {day}
              {tasks.length > 0 && <span className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />}
            </div>
          );
        })}
      </div>

      {selectedDayTasks ? (
        <div className="mt-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Tasks for {selectedDayTasks.day} {monthNames[month]}</p>
            <button onClick={() => setSelectedDayTasks(null)} className="text-blue-400 hover:text-blue-600 font-bold">&times;</button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {selectedDayTasks.tasks.map(t => (
              <div key={t._id} className="bg-white/60 p-2 rounded-lg text-[11px]">
                <p className="font-bold text-gray-700 truncate">{t.title}</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-blue-600 font-medium">{t.assignedStaff?.[0]?.name || "Unassigned"}</span>
                  <span className="text-gray-400">{t.scheduledSlot}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] text-gray-400">
          <div className="w-2 h-2 bg-blue-100 rounded-full" />
          <span>Days with assigned tasks are highlighted</span>
        </div>
      )}
    </div>
  );
}

function BillsRecordsView() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const d = await apiFetch("/admin/finances-data");
      setBills(d.groupedBills || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  usePolling(fetchData, 15000);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-gray-800 tracking-tight">📁 Monthly Bills & Records</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Full audit log of society expenditures</p>
        </div>
        <Btn color="gray" size="xs" onClick={fetchData}>Refresh Records</Btn>
      </div>

      <div className="space-y-8">
        {bills.map(group => (
          <div key={`${group.month}-${group.year}`} className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
            <div className="bg-slate-50 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-black text-blue-700 uppercase tracking-widest text-sm">
                {monthNames[group.month]} {group.year}
              </h3>
              <Badge color="blue">{group.items.length} Records</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50">
                  <tr className="text-left">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Item / Work</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Amount</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Bill Image</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {group.items.map(item => (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-black text-gray-800 text-xs uppercase">{item.description}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{item.transactionCategory}</p>
                      </td>
                      <td className="px-8 py-5 text-center font-black text-gray-800">₹{item.amount.toLocaleString()}</td>
                      <td className="px-8 py-5 text-center">
                        <Badge color={item.status === "Paid" ? "green" : "yellow"}>{item.status}</Badge>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {item.billImage ? (
                          <a href={`${API}${item.billImage}`} target="_blank" rel="noreferrer" className="text-blue-500 font-bold text-[10px] uppercase hover:underline">View Bill</a>
                        ) : (
                          <span className="text-gray-300 text-[10px] font-black uppercase">No Image</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {bills.length === 0 && <div className="text-center py-20 bg-white rounded-3xl text-gray-300 font-black uppercase text-xs">No records found</div>}
      </div>
    </div>
  );
}

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

function NoticesView() {
  const [refresh, setRefresh] = useState(0);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <AnnouncementForm onCreated={() => setRefresh(prev => prev + 1)} />
      </div>
      <div className="space-y-6">
        <AnnouncementBoard key={refresh} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  const navItems = [
    { label: "Dashboard", icon: "📊" },
    { label: "Complaints", icon: "📋" },
    { label: "User Management", icon: "👥" },
    { label: "Payments", icon: "💰" },
    { label: "Inventory", icon: "📦" },
    { label: "Bills / Records", icon: "📁" },
    { label: "Settings", icon: "⚙️" },
    { label: "Notices", icon: "📢" },
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
      case "Bills / Records": return <BillsRecordsView />;
      case "Settings": return <SettingsView />;
      case "Notices": return <NoticesView />;

      default: return null;
    }
  };

  const [profileName, setProfileName] = useState("Admin");
  useEffect(() => {
    apiFetch("/profile").then(p => setProfileName(p.profile?.name || "Admin")).catch(() => { });
  }, []);

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      <aside className="w-56 bg-white flex flex-col shadow-md z-10 flex-shrink-0">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <img src="/image.png" alt="" className="h-full w-full object-contain" aria-hidden />
          </div>
          <span className="text-blue-700 font-bold text-lg tracking-tight truncate">FixMate</span>
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