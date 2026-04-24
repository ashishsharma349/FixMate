const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Auth = require("../model/Auth");
const User = require("../model/User");
const Payment = require("../model/Payment");

async function deletePaymentByEmail(email) {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // 2. Find Auth by email
    const auth = await Auth.findOne({ email });
    if (!auth) {
      console.error(`Error: No resident found with email ${email}`);
      process.exit(1);
    }

    // 3. Find User by authId
    const user = await User.findOne({ authId: auth._id });
    if (!user) {
      console.error(`Error: User profile not found for email ${email}`);
      process.exit(1);
    }

    // 4. Find the most recent personal payment for this resident
    const payment = await Payment.findOne({
      resident: user._id,
      type: "personal"
    }).sort({ createdAt: -1 });

    if (!payment) {
      console.log(`No payment records found for resident: ${user.name}`);
    } else {
      // 5. Delete the payment
      const deleted = await Payment.findByIdAndDelete(payment._id);
      console.log(`Successfully deleted payment record:`);
      console.log(`- Resident: ${user.name}`);
      console.log(`- Month/Year: ${payment.month}/${payment.year}`);
      console.log(`- Amount: ₹${payment.amount}`);
      console.log(`- Ref ID: ${payment.refId}`);
      console.log(`- Status: ${payment.status}`);
    }

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

// Get email from command line argument
const emailArg = process.argv[2];

if (!emailArg) {
  console.log("\nUsage: node scripts/delete_payment.js <resident_email>");
  console.log("Example: node scripts/delete_payment.js ashishsharma90807@gmail.com\n");
  process.exit(1);
}

deletePaymentByEmail(emailArg);

//To use
//node scripts/delete_payment.js <resident_email>
