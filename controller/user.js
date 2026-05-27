const ComplaintService = require("../services/ComplaintService");
const StaffRepository = require("../repositories/StaffRepository");
const UserRepository = require("../repositories/UserRepository");
const ComplaintRepository = require("../repositories/ComplaintRepository");

// ── FILE UPLOAD FOR COMPLAINT ──────────────────────────────────────────────────
exports.handlePost_fileUpload = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }
    const complainData = {
      title:         req.body.title,
      description:   req.body.description,
      priority:      req.body.priority,
      category:      req.body.category,
      flatNumber:    req.body.flatNumber,
      residentName:  req.body.residentName,
      residentPhone: req.body.residentPhone,
      scheduledSlot: req.body.scheduledSlot,
      residentId:    req.user.profileId || req.user.id,
      imagePath:     req.file ? (req.file.path || "temp_path_for_testing") : null
    };

    await ComplaintService.fileComplaint(complainData);
    res.status(201).json({ message: "Complaint filed successfully" });
  } catch (err) {
    console.error("[handlePost_fileUpload]:", err);
    res.status(err.message.includes("required") ? 400 : 500).json({ error: err.message || "Could not save complaint" });
  }
};

// ── SHOW COMPLAINTS ────────────────────────────────────────────────────────────
exports.ShowComplains = async (req, res, next) => {
  try {
    const complains = await ComplaintService.getComplaints(req.user);
    res.status(200).json({ complains });
  } catch (err) {
    console.error("[ShowComplains]:", err);
    res.status(err.message === "Not logged in" ? 401 : 500).json({ error: err.message || "Database error" });
  }
};

