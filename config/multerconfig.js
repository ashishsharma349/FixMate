require('dotenv').config(); 
const cloudinary = require("cloudinary");
const  CloudinaryStorage  = require("multer-storage-cloudinary"); 
const multer = require("multer");

cloudinary.config({
    cloud_name: "dvos3n9le", 
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "Complains_app",
        allowed_formats: ["jpg", "png", "jpeg"]
    }
});


const upload = multer({ storage: storage });

module.exports = upload;