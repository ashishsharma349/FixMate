const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authRepository = require("../repositories/AuthRepository");

class AdminService {
  // Update admin credentials (email and password securely) and return a new token
  async updateProfile(adminId, updateData) {
    const { email, currentPassword, newPassword } = updateData;

    const auth = await authRepository.findByIdWithPassword(adminId);
    if (!auth) {
      const error = new Error("Admin not found");
      error.statusCode = 404;
      throw error;
    }

    if (email && email !== auth.email) {
      const exists = await authRepository.findByEmailWithPassword(email);
      if (exists) {
        const error = new Error("Email already in use");
        error.statusCode = 409;
        throw error;
      }
      auth.email = email;
    }

    if (newPassword) {
      if (!currentPassword) {
        const error = new Error("Current password required");
        error.statusCode = 400;
        throw error;
      }
      const isMatch = await bcrypt.compare(currentPassword, auth.password);
      if (!isMatch) {
        const error = new Error("Current password is incorrect");
        error.statusCode = 401;
        throw error;
      }
      auth.password = await bcrypt.hash(newPassword, 10);
    }

    await auth.save();

    const payload = {
      id: auth._id.toString(),
      email: auth.email,
      role: auth.role,
      profileId: null,
      isFirstLogin: auth.isFirstLogin
    };

    const JWT_SECRET = process.env.JWT_SECRET || "fxm_acc_fallback";
    const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });

    return { token: newToken };
  }
}

module.exports = new AdminService();
