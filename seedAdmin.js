const bcrypt =require( "bcrypt");
const Account = require("./model/Auth"); // adjust path

async function seedAdmin() {
  const existing = await Account.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD
    ,
    10
  );

  await Account.create({
    name: "Admin",
    email: process.env.ADMIN_EMAIL,
    password: hashedPassword,
    role: "admin",
  });

  console.log(" Admin account seeded");
}

module.exports=seedAdmin;