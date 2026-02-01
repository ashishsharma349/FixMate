const express=require("express");
const authRouter=express.Router();
const authController=require('../controller/auth.js');
const {signupRules,validate}= require("../middleware/validator.js")

// authRouter.get('/signup',authController.handleGet_signup);


authRouter.post('/signup',express.json(),signupRules,validate,authController.handlePost_signup);
authRouter.post('/login',express.json(),authController.handlePost_login);
authRouter.post('/logout', authController.handle_logout);


module.exports=authRouter;