require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fixmateDB';

async function fixComplaints() {
    await mongoose.connect(uri);
    const db = mongoose.connection;
    
    console.log('--- Fixing Resident References in Complaints ---');
    
    // 1. Get all Users and their authId
    const users = await db.collection('users').find().toArray();
    const authToUserMap = {};
    const firstUserId = users[0]._id;
    users.forEach(u => {
        authToUserMap[u.authId.toString()] = u._id;
    });
    console.log(`Mapping created for ${users.length} users. First User ID: ${firstUserId}`);

    // Add special mappings for Admin and known Staff if they filed complaints
    const auths = await db.collection('auths').find().toArray();
    auths.forEach(a => {
        if (!authToUserMap[a._id.toString()]) {
            authToUserMap[a._id.toString()] = firstUserId; // Map to first user as fallback
        }
    });

    // 2. Find Complaints with broken resident refs
    const complains = await db.collection('complains').find().toArray();
    let fixedCount = 0;

    for (const c of complains) {
        if (c.resident) {
            const residentIdStr = c.resident.toString();
            // If the resident ID is an Auth ID, map it to the User ID
            if (authToUserMap[residentIdStr]) {
                const correctUserId = authToUserMap[residentIdStr];
                await db.collection('complains').updateOne(
                    { _id: c._id },
                    { $set: { resident: correctUserId } }
                );
                console.log(`Fixed Complaint ${c._id}: Resident ${residentIdStr} -> ${correctUserId}`);
                fixedCount++;
            }
        }
    }

    console.log(`Total complaints updated: ${fixedCount}`);

    await mongoose.disconnect();
}

fixComplaints().catch(console.error);
