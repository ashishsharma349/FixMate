const bcrypt = require("bcrypt");
const userRepository = require("../repositories/UserRepository");
const authRepository = require("../repositories/AuthRepository");
const generateTempPassword = require("../utils/passwordGenerator");
const withTransaction = require("../utils/transactionHelper");
const { sendTempPasswordMail } = require("../utils/mailer");

class UserService {
  // Retrieve all residents populated with authentication details
  async getAllUsers() {
    return await userRepository.findAll();
  }

  // Create a resident credentials and profile within a transaction
  async createUser(userData) {
    const { email, name, age, phone, contact, aadhaar, flatNumber } = userData;
    const phoneNum = phone || contact;

    if (!email || !name || !age || !phoneNum || !aadhaar) {
      const error = new Error("All fields required");
      error.statusCode = 400;
      throw error;
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      const error = new Error("Email already exists");
      error.statusCode = 409;
      throw error;
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const result = await withTransaction(async (session) => {
      const auth = await userRepository.createAuth(
        { email, password: hashedPassword, role: "user", isFirstLogin: true },
        session
      );
      const user = await userRepository.createUser(
        { authId: auth._id, name, age, phone: phoneNum, aadhaar, flatNumber: flatNumber || null },
        session
      );
      return { user, tempPassword };
    });

    try {
      await sendTempPasswordMail(email, name, result.tempPassword, "Resident");
    } catch (mailErr) {
      console.error("[UserService Mail Error]:", mailErr);
    }

    return result.user;
  }

  // Update user profile and associated authentication email
  async updateUser(userId, updateData) {
    const { name, age, phone, aadhaar, email, flatNumber } = updateData;

    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    if (email) {
      const currentAuth = await authRepository.findById(user.authId);
      if (currentAuth && currentAuth.email !== email) {
        const existing = await userRepository.findByEmail(email);
        if (existing) {
          const error = new Error("Email already in use");
          error.statusCode = 409;
          throw error;
        }
        await userRepository.updateAuth(user.authId, { email });
      }
    }

    const updatedUser = await userRepository.update(userId, { name, age, phone, aadhaar, flatNumber });
    return updatedUser;
  }

  // Remove user profile and associated credentials
  async deleteUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    await userRepository.delete(userId);
    await userRepository.deleteAuth(user.authId);
  }
}

module.exports = new UserService();
