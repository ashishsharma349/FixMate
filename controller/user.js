const Complain = require("../model/Complain");
const User = require("../model/User");
const { deductMaterials } = require("./inventory"); // auto-deduct on CommonArea completion

// ── FILE UPLOAD FOR COMPLAINT (existing) ────────────────────────────────────
exports.handlePost_fileUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const complain = {
      image_url:   `/uploads/${req.file.filename}`,
      title:       req.body.title,
      category:    req.body.category || "General",
      priority:    req.body.priority,
      description: req.body.description,
      resident:    req.session.user.id,
    };
    await Complain.create(complain);
    res.status(201).json({ message: "Complaint filed successfully" });
  } catch (err) {
    console.error("[handlePost_fileUpload]:", err);
    res.status(500).json({ error: "Could not save complaint" });
  }
};

// ── SHOW COMPLAINTS — resident sees own, admin sees all (existing) ────────────
exports.ShowComplains = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.status(401).json({ error: "Not logged in" });
    const filter = sessionUser.role === "admin" ? {} : { resident: sessionUser.id };
    const data = await Complain.find(filter)
      .populate("assignedStaff", "name department phone")
      .sort({ createdAt: -1 });
    res.status(200).json({ complains: data });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
};

// ── GET ALL STAFF (existing) ─────────────────────────────────────────────────
exports.getAllStaffDetails = async (req, res) => {
  try {
    const Staff = require("../model/staff");
    const staff = await Staff.find().populate({ path: "authId", select: "email role" });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── ASSIGN COMPLAINT (existing) ──────────────────────────────────────────────
exports.handleComplainAssign = async (req, res) => {
  try {
    const Staff = require("../model/staff");
    const { staffId, complaintIds } = req.body;
    if (!staffId || !Array.isArray(complaintIds) || complaintIds.length === 0)
      return res.status(400).json({ error: "Invalid input data" });
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ error: "Staff not found" });
    const updateResult = await Complain.updateMany(
      { _id: { $in: complaintIds } },
      { $set: { assignedStaff: staffId, status: "Assigned" } }
    );
    await Staff.findByIdAndUpdate(staffId, { $set: { isAvailable: false } });
    return res.status(200).json({ message: "Complaints assigned", assignedCount: updateResult.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── FETCH STAFF TASKS (existing) ─────────────────────────────────────────────
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

// ── PROFILE PHOTO UPLOAD (existing) ─────────────────────────────────────────
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

// ── NEW: STAFF SUBMITS ESTIMATE ──────────────────────────────────────────────
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

    // Personal = auto-approve (resident pays offline), CommonArea = needs admin approval
    const isPersonal = complaint.workType === "Personal";
    await Complain.findByIdAndUpdate(complaintId, {
      $set: {
        estimatedCost:  Number(estimatedCost),
        estimateStatus: isPersonal ? "Approved" : "Pending",
        status:         isPersonal ? "EstimateApproved" : "EstimatePending",
      },
    });
    res.status(200).json({
      message: isPersonal ? "Estimate recorded. Work can begin." : "Estimate sent to admin for approval.",
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── NEW: STAFF SUBMITS COMPLETION PROOF ─────────────────────────────────────
// Materials are OPTIONAL — labour-only jobs are perfectly valid (empty array)
// Auto-deducts inventory only for CommonArea work (society's stock)
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

    // Materials optional — empty array = labour only, that's fine
    let materials = [];
    try { materials = JSON.parse(materialsUsed || "[]"); } catch (_) {}

    await Complain.findByIdAndUpdate(complaintId, {
      $set: {
        proofImage:    `/uploads/${req.file.filename}`,
        worklog:       worklog || "",
        actualCost:    Number(actualCost) || 0,
        materialsUsed: materials,
        status:        "InProgress",
      },
    });

    // Only deduct society inventory for CommonArea work with materials used
    if (complaint.workType === "CommonArea" && materials.length > 0) {
      await deductMaterials(materials);
    }

    res.status(200).json({ message: "Completion submitted successfully" });
  } catch (err) {
    console.error("[completeTask]:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── NEW: RESIDENT REVOKES ASSIGNED STAFF (Personal work only) ───────────────
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
    if (String(complaint.resident) !== String(sessionUser.id))
      return res.status(403).json({ error: "Not your complaint" });
    if (complaint.workType !== "Personal")
      return res.status(400).json({ error: "Can only revoke Personal work" });
    if (!["Assigned", "EstimatePending", "EstimateApproved"].includes(complaint.status))
      return res.status(400).json({ error: "Cannot revoke at this stage" });

    // Free up the staff member
    if (complaint.assignedStaff)
      await Staff.findByIdAndUpdate(complaint.assignedStaff, { $set: { isAvailable: true } });

    // Fully reset complaint so admin can reassign
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