const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();

// Models
const Auth = require("./model/Auth");
const User = require("./model/User");
const Staff = require("./model/staff");
const Payment = require("./model/Payment");
const Complain = require("./model/Complain");
const Inventory = require("./model/Inventory");

const { ObjectId } = mongoose.Types;

const LOCAL_URI = process.env.MONGO_URI;

if (LOCAL_URI.includes("cluster0")) {
    console.error("ERROR: .env still contains Atlas URI. Please change to local MongoDB before running this.");
    process.exit(1);
}

const rawData = fs.readFileSync("atlas_data.json");
let data = JSON.parse(rawData);

// Function to recursively convert string IDs to ObjectId
function convertIds(obj) {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map(convertIds);
  if (typeof obj === 'object') {
    for (let key in obj) {
      if (typeof obj[key] === 'string' && obj[key].length === 24 && /^[0-9a-fA-F]{24}$/.test(obj[key])) {
        // Only convert recognizable keys
        if (key === '_id' || key === 'authId' || key === 'resident' || key === 'assignedStaff' || key === 'paymentId') {
            obj[key] = new ObjectId(obj[key]);
        }
      } else if (typeof obj[key] === 'object') {
        obj[key] = convertIds(obj[key]);
      }
    }
  }
  return obj;
}

data = convertIds(data);

mongoose.connect(LOCAL_URI)
  .then(async () => {
    console.log("Connected to Local Database for Import...");
    
    // Clear existing local data
    await Auth.deleteMany({});
    await User.deleteMany({});
    await Staff.deleteMany({});
    await Payment.deleteMany({});
    await Complain.deleteMany({});
    await Inventory.deleteMany({});

    // Import from JSON directly bypassing mongoose validation
    if (data.Auth.length > 0) await Auth.collection.insertMany(data.Auth);
    if (data.User.length > 0) await User.collection.insertMany(data.User);
    if (data.Staff.length > 0) await Staff.collection.insertMany(data.Staff);
    if (data.Payment.length > 0) await Payment.collection.insertMany(data.Payment);
    if (data.Complain.length > 0) await Complain.collection.insertMany(data.Complain);
    if (data.Inventory.length > 0) await Inventory.collection.insertMany(data.Inventory);

    console.log("Migration complete! Data successfully imported to Local MongoDB.");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });
