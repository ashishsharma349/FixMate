const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["personal", "maintenance"],
    required: true,
  },

  // ── Personal Payment ──
  resident:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  flatNumber: { type: String },
  amount:     { type: Number, required: true },
  dueDate:    { type: Date },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Overdue"],
    default: "Pending",
  },

  // Razorpay
  razorpayOrderId:   { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },

  // ── Maintenance Payment ──
  complaint:  { type: mongoose.Schema.Types.ObjectId, ref: "Complain" }, // FIXED: was "Complaint"
  worker:     { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  workerName: { type: String },
  purpose:    { type: String },

  // ── Shared ──
  refId:  { type: String, unique: true, sparse: true },
  month:  { type: Number },
  year:   { type: Number },
  paidAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);