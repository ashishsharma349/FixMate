require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../model/User");
const Payment = require("../model/Payment");
const Finance = require("../model/finance");

async function runAudit() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fixmateDB");
    
    // April 2026
    const month = 4;
    const year = 2026;

    const residentCount = await User.countDocuments();
    
    // Dashboard Logic: Sum of Paid Payments + Income Finance for CURRENT MONTH
    const incomePayments = await Payment.find({ type: "personal", status: "Paid", month, year });
    const totalIncomePayments = incomePayments.reduce((s, p) => s + (p.amount || 0), 0);
    
    const incomeFinance = await Finance.find({ transactionType: "Income", status: "Paid", month, year });
    const totalIncomeFinance = incomeFinance.reduce((s, f) => s + (f.amount || 0), 0);
    
    const totalIncome = totalIncomePayments + totalIncomeFinance;

    // Dashboard Logic: Sum of Maintenance Payments + Expense Finance for CURRENT MONTH
    const expensePayments = await Payment.find({ type: "maintenance", status: "Paid", month, year });
    const totalExpensePayments = expensePayments.reduce((s, p) => s + (p.amount || 0), 0);
    
    const expenseFinance = await Finance.find({ transactionType: "Expense", status: "Paid", month, year });
    const totalExpenseFinance = expenseFinance.reduce((s, f) => s + (f.amount || 0), 0);
    
    const totalSpent = totalExpensePayments + totalExpenseFinance;

    console.log(`--- DASHBOARD DATA (APRIL 2026) ---`);
    console.log(`Residents: ${residentCount}`);
    console.log(`Total Income: ₹${totalIncome} (Payments: ${totalIncomePayments}, Misc: ${totalIncomeFinance})`);
    console.log(`Total Spent: ₹${totalSpent} (Maint: ${totalExpensePayments}, Misc: ${totalExpenseFinance})`);
    console.log(`Fund Balance: ₹${totalIncome - totalSpent}`);
    console.log("------------------------------------");

  } catch (err) {
    console.error("Audit Error:", err);
  } finally {
    mongoose.connection.close();
  }
}

runAudit();
