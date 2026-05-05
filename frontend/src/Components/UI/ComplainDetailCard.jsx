import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../Context/AuthContext";
import { useContext, useState, useEffect, useCallback } from "react";
import { API, getAuthHeaders, jsonAuthHeaders } from "../../utils/api";

function ComplainDetailCard() {
  const { role } = useContext(AuthContext);
  const { state: initialComplain } = useLocation();
  const navigate = useNavigate();

  const [complain, setComplain] = useState(initialComplain);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [payAmount, setPayAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const fetchComplain = useCallback(async () => {
    try {
      const res = await fetch(`${API}/users/All-Complains`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) {
        const found = data.complains.find(c => c._id === initialComplain._id);
        if (found) setComplain(found);
      }
    } catch (err) { console.error("Sync error:", err); }
  }, [initialComplain._id]);

  useEffect(() => { fetchComplain(); }, [fetchComplain]);

  const handleAcceptEstimate = async () => {
    setProcessing(true);
    setMsg("");
    try {
      const res = await fetch(`${API}/users/accept-estimate`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ complaintId: complain._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg("Estimate accepted! Staff will start work.");
      fetchComplain();
    } catch (err) { setMsg(err.message); }
    finally { setProcessing(false); }
  };

  const handleRecordPayment = async () => {
    if (!payAmount) return;
    setProcessing(true);
    setMsg("");
    try {
      const res = await fetch(`${API}/users/record-payment`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ complaintId: complain._id, amount: payAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.mismatch) {
        setMsg(data.message);
        setPayAmount("");
      } else {
        setMsg(data.message);
      }
      fetchComplain();
    } catch (err) { setMsg(err.message); }
    finally { setProcessing(false); }
  };

  const handleRateStaff = async () => {
    if (rating === 0 || !complain.assignedStaff?.[0]?._id) return;
    setProcessing(true);
    setMsg("");
    try {
      const res = await fetch(`${API}/users/rate-staff`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ staffId: complain.assignedStaff[0]._id, rating }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg("Rating submitted successfully!");
      setRatingSubmitted(true);
    } catch (err) { setMsg(err.message); }
    finally { setProcessing(false); }
  };

  if (!complain) return <div className="p-10 text-center">Loading...</div>;

  const isPersonal = complain.workType === "Personal";
  const isResident = role === "user";

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-10">
      {/* Header */}
      <div className="bg-slate-900 px-8 py-6 text-white">
        <div className="flex items-center justify-between mb-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Complaint ID: {complain._id}</span>
           <span className="text-[10px] font-black uppercase tracking-widest bg-blue-600 px-3 py-1 rounded-full">{complain.status}</span>
        </div>
        <h1 className="text-3xl font-black leading-tight">{complain.title}</h1>
      </div>

      <div className="p-8">
        {/* Gallery & Proof */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
                <div className="aspect-square rounded-3xl overflow-hidden border bg-gray-50 flex items-center justify-center group relative">
                    <img
                        src={complain.image_url?.startsWith("/") ? `${API}${complain.image_url}` : complain.image_url}
                        alt="Issue"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">Initial Proof</div>
                </div>
                {complain.proofImage && (
                    <div className="aspect-video rounded-3xl overflow-hidden border bg-gray-50 flex items-center justify-center group relative">
                        <img
                            src={complain.proofImage.startsWith("/") ? `${API}${complain.proofImage}` : complain.proofImage}
                            alt="Resolution"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-4 left-4 bg-green-600 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">Work Complete Proof</div>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</h2>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{complain.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Priority</p>
                        <p className="text-xs font-black uppercase text-slate-700">{complain.priority}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Work Type</p>
                        <p className="text-xs font-black uppercase text-blue-600">{complain.workType || "Pending"}</p>
                    </div>
                </div>

                {complain.assignedStaff && complain.assignedStaff.length > 0 && (
                    <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100/50">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-3">Assigned Staff</h3>
                        {complain.assignedStaff.map((staff, idx) => (
                          <div key={idx} className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-xl"></div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">{staff.name}</p>
                                <p className="text-[10px] font-bold text-blue-500 uppercase">{staff.department}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{staff.phone}</p>
                                {staff.rating && (
                                    <p className="text-[10px] font-bold text-yellow-600 mt-1">
                                        Rating: {staff.rating} ({staff.ratingCount} {staff.ratingCount === 1 ? 'rating' : 'ratings'})
                                    </p>
                                )}
                            </div>
                          </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="h-px bg-slate-100 w-full mb-8" />

        {/* ── INTERACTIVE WORKFLOW SECTIONS ── */}
        
        {/* 1. Estimate Approval Section */}
        {complain.status === "EstimateSubmitted" && isPersonal && isResident && (
            <div className="bg-orange-50 rounded-[2rem] p-8 border border-orange-100 mb-8 animation-fade-in">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-black text-orange-800 mb-1">Review Estimate</h2>
                        <p className="text-xs text-orange-600 font-medium">The staff has submitted a labour estimate for this repair.</p>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-orange-200">
                        <p className="text-[9px] font-bold text-orange-400 uppercase mb-1">Estimated Cost</p>
                        <p className="text-2xl font-black text-slate-900">₹{complain.labourEstimate}</p>
                    </div>
                </div>
                {msg && <p className="text-xs mb-4 font-bold p-3 bg-white rounded-xl border border-orange-200">{msg}</p>}
                <div className="flex gap-4">
                    <button 
                        onClick={handleAcceptEstimate}
                        disabled={processing}
                        className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
                    >
                        {processing ? "PROCESSING..." : "ACCEPT ESTIMATE & START WORK"}
                    </button>
                </div>
            </div>
        )}

        {/* 2. Payment Verification Section */}
        {complain.status === "PaymentPending" && isPersonal && (
            <div className="bg-yellow-50 rounded-[2rem] p-8 border border-yellow-100 mb-8 animation-fade-in">
                <div className="mb-6">
                    <h2 className="text-xl font-black text-yellow-800 mb-1">Verify Private Payment</h2>
                    <p className="text-xs text-yellow-600 font-medium">Please enter the exact amount paid to <strong>{complain.assignedStaff?.[0]?.name}</strong> to close this ticket.</p>
                </div>
                
                {complain.paymentMismatchCount > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                        <p className="text-xs font-black text-red-600 uppercase mb-1">Payment Mismatch ({complain.paymentMismatchCount}x)</p>
                        <p className="text-[11px] text-red-500">
                            Last attempt — You entered: ₹{complain.lastMismatchUserAmount}, Staff entered: ₹{complain.lastMismatchStaffAmount}. 
                            Please verify with the staff and re-enter the correct amount.
                        </p>
                    </div>
                )}
                
                <div className="flex gap-3 mb-6">
                    <input 
                        type="number"
                        placeholder="Amount in ₹"
                        className="flex-1 p-4 rounded-2xl bg-white border border-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-black text-xl text-slate-800"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                    />
                    <button 
                        onClick={handleRecordPayment}
                        disabled={!payAmount || processing}
                        className="bg-slate-900 text-white px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
                    >
                        {processing ? "RECORDING..." : "CONFIRM PAID"}
                    </button>
                </div>

                {msg && <p className="text-xs mb-4 font-bold text-yellow-800">{msg}</p>}

                <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-2xl flex flex-col items-center justify-center border-2 ${complain.userPaymentAmount !== null ? 'bg-white border-green-400' : 'bg-yellow-100/50 border-dashed border-yellow-300'}`}>
                        <span className="text-[9px] font-black uppercase text-slate-400 mb-1">You Recorded</span>
                        <span className="text-lg font-black text-slate-800">{complain.userPaymentAmount !== null ? `₹${complain.userPaymentAmount}` : "Waiting..."}</span>
                    </div>
                    <div className={`p-4 rounded-2xl flex flex-col items-center justify-center border-2 ${complain.staffPaymentAmount !== null ? 'bg-white border-green-400' : 'bg-yellow-100/50 border-dashed border-yellow-300'}`}>
                        <span className="text-[9px] font-black uppercase text-slate-400 mb-1">Staff Recorded</span>
                        <span className="text-lg font-black text-slate-800">{complain.staffPaymentAmount !== null ? `₹${complain.staffPaymentAmount}` : "Waiting..."}</span>
                    </div>
                </div>
            </div>
        )}

        {/* 3. Staff Rating Section */}
        {complain.status === "Resolved" && isResident && complain.assignedStaff && complain.assignedStaff.length > 0 && !ratingSubmitted && (
            <div className="bg-purple-50 rounded-[2rem] p-8 border border-purple-100 mb-8 animation-fade-in">
                <div className="mb-6">
                    <h2 className="text-xl font-black text-purple-800 mb-1">Rate the Staff</h2>
                    <p className="text-xs text-purple-600 font-medium">How was your experience with <strong>{complain.assignedStaff[0].name}</strong>?</p>
                </div>
                {msg && <p className="text-xs mb-4 font-bold p-3 bg-white rounded-xl border border-purple-200">{msg}</p>}
                <div className="flex items-center justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-3xl transition-transform hover:scale-125 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                            *
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleRateStaff}
                    disabled={rating === 0 || processing}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
                >
                    {processing ? "SUBMITTING..." : "SUBMIT RATING"}
                </button>
            </div>
        )}

        {/* Materials List (for Common Area) */}
        {!isPersonal && complain.status === "Resolved" && complain.actualInventoryUsed?.length > 0 && (
            <div className="mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Materials Used</h3>
                <div className="space-y-2">
                    {complain.actualInventoryUsed.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-sm font-bold text-slate-700">{m.name}</span>
                            <span className="text-xs font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full">x{m.qty}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Footer info */}
        <div className="flex items-center justify-between pt-8 border-t border-slate-50">
            <button 
                onClick={() => navigate(-1)}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
                Back to List
            </button>
            <p className="text-[10px] font-bold text-slate-300 uppercase">Created: {new Date(complain.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

export default ComplainDetailCard;