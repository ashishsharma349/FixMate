const express = require("express");
const userControllers = require("../controller/user");
const upload = require("../config/multerconfig");

const userRoute = express.Router();
userRoute.use(express.json());
userRoute.use(express.urlencoded({ extended: true }));

userRoute.use((req, res, next) => {
  console.log("USER ROUTER:", req.method, req.originalUrl);
  next();
});

// ── Complaint image upload (existing) ────────────────────────────────────────
userRoute.post("/complains",
  upload.single("photo"),
  userControllers.handlePost_fileUpload
);

// ── Fetch complaints — resident sees own, admin sees all (existing) ───────────
userRoute.get("/All-Complains", userControllers.ShowComplains);

// ── Fetch all staff list (existing) ─────────────────────────────────────────
userRoute.get("/All-Staff", userControllers.getAllStaffDetails);

// ── Assign complaint to staff (existing) ─────────────────────────────────────
userRoute.patch("/Assign-Complain", userControllers.handleComplainAssign);

// ── Fetch staff's assigned tasks (existing) ──────────────────────────────────
userRoute.get("/Task", userControllers.fetch_task);

// ── Profile photo upload (existing) ─────────────────────────────────────────
userRoute.post("/profile/photo",
  upload.single("photo"),
  userControllers.handleProfilePhotoUpload
);

// ── NEW: Staff submits estimated cost for a complaint ────────────────────────
userRoute.post("/submit-estimate", userControllers.submitEstimate);

// ── NEW: Staff submits completion proof + actual cost + materials ─────────────
userRoute.post("/complete-task",
  upload.single("proof"), // proof image via multer
  userControllers.completeTask
);

// ── NEW: Resident revokes assigned staff for Personal work ───────────────────
userRoute.patch("/revoke-complaint", userControllers.revokeStaff);

module.exports = userRoute;