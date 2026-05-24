const Auth = require("../model/Auth");
const User = require("../model/User");
const Staff = require("../model/staff");
const RefreshToken = require("../model/RefreshToken");

class AuthRepository {
  async findByEmailWithPassword(email) {
    return await Auth.findOne({ email }).select("+password");
  }

  async findById(id) {
    return await Auth.findById(id);
  }

  async findByIdWithPassword(id) {
    return await Auth.findById(id).select("+password");
  }

  async findProfile(authId, role) {
    if (role === "user") {
      return await User.findOne({ authId });
    } else if (role === "staff") {
      return await Staff.findOne({ authId });
    }
    return null;
  }

  async createRefreshToken(data) {
    return await RefreshToken.create(data);
  }

  async findRefreshToken(tokenHash, jti) {
    return await RefreshToken.findOne({ tokenHash, jti });
  }

  async deleteRefreshToken(tokenHash) {
    return await RefreshToken.deleteOne({ tokenHash });
  }

  async deleteRefreshTokenById(id) {
    return await RefreshToken.deleteOne({ _id: id });
  }

  async deleteAllRefreshTokensForUser(userId) {
    return await RefreshToken.deleteMany({ userId });
  }
}

module.exports = new AuthRepository();
