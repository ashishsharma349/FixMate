const mongoose = require("mongoose");
require("dotenv").config();
const Complain = require("./model/Complain");
const User = require("./model/User");

async function cleanComplaints() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fixmateDB");
  console.log("Connected to MongoDB. Cleaning up Complaints...");

  // 1. Delete completely garbage test complaints (titles: "xyz", "abc", "acc", etc or < 4 chars)
  const garbageRegex = /^(xyz|abc|test|acc|qwe|asd|dummy)$/i;
  
  const allComplaints = await Complain.find({});
  let deletedCount = 0;
  
  const validResidents = await User.find({});
  if (validResidents.length === 0) {
    console.log("No valid residents found. Run seeders first.");
    process.exit(1);
  }

  let reassignedCount = 0;

  for (let c of allComplaints) {
    // Check if it's garbage title
    if (garbageRegex.test(c.title.trim()) || c.title.trim().length < 4) {
      await Complain.findByIdAndDelete(c._id);
      deletedCount++;
      continue;
    }

    // Check if resident is missing or invalid
    let needReassign = false;
    if (!c.resident) {
      needReassign = true;
    } else {
      // Check if the resident actually exists in User collection
      const residentExists = validResidents.find(r => r._id.toString() === c.resident.toString());
      if (!residentExists) {
        needReassign = true;
      }
    }

    if (needReassign) {
      // Assign to a random valid resident
      const randomRes = validResidents[Math.floor(Math.random() * validResidents.length)];
      c.resident = randomRes._id;
      await c.save();
      reassignedCount++;
    }
  }

  console.log(`✅ Cleaned up ${deletedCount} garbage complaints.`);
  console.log(`✅ Reassigned ${reassignedCount} orphaned complaints to valid residents.`);
  
  process.exit(0);
}

cleanComplaints().catch(console.error);
