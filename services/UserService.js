const bcrypt = require("bcrypt");
const userRepository = require("../repositories/UserRepository");
const authRepository = require("../repositories/AuthRepository");
const generateTempPassword = require("../utils/passwordGenerator");
const withTransaction = require("../utils/transactionHelper");
const { sendTempPasswordMail } = require("../utils/mailer");

class UserService {
  // Retrieve all residents populated with authentication details
  async getAllUsers() {
    try {
      return await userRepository.findAll();
    } catch (err) {
      const error = new Error("Failed to retrieve residents list");
      error.statusCode = 500;
      throw error;
    }
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

    try {
      const existing = await userRepository.findByEmail(email);
      if (existing) {
        const error = new Error("Email already exists");
        error.statusCode = 409;
        throw error;
      }
    } catch (err) {
      if (err.statusCode) throw err;
      const error = new Error("Error checking email availability");
      error.statusCode = 500;
      throw error;
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    let result;
    try {
      result = await withTransaction(async (session) => {
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
    } catch (err) {
      const error = new Error("Failed to create resident account: " + err.message);
      error.statusCode = err.statusCode || 500;
      throw error;
    }

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

    let user;
    try {
      user = await userRepository.findById(userId);
    } catch (err) {
      const error = new Error("Error retrieving user profile");
      error.statusCode = 500;
      throw error;
    }

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    try {
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
    } catch (err) {
      if (err.statusCode) throw err;
      const error = new Error("Failed to update user profile");
      error.statusCode = 500;
      throw error;
    }
  }

  // Remove user profile and associated credentials
  async deleteUser(userId) {
    let user;
    try {
      user = await userRepository.findById(userId);
    } catch (err) {
      const error = new Error("Error retrieving user profile for deletion");
      error.statusCode = 500;
      throw error;
    }

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    try {
      await userRepository.delete(userId);
      await userRepository.deleteAuth(user.authId);
    } catch (err) {
      const error = new Error("Failed to delete user account");
      error.statusCode = 500;
      throw error;
    }
  }
}

module.exports = new UserService();
