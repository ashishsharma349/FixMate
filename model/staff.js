// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const StaffSchema = new Schema({
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
//   phone: {
//     type: String,
//     required: true
//   },
//   department: {
//     type: String,
//     required: true,
//     enum: ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Security'],
//     default: 'Cleaning'
//   },
//   isAvailable: {
//     type: Boolean,
//     default: true,
//     index: true
//   },
//   rating: {
//     type: Number,
//     default: 3,
//     min: 1,
//     max: 5
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//     immutable: true
//   }
// });

// module.exports = mongoose.model("Staff", StaffSchema);

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StaffSchema = new Schema({
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
  phone: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Security'],
    default: 'Cleaning'
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
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },
  rating: {
    type: Number,
    default: 3,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  }
});

module.exports = mongoose.models.Staff || mongoose.model("Staff", StaffSchema);