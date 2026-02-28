import { useEffect, useState, useCallback, useRef } from "react";
import { API, getAuthHeaders, jsonAuthHeaders } from "../../utils/api";

// Auto-refresh hook
const usePolling = (fetchFn, intervalMs = 15000) => {
  const savedFn = useRef(fetchFn);
  useEffect(() => { savedFn.current = fetchFn; }, [fetchFn]);
  useEffect(() => {
    savedFn.current();
    const id = setInterval(() => savedFn.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
};

const statusColors = {
  Assigned: "bg-blue-100 text-blue-700",
  EstimatePending: "bg-yellow-100 text-yellow-700",
  EstimateApproved: "bg-green-100 text-green-700",
  InProgress: "bg-purple-100 text-purple-700",
  Resolved: "bg-gray-100 text-gray-500",
};

function TaskCard({ task, onRefresh }) {
  const [estimateCost, setEstimateCost] = useState("");
  const [submittingEst, setSubmittingEst] = useState(false);
  const [estMsg, setEstMsg] = useState("");

  const [worklog, setWorklog] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofMsg, setProofMsg] = useState("");

  const isPersonal = task.workType === "Personal";
  const isCommonArea = task.workType === "CommonArea";

  // Fetch inventory only for CommonArea + EstimateApproved
  useEffect(() => {
    if (isCommonArea && task.status === "EstimateApproved") {
      fetch(`${API}/inventory`, { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((d) => setInventoryItems(d.items || []))
        .catch(console.error);
    }
  }, [isCommonArea, task.status]);

  const addMaterial = (name) => {
    if (!name || materials.find((m) => m.name === name)) return;
    setMaterials([...materials, { name, qty: 1 }]);
  };
  const removeMaterial = (idx) => setMaterials(materials.filter((_, i) => i !== idx));
  const updateQty = (idx, qty) => {
    const updated = [...materials];
    updated[idx].qty = Math.max(1, Number(qty) || 1);
    setMaterials(updated);
  };

  // Submit estimate
  const handleSubmitEstimate = async () => {
    if (!estimateCost) return;
    setSubmittingEst(true);
    setEstMsg("");
    try {
      const res = await fetch(`${API}/users/submit-estimate`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ complaintId: task._id, estimatedCost: estimateCost }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEstMsg("✅ " + data.message);
      onRefresh();
    } catch (err) {
      setEstMsg("❌ " + err.message);
    } finally {
      setSubmittingEst(false);
    }
  };

  // Submit proof
  const handleSubmitProof = async () => {
    if (!proofFile) return;
    setSubmittingProof(true);
    setProofMsg("");
    try {
      const formData = new FormData();
      formData.append("complaintId", task._id);
      formData.append("worklog", worklog);
      // Only send actualCost for CommonArea — Personal uses estimatedCost on backend
      if (isCommonArea) formData.append("actualCost", actualCost);
      formData.append("materialsUsed", JSON.stringify(isCommonArea ? materials : []));
      formData.append("proof", proofFile);

      const res = await fetch(`${API}/users/complete-task`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProofMsg("✅ " + data.message);
      onRefresh();
    } catch (err) {
      setProofMsg("❌ " + err.message);
    } finally {
      setSubmittingProof(false);
    }
  };

  const isDone = ["InProgress", "Resolved"].includes(task.status);

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
      {/* Header */}
      <div className="mb-4">
        <p className="text-[10px] font-bold text-slate-300 mb-1">ID: {task._id}</p>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-xl font-extrabold text-slate-800 leading-tight flex-1">{task.title}</h2>
          <span className={`text-[11px] px-3 py-1 rounded-full font-semibold whitespace-nowrap ${statusColors[task.status] || "bg-gray-100 text-gray-500"}`}>
            {task.status}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">{task.description}</p>
        {task.resident && <p className="text-xs text-slate-400 mt-1">👤 {task.resident.name}</p>}
        <div className="mt-2">
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${isPersonal ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"}`}>
            {isPersonal ? "🏠 Personal Work" : "🏢 Common Area Work"}
          </span>
        </div>
      </div>

      {/* ── STEP 1: Estimate — shown for BOTH types on Assigned status ── */}
      {task.status === "Assigned" && (
        <div className="bg-slate-50 rounded-2xl p-4 mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Step 1 — Your Estimated Labour Cost (₹)
          </p>
          <div className={`text-[11px] px-3 py-2 rounded-xl mb-3 font-medium ${isPersonal ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"}`}>
            {isPersonal
              ? "🏠 Personal work — estimate auto-approved, resident sees it. No admin step."
              : "🏢 Common area — admin will approve your estimate before work begins."}
          </div>
          <input
            type="number"
            placeholder="Enter amount in ₹"
            className="w-full p-4 bg-white rounded-2xl border border-slate-200 font-black text-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3"
            value={estimateCost}
            onChange={(e) => setEstimateCost(e.target.value)}
          />
          {estMsg && <p className="text-xs mb-3 font-medium">{estMsg}</p>}
          <button
            onClick={handleSubmitEstimate}
            disabled={!estimateCost || submittingEst}
            className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black text-[11px] tracking-widest disabled:bg-slate-200 disabled:text-slate-400 transition-all"
          >
            {submittingEst ? "SUBMITTING..." : "SUBMIT ESTIMATE"}
          </button>
        </div>
      )}

      {/* ── Waiting for admin (CommonArea EstimatePending only) ── */}
      {task.status === "EstimatePending" && (
        <div className="bg-yellow-50 rounded-2xl p-4 mb-4 text-center">
          <p className="text-2xl mb-1">⏳</p>
          <p className="text-sm font-bold text-yellow-700">Estimate submitted: ₹{task.estimatedCost}</p>
          <p className="text-xs text-yellow-500 mt-1">Waiting for admin approval before work begins.</p>
        </div>
      )}

      {/* ── STEP 2: Submit Proof — after estimate approved ── */}
      {task.status === "EstimateApproved" && (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-2xl px-4 py-3 text-center">
            <p className="text-sm font-bold text-green-700">✅ Approved — ₹{task.estimatedCost}</p>
            <p className="text-xs text-green-500">Submit your proof below once work is done.</p>
          </div>

          {/* Work description */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1 mb-1">Work Done</label>
            <textarea
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm h-20 focus:outline-none resize-none"
              placeholder="Briefly describe the fix..."
              value={worklog}
              onChange={(e) => setWorklog(e.target.value)}
            />
          </div>

          {/* Materials — CommonArea ONLY */}
          {isCommonArea && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1 mb-1">
                Materials Used <span className="text-slate-300 normal-case font-normal">(optional)</span>
              </label>
              <select
                className="w-full p-3 bg-blue-50 text-blue-700 rounded-xl border-none font-bold text-xs"
                onChange={(e) => { addMaterial(e.target.value); e.target.value = ""; }}
              >
                <option value="">+ Add material from inventory (optional)</option>
                {inventoryItems.map((i) => (
                  <option key={i._id} value={i.name}>{i.name} ({i.quantity} {i.unit} available)</option>
                ))}
              </select>
              {materials.length > 0 && (
                <div className="mt-2 space-y-2">
                  {materials.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-600">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-12 text-center bg-white rounded-lg border border-slate-200 text-xs font-bold py-1"
                          value={item.qty}
                          onChange={(e) => updateQty(idx, e.target.value)}
                        />
                        <button onClick={() => removeMaterial(idx)} className="text-red-400 hover:text-red-600 font-bold px-1">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {materials.length === 0 && (
                <p className="text-[11px] text-slate-400 mt-2 ml-1">No materials added — labour only job.</p>
              )}
            </div>
          )}

          {/* Actual cost — CommonArea ONLY (Personal uses estimate automatically) */}
          {isCommonArea && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1 mb-1">
                Final Amount Charged (₹)
              </label>
              <input
                type="number"
                placeholder="Enter final amount"
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-black text-xl text-slate-800 focus:outline-none"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
              />
            </div>
          )}

          {/* Personal info note */}
          {isPersonal && (
            <div className="bg-blue-50 rounded-2xl px-4 py-3 text-xs text-blue-600 font-medium">
              🏠 Personal work — final amount is your approved estimate of ₹{task.estimatedCost}. Just upload proof.
            </div>
          )}

          {/* Proof photo */}
          <div className={`py-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all ${proofFile ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
            <label className="cursor-pointer flex flex-col items-center">
              <span className="text-3xl mb-1">{proofFile ? "✅" : "📸"}</span>
              <span className="text-[9px] font-black uppercase text-slate-400">{proofFile ? proofFile.name : "Take Proof Photo (Required)"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files[0])} />
            </label>
          </div>

          {proofMsg && <p className="text-xs font-medium text-center">{proofMsg}</p>}

          <button
            onClick={handleSubmitProof}
            disabled={!proofFile || submittingProof}
            className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-[10px] tracking-[0.2em] disabled:bg-slate-100 disabled:text-slate-300 transition-all"
          >
            {submittingProof ? "SUBMITTING..." : "SUBMIT COMPLETION PROOF"}
          </button>
        </div>
      )}

      {/* Already submitted */}
      {isDone && (
        <div className="bg-gray-50 rounded-2xl p-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="text-sm font-bold text-gray-600">Proof Submitted — Awaiting Admin Verification</p>
          {task.materialsUsed?.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">Materials: {task.materialsUsed.map(m => `${m.name} x${m.qty}`).join(", ")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Task() {
  const [complains, setComplains] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/users/Task`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data?.complains) setComplains(data.complains);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 15 seconds
  usePolling(fetchTasks, 15000);

  if (loading)
    return (
      <div className="p-10 text-center font-bold text-slate-400 uppercase tracking-widest">
        Loading Assignments...
      </div>
    );

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-10 font-sans">
      <header className="bg-white px-6 py-5 border-b sticky top-0 z-10 shadow-sm">
        <h1 className="text-lg font-black uppercase tracking-tight">My Assignments</h1>
        <p className="text-xs text-slate-400 mt-0.5">{complains.length} task{complains.length !== 1 ? "s" : ""} assigned</p>
      </header>
      <div className="p-5 space-y-6">
        {complains.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No assignments yet</p>
          </div>
        )}
        {complains.map((task) => (
          <TaskCard key={task._id} task={task} onRefresh={fetchTasks} />
        ))}
      </div>
    </div>
  );
}

export default Task;