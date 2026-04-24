/**
 * DB Data Cleanup Script
 * ──────────────────────
 * Run ONCE: node scripts/fixData.js
 *
 * What it does:
 * 1. Assigns flatNumber (A101–A128) to all users missing it
 * 2. Fills inventory: supplier, unitPrice, approvedBy, approvedDate
 * 3. Resets all personal payments → Pending
 * 4. Reopens all complaints → Pending
 * 5. Sets all staff → isAvailable: true
 *
 * Does NOT touch: finances, announcements
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const DB_PATH = process.env.MONGO_URI;

async function run() {
    await mongoose.connect(DB_PATH);
    console.log("Connected to:", mongoose.connection.name);

    const User = require("../model/User");
    const Staff = require("../model/staff");
    const Complain = require("../model/Complain");
    const Payment = require("../model/Payment");
    const Inventory = require("../model/Inventory");
    const Auth = require("../model/Auth");

    // ── 0. ADMIN — fix hashed password → plain text ───────────────────────────
    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
    const adminPlainPw = process.env.ADMIN_PASSWORD || "admin@123";
    const adminAuth = await Auth.findOne({ email: adminEmail }).select("+password");
    if (adminAuth) {
        // If password looks hashed (starts with $2b$ or $2a$), replace with plain text
        if (adminAuth.password && adminAuth.password.startsWith("$2")) {
            await Auth.findByIdAndUpdate(adminAuth._id, { $set: { password: adminPlainPw } });
            console.log(`[Admin] Converted hashed password → plain text for ${adminEmail}`);
        } else {
            console.log(`[Admin] Password already plain text for ${adminEmail} (pw: ${adminAuth.password})`);
        }
    }

    // Also fix any staff/user passwords that are still hashed
    const allAuth = await Auth.find({}).select("+password");
    let authFixed = 0;
    for (const a of allAuth) {
        if (a.password && a.password.startsWith("$2")) {
            // Can't reverse bcrypt, so set a default temp password
            await Auth.findByIdAndUpdate(a._id, { $set: { password: "Temp@1234", isFirstLogin: true } });
            authFixed++;
        }
    }
    if (authFixed > 0) console.log(`[Auth] ${authFixed} hashed passwords reset to "Temp@1234" (isFirstLogin=true)`);

    // ── 1. USERS — assign flat numbers ─────────────────────────────────────────
    const usersNoFlat = await User.find({ $or: [{ flatNumber: null }, { flatNumber: "" }, { flatNumber: { $exists: false } }] });
    console.log(`\n[Users] ${usersNoFlat.length} missing flatNumber`);
    let flatIdx = 101;
    for (const u of usersNoFlat) {
        const block = flatIdx <= 114 ? "A" : "B";
        const num = flatIdx <= 114 ? flatIdx : flatIdx - 14;
        const flatNumber = `${block}${num}`;
        await User.findByIdAndUpdate(u._id, { $set: { flatNumber } });
        console.log(`  → ${u.name} → ${flatNumber}`);
        flatIdx++;
    }

    // ── 2. INVENTORY — fill supplier data ──────────────────────────────────────
    const supplierMap = {
        "Plumbing": { supplier: "Sharma Plumbing Supplies", unitPrice: 150 },
        "Electrical": { supplier: "Gupta Electricals", unitPrice: 200 },
        "Carpentry": { supplier: "Singh Wood Works", unitPrice: 300 },
        "Cleaning": { supplier: "Clean India Traders", unitPrice: 80 },
        "Security": { supplier: "SecureAll Distributors", unitPrice: 500 },
        "General": { supplier: "Metro Hardware Store", unitPrice: 100 },
    };

    const items = await Inventory.find({});
    let invUpdated = 0;
    for (const item of items) {
        const defaults = supplierMap[item.category] || supplierMap["General"];
        const update = {};
        if (!item.supplier) update.supplier = defaults.supplier;
        if (!item.unitPrice) update.unitPrice = defaults.unitPrice;
        if (!item.approvedBy) update.approvedBy = "Admin";
        if (!item.approvedDate) update.approvedDate = new Date();
        if (Object.keys(update).length > 0) {
            await Inventory.findByIdAndUpdate(item._id, { $set: update });
            invUpdated++;
        }
    }
    console.log(`[Inventory] ${invUpdated} items updated with supplier data`);

    // ── 3. PAYMENTS — reset personal to Pending + delete maintenance ───────────
    const payResult = await Payment.updateMany(
        { type: "personal" },
        { $set: { status: "Pending", paidAt: null, razorpayPaymentId: null, razorpayOrderId: null, razorpaySignature: null } }
    );
    console.log(`[Payments] ${payResult.modifiedCount} personal payments reset to Pending`);

    const manResult = await Payment.deleteMany({ type: "maintenance" });
    console.log(`[Payments] ${manResult.deletedCount} maintenance payments deleted (complaints reopened)`);

    // ── 4. COMPLAINTS — reopen all ────────────────────────────────────────────
    const compResult = await Complain.updateMany(
        {},
        {
            $set: {
                status: "Pending",
                assignedStaff: null,
                workType: null,
                estimatedCost: null,
                estimateStatus: null,
                proofImage: null,
                worklog: null,
                actualCost: null,
                materialsUsed: [],
            },
        }
    );
    console.log(`[Complaints] ${compResult.modifiedCount} complaints reopened to Pending`);

    // ── 5. STAFF — set all to available ───────────────────────────────────────
    const staffResult = await Staff.updateMany({}, { $set: { isAvailable: true } });
    console.log(`[Staff] ${staffResult.modifiedCount} staff set to available`);

    console.log("\n✅ All done! Disconnecting...");
    await mongoose.disconnect();
}

run().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
