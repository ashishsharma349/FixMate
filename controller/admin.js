const rootDir=require('../utils/pathUtil');
const path=require("path");

exports.handle_get=(req,res)=>{
console.log("Get request on Admin Route");
res.sendFile(path.join(rootDir,'views','admin.html'));
}

