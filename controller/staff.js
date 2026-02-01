const Complain=require("../model/Complain");

exports.fetch_task= async (req,res)=>{
console.log("Request on staff controller fetch_task");    
const sessionUser = req.session.user;
if (!sessionUser) {
      return res.status(401).json({ error: "Not logged in" });
    }

const filter= { assignedStaff: sessionUser.id }
console.log("Filter :",filter);

const data = await Complain.find(filter);
console.log("Complain Data:", data);
res.status(200).json({ complains: data });

}