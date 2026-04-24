const mongoose = require('mongoose');
require('dotenv').config();
const Complain = require('../model/Complain');

async function reshuffle() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fixmateDB');
    console.log('Connected to MongoDB');

    const complaints = await Complain.find({ status: { $ne: 'Resolved' } });
    const slots = ["10 AM - 1 PM", "1 PM - 4 PM", "4 PM - 7 PM", "7 PM - 10 PM"];
    
    const now = new Date();
    const dates = [
      new Date(now.getTime() + 4 * 60 * 60 * 1000), // Today (in 4 hours)
      new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      new Date(now.getTime() + 48 * 60 * 60 * 1000), // Day after
      new Date(now.getTime() + 72 * 60 * 60 * 1000), // 3 days later
    ];

    console.log(`Reshuffling ${complaints.length} complaints...`);

    for (const c of complaints) {
      c.scheduledAt = dates[Math.floor(Math.random() * dates.length)];
      c.scheduledSlot = slots[Math.floor(Math.random() * slots.length)];
      if (!c.status || c.status === 'Pending') {
          // If perfectly unassigned, just schedule it anyway for demo
          c.status = 'Assigned';
      }
      await c.save();
    }

    console.log('Successfully reshuffled schedules!');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

reshuffle();
