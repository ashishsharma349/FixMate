// require('dotenv').config(); 
// const cloudinary = require("cloudinary");
// const  CloudinaryStorage  = require("multer-storage-cloudinary"); 
// const multer = require("multer");

// cloudinary.config({
//     cloud_name: "dvos3n9le", 
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: "Complains_app",
//         allowed_formats: ["jpg", "png", "jpeg"]
//     }
// });


// const upload = multer({ storage: storage });

// module.exports = upload;

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Make sure the uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "_" + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpg", "image/jpeg", "image/png"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only jpg, jpeg, png images are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;