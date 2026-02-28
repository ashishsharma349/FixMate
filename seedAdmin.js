const Account = require("./model/Auth");

async function seedAdmin() {
  const existing = await Account.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log("Admin already exists");
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
}

module.exports = seedAdmin;