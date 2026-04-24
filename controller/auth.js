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

  let pass =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)];

  for (let i = 0; i < 4; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }

  return pass.split("").sort(() => Math.random() - 0.5).join("");
}

// ─── LOGIN (plain text password comparison for demo) ─────────────────────────
exports.handlePost_login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const authUser = await Auth.findOne({ email }).select("+password");
    if (!authUser) return res.status(401).json({ error: "Email not found" });

    // SUPPORT BOTH BCRYPT HASHES AND PLAIN TEXT (For demo flexibility)
    const isMatch = await bcrypt.compare(password, authUser.password);
    const isPlainMatch = password === authUser.password;

    if (!isMatch && !isPlainMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    let profile;
    if (authUser.role === "user") profile = await User.findOne({ authId: authUser._id });
    else if (authUser.role === "staff") profile = await Staff.findOne({ authId: authUser._id });

    req.session.user = {
      id: authUser._id.toString(),
      email: authUser.email,
      role: authUser.role,
      profileId: profile?._id.toString(),
      isFirstLogin: authUser.isFirstLogin
    };
    req.session.isLoggedIn = true;

    req.session.save(err => {
      if (err) return res.status(500).json({ session: "Could not save session", success: false });
      return res.json({
        success: true,
        role: authUser.role,
        isFirstLogin: authUser.isFirstLogin,
        sessionId: req.sessionID, // 
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

// ─── ADMIN: CREATE USER OR STAFF (plain text password for demo) ──────────────
exports.handlePost_createUser = async (req, res) => {
  try {
    const { name, userType, age, email, contact, phone, aadhaar, department } = req.body;
    const phoneNum = phone || contact;

    if (!name || !userType || !email || !phoneNum) {
      return res.status(400).json({ error: "Name, userType, email and phone are required" });
    }
    if (userType === "user" && !age) {
      return res.status(400).json({ error: "Age is required for residents" });
    }
    if (userType === "staff" && !department) {
      return res.status(400).json({ error: "Department is required for staff" });
    }

    const existingAuth = await Auth.findOne({ email });
    if (existingAuth) return res.status(409).json({ error: "Email already registered" });

    const tempPassword = generateTempPassword();

    // Store plain text password (for demo — easy to remember)
    const authUser = await Auth.create({
      email,
      password: tempPassword,
      role: userType,
      isFirstLogin: true
    });

    try {
      if (userType === "user") {
        await User.create({
          authId: authUser._id,
          name,
          age,
          phone: phoneNum,
          aadhaar,
          email
        });
      } else if (userType === "staff") {
        await Staff.create({
          authId: authUser._id,
          name,
          phone: phoneNum,
          department,
          aadhaar
        });
      }
    } catch (profileError) {
      await Auth.findByIdAndDelete(authUser._id);
      console.log("[ROLLBACK]: Auth record deleted due to profile error");
      throw profileError;
    }

    await sendTempPasswordMail(email, name, tempPassword, userType);

    res.status(201).json({ msg: `${userType} account created successfully.` });

  } catch (err) {
    console.log("[handlePost_createUser ERROR]:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: "Validation Failed: " + err.message });
    }
    res.status(500).json({ error: "Could not create account: " + err.message });
  }
};

// ─── CHANGE PASSWORD (plain text for demo) ───────────────────────────────────
exports.handlePost_changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const sessionUser = req.session.user;

    if (!sessionUser) return res.status(401).json({ error: "Not logged in" });

    const authUser = await Auth.findById(sessionUser.id).select("+password");
    if (!authUser) return res.status(404).json({ error: "User not found" });

    // Plain text comparison
    if (currentPassword !== authUser.password)
      return res.status(401).json({ error: "Current password is incorrect" });

    authUser.password = newPassword;
    authUser.isFirstLogin = false;
    await authUser.save();

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