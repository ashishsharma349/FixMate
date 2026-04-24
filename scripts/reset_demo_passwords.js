const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const Auth = require('../model/Auth');

async function resetPasswords() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fixmateDB');
    console.log('Connected to MongoDB');

    const defaultPassword = 'Temp@1234';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    console.log(`Hashing complete. Resetting all User and Staff passwords to: ${defaultPassword}`);

    const result = await Auth.updateMany(
      { role: { $in: ['user', 'staff'] } },
      { $set: { password: hashedPassword, isFirstLogin: true } }
    );

    console.log(`Successfully updated ${result.modifiedCount} accounts.`);

    const sampleUsers = await Auth.find({ role: { $in: ['user', 'staff'] } }).limit(10);
    console.log('\nSample Resident/Staff Emails you can now use:');
    sampleUsers.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));

  } catch (err) {
    console.error('Error during reset:', err);
  } finally {
    await mongoose.connection.close();
  }
}

resetPasswords();
