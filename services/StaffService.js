const bcrypt = require("bcrypt");
const staffRepository = require("../repositories/StaffRepository");
const authRepository = require("../repositories/AuthRepository");
const generateTempPassword = require("../utils/passwordGenerator");
const withTransaction = require("../utils/transactionHelper");
const { sendTempPasswordMail } = require("../utils/mailer");

class StaffService {
  // Retrieve all staff members populated with authentication details
  async getAllStaff() {
    try {
      return await staffRepository.findAll();
    } catch (err) {
      const error = new Error("Failed to retrieve staff list");
      error.statusCode = 500;
      throw error;
    }
  }

  // Create a staff credentials and profile within a transaction
  async createStaff(staffData) {
    const { email, name, phone, contact, department, aadhaar } = staffData;
    const phoneNum = phone || contact;

    if (!email || !name || !phoneNum || !department) {
      const error = new Error("All fields required");
      error.statusCode = 400;
      throw error;
    }

    try {
      const existing = await staffRepository.findByEmail(email);
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
        const auth = await staffRepository.createAuth(
          { email, password: hashedPassword, role: "staff", isFirstLogin: true },
          session
        );
        const staff = await staffRepository.createStaff(
          { authId: auth._id, name, phone: phoneNum, department, aadhaar },
          session
        );
        return { staff, tempPassword };
      });
    } catch (err) {
      const error = new Error("Failed to create staff account: " + err.message);
      error.statusCode = err.statusCode || 500;
      throw error;
    }

    try {
      await sendTempPasswordMail(email, name, result.tempPassword, "Staff");
    } catch (mailErr) {
      console.error("[StaffService Mail Error]:", mailErr);
    }

    return result.staff;
  }

  // Update staff profile and associated authentication email
  async updateStaff(staffId, updateData) {
    const { name, phone, department, aadhaar, email, isAvailable } = updateData;

    let staff;
    try {
      staff = await staffRepository.findById(staffId);
    } catch (err) {
      const error = new Error("Error retrieving staff profile");
      error.statusCode = 500;
      throw error;
    }

    if (!staff) {
      const error = new Error("Staff not found");
      error.statusCode = 404;
      throw error;
    }

    try {
      if (email) {
        const currentAuth = await authRepository.findById(staff.authId);
        if (currentAuth && currentAuth.email !== email) {
          const existing = await staffRepository.findByEmail(email);
          if (existing) {
            const error = new Error("Email already in use");
            error.statusCode = 409;
            throw error;
          }
          await staffRepository.updateAuth(staff.authId, { email });
        }
      }

      const updatedStaff = await staffRepository.update(staffId, { name, phone, department, aadhaar, isAvailable });
      return updatedStaff;
    } catch (err) {
      if (err.statusCode) throw err;
      const error = new Error("Failed to update staff profile");
      error.statusCode = 500;
      throw error;
    }
  }

  // Remove staff profile and associated credentials
  async deleteStaff(staffId) {
    let staff;
    try {
      staff = await staffRepository.findById(staffId);
    } catch (err) {
      const error = new Error("Error retrieving staff profile for deletion");
      error.statusCode = 500;
      throw error;
    }

    if (!staff) {
      const error = new Error("Staff not found");
      error.statusCode = 404;
      throw error;
    }

    try {
      await staffRepository.delete(staffId);
      await staffRepository.deleteAuth(staff.authId);
    } catch (err) {
      const error = new Error("Failed to delete staff account");
      error.statusCode = 500;
      throw error;
    }
  }
}

module.exports = new StaffService();
