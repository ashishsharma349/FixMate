import { useEffect, useState } from "react";
import { API, getAuthHeaders, jsonAuthHeaders } from "../../utils/api";

// ── Shared UI atoms (matches AllComplains style) ──────────────────────────────
const getStatusStyle = (status) => {
  const map = {
    Paid: "bg-green-100 text-green-700 border-green-200",
    Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Overdue: "bg-red-100 text-red-700 border-red-200",
  };
  return map[status] || "bg-gray-100 text-gray-600 border-gray-200";
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ── Load Razorpay script once ─────────────────────────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// ── Single Payment Card ───────────────────────────────────────────────────────
function PaymentCard({ payment, onPaid }) {
  const [paying, setPaying] = useState(false);
  const [msg, setMsg] = useState("");

  const isPaid = payment.status === "Paid";
  const isOverdue = payment.status === "Overdue";

  const handlePayNow = async () => {
    setPaying(true);
    setMsg("");
    try {
      // Step 1 — Create / reuse Razorpay order
      const res = await fetch(`${API}/payments/create-order`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ paymentId: payment._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      // Step 2 — Load Razorpay and open checkout
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay SDK failed to load");

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || "INR",
        name: "FixMate Society",
        description: `Maintenance Fee — ${payment.month}/${payment.year}`,
        order_id: data.orderId,
        handler: async (response) => {
          try {
            // Step 3 — Verify payment
            const vRes = await fetch(`${API}/payments/verify`, {
              method: "POST",
              headers: jsonAuthHeaders(),
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const vData = await vRes.json();
            if (!vRes.ok) throw new Error(vData.error || "Verification failed");

            setMsg("✅ Payment successful!");
            onPaid(); // refresh parent list
          } catch (e) {
            setMsg("❌ " + e.message);
          }
        },
        prefill: {
          name: payment.resident?.name || "",
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setMsg("❌ " + err.message);
      setPaying(false);
    }
  };

  return (
    <div className={`bg-white rounded-[30px] shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${isOverdue ? "border-red-200" : "border-gray-100"}`}>
      {/* Top colour strip */}
      <div className={`h-2 w-full ${isPaid ? "bg-green-400" : isOverdue ? "bg-red-400" : "bg-yellow-300"}`} />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-0.5">
              Monthly Maintenance
            </p>
            <h2 className="text-xl font-extrabold text-[#1a365d]">
              {fmtDate(new Date(payment.year, payment.month - 1))}
            </h2>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(payment.status)}`}>
            {payment.status}
          </span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gray-50 rounded-2xl p-3">
            <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Amount</p>
            <p className="text-lg font-black text-[#1a365d]">₹{payment.amount?.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-3">
            <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Due Date</p>
            <p className="text-sm font-bold text-gray-700">{fmtDate(payment.dueDate)}</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-3">
            <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Reference</p>
            <p className="text-xs font-bold text-blue-600 font-mono">{payment.refId || "—"}</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-3">
            <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Flat No.</p>
            <p className="text-sm font-bold text-gray-700">{payment.flatNumber || "—"}</p>
          </div>
        </div>

        {/* Paid info */}
        {isPaid && payment.paidAt && (
          <div className="bg-green-50 rounded-2xl px-4 py-2.5 mb-4 flex items-center gap-2">
            <span className="text-green-500 text-sm">✅</span>
            <p className="text-xs font-semibold text-green-700">Paid on {fmtDate(payment.paidAt)}</p>
          </div>
        )}

        {/* Overdue warning */}
        {isOverdue && (
          <div className="bg-red-50 rounded-2xl px-4 py-2.5 mb-4 flex items-center gap-2">
            <span className="text-red-500 text-sm">⚠️</span>
            <p className="text-xs font-semibold text-red-700">Payment overdue — please clear immediately</p>
          </div>
        )}

        {/* Status message */}
        {msg && (
          <div className={`text-xs font-semibold px-4 py-2 rounded-2xl mb-3 ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
            {msg}
          </div>
        )}

        {/* Action button */}
        {!isPaid && (
          <button
            onClick={handlePayNow}
            disabled={paying}
            className="w-full bg-[#25334d] text-white py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paying ? "Opening Payment..." : "💳 Pay Now"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  const fetchPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/payments/my-payments`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch payments");
      setPayments(data.payments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const filtered = filter === "All"
    ? payments
    : payments.filter((p) => p.status === filter);

  const totalPaid = payments.filter(p => p.status === "Paid").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status !== "Paid").reduce((s, p) => s + (p.amount || 0), 0);
  const overdueCount = payments.filter(p => p.status === "Overdue").length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a365d]" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-500 font-semibold">
      {error}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-[#1a365d] tracking-tight">My Payments</h1>
        <p className="text-sm text-gray-500 font-medium">View and clear your monthly maintenance fees</p>
      </div>

      {/* Summary Cards */}
      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 rounded-[24px] p-5 border border-green-100">
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Total Paid</p>
            <p className="text-2xl font-black text-green-700">₹{totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 rounded-[24px] p-5 border border-yellow-100">
            <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1">Pending Amount</p>
            <p className="text-2xl font-black text-yellow-700">₹{totalPending.toLocaleString()}</p>
          </div>
          <div className={`rounded-[24px] p-5 border ${overdueCount > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${overdueCount > 0 ? "text-red-500" : "text-gray-400"}`}>Overdue</p>
            <p className={`text-2xl font-black ${overdueCount > 0 ? "text-red-600" : "text-gray-400"}`}>
              {overdueCount} {overdueCount === 1 ? "bill" : "bills"}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {payments.length > 0 && (
        <div className="flex gap-2 mb-8 flex-wrap">
          {["All", "Pending", "Paid", "Overdue"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition ${filter === f
                  ? "bg-[#25334d] text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Payment Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((p) => (
            <PaymentCard key={p._id} payment={p} onPaid={fetchPayments} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
            {payments.length === 0
              ? "No payment records yet — admin will generate monthly requests"
              : `No ${filter.toLowerCase()} payments`}
          </p>
        </div>
      )}
    </div>
  );
}