// ── GET ALL STAFF ──────────────────────────────────────────────────────────────
exports.getAllStaffDetails = async (req, res, next) => {
  try {
    const staff = await StaffRepository.findAll();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── ASSIGN COMPLAINT ───────────────────────────────────────────────────────────
exports.handleComplainAssign = async (req, res, next) => {
  try {
    const { staffId, complaintIds, workType } = req.body;
    const updateResult = await ComplaintService.assignOneStaffToMultipleComplaints({ staffId, complaintIds, workType });
    return res.status(200).json({ message: "Complaints assigned", assignedCount: updateResult.modifiedCount });
  } catch (err) {
    console.error("[handleComplainAssign]:", err);
    res.status(err.message.includes("not found") ? 404 : 400).json({ error: err.message || "Internal server error" });
  }
};

// ── FETCH STAFF TASKS ──────────────────────────────────────────────────────────
exports.fetch_task = async (req, res, next) => {
  try {
    const sessionUser = req.user;
    if (!sessionUser || sessionUser.role !== "staff") {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const complains = await ComplaintRepository.find(
      { assignedStaff: sessionUser.profileId },
      [{ path: "resident", select: "name phone" }]
    );
    res.status(200).json({ complains });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── PROFILE PHOTO UPLOAD ───────────────────────────────────────────────────────
exports.handleProfilePhotoUpload = async (req, res, next) => {
  try {
    const sessionUser = req.user;
    if (!sessionUser) return res.status(401).json({ error: "Not logged in" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const photoUrl = req.file.path;
    if (sessionUser.role === "user") {
      await UserRepository.update(sessionUser.profileId, { photo: photoUrl });
    } else if (sessionUser.role === "staff") {
      await StaffRepository.update(sessionUser.profileId, { photo: photoUrl });
    } else {
      return res.status(403).json({ error: "Admin does not have a profile photo" });
    }
    res.status(200).json({ success: true, photo: photoUrl });
  } catch (err) {
    res.status(500).json({ error: "Could not update profile photo" });
  }
};

// ── STAFF SUBMITS ESTIMATE ─────────────────────────────────────────────────────
exports.submitEstimate = async (req, res, next) => {
  try {
    const sessionUser = req.user;
    const { complaintId, labourEstimate, inventoryEstimate } = req.body;
    const result = await ComplaintService.submitEstimate(sessionUser, complaintId, labourEstimate, inventoryEstimate);
    const isPersonal = result.workType === "Personal";
    res.status(200).json({
      message: isPersonal
        ? "Estimate sent to resident for acceptance."
        : "Estimate (Labour + Inventory) sent to admin for approval.",
    });
  } catch (err) {
    console.error("[submitEstimate]:", err);
    res.status(err.message === "Unauthorized" ? 401 : err.message.includes("not found") ? 404 : 400).json({ error: err.message });
  }
};

// ── RESIDENT ACCEPTS ESTIMATE (Personal Work Only) ─────────────────────────────
exports.acceptEstimate = async (req, res, next) => {
  try {
    const sessionUser = req.user;
    const { complaintId } = req.body;
    await ComplaintService.acceptEstimate(sessionUser, complaintId);
    res.json({ message: "Estimate accepted. Staff can now start work." });
  } catch (err) {
    console.error("[acceptEstimate]:", err);
    res.status(err.message === "Unauthorized" ? 401 : err.message.includes("not found") ? 404 : 400).json({ error: err.message });
  }
};

// ── STAFF SUBMITS COMPLETION PROOF ────────────────────────────────────────────
exports.completeTask = async (req, res, next) => {
  try {
    const sessionUser = req.user;
    const { complaintId, worklog, actualLabourCost, actualInventoryUsed } = req.body;
    
    const updated = await ComplaintService.completeTask(
      sessionUser,
      complaintId,
      worklog,
      actualLabourCost,
      actualInventoryUsed,
      req.file
    );
    
    const isPersonal = updated.workType === "Personal";
    res.status(200).json({ 
      message: isPersonal 
          ? "Work completed. Awaiting payment verification from both parties." 
          : "Work completed successfully and recorded." 
    });
  } catch (err) {
    console.error("[completeTask]:", err);
    res.status(err.message === "Unauthorized" ? 401 : err.message.includes("not found") ? 404 : 400).json({ error: err.message });
  }
};

// ── RECORD PAYMENT VERIFICATION (Personal Work Only) ───────────────────────────
exports.recordPaymentVerification = async (req, res, next) => {
  try {
    const sessionUser = req.user;
    const { complaintId, amount } = req.body;
    const result = await ComplaintService.recordPaymentVerification(sessionUser, complaintId, amount);
    if (result.mismatch) {
      return res.status(200).json({
        message: result.message,
        mismatch: true,
        mismatchInfo: result.mismatchInfo
      });
    }
    res.json({ message: result.message, isVerified: result.isVerified });
  } catch (err) {
    console.error("[recordPaymentVerification]:", err);
    res.status(err.message.includes("not found") ? 404 : 400).json({ error: err.message });
  }
};

// ── RESIDENT REVOKES ASSIGNED STAFF ───────────────────────────────────────────
exports.revokeStaff = async (req, res, next) => {
  try {
    const sessionUser = req.user;
    const { complaintId, revokeReason } = req.body;
    await ComplaintService.revokeStaff(sessionUser, complaintId, revokeReason);
    res.status(200).json({ message: "Staff revoked. Complaint reopened." });
  } catch (err) {
    console.error("[revokeStaff]:", err);
    res.status(err.message === "Unauthorized" ? 401 : err.message.includes("not found") ? 404 : 400).json({ error: err.message });
  }
};

// ── RESIDENT RATES STAFF ─────────────────────────────────────────────────────
exports.rateStaff = async (req, res, next) => {
  try {
    const sessionUser = req.user;
    const { staffId, rating } = req.body;
    const updatedStaff = await ComplaintService.rateStaff(sessionUser, staffId, rating);
    res.status(200).json({ message: "Rating submitted successfully", newRating: updatedStaff.rating });
  } catch (err) {
    console.error("[rateStaff]:", err);
    res.status(err.message === "Unauthorized" ? 401 : err.message.includes("not found") ? 404 : 400).json({ error: err.message });
  }
};