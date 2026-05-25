const bcrypt = require("bcrypt");
const staffRepository = require("../repositories/StaffRepository");
const authRepository = require("../repositories/AuthRepository");
const generateTempPassword = require("../utils/passwordGenerator");
const withTransaction = require("../utils/transactionHelper");
const { sendTempPasswordMail } = require("../utils/mailer");

class StaffService {
  // Retrieve all staff members populated with authentication details
  async getAllStaff() {
    return await staffRepository.findAll();
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

    const existing = await staffRepository.findByEmail(email);
    if (existing) {
      const error = new Error("Email already exists");
      error.statusCode = 409;
      throw error;
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const result = await withTransaction(async (session) => {
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

    const staff = await staffRepository.findById(staffId);
    if (!staff) {
      const error = new Error("Staff not found");
      error.statusCode = 404;
      throw error;
    }

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
  }

  // Remove staff profile and associated credentials
  async deleteStaff(staffId) {
    const staff = await staffRepository.findById(staffId);
    if (!staff) {
      const error = new Error("Staff not found");
      error.statusCode = 404;
      throw error;
    }

    await staffRepository.delete(staffId);
    await staffRepository.deleteAuth(staff.authId);
  }
}

module.exports = new StaffService();
