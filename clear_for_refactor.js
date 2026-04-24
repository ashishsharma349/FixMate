const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fixmateDB')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const Payment = require('./model/Payment');
    const Complain = require('./model/Complain');
    const Finance = require('./model/finance');
    const Staff = require('./model/staff');
    const Auth = require('./model/Auth');
    
    try {
      await Payment.deleteMany({});
      await Complain.deleteMany({});
      await Finance.deleteMany({});
      
      // Delete staff and their associated auth records
      const staffMembers = await Staff.find({});
      for (const s of staffMembers) {
          await Auth.findByIdAndDelete(s.authId);
      }
      await Staff.deleteMany({});

      console.log('✅ Complaints, Payments, Finance, and Staff cleared!');
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      await mongoose.connection.close();
      process.exit(0);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));
