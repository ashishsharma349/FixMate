// const bcrypt = require("bcrypt");
// const path = require('path');
// const rootDir = require('../utils/pathUtil');
// const { validationResult } = require("express-validator");
// const Auth = require("../model/Auth");
// const User = require("../model/User");
// const Staff = require("../model/staff");

// exports.handlePost_login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const authUser = await Auth.findOne({ email }).select("+password");
//     if (!authUser) return res.status(401).json({ error: "Email not found" });

//     const isMatch = await bcrypt.compare(password, authUser.password);
//     if (!isMatch) return res.status(401).json({ error: "Invalid password" });

//     let profile;
//     if (authUser.role === "user") profile = await User.findOne({ authId: authUser._id });
//     else if (authUser.role === "staff") profile = await Staff.findOne({ authId: authUser._id });

//     req.session.user = {
//       id: authUser._id.toString(),
//       email: authUser.email,
//       role: authUser.role,
//       profileId: profile?._id.toString()
//     };
//     req.session.isLoggedIn = true;
//     req.session.save(err => {
//       if (err) return res.status(500).json({ session: "Could not save session", success: false });
//       return res.json({ success: true, role: authUser.role, message: "Logged in" });
//     });
    
//   } catch (err) {
//     res.status(500).send({ error: "Authentication Failed" });
//   }
// }

// exports.handle_logout = (req, res) => {
//   try{
//   req.session.destroy(err => {
//     if (err) console.log(err);
//     res.clearCookie('connect.sid', { path: "/" });
//     res.status(200).send("Successfully Logged Out");
//   });
//   }
//   catch(err){
//     console.log("[Session Destroy/ Logout Error]:",err);
//   }

// }

// async function Hash_password(password) {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash(password, salt);
// }

// exports.handlePost_signup = async (req, res) => {
//   console.log("[handlePost_signup] :",req.body);
//   try {
//     const { name, userType, age, email, contact, password, department } = req.body;
//     const existingAuth = await Auth.findOne({ email });
//     if (existingAuth) return res.status(409).json({ error: "Email already taken" });
//     console.log("Email Not Duplicate Done");
//     // console.log(password);
//     const hashedPassword = await Hash_password(password);
//     const authUser = await Auth.create({ email, password: hashedPassword, role: userType });
//     console.log("Hashing Password and Auth document Done");
//     if (userType === "user") {
//       await User.create({ authId: authUser._id, name, age, phone: contact });
//     console.log("User Created"); 
//     } else if (userType === "staff") {
//       await Staff.create({ authId: authUser._id, name, phone: contact, department });
//       console.log("Staff Created"); 
//     }
//     res.status(201).json({ msg: "User Created" });

//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: err });
//   }
// }

const bcrypt = require("bcrypt");
const path = require('path');
const rootDir = require('../utils/pathUtil');
const Auth = require("../model/Auth");
const User = require("../model/User");
const Staff = require("../model/staff");
const { sendTempPasswordMail } = require("../utils/mailer");

// ─── Helper: generate a random secure temp password ───────────────────────────
function generateTempPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@$!%*?&";
  const all = upper + lower + digits + special;

  // Guarantee at least one of each required type
  let pass =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)];

  // Fill remaining 4 characters from all
  for (let i = 0; i < 4; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return pass.split("").sort(() => Math.random() - 0.5).join("");
}

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}


// ─── LOGIN ────────────────────────────────────────────────────────────────────
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
      profileId: profile?._id.toString(),
      isFirstLogin: authUser.isFirstLogin   // frontend uses this to redirect to change-password page
    };
    req.session.isLoggedIn = true;

    req.session.save(err => {
      if (err) return res.status(500).json({ session: "Could not save session", success: false });
      return res.json({
        success: true,
        role: authUser.role,
        isFirstLogin: authUser.isFirstLogin,
        message: "Logged in"
      });
    });

  } catch (err) {
    res.status(500).json({ error: "Authentication Failed" });
  }
};


// ─── LOGOUT ───────────────────────────────────────────────────────────────────
exports.handle_logout = (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) console.log(err);
      res.clearCookie('connect.sid', { path: "/" });
      res.status(200).send("Successfully Logged Out");
    });
  } catch (err) {
    console.log("[Session Destroy/ Logout Error]:", err);
  }
};


// ─── ADMIN: CREATE USER OR STAFF ──────────────────────────────────────────────
// Only admin can hit this route (protected by isAdmin middleware)
exports.handlePost_createUser = async (req, res) => {
  console.log("[handlePost_createUser] :", req.body);
  try {
    const { name, userType, age, email, contact, department } = req.body;

    // Check duplicate email
    const existingAuth = await Auth.findOne({ email });
    if (existingAuth) return res.status(409).json({ error: "Email already registered" });

    // Generate and hash temp password
    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);

    // Create Auth record
    const authUser = await Auth.create({
      email,
      password: hashedPassword,
      role: userType,
      isFirstLogin: true
    });

    // Create profile record
    if (userType === "user") {
      await User.create({ authId: authUser._id, name, age, phone: contact });
    } else if (userType === "staff") {
      await Staff.create({ authId: authUser._id, name, phone: contact, department });
    }

    // Send temp password to their email
    await sendTempPasswordMail(email, name, tempPassword, userType);

    res.status(201).json({ msg: `${userType} account created. Temp password sent to ${email}.` });

  } catch (err) {
    console.log("[handlePost_createUser ERROR]:", err);
    res.status(500).json({ error: "Could not create account" });
  }
};


// ─── CHANGE PASSWORD (forced on first login, or voluntary) ───────────────────
exports.handlePost_changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const sessionUser = req.session.user;

    if (!sessionUser) return res.status(401).json({ error: "Not logged in" });

    const authUser = await Auth.findById(sessionUser.id).select("+password");
    if (!authUser) return res.status(404).json({ error: "User not found" });

    // Verify current/temp password
    const isMatch = await bcrypt.compare(currentPassword, authUser.password);
    if (!isMatch) return res.status(401).json({ error: "Current password is incorrect" });

    // Hash and save new password
    authUser.password = await hashPassword(newPassword);
    authUser.isFirstLogin = false;
    await authUser.save();

    // Update session
    req.session.user.isFirstLogin = false;
    req.session.save(err => {
      if (err) return res.status(500).json({ error: "Session update failed" });
      res.json({ success: true, message: "Password changed successfully" });
    });

  } catch (err) {
    console.log("[handlePost_changePassword ERROR]:", err);
    res.status(500).json({ error: "Could not change password" });
  }
};