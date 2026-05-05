const express = require("express");
const router = express.Router();
const announcementController = require("../controller/announcement");
const { isLoggedIn, isAdmin } = require("../middleware/authMiddleware");

// All routes require login
router.use(isLoggedIn);

// Get announcements (available to everyone)
router.get("/announcements", announcementController.handleGet_allAnnouncements);

// Admin only routes
router.post("/announcements", isAdmin, announcementController.handlePost_createAnnouncement);
router.delete("/announcements/:id", isAdmin, announcementController.handleDelete_announcement);

module.exports = router;
