const mongoose = require("mongoose");
require("dotenv").config();

const Payment = require("./model/Payment");
const Complain = require("./model/Complain");
const Staff = require("./model/staff");

async function resetAllData() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fixmateDB");
    console.log("Connected to MongoDB for full data reset...");

    // 1. Reset all personal payments to Pending
    const personalResult = await Payment.updateMany(
      { type: "personal" },
      { 
        $set: { 
          status: "Pending", 
          paidAt: null, 
          razorpayPaymentId: null, 
          razorpayOrderId: null, 
          razorpaySignature: null 
        } 
      }
    );
    console.log(`✅ Reset ${personalResult.modifiedCount} personal payments to Pending`);

    // 2. Delete all maintenance payments (they'll be recreated when work is completed)
    const maintenanceDeleteResult = await Payment.deleteMany({ type: "maintenance" });
    console.log(`✅ Deleted ${maintenanceDeleteResult.deletedCount} maintenance payments`);

    // 3. Reopen all complaints to Pending status
    const complaintResult = await Complain.updateMany(
      {},
      {
        $set: {
          status: "Pending",
          assignedStaff: null,
          workType: null,
          estimatedCost: null,
          actualCost: null,
          estimateStatus: null,
          proofImage: null,
          worklog: null,
          materialsUsed: [],
          revokedAt: null,
          revokeReason: null
        }
      }
    );
    console.log(`✅ Reopened ${complaintResult.modifiedCount} complaints to Pending`);

    // 4. Set all staff to available
    const staffResult = await Staff.updateMany(
      {},
      { $set: { isAvailable: true } }
    );
    console.log(`✅ Set ${staffResult.modifiedCount} staff members to available`);

    // 5. Clear any Razorpay orders that might be hanging
    const orderClearResult = await Payment.updateMany(
      { razorpayOrderId: { $exists: true } },
      { $unset: { razorpayOrderId: 1 } }
    );
    console.log(`✅ Cleared ${orderClearResult.modifiedCount} hanging Razorpay orders`);

    console.log("\n🎉 COMPLETE DATA RESET DONE!");
    console.log("📋 Summary:");
    console.log(`   • Personal payments: ${personalResult.modifiedCount} → Pending`);
    console.log(`   • Maintenance payments: ${maintenanceDeleteResult.deletedCount} → Deleted`);
    console.log(`   • Complaints: ${complaintResult.modifiedCount} → Pending`);
    console.log(`   • Staff: ${staffResult.modifiedCount} → Available`);
    console.log(`   • Orders: ${orderClearResult.modifiedCount} → Cleared`);
    console.log("\n🚀 Ready for fresh testing!");
    console.log("   • Residents can make new payments");
    console.log("   • Admin can assign staff to complaints");
    console.log("   • Staff can submit estimates and complete work");
    console.log("   • Email receipts will trigger on new payments");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error resetting data:", error);
    process.exit(1);
  }
}

resetAllData();
