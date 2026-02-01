const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AuthSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false // doesn't return this field by default
  },
  role: {
    type: String,
    enum: ["user", "staff", "admin"],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

module.exports = mongoose.model("Auth", AuthSchema);
