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
  EstimateSubmitted: "bg-orange-100 text-orange-700",
  EstimateApproved: "bg-teal-100 text-teal-700",
  InProgress: "bg-purple-100 text-purple-700",
  PaymentPending: "bg-yellow-100 text-yellow-700",
  Resolved: "bg-green-100 text-green-700",
};

function TaskCard({ task, onRefresh }) {
  const [labourEst, setLabourEst] = useState("");
  const [submittingEst, setSubmittingEst] = useState(false);
  const [estMsg, setEstMsg] = useState("");

  const [worklog, setWorklog] = useState("");
  const [actualLabour, setActualLabour] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [estMaterials, setEstMaterials] = useState([]); // used during estimate
  const [materialsUsed, setMaterialsUsed] = useState([]); // used during completion
  const [inventoryItems, setInventoryItems] = useState([]);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofMsg, setProofMsg] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [payMsg, setPayMsg] = useState("");

  const isPersonal = task.workType === "Personal";
  const isCommonArea = task.workType === "CommonArea";

  // Fetch inventory for CommonArea during Assigned (Estimate) AND InProgress (Completion)
  useEffect(() => {
    if (isCommonArea && ["Assigned", "InProgress", "EstimateApproved"].includes(task.status)) {
      fetch(`${API}/inventory`, { headers: getAuthHeaders() })
        .then((r) => r.json())
        .then((d) => setInventoryItems(d.items || []))
        .catch(console.error);
    }
  }, [isCommonArea, task.status]);

  const addEstimateMaterial = (id) => {
    const item = inventoryItems.find(i => i._id === id);
    if (!item || estMaterials.find(m => m.itemId === id)) return;
    setEstMaterials([...estMaterials, { itemId: id, name: item.name, qty: 1, price: item.unitPrice || 0 }]);
  };

  const addActualMaterial = (id) => {
    const item = inventoryItems.find(i => i._id === id);
    if (!item || materialsUsed.find(m => m.itemId === id)) return;
    setMaterialsUsed([...materialsUsed, { itemId: id, name: item.name, qty: 1, price: item.unitPrice || 0 }]);
  };

  const updateMaterialQty = (list, setter, idx, qty) => {
    const updated = [...list];
    updated[idx].qty = Math.max(1, Number(qty) || 1);
    setter(updated);
  };

  // Submit estimate
  const handleSubmitEstimate = async () => {
    if (!labourEst) return;
    setSubmittingEst(true);
    setEstMsg("");
    try {
      const res = await fetch(`${API}/users/submit-estimate`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ 
            complaintId: task._id, 
            labourEstimate: labourEst,
            inventoryEstimate: isCommonArea ? estMaterials : []
        }),
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
      formData.append("actualLabourCost", actualLabour || task.labourEstimate);
      formData.append("actualInventoryUsed", JSON.stringify(isCommonArea ? materialsUsed : []));
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

  const handleVerifyPayment = async () => {
    if (!paymentAmount) return;
    setVerifyingPayment(true);
    try {
        const res = await fetch(`${API}/users/record-payment`, {
            method: "POST",
            headers: jsonAuthHeaders(),
            body: JSON.stringify({ complaintId: task._id, amount: paymentAmount }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.mismatch) {
          setPayMsg(`⚠️ ${data.message}`);
          setPaymentAmount("");
        } else {
          setPayMsg("✅ " + data.message);
        }
        onRefresh();
    } catch (err) {
        setPayMsg("❌ " + err.message);
    } finally {
        setVerifyingPayment(false);
    }
  };

  const isDone = ["Resolved"].includes(task.status);

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
            Step 1 — Labour Cost Estimate (₹)
          </p>
          <div className={`text-[11px] px-3 py-2 rounded-xl mb-3 font-medium ${isPersonal ? "bg-blue-50 text-blue-600" : "bg-teal-50 text-teal-600"}`}>
            {isPersonal
              ? "🏠 Personal work — resident must approve your estimate before you can start."
              : "🏢 Common area — admin will approve labour + materials before work begins."}
          </div>
          <input
            type="number"
            placeholder="Enter labour amount in ₹"
            className="w-full p-4 bg-white rounded-2xl border border-slate-200 font-black text-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3"
            value={labourEst}
            onChange={(e) => setLabourEst(e.target.value)}
          />

          {isCommonArea && (
            <div className="mb-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1 mb-2">Estimated Materials</label>
              <select
                className="w-full p-3 bg-white rounded-xl border border-slate-200 font-bold text-xs mb-3"
                onChange={(e) => { addEstimateMaterial(e.target.value); e.target.value = ""; }}
              >
                <option value="">+ Add materials needed</option>
                {inventoryItems.map((i) => (
                  <option key={i._id} value={i._id}>{i.name} (₹{i.unitPrice}/{i.unit})</option>
                ))}
              </select>
              <div className="space-y-2">
                {estMaterials.map((m, idx) => (
                  <div key={m.itemId} className="flex justify-between items-center bg-white px-3 py-2 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-12 text-center bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold py-1"
                        value={m.qty}
                        onChange={(e) => updateMaterialQty(estMaterials, setEstMaterials, idx, e.target.value)}
                      />
                      <button onClick={() => setEstMaterials(estMaterials.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 font-bold px-1">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {estMsg && <p className="text-xs mb-3 font-medium">{estMsg}</p>}
          <button
            onClick={handleSubmitEstimate}
            disabled={!labourEst || submittingEst}
            className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black text-[11px] tracking-widest disabled:bg-slate-200 disabled:text-slate-400 transition-all font-sans"
          >
            {submittingEst ? "SUBMITTING..." : "SUBMIT ESTIMATE"}
          </button>
        </div>
      )}

      {/* ── Waiting for approval ── */}
      {task.status === "EstimateSubmitted" && (
        <div className="bg-orange-50 rounded-2xl p-4 mb-4 text-center">
          <p className="text-2xl mb-1">⏳</p>
          <p className="text-sm font-bold text-orange-700">Estimate submitted: ₹{task.estimatedCost}</p>
          <p className="text-xs text-orange-500 mt-1">
            {isPersonal ? "Waiting for resident to accept the estimate." : "Waiting for admin approval before work begins."}
          </p>
        </div>
      )}

      {/* ── STEP 2: Work & Proof — after approval ── */}
      {(task.status === "EstimateApproved" || (task.status === "InProgress" && !task.proofImage)) && (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-2xl px-4 py-3 text-center">
            <p className="text-sm font-bold text-green-700">✅ Approved — Estimated Cost: ₹{task.estimatedCost}</p>
            <p className="text-xs text-green-500">
              {task.status === "InProgress" 
                ? "Work is in progress. Upload proof and confirm payment details when done."
                : "Submit completion details below once fix is done."}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1 mb-1">Work Done</label>
            <textarea
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm h-20 focus:outline-none resize-none"
              placeholder="Briefly describe what you did..."
              value={worklog}
              onChange={(e) => setWorklog(e.target.value)}
            />
          </div>

          {isCommonArea && (
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1 mb-1">Actual Materials Used</label>
              <select
                className="w-full p-3 bg-blue-50 text-blue-700 rounded-xl border-none font-bold text-xs"
                onChange={(e) => { addActualMaterial(e.target.value); e.target.value = ""; }}
              >
                <option value="">+ Add used items</option>
                {inventoryItems.map((i) => (
                  <option key={i._id} value={i._id}>{i.name} ({i.quantity} left)</option>
                ))}
              </select>
              <div className="mt-2 space-y-2">
                {materialsUsed.map((m, idx) => (
                  <div key={m.itemId} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-12 text-center bg-white rounded-lg border border-slate-200 text-xs font-bold py-1"
                        value={m.qty}
                        onChange={(e) => updateMaterialQty(materialsUsed, setMaterialsUsed, idx, e.target.value)}
                      />
                      <button onClick={() => setMaterialsUsed(materialsUsed.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 font-bold px-1">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1 mb-1">
              Final Labour Cost (₹)
            </label>
            <input
              type="number"
              placeholder={task.labourEstimate || "Enter amount"}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-black text-xl text-slate-800 focus:outline-none"
              value={actualLabour}
              onChange={(e) => setActualLabour(e.target.value)}
            />
          </div>

          <div className={`py-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all ${proofFile ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}>
            <label className="cursor-pointer flex flex-col items-center">
              <span className="text-3xl mb-1">{proofFile ? "✅" : "📸"}</span>
              <span className="text-[9px] font-black uppercase text-slate-400">{proofFile ? proofFile.name : "Upload Proof Photo"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setProofFile(e.target.files[0])} />
            </label>
          </div>

          {proofMsg && <p className="text-xs font-medium text-center">{proofMsg}</p>}

          <button
            onClick={handleSubmitProof}
            disabled={!proofFile || submittingProof}
            className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-[10px] tracking-[0.2em] disabled:bg-slate-100 disabled:text-slate-300 transition-all"
          >
            {submittingProof ? "SUBMITTING..." : "SUBMIT COMPLETION"}
          </button>
        </div>
      )}

      {/* ── Show when InProgress with proof already submitted, or PaymentPending ── */}
      {task.status === "InProgress" && task.proofImage && isPersonal && (
        <div className="bg-blue-50 rounded-2xl p-4 text-center mb-4">
          <p className="text-2xl mb-1">✅</p>
          <p className="text-sm font-bold text-blue-700">Proof submitted! Awaiting payment verification.</p>
          <p className="text-xs text-blue-500 mt-1">The resident will confirm payment on their end.</p>
        </div>
      )}

      {/* ── STEP 3: Payment Verification (Personal Only) ── */}
      {task.status === "PaymentPending" && (
        <div className="bg-yellow-50 rounded-[2rem] p-6 border border-yellow-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-600 mb-2">Final Step: Verify Payment</p>
          
          {task.paymentMismatchCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
              <p className="text-xs font-black text-red-600 uppercase mb-1">⚠️ Payment Mismatch Detected ({task.paymentMismatchCount}x)</p>
              <p className="text-[11px] text-red-500">
                Last attempt — You entered: ₹{task.lastMismatchStaffAmount}, Resident entered: ₹{task.lastMismatchUserAmount}. 
                Please verify with the resident and re-enter the correct amount.
              </p>
            </div>
          )}
          
          <p className="text-xs font-medium text-yellow-700 mb-4">
            Enter the exact amount you received from the resident. Once both parties enter matching amounts, the task will be resolved.
          </p>
          <input
            type="number"
            placeholder="Amount received ₹"
            className="w-full p-4 bg-white rounded-2xl border border-yellow-200 font-black text-xl text-slate-800 focus:outline-none mb-3"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
          />
          {payMsg && <p className="text-xs mb-3 font-semibold">{payMsg}</p>}
          <button
            onClick={handleVerifyPayment}
            disabled={!paymentAmount || verifyingPayment}
            className="w-full py-3 rounded-2xl bg-slate-900 text-white font-black text-[11px] tracking-widest disabled:opacity-50"
          >
            {verifyingPayment ? "RECORDING..." : "CONFIRM RECEIPT"}
          </button>
          
          <div className="mt-4 flex flex-col gap-2">
            <div className={`p-3 rounded-xl flex items-center justify-between text-[10px] font-bold uppercase ${task.staffPaymentAmount !== null ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                <span>Staff Record</span>
                <span>{task.staffPaymentAmount !== null ? `₹${task.staffPaymentAmount}` : "Pending"}</span>
            </div>
            <div className={`p-3 rounded-xl flex items-center justify-between text-[10px] font-bold uppercase ${task.userPaymentAmount !== null ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                <span>Resident Record</span>
                <span>{task.userPaymentAmount !== null ? `₹${task.userPaymentAmount}` : "Pending"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Already submitted (Resolved) */}
      {task.status === "Resolved" && (
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="text-sm font-bold text-green-600">Task Successfully Resolved</p>
          <p className="text-xs text-green-500 mt-1">Total Final Cost: ₹{task.actualCost}</p>
        </div>
      )}
    </div>
  );
}

function Task() {
  const [complains, setComplains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Active");

  const fetchTasks = useCallback(async () => {
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

  usePolling(fetchTasks, 15000);

  if (loading)
    return (
      <div className="p-10 text-center font-bold text-slate-400 uppercase tracking-widest bg-slate-50 min-h-screen">
        Loading Assignments...
      </div>
    );

  const filtered = complains.filter(c => {
    if (filterStatus === "Active") return ["Assigned", "InProgress", "EstimateSubmitted", "EstimateApproved", "PaymentPending"].includes(c.status);
    if (filterStatus === "Resolved") return c.status === "Resolved";
    return true;
  });

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-20 font-sans">
      <header className="bg-white px-6 py-5 border-b sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-slate-800">My Assignments</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{filtered.length} task{filtered.length !== 1 ? "s" : ""} shown</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {["Active", "Resolved", "All"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterStatus === s ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>
      <div className="p-5 space-y-6">
        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No {filterStatus.toLowerCase()} tasks</p>
          </div>
        )}
        {filtered.map((task) => (
          <TaskCard key={task._id} task={task} onRefresh={fetchTasks} />
        ))}
      </div>
    </div>
  );
}

export default Task;