const bcrypt = require("bcrypt");
const path = require('path');
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const rootDir = require('../utils/pathUtil');
const Auth = require("../model/Auth");
const User = require("../model/User");
const Staff = require("../model/staff");
const RefreshToken = require("../model/RefreshToken");
const { sendTempPasswordMail } = require("../utils/mailer");

const JWT_SECRET = process.env.JWT_SECRET || "fxm_acc_fallback";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fxm_ref_fallback";
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

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

// ─── Helper: build JWT payload ────────────────────────────────────────────────
function buildTokenPayload(authUser, profile) {
  return {
    id: authUser._id.toString(),
    email: authUser.email,
    role: authUser.role,
    profileId: profile?._id?.toString() || null,
    isFirstLogin: authUser.isFirstLogin,
  };
}

// ─── Helper: issue access + refresh tokens ────────────────────────────────────
async function issueTokenPair(authUser, profile, req, res) {
  const payload = buildTokenPayload(authUser, profile);

  // Access token (short-lived, sent in response body)
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });

  // Refresh token (long-lived, stored in httpOnly cookie)
  const jti = crypto.randomUUID();
  const refreshToken = jwt.sign({ id: payload.id, jti }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });

  // Hash and store refresh token in DB
  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
  await RefreshToken.create({
    tokenHash,
    userId: authUser._id,
    jti,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    userAgent: req.headers["user-agent"] || "",
    ip: req.ip || "",
  });

  // Set refresh token as httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,       // Set to true in production with HTTPS
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  return { accessToken, payload };
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
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

    const { accessToken, payload } = await issueTokenPair(authUser, profile, req, res);

    return res.json({
      success: true,
      token: accessToken,
      role: payload.role,
      isFirstLogin: payload.isFirstLogin,
      message: "Logged in",
    });

  } catch (err) {
    console.error("[handlePost_login ERROR]:", err);
    res.status(500).json({ error: "Authentication Failed" });
  }
};

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
exports.handlePost_refresh = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      return res.status(401).json({ error: "No refresh token" });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    // Find and validate in DB
    const tokenHash = crypto.createHash("sha256").update(oldRefreshToken).digest("hex");
    const storedToken = await RefreshToken.findOne({ tokenHash, jti: decoded.jti });

    if (!storedToken) {
      // Token reuse detected — revoke ALL tokens for this user (security measure)
      await RefreshToken.deleteMany({ userId: decoded.id });
      res.clearCookie("refreshToken", { path: "/" });
      return res.status(401).json({ error: "Token reuse detected. All sessions revoked." });
    }

    // Delete old token (rotation: one-time use)
    await RefreshToken.deleteOne({ _id: storedToken._id });

    // Fetch fresh user data
    const authUser = await Auth.findById(decoded.id);
    if (!authUser) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    let profile;
    if (authUser.role === "user") profile = await User.findOne({ authId: authUser._id });
    else if (authUser.role === "staff") profile = await Staff.findOne({ authId: authUser._id });

    // Issue new token pair
    const { accessToken } = await issueTokenPair(authUser, profile, req, res);

    return res.json({ success: true, token: accessToken });

  } catch (err) {
    console.error("[handlePost_refresh ERROR]:", err);
    res.status(500).json({ error: "Token refresh failed" });
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
exports.handle_logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      // Revoke refresh token from DB
      const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      await RefreshToken.deleteOne({ tokenHash });
    }

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", { path: "/" });
    res.status(200).json({ message: "Successfully Logged Out" });
  } catch (err) {
    console.error("[Logout Error]:", err);
    res.status(500).json({ error: "Logout failed" });
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
    const tokenUser = req.user; // From JWT middleware

    if (!tokenUser) return res.status(401).json({ error: "Not logged in" });

    const authUser = await Auth.findById(tokenUser.id).select("+password");
    if (!authUser) return res.status(404).json({ error: "User not found" });

    // Plain text comparison
    if (currentPassword !== authUser.password)
      return res.status(401).json({ error: "Current password is incorrect" });

    authUser.password = newPassword;
    authUser.isFirstLogin = false;
    await authUser.save();

    // Issue a fresh access token with updated isFirstLogin
    let profile;
    if (authUser.role === "user") profile = await User.findOne({ authId: authUser._id });
    else if (authUser.role === "staff") profile = await Staff.findOne({ authId: authUser._id });

    const payload = buildTokenPayload(authUser, profile);
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });

    res.json({ success: true, message: "Password changed successfully", token: newAccessToken });

  } catch (err) {
    console.log("[handlePost_changePassword ERROR]:", err);
    res.status(500).json({ error: "Could not change password" });
  }
};