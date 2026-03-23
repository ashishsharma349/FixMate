const express = require("express");
const router = express.Router();
require("dotenv").config();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../model/Payment");
const User = require("../model/User");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const adminOnly = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden: Admin only" });
  next();
};

const loggedIn = (req, res, next) => {
  if (!req.session.user)
    return res.status(401).json({ error: "Not logged in" });
  next();
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const generateRefId = async (type) => {
  const count = await Payment.countDocuments({ type });
  const prefix = type === "personal" ? "PER" : "MAN";
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
};

// GET /payments/list (admin)
router.get("/list", adminOnly, async (req, res) => {
  try {
    const [maintenance, personal] = await Promise.all([
      Payment.find({ type: "maintenance" })
        .populate("worker", "name department")
        .populate("complaint", "title")
        .sort({ createdAt: -1 }),
      Payment.find({ type: "personal" })
        .populate("resident", "name flatNumber phone")
        .sort({ createdAt: -1 }),
    ]);
    res.json({ maintenance, personal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /payments/monthly-revenue (admin)
router.get("/monthly-revenue", adminOnly, async (req, res) => {
  try {
    const data = await Payment.aggregate([
      { $match: { status: "Paid" } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 },
    ]);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = data.map(d => ({
      month: months[d._id.month - 1],
      revenue: d.revenue,
    }));
    res.json({ chartData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /payments/my-payments (resident)
router.get("/my-payments", loggedIn, async (req, res) => {
  try {
    const user = await User.findOne({
      authId: req.session.user.id || req.session.user._id,
    });
    if (!user) return res.status(404).json({ error: "User profile not found" });

    const payments = await Payment.find({ type: "personal", resident: user._id })
      .sort({ createdAt: -1 });

    res.json({ payments, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /payments/monthly-revenue — resident payments collected, grouped by month (dashboard chart)
router.get("/monthly-revenue", adminOnly, async (req, res) => {
  try {
    const data = await Payment.aggregate([
      { $match: { type: "personal", status: "Paid" } },
      {
        $group: {
          _id: { month: { $month: "$paidAt" }, year: { $year: "$paidAt" } },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 },
    ]);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = data.map(d => ({
      month: months[d._id.month - 1],
      revenue: d.revenue,
    }));
    res.json({ chartData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /payments/generate-monthly (admin)
router.post("/generate-monthly", adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const amount = req.body.amount || 5000;

    const residents = await User.find({});
    let created = 0, skipped = 0;

    for (const resident of residents) {
      const exists = await Payment.findOne({
        type: "personal",
        resident: resident._id,
        month,
        year,
      });
      if (exists) { skipped++; continue; }

      const refId = await generateRefId("personal");
      await Payment.create({
        type: "personal",
        resident: resident._id,
        flatNumber: resident.flatNumber || "—",
        amount,
        dueDate: new Date(year, month, 5),
        status: "Pending",
        month,
        year,
        refId,
      });
      created++;
    }

    res.json({ success: true, created, skipped, month, year });
  } catch (err) {
    console.error("[generate-monthly]:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /payments/create-order (resident)
router.post("/create-order", loggedIn, async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: "paymentId required" });

    const payment = await Payment.findById(paymentId).populate("resident", "name flatNumber");
    if (!payment) return res.status(404).json({ error: "Payment record not found" });
    if (payment.status === "Paid") return res.status(400).json({ error: "Already paid" });

    // Reuse existing order if already created
    if (payment.razorpayOrderId) {
      return res.json({
        orderId: payment.razorpayOrderId,
        amount: payment.amount * 100,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        residentName: payment.resident?.name || "",
        flatNumber: payment.flatNumber,
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Number(payment.amount) * 100),
      currency: "INR",
      receipt: `fixmate_${payment._id}`.substring(0, 40),
      notes: {
        flatNumber: String(payment.flatNumber || "N/A"),
        residentName: String(payment.resident?.name || "N/A"),
        paymentId: String(payment._id),
      },
    });

    payment.razorpayOrderId = order.id;
    await payment.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      residentName: payment.resident?.name || "",
      flatNumber: payment.flatNumber,
    });
  } catch (err) {
    console.error("Razorpay Create Order Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /payments/verify (any logged-in)
router.post("/verify", loggedIn, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature)
      return res.status(400).json({ error: "Invalid payment signature" });

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: "Paid",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
      },
      { new: true }
    );

    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /payments/maintenance (admin)
router.post("/maintenance", adminOnly, async (req, res) => {
  try {
    const { complaintId, workerId, workerName, purpose, amount } = req.body;
    if (!amount || !purpose) return res.status(400).json({ error: "amount and purpose required" });

    const refId = await generateRefId("maintenance");
    const payment = await Payment.create({
      type: "maintenance",
      complaint: complaintId || null,
      worker: workerId || null,
      workerName,
      purpose,
      amount,
      status: "Paid",
      paidAt: new Date(),
      refId,
    });

    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /payments/mark-paid — admin confirms payment as paid
router.post("/mark-paid", adminOnly, async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: "paymentId required" });
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status: "Paid", paidAt: new Date(), razorpayPaymentId: "ADMIN_CONFIRMED" },
      { new: true }
    );
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /payments/:id — admin edits a maintenance payment
router.put("/:id", adminOnly, async (req, res) => {
  try {
    const { purpose, amount, workerName, status, paidAt } = req.body;
    const update = {};
    if (purpose !== undefined) update.purpose = purpose;
    if (amount !== undefined) update.amount = Number(amount);
    if (workerName !== undefined) update.workerName = workerName;
    if (status !== undefined) update.status = status;
    if (paidAt !== undefined) update.paidAt = paidAt ? new Date(paidAt) : null;

    const payment = await Payment.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /payments/:id — admin deletes a maintenance payment
router.delete("/:id", adminOnly, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json({ success: true, message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;