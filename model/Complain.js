const mongoose= require("mongoose");
const Schema= mongoose.Schema;

const ComplainSchema= new Schema({
        image_url:{
        type:String,
        required:true,
        },
        title:{
        type:String,
        required:true,
        },
        status:{
            type:String,
            enum:["Pending","InProgress","Resolved"],
            default:"Pending"
        },
        priority:{
        type:String,
        enum: ["Low", "Medium", "High", "Emergency"],
         required: true
        },
        description:{
        type:String,
        required:true,
        },
        resident:{
        type:Schema.Types.ObjectId,
        ref: "User",
        required:true
        },
        assignedStaff: {
        type: Schema.Types.ObjectId, 
        ref: 'Staff', // This matches the name in your Staff.js file
        default: null  // Empty until an Admin assigns someone
        },
        createdAt:{
        type:Date,
        default:Date.now,
        }
    }
)
module.exports=mongoose.model("Complain",ComplainSchema);
