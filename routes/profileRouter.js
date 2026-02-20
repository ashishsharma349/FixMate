const express = require("express");
const profileRouter = express.Router();
const profileController = require("../controller/profile");
const { isLoggedIn } = require("../middleware/authMiddleware");
const upload = require("../config/multerconfig");
const userController = require("../controller/user");

// Get profile data
profileRouter.get("/", isLoggedIn, profileController.getProfile);

// Upload profile photo
profileRouter.post("/photo", isLoggedIn, upload.single("photo"), userController.handleProfilePhotoUpload);

module.exports = profileRouter;