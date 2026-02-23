const Auth = require("../model/Auth");
const User = require("../model/User");
const Staff = require("../model/staff");
const Complain = require("../model/Complain");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// ── Email helper — sends temp password on account creation ──────────────────
const sendTempPasswordEmail = async (email, tempPassword, role) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from: `"FixMate Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your FixMate Account Credentials",
      html: `<p>Your <strong>FixMate</strong> account has been created as <strong>${role}</strong>.</p>
             <p>Temporary Password: <strong>${tempPassword}</strong></p>
             <p>Log in and change your password immediately.</p>`,
    });
  } catch (err) {
    console.error("[Email Error]:", err.message);
  }
};

// ── Generate random temp password ───────────────────────────────────────────
const generateTempPassword = () =>
  Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

// ── DASHBOARD STATS ──────────────────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalComplaints, inProgress, pendingApproval, pendingEstimates] = await Promise.all([
      Complain.countDocuments(),
      Complain.countDocuments({ status: "InProgress" }),
      Complain.countDocuments({ status: "Assigned" }),
      Complain.countDocuments({ estimateStatus: "Pending" }),
    ]);

    // Recent 5 complaints for dashboard cards
    const recentComplaints = await Complain.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("resident", "name")
      .populate("assignedStaff", "name");

    // Pending estimates (CommonArea only) waiting for admin approval
    const pendingEstimatesList = await Complain.find({ estimateStatus: "Pending" })
      .populate("assignedStaff", "name")
      .populate("resident", "name");

    res.json({ stats: { totalComplaints, inProgress, pendingApproval, pendingEstimates }, recentComplaints, pendingEstimatesList });
  } catch (err) {
    console.error("[getDashboardStats]:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── ALL COMPLAINTS with populated fields ────────────────────────────────────
exports.getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complain.find()
      .sort({ createdAt: -1 })
      .populate("resident", "name phone")
      .populate("assignedStaff", "name department");
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── ASSIGN STAFF TO COMPLAINT with workType ──────────────────────────────────
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

    res.json({ message: "Complaint assigned", workType });
  } catch (err) {
    console.error("[assignComplaint]:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── APPROVE OR REJECT ESTIMATE (CommonArea only) ─────────────────────────────
exports.handleEstimate = async (req, res) => {
  try {
    const { complaintId, action } = req.body; // action: "Approved" | "Rejected"
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

// ── MARK COMPLAINT RESOLVED (admin confirms staff completion) ────────────────
exports.resolveComplaint = async (req, res) => {
  try {
    const { complaintId } = req.body;
    await Complain.findByIdAndUpdate(complaintId, { $set: { status: "Resolved" } });
    // Free up the staff member
    const complaint = await Complain.findById(complaintId);
    if (complaint?.assignedStaff) {
      await Staff.findByIdAndUpdate(complaint.assignedStaff, { $set: { isAvailable: true } });
    }
    res.json({ message: "Complaint resolved" });
  } catch (err) {
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
  try {
    const { email, name, age, phone, aadhaar } = req.body;
    if (!email || !name || !age || !phone || !aadhaar)
      return res.status(400).json({ error: "All fields required" });

    const existing = await Auth.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already exists" });

    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    const auth = await Auth.create({ email, password: hashed, role: "user", isFirstLogin: true });
    const user = await User.create({ authId: auth._id, name, age, phone, aadhaar });
    await sendTempPasswordEmail(email, tempPassword, "Resident");

    res.status(201).json({ message: "User created", userId: user._id });
  } catch (err) {
    console.error("[createUser]:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, age, phone, aadhaar, email } = req.body;
    const user = await User.findByIdAndUpdate(userId, { $set: { name, age, phone, aadhaar } }, { new: true });
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
    await Auth.findByIdAndDelete(user.authId); // remove auth record too
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

// exports.createStaff = async (req, res) => {
//   try {
//     const { email, name, phone, department, aadhaar } = req.body;
//     if (!email || !name || !phone || !department || !aadhaar)
//       return res.status(400).json({ error: "All fields required" });

//     const existing = await Auth.findOne({ email });
//     if (existing) return res.status(409).json({ error: "Email already exists" });

//     const tempPassword = generateTempPassword();
//     const hashed = await bcrypt.hash(tempPassword, 10);
//     const auth = await Auth.create({ email, password: hashed, role: "staff", isFirstLogin: true });
//     const staff = await Staff.create({ authId: auth._id, name, phone, department, aadhaar });
//     await sendTempPasswordEmail(email, tempPassword, "Staff");

//     res.status(201).json({ message: "Staff created", staffId: staff._id });
//   } catch (err) {
//     console.error("[createStaff]:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

exports.createStaff = async (req, res) => {
  let auth = null;
  try {
    const { email, name, phone, contact, department, aadhaar } = req.body;
    const phoneNum = phone || contact; // accept either field name

    if (!email || !name || !phoneNum || !department)
      return res.status(400).json({ error: "All fields required" });

    const existing = await Auth.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already exists" });

    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);
    auth = await Auth.create({ email, password: hashed, role: "staff", isFirstLogin: true });
    
    const staff = await Staff.create({ authId: auth._id, name, phone: phoneNum, department, aadhaar });
    await sendTempPasswordEmail(email, tempPassword, "Staff");

    res.status(201).json({ message: "Staff created", staffId: staff._id });
  } catch (err) {
    // Rollback auth if staff creation failed
    if (auth) await Auth.findByIdAndDelete(auth._id);
    console.error("[createStaff]:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { name, phone, department, aadhaar, email, isAvailable } = req.body;
    const staff = await Staff.findByIdAndUpdate(
      staffId,
      { $set: { name, phone, department, aadhaar, isAvailable } },
      { new: true }
    );
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
    await Auth.findByIdAndDelete(staff.authId); // remove auth record too
    res.json({ message: "Staff deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Monthly complaint + revenue aggregation for charts
exports.getMonthlyStats = async (req, res) => {
  try {
    const data = await Complain.aggregate([
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          complaints: { $sum: 1 },
          revenue: { $sum: { $ifNull: ["$actualCost", 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 6 }
    ]);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const formatted = data.map(d => ({
      month: months[d._id.month - 1],
      complaints: d.complaints,
      revenue: d.revenue
    }));
    res.json({ chartData: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};