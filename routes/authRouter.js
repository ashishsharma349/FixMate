const express = require("express");
const authRouter = express.Router();
const authController = require('../controller/auth.js');

authRouter.post('/login', express.json(), authController.handlePost_login);
authRouter.post('/logout', authController.handle_logout);

// Change password (first login forced change, or voluntary)
authRouter.post('/change-password', express.json(), authController.handlePost_changePassword);

module.exports = authRouter;