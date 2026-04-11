const Auth = require("../model/Auth");
const User = require("../model/User");
const Staff = require("../model/staff");
const Complain = require("../model/Complain");
const Inventory = require("../model/Inventory");
const Payment = require("../model/Payment");
const Finance = require("../model/finance");
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
    const [totalComplaints, inProgress, pendingApproval, pendingEstimates, resolvedComplaints, totalResidents, totalStaff] = await Promise.all([
      Complain.countDocuments(),
      Complain.countDocuments({ status: { $in: ["Assigned", "EstimateSubmitted", "EstimateApproved", "InProgress", "PaymentPending"] } }),
      Complain.countDocuments({ status: "Pending", assignedStaff: null }), // unassigned only
      Complain.countDocuments({ estimateStatus: "Pending", workType: "CommonArea" }), // CommonArea estimates waiting for admin
      Complain.countDocuments({ status: "Resolved" }),                     // Finished tickets
      User.countDocuments(),
      Staff.countDocuments(),
    ]);

    const recentComplaints = await Complain.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("resident", "name phone email flatNumber photo")
      .populate("assignedStaff", "name phone department");

    const pendingEstimatesList = await Complain.find({ estimateStatus: "Pending" })
      .populate("assignedStaff", "name phone department")
      .populate("resident", "name phone email flatNumber");

    // WIP = complaints that are assigned and being worked on (not Pending, not Resolved)
    const wipComplaints = await Complain.find({
      status: { $in: ["Assigned", "EstimateSubmitted", "EstimateApproved", "InProgress", "PaymentPending"] }
    })
      .sort({ createdAt: -1 })
      .populate("resident", "name phone email flatNumber photo")
      .populate("assignedStaff", "name phone department");

    const lowStockItems = await Inventory.find({
      $expr: { $lte: ["$quantity", "$minQuantity"] }
    }).select("name quantity minQuantity unit category");

    // Maintenance Fund Cumulative Logic (Matching getReportsData)
    const GENESIS_MONTH = 2; // February
    const GENESIS_YEAR = 2026;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const monthsDiff = (currentYear - GENESIS_YEAR) * 12 + (currentMonth - GENESIS_MONTH) + 1;
    const cumulativeLimit = Math.max(0, monthsDiff) * (totalResidents * 3500);

    const fundExpenses = await Finance.aggregate([
      { 
        $match: { 
          transactionType: 'Expense', 
          transactionCategory: { $in: ['Salary', 'CommonRepair', 'Inventory', 'Incentive'] },
          status: 'Paid', // Only count realized expenses
          date: { $gte: new Date(GENESIS_YEAR, GENESIS_MONTH - 1, 1) }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalFundSpent = fundExpenses[0]?.total || 0;

    const monthlyFeesMatch = { type: "personal", month: currentMonth, year: currentYear };
    const [paidFeesAgg, pendingFeesAgg] = await Promise.all([
      Payment.aggregate([
        { $match: { ...monthlyFeesMatch, status: "Paid" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { ...monthlyFeesMatch, status: "Pending" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      stats: { totalComplaints, inProgress, pendingApproval, pendingEstimates, resolvedComplaints, totalResidents, totalStaff },
      fund: {
        limit: cumulativeLimit,
        spent: totalFundSpent,
        balance: cumulativeLimit - totalFundSpent,
      },
      residentMonthlyFees: {
        month: currentMonth,
        year: currentYear,
        collectedAmount: paidFeesAgg[0]?.total || 0,
        paidCount: paidFeesAgg[0]?.count || 0,
        pendingAmount: pendingFeesAgg[0]?.total || 0,
        pendingCount: pendingFeesAgg[0]?.count || 0,
      },
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
      { $limit: 12 },
    ]);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = data.map((d) => ({
      month: `${months[d._id.month - 1]} ${String(d._id.year).slice(-2)}`,
      monthNum: d._id.month,
      year: d._id.year,
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
      .populate("assignedStaff", "name department phone");
    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── ASSIGN STAFF TO COMPLAINT ──────────────────────────────────────────────────
exports.assignComplaint = async (req, res) => {
  try {
    const { complaintId, staffIds, workType, scheduledAt, scheduledSlot, staffIncentive } = req.body;
    if (!complaintId || !staffIds || !Array.isArray(staffIds) || staffIds.length < 1 || !workType)
      return res.status(400).json({ error: "complaintId, staffIds (array with at least 1) and workType are required" });
    


    if (!["Personal", "CommonArea"].includes(workType))
      return res.status(400).json({ error: "workType must be Personal or CommonArea" });

    const staffMembers = await Staff.find({ _id: { $in: staffIds } });
    if (staffMembers.length !== staffIds.length) 
      return res.status(404).json({ error: "One or more staff not found" });

    await Complain.findByIdAndUpdate(complaintId, {
      $set: { 
        assignedStaff: staffIds, 
        status: "Assigned", 
        workType, 
        scheduledAt, 
        scheduledSlot,
        staffIncentive: Number(staffIncentive) || 0 
      },
    });
    
    // Mark all assigned staff as busy
    await Staff.updateMany({ _id: { $in: staffIds } }, { $set: { isAvailable: false } });

    res.json({ message: "Complaint assigned to " + staffIds.length + " staff members", workType });
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

// ── GET STAFF AVAILABILITY FOR TIMEFRAME ─────────────────────────────────────
exports.getStaffAvailability = async (req, res) => {
  try {
    const { date, slot } = req.query;
    if (!date || !slot) return res.status(400).json({ error: "date and slot are required" });

    // Find all complaints assigned to staff on this date and slot that are not resolved
    const busyComplaints = await Complain.find({
      scheduledAt: {
        $gte: new Date(date + "T00:00:00.000Z"),
        $lte: new Date(date + "T23:59:59.999Z")
      },
      scheduledSlot: slot,
      status: { $ne: "Resolved" }
    }).select("assignedStaff");

    const busyStaffIds = busyComplaints
      .map(c => c.assignedStaff?.toString())
      .filter(Boolean);

    res.json({ busyStaffIds: [...new Set(busyStaffIds)] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── REPORTS DATA ───────────────────────────────────────────────────────────────
exports.getReportsData = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filterMonth = month ? parseInt(month) : null;
    const filterYear = year ? parseInt(year) : null;

    const [
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      inProgressComplaints,
      totalStaff,
      availableStaff,
      totalResidents,
    ] = await Promise.all([
      Complain.countDocuments(),
      Complain.countDocuments({ status: "Resolved" }),
      Complain.countDocuments({ status: "Pending" }),
      Complain.countDocuments({ status: { $in: ["Assigned", "EstimatePending", "EstimateApproved", "InProgress"] } }),
      Staff.countDocuments(),
      Staff.countDocuments({ isAvailable: true }),
      User.countDocuments(),
    ]);

    const categoryBreakdown = await Complain.aggregate([
      { $lookup: { from: "staff", localField: "assignedStaff", foreignField: "_id", as: "staff" } },
      { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ["$staff.department", "Unassigned"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const scheduleData = await Complain.find({ scheduledAt: { $ne: null } })
      .select("title scheduledAt scheduledSlot assignedStaff resident")
      .populate("assignedStaff", "name department")
      .populate("resident", "name flatNumber");

    // Income/Expense filtering conditions
    let paymentMatchIncome = { type: "personal", status: "Paid" };
    let paymentMatchExpense = { type: "maintenance", status: "Paid" };
    
    if (filterMonth) {
        paymentMatchIncome.month = filterMonth;
        paymentMatchExpense.month = filterMonth;
    }
    if (filterYear) {
        paymentMatchIncome.year = filterYear;
        paymentMatchExpense.year = filterYear;
    }

    const [incomeData, expenseData] = await Promise.all([
      Payment.aggregate([
        { $match: paymentMatchIncome },
        { $group: { _id: null, totalIncome: { $sum: "$amount" } } },
      ]),
      Payment.aggregate([
        { $match: paymentMatchExpense },
        { $group: { _id: null, totalExpense: { $sum: "$amount" } } },
      ])
    ]);

    const totalIncome = incomeData[0]?.totalIncome || 0;
    const totalExpense = expenseData[0]?.totalExpense || 0;

    // ── Maintenance Fund Cumulative Pooled Logic ──
    const GENESIS_MONTH = 2; // February
    const GENESIS_YEAR = 2026;
    
    const MONTHLY_LIMIT = totalResidents * 3500;
    let cumulativeLimit = MONTHLY_LIMIT;
    let financeMatch = { 
        transactionType: 'Expense', 
        transactionCategory: { $in: ['Salary', 'CommonRepair', 'Inventory', 'Incentive'] },
        date: { $gte: new Date(GENESIS_YEAR, GENESIS_MONTH - 1, 1) }
    };

    if (filterMonth && filterYear) {
        // Calculate months since Genesis (Feb 2026) to calculate cumulative budget
        let monthsDiff = (filterYear - GENESIS_YEAR) * 12 + (filterMonth - GENESIS_MONTH) + 1;
        
        // Before February 2026, everything is 0 as per user request
        if (filterYear < GENESIS_YEAR || (filterYear === GENESIS_YEAR && filterMonth < GENESIS_MONTH)) {
            monthsDiff = 0;
            cumulativeLimit = 0;
        } else {
            cumulativeLimit = monthsDiff * MONTHLY_LIMIT;
        }

        // Total spent from beginning of time until the end of the selected month
        const endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59);
        financeMatch.date.$lte = endDate;
    }

    const fundExpenses = await Finance.aggregate([
      { $match: { ...financeMatch, status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalFundSpent = fundExpenses[0]?.total || 0;
    
    // Period-specific spending (just for this month) for detail stats
    let periodMatch = { ...financeMatch, status: 'Paid' };
    if (filterMonth && filterYear) {
        periodMatch.date = { 
            $gte: new Date(filterYear, filterMonth - 1, 1),
            $lte: new Date(filterYear, filterMonth, 0, 23, 59, 59)
        };
    }
    const periodExpenses = await Finance.aggregate([
        { $match: periodMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlySpent = periodExpenses[0]?.total || 0;

    // Direct Staff Earnings (Personal Work)
    let earningsMatch = { transactionCategory: { $in: ['DirectPayment', 'Salary', 'CommonRepair', 'Incentive'] } };
    if (filterMonth && filterYear) {
        const startDate = new Date(filterYear, filterMonth - 1, 1);
        const endDate = new Date(filterYear, filterMonth, 0, 23, 59, 59);
        earningsMatch.date = { $gte: startDate, $lte: endDate };
    }

    const staffEarnings = await Finance.aggregate([
      { $match: earningsMatch },
      { $group: { 
        _id: "$handledBy", 
        salary: { $sum: { $cond: [{ $eq: ["$transactionCategory", "Salary"] }, "$amount", 0] } },
        direct: { $sum: { $cond: [{ $in: ["$transactionCategory", ["DirectPayment", "Incentive"]] }, "$amount", 0] } },
        repairs: { $sum: { $cond: [{ $eq: ["$transactionCategory", "CommonRepair"] }, "$amount", 0] } }
      }}
    ]);

    const inventoryCategories = await Inventory.aggregate([
      { $group: { _id: "$category", totalItems: { $sum: 1 }, totalQty: { $sum: "$quantity" } } },
      { $sort: { totalItems: -1 } },
    ]);

    const expenseDistribution = await Finance.aggregate([
      { $match: { ...financeMatch, status: 'Paid' } },
      { $group: { _id: "$transactionCategory", total: { $sum: "$amount" } } }
    ]);

    res.json({
      complaints: { total: totalComplaints, resolved: resolvedComplaints, pending: pendingComplaints, inProgress: inProgressComplaints },
      staff: { total: totalStaff, available: availableStaff, busy: totalStaff - availableStaff },
      categoryBreakdown,
      expenseDistribution, // Categorized sums for charts
      scheduleData,
      fund: { 
        limit: cumulativeLimit, 
        spent: totalFundSpent, 
        balance: cumulativeLimit - totalFundSpent,
        monthlySpent: monthlySpent,
        monthlyLimit: MONTHLY_LIMIT,
        totalIncome, 
        totalExpense 
      },
      directLogs: staffEarnings,
      inventoryStats: inventoryCategories,
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

// ── RECORD OFFLINE SALARY ────────────────────────────────────────────────────
exports.recordSalaryPayment = async (req, res) => {
  try {
    const { staffId, amount, month, year, description } = req.body;
    if (!staffId || !amount || !month || !year) 
      return res.status(400).json({ error: "staffId, amount, month and year required" });

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    // Create Finance Expense
    await Finance.create({
      transactionType: "Expense",
      transactionCategory: "Salary",
      amount: Number(amount),
      month: Number(month),
      year: Number(year),
      status: "Paid", 
      description: description || `Salary payment to ${staff.name} for ${month}/${year}`,
      handledBy: staffId
    });

    res.json({ message: "Salary payment recorded successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── NEW: PAY PENDING EXPENSE (Common Repair Payout) ───────────────────────────
exports.payoutExpense = async (req, res) => {
  try {
    const { financeId } = req.body;
    if (!financeId) return res.status(400).json({ error: "financeId required" });

    const finance = await Finance.findById(financeId);
    if (!finance) return res.status(404).json({ error: "Finance record not found" });
    if (finance.status === "Paid") return res.status(400).json({ error: "Already paid" });

    finance.status = "Paid";
    finance.date = new Date(); // Update to actual payment date
    await finance.save();

    res.json({ message: "Payment processed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── NEW: MANUALLY ADD EXPENSE (Bills/Records) ────────────────────────────────
exports.addExpense = async (req, res) => {
  try {
    const { title, category, amount, status, date } = req.body;
    if (!title || !amount) {
      return res.status(400).json({ error: "Title and amount are required" });
    }

    const billImage = req.file ? `/uploads/${req.file.filename}` : null;

    const expenseDate = date ? new Date(date) : new Date();

    const allowedCat = ["Salary", "CommonRepair", "Inventory", "FundTopUp", "DirectPayment", "Incentive"];
    const cat = allowedCat.includes(category) ? category : "CommonRepair";

    const expense = await Finance.create({
      transactionType: "Expense",
      transactionCategory: cat,
      amount: Number(amount),
      description: title,
      status: status || "Paid",
      month: expenseDate.getMonth() + 1,
      year: expenseDate.getFullYear(),
      date: expenseDate,
      billImage
    });

    res.status(201).json({ message: "Expense record added successfully", expense });
  } catch (err) {
    console.error("[addExpense Error]:", err);
    res.status(500).json({ error: err.message });
  }
};

// ── NEW: GET COMPREHENSIVE FINANCES DATA ─────────────────────────────────────
exports.getFinancesData = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filterMonth = month !== undefined && month !== "" ? parseInt(month, 10) : NaN;
    const filterYear = year !== undefined && year !== "" ? parseInt(year, 10) : NaN;

    let financeQuery = {};
    if (!isNaN(filterMonth) && !isNaN(filterYear)) {
      financeQuery = { month: filterMonth, year: filterYear };
    } else if (!isNaN(filterYear) && isNaN(filterMonth)) {
      financeQuery = { year: filterYear };
    }

    const [staff, allFinances, complaints] = await Promise.all([
      Staff.find().populate("authId", "email"),
      Finance.find(financeQuery).sort({ date: -1 }).populate("handledBy", "name department"),
      Complain.find({
        workType: "Personal",
        status: { $in: ["PaymentPending", "Resolved"] },
      })
        .populate("resident", "name flatNumber")
        .populate("assignedStaff", "name"),
    ]);

    const expenses = allFinances.filter((f) => f.transactionCategory !== "Salary");
    const salaries = allFinances.filter((f) => f.transactionCategory === "Salary");

    const personalPayments = complaints.map((c) => {
      const match = c.userPaymentAmount === c.staffPaymentAmount && c.userPaymentAmount !== null;
      return {
        ...c.toObject(),
        paymentMatchStatus: match ? "Match" : "Mismatch",
      };
    });

    const groupedBills = allFinances.reduce((acc, f) => {
      const key = `${f.month}-${f.year}`;
      if (!acc[key]) acc[key] = { month: f.month, year: f.year, items: [] };
      acc[key].items.push(f);
      return acc;
    }, {});

    const incomeMatch = { type: "personal", status: "Paid" };
    if (!isNaN(filterMonth) && !isNaN(filterYear)) {
      incomeMatch.month = filterMonth;
      incomeMatch.year = filterYear;
    } else if (!isNaN(filterYear) && isNaN(filterMonth)) {
      incomeMatch.year = filterYear;
    }

    const totalIncomeAgg = await Payment.aggregate([
      { $match: incomeMatch },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalSpent = allFinances
      .filter((f) => f.status === "Paid" && f.transactionType === "Expense")
      .reduce((sum, f) => sum + f.amount, 0);

    const residentsCount = await User.countDocuments();
    let fundLimit = residentsCount * 3500;
    if (!isNaN(filterYear) && isNaN(filterMonth)) fundLimit = residentsCount * 3500 * 12;
    if (isNaN(filterYear) && isNaN(filterMonth)) fundLimit = residentsCount * 3500;

    const totalIncome = totalIncomeAgg[0]?.total || 0;

    res.json({
      staff,
      expenses,
      salaries,
      personalPayments,
      groupedBills: Object.values(groupedBills).sort((a, b) => b.year - a.year || b.month - a.month),
      stats: {
        totalIncome,
        totalSpent,
        balance: totalIncome - totalSpent,
        fundLimit,
      },
      filters: {
        month: !isNaN(filterMonth) ? filterMonth : null,
        year: !isNaN(filterYear) ? filterYear : null,
      },
    });
  } catch (err) {
    console.error("[getFinancesData]:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── UPDATE / DELETE FINANCE RECORD (admin) ───────────────────────────────────
const FINANCE_CATS = ["Salary", "CommonRepair", "Inventory", "FundTopUp", "DirectPayment", "Incentive"];

exports.updateFinanceRecord = async (req, res) => {
  try {
    const fin = await Finance.findById(req.params.id);
    if (!fin) return res.status(404).json({ error: "Record not found" });

    const { description, amount, transactionCategory, status, date, month, year } = req.body;
    if (description !== undefined) fin.description = String(description);
    if (amount !== undefined) fin.amount = Number(amount);
    if (transactionCategory !== undefined && FINANCE_CATS.includes(transactionCategory)) {
      fin.transactionCategory = transactionCategory;
    }
    if (status !== undefined && ["Pending", "Paid"].includes(status)) fin.status = status;
    if (date !== undefined && date !== null && date !== "") {
      const d = new Date(date);
      if (!Number.isNaN(d.getTime())) {
        fin.date = d;
        fin.month = d.getMonth() + 1;
        fin.year = d.getFullYear();
      }
    }
    if (month !== undefined && !Number.isNaN(Number(month))) fin.month = Number(month);
    if (year !== undefined && !Number.isNaN(Number(year))) fin.year = Number(year);

    await fin.save();
    res.json({ success: true, finance: fin });
  } catch (err) {
    console.error("[updateFinanceRecord]:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteFinanceRecord = async (req, res) => {
  try {
    const fin = await Finance.findByIdAndDelete(req.params.id);
    if (!fin) return res.status(404).json({ error: "Record not found" });
    res.json({ success: true, message: "Record deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};