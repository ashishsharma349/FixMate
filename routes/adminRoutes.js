const express = require("express");
const adminControllers = require("../controller/admin");

const adminRoute = express.Router();
adminRoute.use(express.json());
adminRoute.use(express.urlencoded({ extended: true }));

// ── Guard: only admin can access these routes ────────────────────────────────
adminRoute.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden: Admin only" });
  next();
});

// ── Dashboard stats ──────────────────────────────────────────────────────────
adminRoute.get("/dashboard-stats", adminControllers.getDashboardStats);
adminRoute.get("/monthly-stats", adminControllers.getMonthlyStats);

// ── Complaints ────────────────────────────────────────────────────────────────
adminRoute.get("/complaints",          adminControllers.getAllComplaints);
adminRoute.post("/assign-complaint",   adminControllers.assignComplaint);
adminRoute.post("/handle-estimate",    adminControllers.handleEstimate);
adminRoute.post("/resolve-complaint",  adminControllers.resolveComplaint);

// ── Users ─────────────────────────────────────────────────────────────────────
adminRoute.get("/users",               adminControllers.getAllUsers);
adminRoute.post("/create-user",        adminControllers.createUser);
adminRoute.put("/users/:userId",       adminControllers.updateUser);
adminRoute.delete("/users/:userId",    adminControllers.deleteUser);

// ── Staff ─────────────────────────────────────────────────────────────────────
adminRoute.get("/staff",               adminControllers.getAllStaff);
adminRoute.post("/create-staff",       adminControllers.createStaff);
adminRoute.put("/staff/:staffId",      adminControllers.updateStaff);
adminRoute.delete("/staff/:staffId",   adminControllers.deleteStaff);

module.exports = adminRoute;