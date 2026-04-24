const Account = require("../model/Auth");
const mongoose = require("mongoose");
require("dotenv").config();

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");
  
  const existing = await Account.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log("Admin already exists");
    await mongoose.connection.close();
    return;
  }

  // Plain text password for demo (no bcrypt)
  await Account.create({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: "admin",
    isFirstLogin: false
  });

  console.log("Admin account seeded");
  await mongoose.connection.close();
}

seedAdmin();