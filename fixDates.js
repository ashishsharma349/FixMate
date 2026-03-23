const mongoose = require("mongoose");
require("dotenv").config();

async function fixDates() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fixmateDB");
  console.log("Connected. Fixing string dates to BSON Dates...");

  const db = mongoose.connection.db;
  const collections = await db.collections();

  for (let collection of collections) {
    const docs = await collection.find({}).toArray();
    for (let doc of docs) {
      let needsUpdate = false;
      const setFields = {};

      for (const [key, val] of Object.entries(doc)) {
        // Quick regex check if it looks like an ISO date string: 2026-03-19T...
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
          setFields[key] = new Date(val);
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await collection.updateOne({ _id: doc._id }, { $set: setFields });
      }
    }
  }

  console.log("✅ Fixed all String dates to proper BSON ISODates!");
  process.exit(0);
}

fixDates().catch(console.error);
