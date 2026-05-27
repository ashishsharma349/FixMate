const Staff = require("../model/staff");
const Auth = require("../model/Auth");

class StaffRepository {
  // Find all staff populated with auth credentials
  async findAll() {
    return await Staff.find().populate("authId", "email role isFirstLogin");
  }

  // Find auth record by email
  async findByEmail(email) {
    return await Auth.findOne({ email });
  }

  // Create authentication credentials using a database session
  async createAuth(data, session) {
    return await Auth.create([data], { session }).then(res => res[0]);
  }

  // Create staff profile using a database session
  async createStaff(data, session) {
    return await Staff.create([data], { session }).then(res => res[0]);
  }

  // Find staff profile by ID
  async findById(id) {
    return await Staff.findById(id);
  }

  // Update staff profile by ID
  async update(id, updateData, session = null) {
    const options = { new: true };
    if (session) {
      options.session = session;
    }
    return await Staff.findByIdAndUpdate(id, { $set: updateData }, options);
  }

  // Update many staff profiles
  async updateMany(filter, updateData, session = null) {
    const options = {};
    if (session) {
      options.session = session;
    }
    return await Staff.updateMany(filter, updateData, options);
  }

  // Update authentication credentials by ID
  async updateAuth(authId, updateData) {
    return await Auth.findByIdAndUpdate(authId, { $set: updateData }, { new: true });
  }

  // Delete staff profile by ID
  async delete(id) {
    return await Staff.findByIdAndDelete(id);
  }

  // Delete authentication credentials by ID
  async deleteAuth(authId) {
    return await Auth.findByIdAndDelete(authId);
  }
}

module.exports = new StaffRepository();
