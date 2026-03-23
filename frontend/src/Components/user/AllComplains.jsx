import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API, getAuthHeaders, jsonAuthHeaders } from "../../utils/api";

// ── Status color helper ───────────────────────────────────────────────────────
const getStatusStyle = (status) => {
  const map = {
    Resolved: "bg-green-100 text-green-700 border-green-200",
    InProgress: "bg-blue-100 text-blue-700 border-blue-200",
    Assigned: "bg-purple-100 text-purple-700 border-purple-200",
    EstimatePending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    EstimateApproved: "bg-teal-100 text-teal-700 border-teal-200",
    Pending: "bg-orange-100 text-orange-700 border-orange-200",
  };
  return map[status] || "bg-gray-100 text-gray-600 border-gray-200";
};

// ── Single complaint card ─────────────────────────────────────────────────────
function ComplainCard({ data, onRevoke }) {
  const navigate = useNavigate();
  const [revoking, setRevoking] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [showRevokeBox, setShowRevokeBox] = useState(false);
  const [revokeMsg, setRevokeMsg] = useState("");

  // Navigate to detail page (existing behaviour)
  const showDetail = () => navigate(`/ComplainDetail/${data._id}`, { state: data });

  // Can revoke only if Personal + not yet in InProgress/Resolved
  const canRevoke =
    data.workType === "Personal" &&
    ["Assigned", "EstimatePending", "EstimateApproved"].includes(data.status);

  const handleRevoke = async () => {
    setRevoking(true);
    setRevokeMsg("");
    try {
      // Uses new PATCH /users/revoke-complaint endpoint
      const res = await fetch(`${API}/users/revoke-complaint`, {
        method: "PATCH",
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ complaintId: data._id, revokeReason }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setRevokeMsg("✅ Staff revoked. Complaint reopened.");
      setShowRevokeBox(false);
      onRevoke(); // refresh list
    } catch (err) {
      setRevokeMsg("❌ " + err.message);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="bg-white rounded-[30px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Complaint image */}
      <div className="relative w-full h-48 overflow-hidden bg-gray-100">
        <img
          src={data.image_url?.startsWith("/") ? `${API}${data.image_url}` : data.image_url}
          alt="Complaint proof"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = "/placeholder.png"; }}
        />
        {/* Status badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(data.status)}`}>
          {data.status}
        </div>
        {/* WorkType badge */}
        {data.workType && (
          <div className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-[10px] font-bold ${data.workType === "Personal" ? "bg-blue-600 text-white" : "bg-teal-600 text-white"}`}>
            {data.workType === "Personal" ? "🏠 Personal" : "🏢 Common"}
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Category + Title */}
        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-1">
          {data.category || "Maintenance"}
        </p>
        <h2 className="text-xl font-extrabold text-[#1a365d] mb-2 truncate">{data.title}</h2>

        {/* Assigned staff info */}
        {data.assignedStaff && (
          <p className="text-xs text-gray-500 mb-3">
            🔧 Assigned to: <span className="font-semibold">{data.assignedStaff.name}</span>
            {data.assignedStaff.department && ` · ${data.assignedStaff.department}`}
          </p>
        )}

        {/* Estimated cost (if submitted) */}
        {data.estimatedCost && (
          <p className="text-xs text-gray-500 mb-3">
            💰 Estimated: <span className="font-semibold">₹{data.estimatedCost}</span>
            {data.estimateStatus && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${data.estimateStatus === "Approved" ? "bg-green-100 text-green-700" :
                  data.estimateStatus === "Rejected" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                }`}>
                {data.estimateStatus}
              </span>
            )}
          </p>
        )}

        {/* Date + Actions */}
        <div className="flex items-center justify-between border-t border-gray-50 pt-4 gap-2 flex-wrap">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Date Reported</span>
            <span className="text-xs font-semibold text-gray-600">
              {new Date(data.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex gap-2">
            {/* Revoke button — only for Personal assigned work */}
            {canRevoke && (
              <button
                onClick={() => setShowRevokeBox(!showRevokeBox)}
                className="bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition"
              >
                Revoke Staff
              </button>
            )}
            <button
              onClick={showDetail}
              className="bg-[#25334d] text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition"
            >
              See Details
            </button>
          </div>
        </div>

        {/* Revoke confirmation box */}
        {showRevokeBox && (
          <div className="mt-4 bg-red-50 rounded-2xl p-4 border border-red-100">
            <p className="text-xs font-bold text-red-700 mb-2">
              ⚠️ Are you sure? This will unassign the staff and reopen the complaint.
            </p>
            <textarea
              className="w-full text-xs p-3 rounded-xl border border-red-200 bg-white resize-none focus:outline-none mb-3"
              rows={2}
              placeholder="Reason for revoking (optional)..."
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
            />
            {revokeMsg && <p className="text-xs mb-2 font-medium">{revokeMsg}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setShowRevokeBox(false)}
                className="flex-1 py-2 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 disabled:opacity-50"
              >
                {revoking ? "Revoking..." : "Confirm Revoke"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main complaints list ──────────────────────────────────────────────────────
function ShowComplains() {
  const [complains, setComplains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // High-end filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortOrder, setSortOrder] = useState("newest");

  const navigate = useNavigate();

  const fetchComplains = () => {
    setLoading(true);
    fetch(`${API}/users/All-Complains`, { method: "GET", headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) throw new Error("Not authenticated");
          throw new Error("Failed to fetch complaints");
        }
        return res.json();
      })
      .then((data) => {
        setComplains(Array.isArray(data.complains) ? data.complains : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => { fetchComplains(); }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a365d]" />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 font-semibold bg-slate-50">
        {error}
      </div>
    );

  const filtered = complains.filter(c => {
    const s = search.toLowerCase();
    const matchSearch = c.title?.toLowerCase().includes(s) || c._id?.toLowerCase().includes(s);
    const matchStatus = filterStatus === "All" || c.status === filterStatus;
    const matchPriority = filterPriority === "All" || c.priority === filterPriority;
    const matchCategory = filterCategory === "All" || c.category === filterCategory;
    return matchSearch && matchStatus && matchPriority && matchCategory;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const allCategories = ["All", ...Array.from(new Set(complains.map(c => c.category).filter(Boolean)))];
  const allStatuses = ["All", "Pending", "Assigned", "InProgress", "Resolved"];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#1a365d] tracking-tight">Your Complaints</h1>
            <p className="text-sm text-gray-500 font-medium">Track and manage your reported issues</p>
          </div>
          <button
            onClick={() => navigate("/FileComplain")}
            className="bg-[#25334d] text-white px-8 py-3.5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-slate-700 transition shadow-lg shadow-blue-900/10"
          >
            + New Complaint
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-8 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px] relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
              <input 
                className="w-full border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                placeholder="Search by ID or title..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <div className="flex items-center gap-3">
              <select 
                className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={sortOrder} onChange={e => setSortOrder(e.target.value)}
              >
                <option value="newest">Latest Date</option>
                <option value="oldest">Oldest Date</option>
              </select>
              <select 
                className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              >
                {allCategories.map(cat => <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>)}
              </select>
              <select 
                className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              >
                <option value="All">All Priorities</option>
                <option value="Emergency">🚨 Emergency</option>
                <option value="High">🔴 High</option>
                <option value="Medium">🟠 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap border-t border-gray-50 pt-4">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mr-2">Quick Status:</span>
            {allStatuses.map(s => (
              <button 
                key={s} 
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? "bg-[#1a365d] text-white shadow-md shadow-blue-900/20" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((c) => (
              <ComplainCard key={c._id} data={c} onRevoke={fetchComplains} />
            ))}
          </div>
        ) : (
        <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No complaints found</p>
          <button
            onClick={() => navigate("/FileComplain")}
            className="mt-4 bg-[#25334d] text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-slate-700 transition"
          >
            File Your First Complaint
          </button>
        </div>
      )}
    </div>
  </div>
);
}

export default ShowComplains;