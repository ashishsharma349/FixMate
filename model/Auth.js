// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const AuthSchema = new Schema({
//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   password: {
//     type: String,
//     required: true,
//     select: false // doesn't return this field by default
//   },
//   role: {
//     type: String,
//     enum: ["user", "staff", "admin"],
//     required: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//     immutable: true
//   }
// });

// module.exports = mongoose.model("Auth", AuthSchema);
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
    select: false
  },
  role: {
    type: String,
    enum: ["user", "staff", "admin"],
    required: true
  },
  isFirstLogin: {
    type: Boolean,
    default: true   // true = must change password on next login
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

module.exports = mongoose.model("Auth", AuthSchema);