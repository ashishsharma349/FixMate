const Auth = require("../model/Auth");
const User = require("../model/User");
const Staff = require("../model/staff");
const Complain = require("../model/Complain");
const Inventory = require("../model/Inventory");
const Payment = require("../model/Payment");
const { sendTempPasswordMail } = require("../utils/mailer");

// ── Helper: generate a random secure temp password ───────────────────────────
function generateTempPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@$!%*?&";
  const all = upper + lower + digits + special;

  let pass =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)];

  for (let i = 0; i < 4; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }

  return pass.split("").sort(() => Math.random() - 0.5).join("");
}

// ── DASHBOARD STATS ───────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalComplaints, inProgress, pendingApproval, pendingEstimates, resolvedComplaints] = await Promise.all([
      Complain.countDocuments(),
      Complain.countDocuments({ status: { $in: ["Assigned", "EstimatePending", "EstimateApproved", "InProgress"] } }),
      Complain.countDocuments({ status: "Pending", assignedStaff: null }), // unassigned only
      Complain.countDocuments({ estimateStatus: "Pending" }),              // CommonArea estimates waiting
      Complain.countDocuments({ status: "Resolved" }),                     // Finished tickets
    ]);

    const recentComplaints = await Complain.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("resident", "name phone email flatNumber")
      .populate("assignedStaff", "name phone department");

    const pendingEstimatesList = await Complain.find({ estimateStatus: "Pending" })
      .populate("assignedStaff", "name phone department")
      .populate("resident", "name phone email flatNumber");

    // WIP = complaints that are assigned and being worked on (not Pending, not Resolved)
    const wipComplaints = await Complain.find({
      status: { $in: ["Assigned", "EstimatePending", "EstimateApproved", "InProgress"] }
    })
      .sort({ createdAt: -1 })
      .populate("resident", "name phone email flatNumber")
      .populate("assignedStaff", "name phone department");

    const lowStockItems = await Inventory.find({
      $expr: { $lte: ["$quantity", "$minQuantity"] }
    }).select("name quantity minQuantity unit category");

    res.json({
      stats: { totalComplaints, inProgress, pendingApproval, pendingEstimates, resolvedComplaints },
      recentComplaints,
      pendingEstimatesList,
      wipComplaints,
      lowStockItems,
    });
  } catch (err) {
    console.error("[getDashboardStats]:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── MONTHLY STATS for complaints chart ────────────────────────────────────────
exports.getMonthlyStats = async (req, res) => {
  try {
    const data = await Complain.aggregate([
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          complaints: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 },
    ]);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = data.map(d => ({
      month: months[d._id.month - 1],
      complaints: d.complaints,
    }));
    res.json({ chartData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── ALL COMPLAINTS ─────────────────────────────────────────────────────────────
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complain.find()
      .sort({ createdAt: -1 })
      .populate("resident", "name phone flatNumber")
      .populate("assignedStaff", "name department");
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── ASSIGN STAFF TO COMPLAINT ──────────────────────────────────────────────────
exports.assignComplaint = async (req, res) => {
  try {
    const { complaintId, staffId, workType } = req.body;
    if (!complaintId || !staffId || !workType)
      return res.status(400).json({ error: "complaintId, staffId and workType are required" });
    if (!["Personal", "CommonArea"].includes(workType))
      return res.status(400).json({ error: "workType must be Personal or CommonArea" });

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    await Complain.findByIdAndUpdate(complaintId, {
      $set: { assignedStaff: staffId, status: "Assigned", workType },
    });
    // Mark staff as busy
    await Staff.findByIdAndUpdate(staffId, { $set: { isAvailable: false } });

    res.json({ message: "Complaint assigned", workType });
  } catch (err) {
    console.error("[assignComplaint]:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── APPROVE OR REJECT ESTIMATE ─────────────────────────────────────────────────
exports.handleEstimate = async (req, res) => {
  try {
    const { complaintId, action } = req.body;
    if (!["Approved", "Rejected"].includes(action))
      return res.status(400).json({ error: "action must be Approved or Rejected" });

    const newStatus = action === "Approved" ? "EstimateApproved" : "Assigned";
    await Complain.findByIdAndUpdate(complaintId, {
      $set: { estimateStatus: action, status: newStatus },
    });
    res.json({ message: `Estimate ${action}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── RESOLVE COMPLAINT ──────────────────────────────────────────────────────────
exports.resolveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.body;
    const complaint = await Complain.findById(complaintId);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    await Complain.findByIdAndUpdate(complaintId, { $set: { status: "Resolved" } });
    if (complaint.assignedStaff) {
      await Staff.findByIdAndUpdate(complaint.assignedStaff, { $set: { isAvailable: true } });
    }
    res.json({ message: "Complaint resolved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── REPORTS DATA ───────────────────────────────────────────────────────────────
exports.getReportsData = async (req, res) => {
  try {
    const [
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      inProgressComplaints,
      totalStaff,
      availableStaff,
    ] = await Promise.all([
      Complain.countDocuments(),
      Complain.countDocuments({ status: "Resolved" }),
      Complain.countDocuments({ status: "Pending" }),
      Complain.countDocuments({ status: { $in: ["Assigned", "EstimatePending", "EstimateApproved", "InProgress"] } }),
      Staff.countDocuments(),
      Staff.countDocuments({ isAvailable: true }),
    ]);

    const categoryBreakdown = await Complain.aggregate([
      { $lookup: { from: "staff", localField: "assignedStaff", foreignField: "_id", as: "staff" } },
      { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ["$staff.department", "Unassigned"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // FIXED: Income = actual resident payments collected via Razorpay / cash
    const incomeData = await Payment.aggregate([
      { $match: { type: "personal", status: "Paid" } },
      { $group: { _id: null, totalIncome: { $sum: "$amount" } } },
    ]);

    // Expense = fund paid to staff for CommonArea work
    const expenseData = await Payment.aggregate([
      { $match: { type: "maintenance", status: "Paid" } },
      { $group: { _id: null, totalExpense: { $sum: "$amount" } } },
    ]);

    const totalIncome = incomeData[0]?.totalIncome || 0;
    const totalExpense = expenseData[0]?.totalExpense || 0;

    const inventoryCategories = await Inventory.aggregate([
      { $group: { _id: "$category", totalItems: { $sum: 1 }, totalQty: { $sum: "$quantity" } } },
      { $sort: { totalItems: -1 } },
    ]);

    res.json({
      complaints: { total: totalComplaints, resolved: resolvedComplaints, pending: pendingComplaints, inProgress: inProgressComplaints },
      staff: { total: totalStaff, available: availableStaff, busy: totalStaff - availableStaff },
      categoryBreakdown,
      fund: { totalIncome, totalExpense },
      inventoryCategories,
    });
  } catch (err) {
    console.error("[getReportsData]:", err);
    res.status(500).json({ error: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// USER CRUD
// ══════════════════════════════════════════════════════════════════════════════

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("authId", "email role isFirstLogin");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createUser = async (req, res) => {
  let auth = null;
  try {
    const { email, name, age, phone, contact, aadhaar, flatNumber } = req.body;
    const phoneNum = phone || contact;
    if (!email || !name || !age || !phoneNum || !aadhaar)
      return res.status(400).json({ error: "All fields required" });

    const existing = await Auth.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already exists" });

    const tempPassword = generateTempPassword();
    auth = await Auth.create({ email, password: tempPassword, role: "user", isFirstLogin: true });
    const user = await User.create({ authId: auth._id, name, age, phone: phoneNum, aadhaar, flatNumber: flatNumber || null });
    await sendTempPasswordMail(email, tempPassword, "Resident");

    res.status(201).json({ message: "User created", userId: user._id });
  } catch (err) {
    if (auth) await Auth.findByIdAndDelete(auth._id);
    console.error("[createUser]:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, age, phone, aadhaar, email, flatNumber } = req.body;
    const user = await User.findByIdAndUpdate(userId, { $set: { name, age, phone, aadhaar, flatNumber } }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (email) await Auth.findByIdAndUpdate(user.authId, { $set: { email } });
    res.json({ message: "User updated", user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    await Auth.findByIdAndDelete(user.authId);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// STAFF CRUD
// ══════════════════════════════════════════════════════════════════════════════

exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().populate("authId", "email role isFirstLogin");
    res.json({ staff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStaff = async (req, res) => {
  let auth = null;
  try {
    const { email, name, phone, contact, department, aadhaar } = req.body;
    const phoneNum = phone || contact;
    if (!email || !name || !phoneNum || !department)
      return res.status(400).json({ error: "All fields required" });

    const existing = await Auth.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already exists" });

    const tempPassword = generateTempPassword();
    auth = await Auth.create({ email, password: tempPassword, role: "staff", isFirstLogin: true });
    const staff = await Staff.create({ authId: auth._id, name, phone: phoneNum, department, aadhaar });
    await sendTempPasswordMail(email, name, tempPassword, "Staff");

    res.status(201).json({ message: "Staff created", staffId: staff._id });
  } catch (err) {
    if (auth) await Auth.findByIdAndDelete(auth._id);
    console.error("[createStaff]:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { name, phone, department, aadhaar, email, isAvailable } = req.body;
    const staff = await Staff.findByIdAndUpdate(staffId, { $set: { name, phone, department, aadhaar, isAvailable } }, { new: true });
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    if (email) await Auth.findByIdAndUpdate(staff.authId, { $set: { email } });
    res.json({ message: "Staff updated", staff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const staff = await Staff.findByIdAndDelete(staffId);
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    await Auth.findByIdAndDelete(staff.authId);
    res.json({ message: "Staff deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── ADMIN SETTINGS ─────────────────────────────────────────────────────────────
exports.updateAdminProfile = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    const { name, email, currentPassword, newPassword } = req.body;
    const auth = await Auth.findById(sessionUser.id).select("+password");
    if (!auth) return res.status(404).json({ error: "Admin not found" });

    if (email && email !== auth.email) {
      const exists = await Auth.findOne({ email });
      if (exists) return res.status(409).json({ error: "Email already in use" });
      auth.email = email;
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ error: "Current password required" });
      if (currentPassword !== auth.password) return res.status(401).json({ error: "Current password is incorrect" });
      auth.password = newPassword;
    }

    await auth.save();
    if (email) req.session.user.email = email;
    req.session.save();

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("[updateAdminProfile]:", err);
    res.status(500).json({ error: err.message });
  }
};