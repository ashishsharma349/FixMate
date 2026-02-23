const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ComplainSchema = new Schema({
  image_url:      { type: String, required: true },
  title:          { type: String, required: true },
  category:       { type: String, default: "General" },

  // Lifecycle: Pending→Assigned→EstimatePending→EstimateApproved→InProgress→Resolved
  status: {
    type: String,
    enum: ["Pending", "Assigned", "EstimatePending", "EstimateApproved", "InProgress", "Resolved"],
    default: "Pending",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Emergency"],
    required: true,
  },
  description:    { type: String, required: true },
  resident:       { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedStaff:  { type: Schema.Types.ObjectId, ref: "Staff", default: null },

  // Set by admin at assignment — Personal skips cost approval, CommonArea requires it
  workType: { type: String, enum: ["Personal", "CommonArea", null], default: null },

  // Staff submits estimated labour cost (CommonArea only goes to admin for approval)
  estimatedCost:  { type: Number, default: null },
  estimateStatus: { type: String, enum: ["Pending", "Approved", "Rejected", null], default: null },

  // Staff submits on completion
  proofImage:     { type: String, default: null },
  worklog:        { type: String, default: null },
  actualCost:     { type: Number, default: null },
  materialsUsed:  { type: Array,  default: [] }, // [{ name, qty }]

  // Personal work — resident can revoke assigned staff, reopens complaint
  revokedAt:      { type: Date,   default: null },
  revokeReason:   { type: String, default: null },

  createdAt:      { type: Date, default: Date.now },
});

module.exports = mongoose.model("Complain", ComplainSchema);