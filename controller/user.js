const Complain = require("../model/Complain");
const User = require("../model/User");
const { deductMaterials } = require("./inventory");

// ── FILE UPLOAD FOR COMPLAINT ──────────────────────────────────────────────────
exports.handlePost_fileUpload = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    if (!req.body.title || !req.body.description || !req.body.priority) {
      return res.status(400).json({ error: "Title, description and priority required" });
    }
    // FIXED: photo is MANDATORY
    if (!req.file) {
      return res.status(400).json({ error: "Photo is required" });
    }
    const complain = {
      image_url:     `/uploads/${req.file.filename}`,
      title:         req.body.title,
      category:      req.body.category || "General",
      priority:      req.body.priority,
      description:   req.body.description,
      flatNumber:    req.body.flatNumber,
      residentName:  req.body.residentName,
      residentPhone: req.body.residentPhone,
      scheduledSlot: req.body.scheduledSlot,
      resident:      req.session.user.profileId || req.session.user.id,
    };
    await Complain.create(complain);
    res.status(201).json({ message: "Complaint filed successfully" });
  } catch (err) {
    console.error("[handlePost_fileUpload]:", err);
    res.status(500).json({ error: "Could not save complaint" });
  }
};

// ── SHOW COMPLAINTS ────────────────────────────────────────────────────────────
exports.ShowComplains = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.status(401).json({ error: "Not logged in" });
    const filter = sessionUser.role === "admin" ? {} : { resident: sessionUser.profileId || sessionUser.id };
    const data = await Complain.find(filter)
      .populate("assignedStaff", "name department phone")
      .sort({ createdAt: -1 });
    res.status(200).json({ complains: data });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

