require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fixmateDB';

async function verifyReferences() {
    await mongoose.connect(uri);
    const db = mongoose.connection;
    
    console.log('--- Verifying Resident References ---');
    
    const users = await db.collection('users').find().toArray();
    const userIds = new Set(users.map(u => u._id.toString()));
    console.log(`Total Users: ${userIds.size}`);

    // Check Complains
    const complains = await db.collection('complains').find().toArray();
    let brokenComplains = 0;
    complains.forEach(c => {
        if (!c.resident) {
            brokenComplains++;
        } else if (!userIds.has(c.resident.toString())) {
            brokenComplains++;
            console.log(`Broken resident ref in Complaint ${c._id}: ${c.resident}`);
        }
    });
    console.log(`Complaints: ${complains.length}, Broken Resident Refs: ${brokenComplains}`);

    // Check Payments
    const payments = await db.collection('payments').find({ type: 'personal' }).toArray();
    let brokenPayments = 0;
    payments.forEach(p => {
        if (!p.resident) {
            brokenPayments++;
        } else if (!userIds.has(p.resident.toString())) {
            brokenPayments++;
            console.log(`Broken resident ref in Payment ${p._id}: ${p.resident}`);
        }
    });
    console.log(`Personal Payments: ${payments.length}, Broken Resident Refs: ${brokenPayments}`);

    await mongoose.disconnect();
}

verifyReferences().catch(console.error);
