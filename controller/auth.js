const bcrypt = require("bcrypt");
const path = require('path');
const rootDir = require('../utils/pathUtil');
const { validationResult } = require("express-validator");
const Auth = require("../model/Auth");
const User = require("../model/User");
const Staff = require("../model/staff");

exports.handlePost_login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const authUser = await Auth.findOne({ email }).select("+password");
    if (!authUser) return res.status(401).json({ error: "Email not found" });

    const isMatch = await bcrypt.compare(password, authUser.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    let profile;
    if (authUser.role === "user") profile = await User.findOne({ authId: authUser._id });
    else if (authUser.role === "staff") profile = await Staff.findOne({ authId: authUser._id });

    req.session.user = {
      id: authUser._id.toString(),
      email: authUser.email,
      role: authUser.role,
      profileId: profile?._id.toString()
    };
    req.session.isLoggedIn = true;
    req.session.save(err => {
      if (err) return res.status(500).json({ session: "Could not save session", success: false });
      return res.json({ success: true, role: authUser.role, message: "Logged in" });
    });
    
  } catch (err) {
    res.status(500).send({ error: "Authentication Failed" });
  }
}

exports.handle_logout = (req, res) => {
  try{
  req.session.destroy(err => {
    if (err) console.log(err);
    res.clearCookie('connect.sid', { path: "/" });
    res.status(200).send("Successfully Logged Out");
  });
  }
  catch(err){
    console.log("[Session Destroy/ Logout Error]:",err);
  }

}

async function Hash_password(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

exports.handlePost_signup = async (req, res) => {
  console.log("[handlePost_signup] :",req.body);
  try {
    const { name, userType, age, email, contact, password, department } = req.body;
    const existingAuth = await Auth.findOne({ email });
    if (existingAuth) return res.status(409).json({ error: "Email already taken" });
    console.log("Email Not Duplicate Done");
    // console.log(password);
    const hashedPassword = await Hash_password(password);
    const authUser = await Auth.create({ email, password: hashedPassword, role: userType });
    console.log("Hashing Password and Auth document Done");
    if (userType === "user") {
      await User.create({ authId: authUser._id, name, age, phone: contact });
    console.log("User Created"); 
    } else if (userType === "staff") {
      await Staff.create({ authId: authUser._id, name, phone: contact, department });
      console.log("Staff Created"); 
    }
    res.status(201).json({ msg: "User Created" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err });
  }
}

