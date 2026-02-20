const Auth = require("../model/Auth");
const User = require("../model/User");
const Staff = require("../model/staff");
const Complain = require("../model/Complain");

// ─── GET PROFILE (user / staff / admin) ──────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.status(401).json({ error: "Not logged in" });

    const auth = await Auth.findById(sessionUser.id);
    if (!auth) return res.status(404).json({ error: "User not found" });

    if (auth.role === "user") {
      const profile = await User.findOne({ authId: auth._id });
      return res.json({
        role: "user",
        email: auth.email,
        name: profile?.name,
        age: profile?.age,
        phone: profile?.phone,
        photo: profile?.photo ? `/uploads/${profile.photo}` : null,
        createdAt: auth.createdAt,
      });
    }

    if (auth.role === "staff") {
      const profile = await Staff.findOne({ authId: auth._id });
      return res.json({
        role: "staff",
        email: auth.email,
        name: profile?.name,
        phone: profile?.phone,
        department: profile?.department,
        isAvailable: profile?.isAvailable,
        rating: profile?.rating,
        photo: profile?.photo ? `/uploads/${profile.photo}` : null,
        createdAt: auth.createdAt,
      });
    }

    if (auth.role === "admin") {
      const totalUsers = await User.countDocuments();
      const totalStaff = await Staff.countDocuments();
      const totalComplaints = await Complain.countDocuments();
      const pendingComplaints = await Complain.countDocuments({ status: "Pending" });
      const resolvedComplaints = await Complain.countDocuments({ status: "Resolved" });

      return res.json({
        role: "admin",
        email: auth.email,
        name: "Admin",
        createdAt: auth.createdAt,
        stats: {
          totalUsers,
          totalStaff,
          totalComplaints,
          pendingComplaints,
          resolvedComplaints,
        },
      });
    }

  } catch (err) {
    console.error("[getProfile ERROR]:", err);
    res.status(500).json({ error: "Could not fetch profile" });
  }
};