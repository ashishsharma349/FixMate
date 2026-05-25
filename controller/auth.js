const authService = require("../services/AuthService");
const generateTempPassword = require("../utils/passwordGenerator");
const Auth = require("../model/Auth");
const User = require("../model/User");
const Staff = require("../model/staff");
const { sendTempPasswordMail } = require("../utils/mailer");
const bcrypt = require("bcrypt");

// Handle resident and staff authentication
exports.handlePost_login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"] || "";

    const result = await authService.login(email, password, ip, userAgent);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({
      success: true,
      token: result.token,
      role: result.role,
      isFirstLogin: result.isFirstLogin,
      message: "Logged in",
    });
  } catch (err) {
    console.error("[handlePost_login ERROR]:", err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message || "Authentication Failed" });
  }
};

// Handle token refresh and rotation
exports.handlePost_refresh = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      return res.status(401).json({ error: "No refresh token" });
    }

    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"] || "";

    const result = await authService.refresh(oldRefreshToken, ip, userAgent);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.json({ success: true, token: result.token });
  } catch (err) {
    console.error("[handlePost_refresh ERROR]:", err);
    if (err.clearCookie) {
      res.clearCookie("refreshToken", { path: "/" });
    }
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message || "Token refresh failed" });
  }
};

// Handle logging out and removing refresh tokens
exports.handlePost_logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(refreshToken);

    res.clearCookie("refreshToken", { path: "/" });
    res.status(200).json({ message: "Successfully Logged Out" });
  } catch (err) {
    console.error("[Logout Error]:", err);
    res.status(500).json({ error: "Logout failed" });
  }
};
exports.handle_logout = exports.handlePost_logout;
// Handle changing passwords for authenticated users
exports.handlePost_changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const tokenUser = req.user;

    if (!tokenUser) return res.status(401).json({ error: "Not logged in" });

    const result = await authService.changePassword(tokenUser.id, currentPassword, newPassword);

    res.json({ success: true, message: "Password changed successfully", token: result.token });
  } catch (err) {
    console.error("[handlePost_changePassword ERROR]:", err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ error: err.message || "Could not change password" });
  }
};

// Temporary endpoint for creating resident or staff accounts
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
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const authUser = await Auth.create({
      email,
      password: hashedPassword,
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