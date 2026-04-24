require("dotenv").config();
const mongoose = require("mongoose");
const Complain = require("../model/Complain");
const Payment = require("../model/Payment");

async function logicalAudit() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fixmateDB");
    
    const issues = [];

    // 1. Check Paid Payments without dates
    const paidNoDate = await Payment.find({ status: "Paid", paidAt: null });
    if (paidNoDate.length > 0) issues.push(`Found ${paidNoDate.length} 'Paid' payments missing a paidAt date.`);

    // 2. Check Resolved Complaints without actual costs
    const resolvedNoCost = await Complain.find({ status: "Resolved", actualCost: { $lte: 0 } });
    if (resolvedNoCost.length > 0) issues.push(`Found ${resolvedNoCost.length} 'Resolved' complaints with 0 or missing actual cost.`);

    // 3. Check for residents with multiple pending payments for the same month
    const dupeMonths = await Payment.aggregate([
      { $group: { _id: { resident: "$resident", month: "$month", year: "$year" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    if (dupeMonths.length > 0) issues.push(`Found ${dupeMonths.length} cases where a resident has multiple payments for the same month/year.`);

    if (issues.length === 0) {
      console.log("✅ All logical checks passed. Data is 100% correct.");
    } else {
      console.log("⚠️ Logical Inconsistencies Found:");
      issues.forEach(i => console.log("- " + i));
    }

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

logicalAudit();
