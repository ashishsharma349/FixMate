const express=require("express");
const path=require('path');
const adminControllers=require('../controller/admin');


adminRoute=express.Router();
adminRoute.use(express.urlencoded());

adminRoute.use((req,res,next)=>{
    // console.log("Admin Router level middleware");
    next();
})
 
adminRoute.get('/',adminControllers.handle_get);


module.exports=adminRoute;