// ── GET ALL STAFF ──────────────────────────────────────────────────────────────
exports.getAllStaffDetails = async (req, res) => {
  try {
    const Staff = require("../model/staff");
    const staff = await Staff.find().populate({ path: "authId", select: "email role" });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── ASSIGN COMPLAINT ───────────────────────────────────────────────────────────
exports.handleComplainAssign = async (req, res) => {
  try {
    const Staff = require("../model/staff");
    const { staffId, complaintIds, workType } = req.body;
    if (!staffId || !Array.isArray(complaintIds) || complaintIds.length === 0)
      return res.status(400).json({ error: "Invalid input data" });
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    const updateResult = await Complain.updateMany(
      { _id: { $in: complaintIds } },
      { $set: { assignedStaff: staffId, status: "Assigned", workType: workType || "Personal" } }
    );
    await Staff.findByIdAndUpdate(staffId, { $set: { isAvailable: false } });
    return res.status(200).json({ message: "Complaints assigned", assignedCount: updateResult.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── FETCH STAFF TASKS ──────────────────────────────────────────────────────────
exports.fetch_task = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser || sessionUser.role !== "staff")
      return res.status(401).json({ error: "Unauthorized" });
    const complains = await Complain.find({ assignedStaff: sessionUser.profileId })
      .populate("resident", "name phone")
      .sort({ createdAt: -1 });
    res.status(200).json({ complains });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── PROFILE PHOTO UPLOAD ───────────────────────────────────────────────────────
exports.handleProfilePhotoUpload = async (req, res) => {
  try {
    const Staff = require("../model/staff");
    const sessionUser = req.session.user;
    if (!sessionUser) return res.status(401).json({ error: "Not logged in" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const photoPath = req.file.filename;
    if (sessionUser.role === "user") {
      await User.findOneAndUpdate({ authId: sessionUser.id }, { $set: { photo: photoPath } });
    } else if (sessionUser.role === "staff") {
      await Staff.findOneAndUpdate({ authId: sessionUser.id }, { $set: { photo: photoPath } });
    } else {
      return res.status(403).json({ error: "Admin does not have a profile photo" });
    }
    res.status(200).json({ success: true, photo: `/uploads/${photoPath}` });
  } catch (err) {
    res.status(500).json({ error: "Could not update profile photo" });
  }
};

// ── STAFF SUBMITS ESTIMATE ─────────────────────────────────────────────────────
// Personal = labour only, goes to resident for acceptance
// CommonArea = labour + inventory, goes to admin for approval
exports.submitEstimate = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser || sessionUser.role !== "staff")
      return res.status(401).json({ error: "Unauthorized" });

    const { complaintId, labourEstimate, inventoryEstimate } = req.body;
    if (!complaintId || (!labourEstimate && labourEstimate !== 0))
      return res.status(400).json({ error: "complaintId and labourEstimate required" });

    const complaint = await Complain.findById(complaintId);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    if (!complaint.assignedStaff.includes(sessionUser.profileId))
      return res.status(403).json({ error: "Not your complaint" });

    const isPersonal = complaint.workType === "Personal";
    const invEst = isPersonal ? [] : (inventoryEstimate || []);
    
    // Calculate total estimated cost
    const totalInvCost = invEst.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalEst = Number(labourEstimate) + totalInvCost;

    await Complain.findByIdAndUpdate(complaintId, {
      $set: {
        labourEstimate:    Number(labourEstimate),
        inventoryEstimate: invEst,
        estimatedCost:     totalEst,
        estimateStatus:    "Pending",
        status:            "EstimateSubmitted",
      },
    });

    res.status(200).json({
      message: isPersonal
        ? "Estimate sent to resident for acceptance."
        : "Estimate (Labour + Inventory) sent to admin for approval.",
    });
  } catch (err) {
    console.error("[submitEstimate]:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── RESIDENT ACCEPTS ESTIMATE (Personal Work Only) ─────────────────────────────
exports.acceptEstimate = async (req, res) => {
    try {
        const sessionUser = req.session.user;
        if (!sessionUser || sessionUser.role !== "user")
          return res.status(401).json({ error: "Unauthorized" });
    
        const { complaintId } = req.body;
        const complaint = await Complain.findById(complaintId);
        
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });
        if (String(complaint.resident) !== String(sessionUser.profileId || sessionUser.id))
            return res.status(403).json({ error: "Unauthorized access" });
        
        if (complaint.workType !== "Personal")
            return res.status(400).json({ error: "Only personal work estimates can be accepted by residents" });
        
        if (complaint.status !== "EstimateSubmitted")
            return res.status(400).json({ error: "Invalid complaint status for acceptance" });
        
        complaint.status = "InProgress";
        complaint.estimateStatus = "Approved";
        await complaint.save();
    
        res.json({ message: "Estimate accepted. Staff can now start work." });
    } catch (err) {
        console.error("[acceptEstimate]:", err);
        res.status(500).json({ error: "Server error" });
    }
}

// ── STAFF SUBMITS COMPLETION PROOF ────────────────────────────────────────────
// Personal work → PaymentPending
// CommonArea → Mark Completed, Admin verifies and releases fund
exports.completeTask = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser || sessionUser.role !== "staff")
      return res.status(401).json({ error: "Unauthorized" });

    const { complaintId, worklog, actualLabourCost, actualInventoryUsed } = req.body;
    if (!complaintId || !req.file)
      return res.status(400).json({ error: "complaintId and proof image required" });

    const complaint = await Complain.findById(complaintId);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    if (!complaint.assignedStaff.includes(sessionUser.profileId))
      return res.status(403).json({ error: "Not your complaint" });

    let inventory = [];
    try { inventory = JSON.parse(actualInventoryUsed || "[]"); } catch (_) {}

    const isPersonal = complaint.workType === "Personal";
    
    const finalLabour = Number(actualLabourCost) || complaint.labourEstimate || 0;
    const finalInvCost = inventory.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const finalTotal = finalLabour + finalInvCost;

    const updateData = {
        proofImage:    `/uploads/${req.file.filename}`,
        worklog:       worklog || "",
        actualLabourCost: finalLabour,
        actualInventoryUsed: isPersonal ? [] : inventory,
        actualCost:    finalTotal,
        status:        isPersonal ? "PaymentPending" : "Resolved",
    };

    await Complain.findByIdAndUpdate(complaintId, { $set: updateData });

    // Release all assigned staff
    const Staff = require("../model/staff");
    await Staff.updateMany({ _id: { $in: complaint.assignedStaff } }, { $set: { isAvailable: true } });

    // For CommonArea: Create a PENDING expense in Finance (Pending Payout flow)
    if (!isPersonal) {
        if (inventory.length > 0) {
            await deductMaterials(inventory.map(i => ({ name: i.name, qty: i.qty })));
        }
        
        const Finance = require("../model/finance");
        const now = new Date();
        // Create a Pending expense entry for the society fund
        await Finance.create({
            transactionType: "Expense",
            transactionCategory: "CommonRepair",
            amount: finalTotal,
            status: "Pending", // Admin must click PAY to mark as Paid
            description: `Common Area repair completed: ${complaint.title}`,
            relatedComplaint: complaint._id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            handledBy: sessionUser.profileId
        });
    }

    res.status(200).json({ 
        message: isPersonal 
            ? "Work completed. Awaiting payment verification from both parties." 
            : "Work completed successfully and recorded." 
    });
  } catch (err) {
    console.error("[completeTask]:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── RECORD PAYMENT VERIFICATION (Personal Work Only) ───────────────────────────
exports.recordPaymentVerification = async (req, res) => {
    try {
        const sessionUser = req.session.user;
        const { complaintId, amount } = req.body;
        
        if (!complaintId || !amount)
            return res.status(400).json({ error: "complaintId and amount required" });
        
        const complaint = await Complain.findById(complaintId);
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });
        if (complaint.workType !== "Personal")
            return res.status(400).json({ error: "Only personal work requires payment verification" });

        if (sessionUser.role === "user") {
            complaint.userPaymentAmount = Number(amount);
        } else if (sessionUser.role === "staff") {
            complaint.staffPaymentAmount = Number(amount);
        } else {
            return res.status(403).json({ error: "Only staff or resident can record payment" });
        }

        // Auto-resolve if both match, reset if mismatch
        if (complaint.userPaymentAmount !== null && complaint.staffPaymentAmount !== null) {
            if (complaint.userPaymentAmount === complaint.staffPaymentAmount) {
                complaint.status = "Resolved";
                complaint.isPaymentVerified = true;
                
                // Final staff earning log for transparency
                const Finance = require("../model/finance");
                await Finance.create({
                    transactionType: "Income", // Tracked for transparency
                    transactionCategory: "DirectPayment",
                    amount: complaint.userPaymentAmount,
                    status: "Paid",
                    description: `Verified personal repair payment: ${complaint.title}`,
                    relatedComplaint: complaint._id,
                    handledBy: complaint.assignedStaff?.[0] || null
                });
                
                // Release staff
                const Staff = require("../model/staff");
                await Staff.updateMany({ _id: { $in: complaint.assignedStaff } }, { isAvailable: true });
            } else {
                // MISMATCH — reset both amounts so they can re-enter
                const mismatchInfo = {
                    staffEntered: complaint.staffPaymentAmount,
                    residentEntered: complaint.userPaymentAmount
                };
                complaint.paymentMismatchCount = (complaint.paymentMismatchCount || 0) + 1;
                complaint.lastMismatchStaffAmount = mismatchInfo.staffEntered;
                complaint.lastMismatchUserAmount = mismatchInfo.residentEntered;
                complaint.userPaymentAmount = null;
                complaint.staffPaymentAmount = null;

                await complaint.save();
                return res.json({ 
                    message: `Payment mismatch! Staff entered ₹${mismatchInfo.staffEntered}, Resident entered ₹${mismatchInfo.residentEntered}. Both must re-enter the correct amount.`,
                    mismatch: true,
                    mismatchInfo 
                });
            }
        }

        await complaint.save();
        res.json({ message: "Payment recorded successfully", isVerified: complaint.isPaymentVerified });
    } catch (err) {
        console.error("[recordPaymentVerification]:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// ── RESIDENT REVOKES ASSIGNED STAFF ───────────────────────────────────────────
exports.revokeStaff = async (req, res) => {
  try {
    const Staff = require("../model/staff");
    const sessionUser = req.session.user;
    if (!sessionUser || sessionUser.role !== "user")
      return res.status(401).json({ error: "Unauthorized" });
    const { complaintId, revokeReason } = req.body;
    if (!complaintId) return res.status(400).json({ error: "complaintId required" });
    const complaint = await Complain.findById(complaintId);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    if (String(complaint.resident) !== String(sessionUser.profileId || sessionUser.id))
      return res.status(403).json({ error: "Not your complaint" });
    if (complaint.workType !== "Personal")
      return res.status(400).json({ error: "Can only revoke Personal work" });
    if (!["Assigned", "EstimatePending", "EstimateApproved"].includes(complaint.status))
      return res.status(400).json({ error: "Cannot revoke at this stage" });

    if (complaint.assignedStaff)
      await Staff.findByIdAndUpdate(complaint.assignedStaff, { $set: { isAvailable: true } });

    await Complain.findByIdAndUpdate(complaintId, {
      $set: {
        assignedStaff: null, status: "Pending", workType: null,
        estimatedCost: null, estimateStatus: null,
        revokedAt: new Date(), revokeReason: revokeReason || "Revoked by resident",
      },
    });
    res.status(200).json({ message: "Staff revoked. Complaint reopened." });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── RESIDENT RATES STAFF ─────────────────────────────────────────────────────
exports.rateStaff = async (req, res) => {
  try {
    const Staff = require("../model/staff");
    const sessionUser = req.session.user;
    if (!sessionUser || sessionUser.role !== "user")
      return res.status(401).json({ error: "Unauthorized" });
    
    const { staffId, rating } = req.body;
    if (!staffId || !rating)
      return res.status(400).json({ error: "staffId and rating required" });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: "Rating must be between 1 and 5" });

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    // Calculate new accumulated rating
    const currentTotal = staff.rating * staff.ratingCount;
    const newCount = staff.ratingCount + 1;
    const newRating = (currentTotal + rating) / newCount;

    await Staff.findByIdAndUpdate(staffId, {
      $set: {
        rating: Math.round(newRating * 10) / 10, // Round to 1 decimal
        ratingCount: newCount
      }
    });

    res.status(200).json({ message: "Rating submitted successfully", newRating: Math.round(newRating * 10) / 10 });
  } catch (err) {
    console.error("[rateStaff]:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};