const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  authId: {
    type: Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 0
  },
  phone: {
    type: String,
    required: true
  },
  aadhaar: {
    type: String,
    required: true,
    unique: true
  },
  flatNumber: {
    type: String,
    default: null
  },
  photo: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);