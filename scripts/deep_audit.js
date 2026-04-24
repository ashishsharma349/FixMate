require("dotenv").config();
const mongoose = require("mongoose");
const Auth = require("../model/Auth");
const User = require("../model/User");
const Staff = require("../model/staff");
const Complain = require("../model/Complain");
const Payment = require("../model/Payment");
const Finance = require("../model/finance");
const Inventory = require("../model/Inventory");

async function deepAudit() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fixmateDB");
    
    const report = {
      residents: { total: 0, orphaned: [], duplicates: [] },
      staff: { total: 0, orphaned: [], duplicates: [] },
      payments: { total: 0, invalidResidents: [], duplicateRefs: [] },
      complaints: { total: 0, invalidResidents: [], invalidStaff: [], statusMismatches: [] },
      finance: { total: 0, orphanedStaff: [] },
      inventory: { total: 0, lowStock: [] }
    };

    // 1. Audit Residents
    const users = await User.find({});
    report.residents.total = users.length;
    const userAadhaars = new Set();
    for (const u of users) {
      const auth = await Auth.findById(u.authId);
      if (!auth) report.residents.orphaned.push(u._id);
      if (userAadhaars.has(u.aadhaar)) report.residents.duplicates.push(u.aadhaar);
      userAadhaars.add(u.aadhaar);
    }

    // 2. Audit Staff
    const staff = await Staff.find({});
    report.staff.total = staff.length;
    for (const s of staff) {
      const auth = await Auth.findById(s.authId);
      if (!auth) report.staff.orphaned.push(s._id);
    }

    // 3. Audit Payments
    const payments = await Payment.find({});
    report.payments.total = payments.length;
    const refIds = new Map();
    for (const p of payments) {
      const resident = await User.findById(p.resident);
      if (!resident) report.payments.invalidResidents.push(p._id);
      
      const count = refIds.get(p.refId) || 0;
      if (count > 0) report.payments.duplicateRefs.push(p.refId);
      refIds.set(p.refId, count + 1);
    }

    // 4. Audit Complaints
    const complaints = await Complain.find({});
    report.complaints.total = complaints.length;
    for (const c of complaints) {
      const res = await User.findById(c.resident);
      if (!res) report.complaints.invalidResidents.push(c._id);
      
      if (c.assignedStaff && c.assignedStaff.length > 0) {
        for (const sId of c.assignedStaff) {
          const s = await Staff.findById(sId);
          if (!s) report.complaints.invalidStaff.push({ complaintId: c._id, staffId: sId });
        }
      }
    }

    // 5. Audit Finance
    const finances = await Finance.find({});
    report.finance.total = finances.length;
    for (const f of finances) {
      if (f.transactionCategory === "Salary" && f.handledBy) {
        const s = await Staff.findById(f.handledBy);
        if (!s) report.finance.orphanedStaff.push({ financeId: f._id, staffId: f.handledBy });
      }
    }

    // 6. Audit Inventory
    const items = await Inventory.find({});
    report.inventory.total = items.length;
    for (const i of items) {
      if (i.quantity <= i.minQuantity) report.inventory.lowStock.push(i.name);
    }

    console.log(JSON.stringify(report, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

deepAudit();
