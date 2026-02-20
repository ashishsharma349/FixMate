// const express=require("express");
// const path=require('path');
// const userControllers=require('../controller/user');
// const staffControllers= require("../controller/staff");
// const upload= require("../config/multerconfig");

// const userRoute=express.Router();
// userRoute.use(express.json())
// userRoute.use(express.urlencoded({extended:true}));

// userRoute.use((req, res, next) => {
//   console.log("USER ROUTER:", req.method, req.originalUrl);
//   next();
// });

// //Multer configuration- local storage setup
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, "uploads/");
// //   },
// //   filename: (req, file, cb) => {
// //     const ext = path.extname(file.originalname);
// //     const randomName = Math.random().toString(36).substring(2, 12);
// //     cb(null, randomName + ext);
// //   }
// // });
// // const upload = multer({ storage });


// //Complain file upload route

// userRoute.post('/complains',
//   (req,res,next)=>{
//     console.log("request to upload a image");
//     next();
//   },
//   upload.single("photo"),
//   userControllers.handlePost_fileUpload);

// //Fetch all complains data
// userRoute.get("/All-Complains",userControllers.ShowComplains);

// //Fetch all staff
// userRoute.get("/All-Staff",userControllers.getAllStaffDetails);

// //Assign Complain
// userRoute.patch("/Assign-Complain",userControllers.handleComplainAssign);

// //Fetch Task
// userRoute.get("/Task",staffControllers.fetch_task)
// //multer error
// // userRoute.use((err, req, res, next) => {
// //   if (err instanceof multer.MulterError) {
// //     console.log("MULTER ERROR:", err.message);
// //     return res.status(400).json({ error: err.message });
// //   }

// //   console.log("UNKNOWN ERROR:", err);
// //   res.status(500).json({ error: "Server error" });
// // });

// module.exports=userRoute;

const express = require("express");
const path = require('path');
const userControllers = require('../controller/user');
const staffControllers = require("../controller/staff");
const upload = require("../config/multerconfig");

const userRoute = express.Router();
userRoute.use(express.json());
userRoute.use(express.urlencoded({ extended: true }));

userRoute.use((req, res, next) => {
  console.log("USER ROUTER:", req.method, req.originalUrl);
  next();
});

// ─── Complaint image upload ───────────────────────────────────────────────────
userRoute.post('/complains',
  (req, res, next) => {
    console.log("request to upload a complaint image");
    next();
  },
  upload.single("photo"),
  userControllers.handlePost_fileUpload
);

// ─── Fetch all complaints ─────────────────────────────────────────────────────
userRoute.get("/All-Complains", userControllers.ShowComplains);

// ─── Fetch all staff ──────────────────────────────────────────────────────────
userRoute.get("/All-Staff", userControllers.getAllStaffDetails);

// ─── Assign complaint ─────────────────────────────────────────────────────────
userRoute.patch("/Assign-Complain", userControllers.handleComplainAssign);

// ─── Fetch staff task ─────────────────────────────────────────────────────────
userRoute.get("/Task", staffControllers.fetch_task);

// ─── Profile photo upload (user/staff uploads their own photo) ────────────────
userRoute.post("/profile/photo",
  upload.single("photo"),
  userControllers.handleProfilePhotoUpload
);

module.exports = userRoute;