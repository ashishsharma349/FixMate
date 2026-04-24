const mongoose = require('mongoose');
const Complain = require('../model/Complain');
require('dotenv').config();

async function fixDates() {
  const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fixmateDB';
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to database.');

    const now = new Date();
    // Find any complaints with a date in the future
    const futureComplaints = await Complain.find({ createdAt: { $gt: now } });
    
    console.log(`Found ${futureComplaints.length} complaints with future dates.`);

    if (futureComplaints.length > 0) {
      for (const c of futureComplaints) {
        // Reset to a random time between April 1st and Today
        const start = new Date(2026, 3, 1).getTime();
        const end = now.getTime();
        const randomTime = start + Math.random() * (end - start);
        c.createdAt = new Date(randomTime);
        await c.save();
      }
      console.log('Successfully adjusted future dates to the past.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Fix failed:', err);
    process.exit(1);
  }
}

fixDates();
