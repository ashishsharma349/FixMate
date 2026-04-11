const mongoose = require('mongoose');
require('dotenv').config();
const Payment = require('../model/Payment');
const Finance = require('../model/finance');
const User = require('../model/User');
const Staff = require('../model/staff');
const Complain = require('../model/Complain');
const Auth = require('../model/Auth');

async function seedFinances() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fixmateDB');
    console.log('Connected to MongoDB');

    // 1. Ensure permanent staff exist
    const staffRoles = [
        { name: 'Ramlal (Watchman Day)', dept: 'Security', aadhaar: '888877776666', salary: 12000 },
        { name: 'Shyamlal (Watchman Night)', dept: 'Security', aadhaar: '888877775555', salary: 12000 },
        { name: 'Kailash (Gardener)', dept: 'Cleaning', aadhaar: '888877774444', salary: 6000 },
        { name: 'Sohan (Broomer)', dept: 'Cleaning', aadhaar: '888877773333', salary: 6000 },
    ];

    const finalStaff = [];
    for (const role of staffRoles) {
        let s = await Staff.findOne({ name: role.name });
        if (!s) {
            console.log(`Creating permanent staff: ${role.name}`);
            const email = role.name.split(' ')[0].toLowerCase().replace('(','') + '@fixmate.com';
            let auth = await Auth.findOne({ email });
            if (!auth) {
                auth = await Auth.create({ email, password: 'password123', role: 'staff' });
            }
            s = await Staff.create({ 
                authId: auth._id, 
                name: role.name, 
                phone: '9876543210', 
                department: role.dept, 
                aadhaar: role.aadhaar,
                baseSalary: role.salary 
            });
        }
        finalStaff.push(s);
    }

    const residents = await User.find(); // Use all residents
    const complaints = await Complain.find().limit(10);

    console.log('CLEANING: Deleting all existing financial records from Feb 2026 onwards...');
    await Promise.all([
      Payment.deleteMany({ year: 2026, month: { $in: [2, 3, 4] } }),
      Finance.deleteMany({ date: { $gte: new Date('2026-02-01') } })
    ]);

    const paymentRecords = [];
    const financeEntries = [];

    const months = [
        { name: 'February', num: 2, days: 28 },
        { name: 'March', num: 3, days: 31 },
        { name: 'April', num: 4, days: 30 }
    ];

    for (const m of months) {
        console.log(`Seeding ${m.name} 2026...`);
        
        // --- 1. INCOME (Total ₹3,500 per resident) ---
        // All residents x ₹3,500
        for (let i = 0; i < residents.length; i++) {
            const resi = residents[i];
            paymentRecords.push({
                type: 'personal',
                resident: resi._id,
                flatNumber: resi.flatNumber,
                amount: 3500,
                status: 'Paid',
                purpose: `Maintenance Fee - ${m.name}`,
                month: m.num,
                year: 2026,
                refId: `${m.name.substring(0,3).toUpperCase()}-DUES-${resi.flatNumber}`,
                paidAt: new Date(2026, m.num - 1, 5) // Paid on 5th of month
            });
        }

        // --- 2. SALARIES (Total ₹36,000 society expense) ---
        for (const s of finalStaff) {
            const date = new Date(2026, m.num - 1, 28);
            financeEntries.push({
                transactionType: 'Expense',
                transactionCategory: 'Salary',
                amount: s.baseSalary,
                description: `${m.name} Salary - ${s.name}`,
                handledBy: s._id,
                date: date
            });
            paymentRecords.push({
                type: 'maintenance',
                worker: s._id,
                workerName: s.name,
                purpose: `Monthly Salary - ${m.name}`,
                amount: s.baseSalary,
                status: 'Paid',
                month: m.num,
                year: 2026,
                refId: `${m.name.substring(0,3).toUpperCase()}-SAL-${s.name.substring(0,3).toUpperCase()}`,
                paidAt: date
            });
        }

        // --- 3. COMMON REPAIRS & INVENTORY ---
        if (m.num === 2) { // February (Genesis)
            // Small repair (3k)
            const c = complaints[0] || { title: 'Main Gate Hinge Fix' };
            const date = new Date(2026, 1, 15);
            financeEntries.push({
                transactionType: 'Expense',
                transactionCategory: 'CommonRepair',
                amount: 3000,
                description: c.title,
                relatedComplaint: c._id,
                handledBy: finalStaff[0]._id,
                date: date
            });
            paymentRecords.push({
                type: 'maintenance',
                worker: finalStaff[0]._id,
                workerName: finalStaff[0].name,
                purpose: c.title,
                amount: 3000,
                status: 'Paid',
                month: 2,
                year: 2026,
                refId: 'FEB-REP-01',
                paidAt: date
            });
            // Total Feb Spent: 36k + 3k = 39k. Rollover: 6k.
        }

        if (m.num === 3) { // March
            // Inventory stockup (5k)
            const date = new Date(2026, 2, 10);
            financeEntries.push({
                transactionType: 'Expense',
                transactionCategory: 'Inventory',
                amount: 5000,
                description: 'Cleaning Acid & Phenyl Stock',
                handledBy: finalStaff[2]._id,
                date: date
            });
            paymentRecords.push({
                type: 'maintenance',
                worker: finalStaff[2]._id,
                workerName: finalStaff[2].name,
                purpose: 'Cleaning supplies',
                amount: 5000,
                status: 'Paid',
                month: 3,
                year: 2026,
                refId: 'MAR-INV-01',
                paidAt: date
            });
            // Total Mar Spent: 36k + 5k = 41k. Rollover: 6k + 4k = 10k.
        }

        if (m.num === 4) { // April
            // Larger repair (Let's use the accumulated rollover)
            const c = complaints[1] || { title: 'Elevator Control Board Repair' };
            const date = new Date(2026, 3, 12);
            financeEntries.push({
                transactionType: 'Expense',
                transactionCategory: 'CommonRepair',
                amount: 8000,
                description: c.title,
                relatedComplaint: c._id,
                handledBy: finalStaff[1]._id,
                date: date
            });
            paymentRecords.push({
                type: 'maintenance',
                worker: finalStaff[1]._id,
                workerName: finalStaff[1].name,
                purpose: c.title,
                amount: 8000,
                status: 'Paid',
                month: 4,
                year: 2026,
                refId: 'APR-REP-01',
                paidAt: date
            });

            // Add one PENDING payout to show in "Actions Needed"
            paymentRecords.push({
                type: 'maintenance',
                worker: finalStaff[3]._id,
                workerName: finalStaff[3].name,
                purpose: 'Garden Tool Sharpening',
                amount: 1200,
                status: 'Pending',
                month: 4,
                year: 2026,
                refId: 'APR-PEND-01',
            });
        }

        // --- 4. PERSONAL TASKS (Direct Wallet) ---
        // Staff doing side-work for residents
        for (let i = 0; i < 3; i++) {
            const resi = residents[i % residents.length];
            const staff = finalStaff[i % finalStaff.length];
            const amount = 500 + (i * 250);
            const date = new Date(2026, m.num - 1, 10 + i);
            
            financeEntries.push({
                transactionType: 'Expense',
                transactionCategory: 'DirectPayment',
                handledBy: staff._id, // Staff earned it
                amount: amount,
                description: `Private work: ${resi.name} (Flat ${resi.flatNumber})`,
                date: date
            });
        }
    }

    console.log(`Inserting ${paymentRecords.length} Payment records...`);
    await Payment.insertMany(paymentRecords);

    console.log(`Inserting ${financeEntries.length} Finance entries...`);
    await Finance.insertMany(financeEntries);

    console.log('\n✅ FINANCIAL SEEDING COMPLETE');
    console.log('Logic Check:');
    console.log(`- Income: ₹${residents.length * 3500}/mo (₹3500 per resident)`);
    console.log('- Salaries: ₹36,000/mo (Fixed Expense)');
    console.log('- Genesis: February 2026');
    console.log('- Historical rollover logic fully populated.');

  } catch (err) {
    console.error('❌ SEEDING FAILED:', err);
  } finally {
    await mongoose.connection.close();
  }
}

seedFinances();
