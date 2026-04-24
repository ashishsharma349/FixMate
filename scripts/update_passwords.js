const mongoose = require('mongoose');
const Auth = require('../model/Auth');
require('dotenv').config();

async function updatePasswords() {
  const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fixmateDB';
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to database.');

    const result = await Auth.updateMany(
      { role: { $ne: 'admin' } },
      { $set: { password: 'Temp@1234', isFirstLogin: false } }
    );

    console.log(`Successfully updated passwords for ${result.modifiedCount} accounts.`);
    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
}

updatePasswords();
