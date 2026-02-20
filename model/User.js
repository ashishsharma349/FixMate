// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const UserSchema = new Schema({
//   authId: {
//     type: Schema.Types.ObjectId,
//     ref: "Auth",
//     required: true,
//     unique: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   age: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   phone: { // renamed 
//     type: String,
//     required: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//     immutable: true
//   }
// });

// // module.exports = mongoose.model("User", UserSchema);
// module.exports = mongoose.models.User || mongoose.model("User", UserSchema);

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
  // Added your new requirements
  aadhaar: { 
    type: String, 
    required: true, 
    unique: true 
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