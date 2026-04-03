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
      image_url:   `/uploads/${req.file.filename}`,
      title:       req.body.title,
      category:    req.body.category || "General",
      priority:    req.body.priority,
      description: req.body.description,
      resident:    req.session.user.profileId || req.session.user.id,
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
// Personal = auto-approve (no admin step needed)
// CommonArea = goes to admin for approval
exports.submitEstimate = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser || sessionUser.role !== "staff")
      return res.status(401).json({ error: "Unauthorized" });
    const { complaintId, estimatedCost } = req.body;
    if (!complaintId || !estimatedCost)
      return res.status(400).json({ error: "complaintId and estimatedCost required" });
    const complaint = await Complain.findById(complaintId);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    if (String(complaint.assignedStaff) !== String(sessionUser.profileId))
      return res.status(403).json({ error: "Not your complaint" });

    const isPersonal = complaint.workType === "Personal";

    await Complain.findByIdAndUpdate(complaintId, {
      $set: {
        estimatedCost:  Number(estimatedCost),
        estimateStatus: isPersonal ? "Approved" : "Pending",
        status:         isPersonal ? "EstimateApproved" : "EstimatePending",
      },
    });

    res.status(200).json({
      message: isPersonal
        ? "Estimate recorded and auto-approved. Proceed with work."
        : "Estimate sent to admin for approval.",
    });
  } catch (err) {
    console.error("[submitEstimate]:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── STAFF SUBMITS COMPLETION PROOF ────────────────────────────────────────────
// Personal work: actualCost = estimatedCost (already confirmed)
// CommonArea: actualCost can differ (materials etc.)
exports.completeTask = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser || sessionUser.role !== "staff")
      return res.status(401).json({ error: "Unauthorized" });

    const { complaintId, worklog, actualCost, materialsUsed } = req.body;
    if (!complaintId || !req.file)
      return res.status(400).json({ error: "complaintId and proof image required" });

    const complaint = await Complain.findById(complaintId);
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    if (String(complaint.assignedStaff) !== String(sessionUser.profileId))
      return res.status(403).json({ error: "Not your complaint" });

    let materials = [];
    try { materials = JSON.parse(materialsUsed || "[]"); } catch (_) {}

    // Personal: use estimatedCost as finalCost
    // CommonArea: use submitted actualCost, fallback to estimatedCost if not provided
    const finalCost = complaint.workType === "Personal"
      ? complaint.estimatedCost
      : (Number(actualCost) || complaint.estimatedCost || 0);

    await Complain.findByIdAndUpdate(complaintId, {
      $set: {
        proofImage:    `/uploads/${req.file.filename}`,
        worklog:       worklog || "",
        actualCost:    finalCost,
        materialsUsed: materials,
        status:        "InProgress",
      },
    });

    // Only deduct society inventory for CommonArea work
    if (complaint.workType === "CommonArea" && materials.length > 0) {
      await deductMaterials(materials);
    }

    // Auto-create maintenance payment for CommonArea work
    if (complaint.workType === "CommonArea") {
      try {
        const Payment = require("../model/Payment");
        const Staff = require("../model/staff");
        const staff = await Staff.findById(sessionUser.profileId);
        const count = await Payment.countDocuments({ type: "maintenance" });
        const refId = `MAN-${String(count + 1).padStart(5, "0")}`;
        await Payment.create({
          type:       "maintenance",
          complaint:  complaint._id,
          worker:     sessionUser.profileId,
          workerName: staff?.name || "Staff",
          purpose:    complaint.title,
          amount:     finalCost,
          status:     "Paid",
          paidAt:     new Date(),
          refId,
        });
      } catch (payErr) {
        console.error("[completeTask] maintenance payment creation failed:", payErr.message);
        // Don't fail the whole request — proof is already saved
      }
    }

    res.status(200).json({ message: "Completion submitted successfully" });
  } catch (err) {
    console.error("[completeTask]:", err);
    res.status(500).json({ error: "Internal server error" });
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