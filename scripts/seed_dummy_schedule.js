const mongoose = require('mongoose');
require('dotenv').config();

const Complain = require('../model/Complain');
const Staff = require('../model/staff');

async function seedDummySchedules() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fixmateDB');
    console.log('Connected to MongoDB');

    const complaints = await Complain.find({ 
      status: { $in: ['Assigned', 'InProgress', 'EstimatePending', 'EstimateApproved'] },
      scheduledAt: { $exists: false } 
    }).limit(10); // Limit to 10 for safety

    const staffMembers = await Staff.find({ isAvailable: true });
    
    if (staffMembers.length === 0) {
      console.log('No available staff found to assign.');
      return;
    }

    const slots = ["10 AM - 1 PM", "1 PM - 4 PM", "4 PM - 7 PM", "7 PM - 10 PM"];
    const dates = [
      new Date(), // Today
      new Date(Date.now() + 86400000), // Tomorrow
      new Date(Date.now() + 172800000), // Day after
    ];

    console.log(`Setting dummy schedules for ${complaints.length} complaints...`);

    for (let i = 0; i < complaints.length; i++) {
      const complain = complaints[i];
      const randomDate = dates[Math.floor(Math.random() * dates.length)];
      const randomSlot = slots[Math.floor(Math.random() * slots.length)];
      
      // Assign a staff member if not already assigned
      if (!complain.assignedStaff) {
          complain.assignedStaff = staffMembers[i % staffMembers.length]._id;
          complain.status = 'Assigned';
      }

      complain.scheduledAt = randomDate;
      complain.scheduledSlot = randomSlot;

      await complain.save();
      console.log(`Updated Complain [${complain.title}]: Scheduled for ${randomDate.toDateString()} at ${randomSlot}`);
    }

    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.connection.close();
  }
}

seedDummySchedules();
