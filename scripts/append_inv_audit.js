const mongoose = require('mongoose');
const Inventory = require('../model/Inventory');
require('dotenv').config();

async function updateData() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fixmateDB');
  
  await Inventory.updateMany({}, {
    $set: {
      approvedBy: 'admin@fixmate.com',
      approvedDate: new Date()
    }
  });
  
  console.log('Successfully updated existing inventory items with approvedBy/approvedDate.');
  process.exit(0);
}

updateData();
