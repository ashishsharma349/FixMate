const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixmateDB')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Payment = require('./model/Payment');
    const Complain = require('./model/Complain');
    
    try {
      // Delete ALL payment records
      const paymentDeleteResult = await Payment.deleteMany({});
      console.log(`Payments deleted: ${paymentDeleteResult.deletedCount} records removed`);

      // Delete ALL complaint records  
      const complaintDeleteResult = await Complain.deleteMany({});
      console.log(`Complaints deleted: ${complaintDeleteResult.deletedCount} records removed`);

      console.log('\n✅ All data cleared!');
      console.log('📊 Summary:');
      console.log(`  - Payments removed: ${paymentDeleteResult.deletedCount}`);
      console.log(`  - Complaints removed: ${complaintDeleteResult.deletedCount}`);
      
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      await mongoose.connection.close();
      process.exit(0);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));
