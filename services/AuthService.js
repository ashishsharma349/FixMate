const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const authRepository = require("../repositories/AuthRepository");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing");
}
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET environment variable is missing");
}
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
    try {
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
    } catch (err) {
      const error = new Error("Failed to issue session token credentials: " + err.message);
      error.statusCode = 500;
      throw error;
    }
  }

  // Authenticate user login credentials
  async login(email, password, ip, userAgent) {
    let authUser;
    try {
      authUser = await authRepository.findByEmailWithPassword(email);
    } catch (err) {
      const error = new Error("Database query failed during authentication");
      error.statusCode = 500;
      throw error;
    }

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

    let profile;
    try {
      profile = await authRepository.findProfile(authUser._id, authUser.role);
    } catch (err) {
      const error = new Error("Failed to retrieve user profile details");
      error.statusCode = 500;
      throw error;
    }

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
    
    let storedToken;
    try {
      storedToken = await authRepository.findRefreshToken(tokenHash, decoded.jti);
    } catch (err) {
      const error = new Error("Error querying session token registry");
      error.statusCode = 500;
      throw error;
    }

    if (!storedToken) {
      try {
        await authRepository.deleteAllRefreshTokensForUser(decoded.id);
      } catch (err) {
        console.error("[Session Purge Failure]:", err);
      }
      const error = new Error("Token reuse detected. All sessions revoked.");
      error.statusCode = 401;
      error.clearCookie = true;
      error.userId = decoded.id;
      throw error;
    }

    try {
      await authRepository.deleteRefreshTokenById(storedToken._id);
    } catch (err) {
      const error = new Error("Failed to clear old refresh session");
      error.statusCode = 500;
      throw error;
    }

    let authUser;
    try {
      authUser = await authRepository.findById(decoded.id);
    } catch (err) {
      const error = new Error("Error fetching account record");
      error.statusCode = 500;
      throw error;
    }

    if (!authUser) {
      const error = new Error("User no longer exists");
      error.statusCode = 401;
      throw error;
    }

    let profile;
    try {
      profile = await authRepository.findProfile(authUser._id, authUser.role);
    } catch (err) {
      const error = new Error("Failed to retrieve profile record");
      error.statusCode = 500;
      throw error;
    }

    const { accessToken, refreshToken } = await this.issueTokenPair(authUser, profile, ip, userAgent);

    return { token: accessToken, refreshToken };
  }

  // Revoke user refresh token on logout
  async logout(refreshToken) {
    if (refreshToken) {
      try {
        const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
        await authRepository.deleteRefreshToken(tokenHash);
      } catch (err) {
        const error = new Error("Failed to revoke session token on database");
        error.statusCode = 500;
        throw error;
      }
    }
  }

  // Hash and update user password
  async changePassword(userId, currentPassword, newPassword) {
    let authUser;
    try {
      authUser = await authRepository.findByIdWithPassword(userId);
    } catch (err) {
      const error = new Error("Error fetching credentials profile");
      error.statusCode = 500;
      throw error;
    }

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

    try {
      authUser.password = await bcrypt.hash(newPassword, 10);
      authUser.isFirstLogin = false;
      await authUser.save();
    } catch (err) {
      const error = new Error("Failed to update password settings");
      error.statusCode = 500;
      throw error;
    }

    let profile;
    try {
      profile = await authRepository.findProfile(authUser._id, authUser.role);
    } catch (err) {
      const error = new Error("Failed to load authenticated profile");
      error.statusCode = 500;
      throw error;
    }

    const payload = this.buildTokenPayload(authUser, profile);
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });

    return { token: newAccessToken };
  }
}

module.exports = new AuthService();
