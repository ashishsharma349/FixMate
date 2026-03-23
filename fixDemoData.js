const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./model/User");
const Staff = require("./model/staff");
const Complain = require("./model/Complain");

const realisticNames = [
  "Rohan Sharma", "Aisha Gupta", "Karan Malhotra", "Priya Verma",
  "Sneha Kapoor", "Vikram Singh", "Ananya Reddy", "Rahul Das"
];

const realisticStaffNames = [
  "Ramesh Kumar", "Suresh Yadav", "Rajesh Pandey", "Mohammad Ali",
  "Dinesh Tiwari", "Manoj Chawla"
];

const isFake = (str) => {
  if (!str) return true;
  const lower = str.toLowerCase();
  return lower.includes("test") || lower.includes("dummy") || 
         lower.includes("xyz") || lower.includes("abc") || 
         lower === "a" || lower === "b" || str.length <= 2;
};

const fixDemoData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fixmateDB");
    console.log("Connected to MongoDB for Data Polishing...");

    // 1. Fix Users
    const users = await User.find({});
    let nameIdx = 0;
    for (let u of users) {
      if (isFake(u.name)) {
        u.name = realisticNames[nameIdx % realisticNames.length];
        nameIdx++;
      }
      if (isFake(u.phone) || u.phone.length < 10) u.phone = "98" + Math.floor(10000000 + Math.random() * 90000000);
      if (isFake(u.flatNumber)) u.flatNumber = Math.floor(100 + Math.random() * 800).toString();
      await u.save();
    }

    // 2. Fix Staff
    const staffs = await Staff.find({});
    let sIdx = 0;
    for (let s of staffs) {
      if (isFake(s.name)) {
        s.name = realisticStaffNames[sIdx % realisticStaffNames.length];
        sIdx++;
      }
      if (isFake(s.phone) || s.phone.length < 10) s.phone = "88" + Math.floor(10000000 + Math.random() * 90000000);
      await s.save();
    }

    // 3. Fix Complaints
    // Get available staff grouped by category if possible, or just any staff
    const allStaff = await Staff.find({});
    
    if (allStaff.length === 0) {
        console.log("No staff found to assign complaints!");
        process.exit(0);
    }

    const complains = await Complain.find({});
    for (let c of complains) {
      // Give it a work type if missing
      if (!c.workType) {
        c.workType = Math.random() > 0.5 ? "Personal" : "CommonArea";
      }

      const matchingStaff = allStaff.filter(s => s.department === c.category);
      const randomStaff = matchingStaff.length > 0 
        ? matchingStaff[Math.floor(Math.random() * matchingStaff.length)] 
        : allStaff[Math.floor(Math.random() * allStaff.length)];

      if (c.status === "Assigned" || c.status === "InProgress" || c.status === "Resolved") {
        if (!c.assignedStaff) {
            c.assignedStaff = randomStaff._id;
        }
      } else if (c.status === "Pending") {
		// Clean up accidentally assigned staff on Pending
        c.assignedStaff = null;
      }
      await c.save();
    }

    console.log("✅ Successfully polished the database. All names and fields are now realistic!");
    process.exit(0);

  } catch (err) {
    console.error("Error fixing data:", err);
    process.exit(1);
  }
};

fixDemoData();
