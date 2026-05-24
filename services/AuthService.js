const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const authRepository = require("../repositories/AuthRepository");

const JWT_SECRET = process.env.JWT_SECRET || "fxm_acc_fallback";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "fxm_ref_fallback";
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

class AuthService {
  // Build JWT payload for access tokens
  buildTokenPayload(authUser, profile) {
    return {
      id: authUser._id.toString(),
      email: authUser.email,
      role: authUser.role,
      profileId: profile ? profile._id.toString() : null,
      isFirstLogin: authUser.isFirstLogin,
    };
  }

  // Generate access and refresh token pair
  async issueTokenPair(authUser, profile, ip, userAgent) {
    const payload = this.buildTokenPayload(authUser, profile);

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });

    const jti = crypto.randomUUID();
    const refreshToken = jwt.sign({ id: payload.id, jti }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });

    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    
    await authRepository.createRefreshToken({
      tokenHash,
      userId: authUser._id,
      jti,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: userAgent || "",
      ip: ip || "",
    });

    return { accessToken, refreshToken, payload };
  }

  // Authenticate user login credentials
  async login(email, password, ip, userAgent) {
    const authUser = await authRepository.findByEmailWithPassword(email);
    if (!authUser) {
      const error = new Error("Email not found");
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, authUser.password);
    if (!isMatch) {
      const error = new Error("Invalid password");
      error.statusCode = 401;
      throw error;
    }

    const profile = await authRepository.findProfile(authUser._id, authUser.role);
    const { accessToken, refreshToken, payload } = await this.issueTokenPair(authUser, profile, ip, userAgent);

    return {
      token: accessToken,
      refreshToken,
      role: payload.role,
      isFirstLogin: payload.isFirstLogin,
    };
  }

  // Validate and rotate refresh token
  async refresh(oldRefreshToken, ip, userAgent) {
    let decoded;
    try {
      decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET);
    } catch (err) {
      const error = new Error("Invalid or expired refresh token");
      error.statusCode = 401;
      throw error;
    }

    const tokenHash = crypto.createHash("sha256").update(oldRefreshToken).digest("hex");
    const storedToken = await authRepository.findRefreshToken(tokenHash, decoded.jti);

    if (!storedToken) {
      await authRepository.deleteAllRefreshTokensForUser(decoded.id);
      const error = new Error("Token reuse detected. All sessions revoked.");
      error.statusCode = 401;
      error.clearCookie = true;
      error.userId = decoded.id;
      throw error;
    }

    await authRepository.deleteRefreshTokenById(storedToken._id);

    const authUser = await authRepository.findById(decoded.id);
    if (!authUser) {
      const error = new Error("User no longer exists");
      error.statusCode = 401;
      throw error;
    }

    const profile = await authRepository.findProfile(authUser._id, authUser.role);
    const { accessToken, refreshToken } = await this.issueTokenPair(authUser, profile, ip, userAgent);

    return { token: accessToken, refreshToken };
  }

  // Revoke user refresh token on logout
  async logout(refreshToken) {
    if (refreshToken) {
      const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      await authRepository.deleteRefreshToken(tokenHash);
    }
  }

  // Hash and update user password
  async changePassword(userId, currentPassword, newPassword) {
    const authUser = await authRepository.findByIdWithPassword(userId);
    if (!authUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, authUser.password);
    if (!isMatch) {
      const error = new Error("Current password is incorrect");
      error.statusCode = 401;
      throw error;
    }

    authUser.password = await bcrypt.hash(newPassword, 10);
    authUser.isFirstLogin = false;
    await authUser.save();

    const profile = await authRepository.findProfile(authUser._id, authUser.role);
    const payload = this.buildTokenPayload(authUser, profile);
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });

    return { token: newAccessToken };
  }
}

module.exports = new AuthService();
