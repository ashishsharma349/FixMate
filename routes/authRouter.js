// const express=require("express");
// const authRouter=express.Router();
// const authController=require('../controller/auth.js');
// const {signupRules,validate}= require("../middleware/validator.js")


// authRouter.post('/signup',express.json(),signupRules,validate,authController.handlePost_signup);
// authRouter.post('/login',express.json(),authController.handlePost_login);
// authRouter.post('/logout', authController.handle_logout);


// module.exports=authRouter;

const express = require("express");
const authRouter = express.Router();
const authController = require('../controller/auth.js');
const { validate } = require("../middleware/validator.js");
const { isAdmin } = require("../middleware/authMiddleware.js");

authRouter.post('/login', express.json(), authController.handlePost_login);
authRouter.post('/logout', authController.handle_logout);

// Admin-only: create a new user or staff account
authRouter.post('/admin/create-user', express.json(), isAdmin, validate, authController.handlePost_createUser);

// Change password (first login forced change, or voluntary)
authRouter.post('/change-password', express.json(), authController.handlePost_changePassword);

module.exports = authRouter;