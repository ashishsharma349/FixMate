const User = require("../model/User");
const Auth = require("../model/Auth");

class UserRepository {
  // Find all users populated with auth credentials
  async findAll() {
    return await User.find().populate("authId", "email role isFirstLogin");
  }

  // Find auth record by email
  async findByEmail(email) {
    return await Auth.findOne({ email });
  }

  // Create authentication credentials using a database session
  async createAuth(data, session) {
    return await Auth.create([data], { session }).then(res => res[0]);
  }

  // Create user profile using a database session
  async createUser(data, session) {
    return await User.create([data], { session }).then(res => res[0]);
  }

  // Find user profile by ID
  async findById(id) {
    return await User.findById(id);
  }

  // Update user profile by ID
  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  }

  // Update authentication credentials by ID
  async updateAuth(authId, updateData) {
    return await Auth.findByIdAndUpdate(authId, { $set: updateData }, { new: true });
  }

  // Delete user profile by ID
  async delete(id) {
    return await User.findByIdAndDelete(id);
  }

  // Delete authentication credentials by ID
  async deleteAuth(authId) {
    return await Auth.findByIdAndDelete(authId);
  }
}

module.exports = new UserRepository();
