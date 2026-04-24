const mongoose = require('mongoose');
require('dotenv').config();

const Auth = require('../model/Auth');
const User = require('../model/User');
const Staff = require('../model/staff');
const Complain = require('../model/Complain');
const Payment = require('../model/Payment');
const Finance = require('../model/finance');
const Inventory = require('../model/Inventory');

async function seedEverything() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/fixmateDB';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    // --- CLEANUP ---
    console.log('Cleaning up existing data...');
    // Keep admin auth, delete everything else
    const admin = await Auth.findOne({ role: 'admin' });
    const adminId = admin ? admin._id : null;

    await Auth.deleteMany({ _id: { $ne: adminId } });
    await User.deleteMany({});
    await Staff.deleteMany({});
    await Complain.deleteMany({});
    await Payment.deleteMany({});
    await Finance.deleteMany({});
    // await Inventory.deleteMany({}); // Keep inventory for now

    // --- SEED STAFF (8 members) ---
    console.log('Seeding Staff...');
    const depts = ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Security'];
    const staffData = [
      { name: 'Ramlal Sharma', dept: 'Security', phone: '9876543210', salary: 15000 },
      { name: 'Suresh Kumar', dept: 'Plumbing', phone: '9876543211', salary: 12000 },
      { name: 'Amit Singh', dept: 'Electrical', phone: '9876543212', salary: 13000 },
      { name: 'Deepak Verma', dept: 'Carpentry', phone: '9876543213', salary: 11000 },
      { name: 'Kailash Nath', dept: 'Cleaning', phone: '9876543214', salary: 9000 },
      { name: 'Sohan Lal', dept: 'Security', phone: '9876543215', salary: 14000 },
      { name: 'Vikram Singh', dept: 'Plumbing', phone: '9876543216', salary: 12500 },
      { name: 'Rahul Gupta', dept: 'Electrical', phone: '9876543217', salary: 13500 },
    ];

    const seededStaff = [];
    for (const s of staffData) {
      const email = s.name.toLowerCase().split(' ')[0] + '@fixmate.com';
      const auth = await Auth.create({ email, password: 'Temp@1234', role: 'staff' });
      const staff = await Staff.create({
        authId: auth._id,
        name: s.name,
        phone: s.phone,
        department: s.dept,
        aadhaar: '12345678' + Math.floor(1000 + Math.random() * 9000),
        baseSalary: s.salary,
        isAvailable: true
      });
      seededStaff.push(staff);
    }

    // --- SEED RESIDENTS (20 members) ---
    console.log('Seeding 20 Residents...');
    const blocks = ['A', 'B', 'C', 'D'];
    const seededResidents = [];
    for (let i = 1; i <= 20; i++) {
      const block = blocks[Math.floor((i - 1) / 5)];
      const flatNum = (i % 5 === 0 ? 5 : i % 5) * 100 + Math.floor(i / 20 * 10); // Simple logic for flat numbers
      const flat = `${block}-${i + 100}`;
      const name = `Resident ${i}`;
      const email = `resident${i}@example.com`;
      
      const auth = await Auth.create({ email, password: 'Temp@1234', role: 'user' });
      const resident = await User.create({
        authId: auth._id,
        name,
        age: 25 + (i % 30),
        phone: '90000000' + (10 + i),
        aadhaar: '80007000' + (1000 + i),
        flatNumber: flat
      });
      seededResidents.push(resident);
    }

    // --- SEED COMPLAINTS (Realistic distribution across months) ---
    console.log('Seeding Monthly Complaints (Feb, March, April)...');
    const complaintTemplates = [
      { title: 'Water leakage in kitchen', cat: 'Plumbing', prio: 'High', desc: 'The pipe under the sink is leaking water.' },
      { title: 'Ceiling fan making noise', cat: 'Electrical', prio: 'Medium', desc: 'Master bedroom fan makes clicking sound.' },
      { title: 'Wooden door jammed', cat: 'Carpentry', prio: 'Low', desc: 'Main balcony door is hard to open.' },
      { title: 'Corridor needs deep cleaning', cat: 'Cleaning', prio: 'Medium', desc: 'Spillage near elevator on 3rd floor.' },
      { title: 'Intercom not working', cat: 'Security', prio: 'High', desc: 'Cannot talk to main gate security.' },
      { title: 'Tap replacement', cat: 'Plumbing', prio: 'Low', desc: 'Bathroom tap is loose and dripping.' },
      { title: 'Short circuit in balcony', cat: 'Electrical', prio: 'Emergency', desc: 'Sparking noticed in outdoor socket.' },
      { title: 'Hinges loose on wardrobe', cat: 'Carpentry', prio: 'Medium', desc: 'Wardrobe door in kids room is sagging.' },
      { title: 'External wall seepage', cat: 'General', prio: 'High', desc: 'Water marks appearing on living room wall.' },
      { title: 'Lobby light off', cat: 'Electrical', prio: 'Low', desc: 'One of the LED panels in lobby is dead.' }
    ];

    const monthsData = [
      { name: 'February', num: 2, count: 10 },
      { name: 'March', num: 3, count: 15 },
      { name: 'April', num: 4, count: 12 }
    ];

    const seededComplaints = [];
    for (const mData of monthsData) {
      for (let i = 0; i < mData.count; i++) {
        const template = complaintTemplates[i % complaintTemplates.length];
        const resident = seededResidents[i % seededResidents.length];
        
        // Status logic: Older months are mostly resolved
        let status = 'Resolved';
        if (mData.num === 4) {
            const statusRoll = Math.random();
            status = 'Pending';
            if (statusRoll > 0.4) status = 'Assigned';
            if (statusRoll > 0.7) status = 'InProgress';
            if (statusRoll > 0.9) status = 'Resolved';
        } else if (mData.num === 3 && Math.random() > 0.8) {
            status = 'InProgress';
        }

        // Ensure dates are not in the future relative to "Today" (April 10, 2026)
        let dayLimit = 28;
        if (mData.num === 4) {
          const now = new Date();
          if (now.getFullYear() === 2026 && now.getMonth() === 3) {
            dayLimit = Math.max(1, now.getDate());
          }
        }
        const createdAt = new Date(2026, mData.num - 1, 1 + Math.floor(Math.random() * dayLimit));

        const complaint = await Complain.create({
          title: `${template.title} (${mData.name} #${i+1})`,
          category: template.cat,
          priority: template.prio,
          description: template.desc,
          resident: resident._id,
          status: status,
          image_url: '/uploads/demo-placeholder.jpg',
          createdAt: createdAt
        });
        seededComplaints.push(complaint);
      }
    }

    // --- SET SCHEDULES & WIP ---
    console.log('Setting Schedules for WIP...');
    const wipComplaints = seededComplaints.filter(c => ['Assigned', 'InProgress'].includes(c.status));
    const slots = ["10 AM - 1 PM", "1 PM - 4 PM", "4 PM - 7 PM", "7 PM - 10 PM"];
    
    for (let i = 0; i < wipComplaints.length; i++) {
        const c = wipComplaints[i];
        const staff = seededStaff.find(s => s.department === c.category) || seededStaff[i % seededStaff.length];
        
        c.assignedStaff = staff._id;
        c.workType = (i % 2 === 0) ? 'Personal' : 'CommonArea';
        c.scheduledAt = new Date(Date.now() + (Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000));
        c.scheduledSlot = slots[i % slots.length];
        
        await c.save();
        await Staff.findByIdAndUpdate(staff._id, { isAvailable: false });
    }

    // --- SEED FINANCES (Feb - Apr 2026) ---
    console.log('Seeding Finance & Payments History...');
    const months = [
        { name: 'February', num: 2 },
        { name: 'March', num: 3 },
        { name: 'April', num: 4 }
    ];

    for (const m of months) {
        // 1. Maintenance Income
        for (const res of seededResidents) {
            await Payment.create({
                type: 'personal',
                resident: res._id,
                flatNumber: res.flatNumber,
                amount: 3500,
                status: 'Paid',
                purpose: `Maintenance Fee - ${m.name}`,
                month: m.num,
                year: 2026,
                refId: `${m.name.substring(0,3).toUpperCase()}-DUES-${res.flatNumber}`,
                paidAt: new Date(2026, m.num - 1, 5 + (Math.random() * 10))
            });
        }

        // 2. Staff Salaries Expenses
        for (const s of seededStaff) {
            const date = new Date(2026, m.num - 1, 28);
            await Finance.create({
                transactionType: 'Expense',
                transactionCategory: 'Salary',
                amount: s.baseSalary,
                description: `${m.name} Salary - ${s.name}`,
                handledBy: s._id,
                date: date
            });
            await Payment.create({
                type: 'maintenance',
                worker: s._id,
                workerName: s.name,
                purpose: `Monthly Salary - ${m.name}`,
                amount: s.baseSalary,
                status: 'Paid',
                month: m.num,
                year: 2026,
                refId: `${m.name.substring(0,3).toUpperCase()}-SAL-${s.name.substring(0,3).toUpperCase()}-${Math.floor(Math.random()*100)}`,
                paidAt: date
            });
        }
    }

    console.log('\n✅ COMPREHENSIVE SEEDING COMPLETE');
    console.log(`- Residents Created: ${seededResidents.length}`);
    console.log(`- Staff Created: ${seededStaff.length}`);
    console.log(`- Complaints Created: ${seededComplaints.length}`);
    console.log(`- WIP Entries with Schedules: ${wipComplaints.length}`);
    console.log('- Financial Records: Feb-Apr 2026 fully populated');

    process.exit(0);
  } catch (err) {
    console.error('❌ SEEDING FAILED:', err);
    process.exit(1);
  }
}

seedEverything();
