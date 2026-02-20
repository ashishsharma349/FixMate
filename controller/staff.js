const Complain=require("../model/Complain");

exports.fetch_task = async (req, res) => {
  try {
    const sessionUser = req.session.user;

    if (!sessionUser || sessionUser.role !== "staff") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const staffId = sessionUser.profileId; // this is Staff._id

    const complains = await Complain.find({
      assignedStaff: staffId
    });

    res.status(200).json({ complains });
  } catch (err) {
    console.error("fetch_task error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
