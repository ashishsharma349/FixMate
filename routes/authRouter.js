const express = require("express");
const authRouter = express.Router();
const authController = require('../controller/auth.js');
const { verifyToken } = require('../middleware/jwtMiddleware');

authRouter.post('/login', express.json(), authController.handlePost_login);
authRouter.post('/logout', authController.handle_logout);

// Change password (first login forced change, or voluntary)
authRouter.post('/change-password', verifyToken, express.json(), authController.handlePost_changePassword);

module.exports = authRouter;