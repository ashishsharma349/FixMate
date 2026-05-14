const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  // The hashed refresh token (never store raw tokens)
  tokenHash: { type: String, required: true, index: true },

  // Which user this token belongs to
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Auth", required: true, index: true },

  // Unique token identifier for rotation tracking
  jti: { type: String, required: true, unique: true },

  // Auto-expire: MongoDB TTL index deletes expired docs automatically
  expiresAt: { type: Date, required: true, index: { expires: 0 } },

  // Metadata
  createdAt: { type: Date, default: Date.now },
  userAgent: { type: String, default: "" },
  ip: { type: String, default: "" },
});

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
