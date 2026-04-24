const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixmateDB')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Payment = require('./model/Payment');
    
    // Check April 2026 personal payments
    const personalPayments = await Payment.find({
      type: 'personal',
      month: 4,
      year: 2026
    });
    
    console.log('April 2026 Personal Payments:');
    console.log('Count:', personalPayments.length);
    personalPayments.forEach(p => {
      console.log(`  ${p.refId}: ₹${p.amount} - ${p.status}`);
    });
    
    // Check paid payments total
    const paidPayments = personalPayments.filter(p => p.status === 'Paid');
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    console.log('Total Paid Amount:', totalPaid);
    
    // Check maintenance payments for April 2026
    const maintenancePayments = await Payment.find({
      type: 'maintenance',
      createdAt: {
        $gte: new Date(2026, 3, 1),
        $lte: new Date(2026, 3, 31, 23, 59, 59)
      }
    });
    
    console.log('\nApril 2026 Maintenance Payments:');
    console.log('Count:', maintenancePayments.length);
    maintenancePayments.forEach(p => {
      console.log(`  ${p.refId}: ₹${p.amount} - ${p.status}`);
    });
    
    const totalMaintenance = maintenancePayments.reduce((sum, p) => sum + p.amount, 0);
    console.log('Total Maintenance Amount:', totalMaintenance);
    console.log('Net Collected (Personal - Maintenance):', totalPaid - totalMaintenance);
    
    await mongoose.connection.close();
  })
  .catch(err => console.error('MongoDB connection error:', err));
