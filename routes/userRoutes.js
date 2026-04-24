const express = require("express");
const userControllers = require("../controller/user");
const upload = require("../config/multerconfig");
const { isLoggedIn } = require("../middleware/authMiddleware");

const userRoute = express.Router();
userRoute.use(express.json());
userRoute.use(express.urlencoded({ extended: true }));

userRoute.use((req, res, next) => {
  console.log("USER ROUTER:", req.method, req.originalUrl);
  next();
});

// ── Complaint image upload (existing) ────────────────────────────────────────
userRoute.post("/complains",
  isLoggedIn,
  upload.single("photo"),
  userControllers.handlePost_fileUpload
);

// ── Fetch complaints — resident sees own, admin sees all (existing) ───────────
userRoute.get("/All-Complains", isLoggedIn, userControllers.ShowComplains);

// ── Fetch all staff list (existing) ─────────────────────────────────────────
userRoute.get("/All-Staff", userControllers.getAllStaffDetails);

// ── Assign complaint to staff (existing) ─────────────────────────────────────
userRoute.patch("/Assign-Complain", isLoggedIn, userControllers.handleComplainAssign);

// ── Fetch staff's assigned tasks (existing) ──────────────────────────────────
userRoute.get("/Task", isLoggedIn, userControllers.fetch_task);

// ── Profile photo upload (existing) ─────────────────────────────────────────
userRoute.post("/profile/photo",
  isLoggedIn,
  upload.single("photo"),
  userControllers.handleProfilePhotoUpload
);

// ── NEW: Staff submits estimated cost for a complaint ────────────────────────
userRoute.post("/submit-estimate", isLoggedIn, userControllers.submitEstimate);

// ── NEW: Staff submits completion proof + actual cost + materials ─────────────
userRoute.post("/complete-task",
  isLoggedIn,
  upload.single("proof"), // proof image via multer
  userControllers.completeTask
);

// ── NEW: Resident revokes assigned staff for Personal work ───────────────────
userRoute.patch("/revoke-complaint", isLoggedIn, userControllers.revokeStaff);

// ── NEW: Resident accepts personal estimate ─────────────────────────
userRoute.post("/accept-estimate", isLoggedIn, userControllers.acceptEstimate);

// ── NEW: Payment verification (both parties) ─────────────────────────
userRoute.post("/record-payment", isLoggedIn, userControllers.recordPaymentVerification);

<<<<<<< HEAD
// ── NEW: Resident rates staff ─────────────────────────────────────────
userRoute.post("/rate-staff", isLoggedIn, userControllers.rateStaff);

=======
>>>>>>> bdfa590df068d40d85cb979dd4b992907a4e016c
module.exports = userRoute;