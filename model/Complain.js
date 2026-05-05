const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ComplainSchema = new Schema({
  image_url:      { type: String, required: true },
  title:          { type: String, required: true },
  category:       { type: String, default: "General" },

  // Lifecycle: Pending → Assigned → EstimateSubmitted → EstimateApproved → InProgress → PaymentPending (Personal) → Resolved
  status: {
    type: String,
    enum: [
      "Pending", 
      "Assigned", 
      "EstimateSubmitted", 
      "EstimateApproved", 
      "InProgress", 
      "PaymentPending", 
      "Resolved"
    ],
    default: "Pending",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    required: true,
  },
  description:    { type: String, required: true },
  resident:       { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedStaff: [{ type: Schema.Types.ObjectId, ref: "Staff", default: [] }],
  scheduledAt:    { type: Date, default: null },
  scheduledSlot:  { type: String, default: null },

  // Set by admin at assignment — Personal skips cost approval, CommonArea requires it
  workType: { type: String, enum: ["Personal", "CommonArea", null], default: null },
  staffIncentive: { type: Number, default: 0 },

  // detailed estimate logic
  labourEstimate:    { type: Number, default: 0 },
  inventoryEstimate: { type: Array,  default: [] }, // [{ itemId, name, qty, price }]
  estimatedCost:     { type: Number, default: 0 },  // total calculated
  estimateStatus:    { type: String, enum: ["Pending", "Approved", "Rejected", null], default: null },

  // Completion fields
  proofImage:         { type: String, default: null },
  worklog:            { type: String, default: null },
  actualLabourCost:   { type: Number, default: 0 },
  actualInventoryUsed:{ type: Array,  default: [] }, // [{ itemId, name, qty, price }]
  actualCost:         { type: Number, default: 0 },

  // Personal work verification
  userPaymentAmount:  { type: Number, default: null },
  staffPaymentAmount: { type: Number, default: null },
  isPaymentVerified:  { type: Boolean, default: false },
  paymentMismatchCount: { type: Number, default: 0 },
  lastMismatchStaffAmount: { type: Number, default: null },
  lastMismatchUserAmount:  { type: Number, default: null },

  // Personal work — resident can revoke assigned staff, reopens complaint
  revokedAt:      { type: Date,   default: null },
  revokeReason:   { type: String, default: null },

  createdAt:      { type: Date, default: Date.now },
});

module.exports = mongoose.model("Complain", ComplainSchema);