const express=require("express");
const cookieParser = require('cookie-parser');
const path=require('path');
const app = express();
const seedAdmin=require("./seedAdmin");

/*Routes */
const userRouter=require('./routes/userRoutes');
const adminRouter=require('./routes/adminRoutes');
const authRouter=require('./routes/authRouter');
// const Complain=require("./model/Complain");

/*AuthN and DB */
const session=require('express-session');
const MongoDbStore=require("connect-mongodb-session")(session);
const cors= require("cors");
const mongoose=require("mongoose");



const allowedOrigins=['http://127.0.0.1:5501', 'http://localhost:5501','http://localhost:5500','http://127.0.0.1:5500','http://localhost:5173']
app.use(cors({
    origin:function(origin,callback){
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}))


app.set('view engine', 'ejs');
app.set("views","./views");
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const DB_PATH=process.env.MONGO_URI;
const store= new MongoDbStore({
    uri:DB_PATH,
    collection:'sessions',
})

app.use(session({
    secret: "xyz",
    resave: false,
    saveUninitialized:false,
    store:store,
    // cookie: { 
    //     maxAge: 3600000
    // },
    // rolling:true
}));



app.use("/check-login",(req,res)=>{
  console.log("Verifying User Login State:",req.session.isLoggedIn);
 if (req.session.user) {
    res.json({ 
      isLoggedIn: true,
      role: req.session.user.role// ye undefined jara ha? //fixed!
    });
  } else {
    res.json({ isLoggedIn: false, role: null });
  }
})


app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(express.static("dist"))



app.use(authRouter);
app.use("/users",userRouter); //users=> resident + staff
app.use("/admin",adminRouter);// admin only




mongoose.connect(DB_PATH).then( async ()=>{  
console.log("[Database Name] :",mongoose.connection.name);
console.log("Connected to Mongo DB");
seedAdmin();
// data= await Complain.find()
// console.log(data);
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
}).catch(err=>{
  console.log("Error :"+err);
})

//https://cloud.mongodb.com/v2/6945663825be031afb5cd455#/explorer/69456739bb3db7510c498fa4/demoDB
//https://console.cloudinary.com/app/c-60bb50f541835b7ef225ec07b2fd8a/assets/

//https://github.com/ashishsharma349/WebProjects/tree/master    // github-branch where code is 

//user acc-
// maheshwari@gmail.com
// @Maheshwari21

//admin account-
//@admingmail.com
//admin@123

//staff account-
//kunal@gmail.com
// @Kunal32

//Done
//login
//register
//register complain
//show complains
//assign complains
//