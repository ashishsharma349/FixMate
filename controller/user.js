const Complain=require("../model/Complain");
const User= require("../model/User");
const Staff = require("../model/staff");
exports.handlePost_fileUpload=async (req,res)=>{
 
if(req.file){
    console.log("[Complain Data] :",req.body);
    console.log("[File Uploaded] :",req.file.asset_id);
    // console.log("[Cloudinary URl :]",req.file.path);
    console.log("[Cloudinary URl :]",req.file.secure_url);
    console.log("File uploaded");
    try{
    const complain={
        image_url:req.file.secure_url,
        title:req.body.title,
        priority:req.body.priority,
        description:req.body.description,
        resident: req.session.user.id,
    }
    await Complain.create(complain);
    res.status(201).send({Message:"Image uploaded :)"})
}
catch(err){
    console.log("[DATABASE UPLOAD ERROR] :",err);
}
}
}// handle file upload


exports.ShowComplains = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) {
      return res.status(401).json({ error: "Not logged in" });
    }
    const filter =
      sessionUser.role === "admin"
        ? {}
        : { resident: sessionUser.id };
    console.log("Filter:", filter);
    const data = await Complain.find(filter);
    console.log("Complain Data:", data);
    res.status(200).json({ complains: data });

  } catch (err) {
    console.error("[Database Error]:", err);
    res.status(500).json({ error: "Database error" });
  }
};



exports.getAllStaffDetails = async (req, res) => {
  try {
    const staff = await Staff.find()
      .populate({
        path: "authId",
        select: "email role"
      });

    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.handleComplainAssign = async (req, res) => {
  try {
    const { staffId, complaintIds } = req.body;
    console.log("[handleComplainAssign] :", req.body);
    if (!staffId || !Array.isArray(complaintIds) || complaintIds.length === 0) {
      return res.status(400).json({ error: "Invalid input data" });
    }
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }
    // Update 
    const updateResult = await Complain.updateMany(
      { _id: { $in: complaintIds } },
      {
        $set: {
          assignedStaff: staffId,
          status: "Assigned"
        }
      }
    );
    await Staff.findByIdAndUpdate(staffId, {
      $set: { isAvailable: false }
    });

    return res.status(200).json({
      message: "Complaints assigned successfully",
      assignedCount: updateResult.modifiedCount
    });

  } catch (error) {
    console.error("Assignment Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
