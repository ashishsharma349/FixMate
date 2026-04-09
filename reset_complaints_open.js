const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixmateDB')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Payment = require('./model/Payment');
    const Complain = require('./model/Complain');
    
    try {
      // Reset all maintenance fees to Pending
      const paymentResult = await Payment.updateMany(
        { type: 'personal', status: { $in: ['Paid', 'Overdue'] } },
        { $set: { status: 'Pending' } }
      );
      console.log(`Maintenance fees reset: ${paymentResult.modifiedCount} records updated to Pending`);

      // Set all complaints to Open
      const complaintResult = await Complain.updateMany(
        { status: { $nin: ['Open'] } },
        { $set: { status: 'Open' } }
      );
      console.log(`Complaints set to Open: ${complaintResult.modifiedCount} records updated to Open`);

      // Also reset any maintenance payments that might be marked as paid
      const maintenanceResult = await Payment.updateMany(
        { type: 'maintenance', status: 'Paid' },
        { $set: { status: 'Pending' } }
      );
      console.log(`Maintenance payments reset: ${maintenanceResult.modifiedCount} records updated to Pending`);

      console.log('\n✅ Data reset complete!');
      console.log('📊 Summary:');
      console.log(`  - Maintenance fees: ${paymentResult.modifiedCount} → Pending`);
      console.log(`  - Complaints: ${complaintResult.modifiedCount} → Open`);
      console.log(`  - Maintenance payments: ${maintenanceResult.modifiedCount} → Pending`);
      
    } catch (error) {
      console.error('Error resetting data:', error);
    } finally {
      await mongoose.connection.close();
      process.exit(0);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));
