const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();

// Models
const Auth = require("./model/Auth");
const User = require("./model/User");
const Staff = require("./model/staff");
const Payment = require("./model/Payment");
const Complain = require("./model/Complain");
const Inventory = require("./model/Inventory");

const ATLAS_URI = "mongodb+srv://ashish:ashish@cluster0.fkpiarc.mongodb.net/demoDB?appName=Cluster0";

mongoose.connect(ATLAS_URI)
  .then(async () => {
    console.log("Connected to Atlas Database for Export...");
    const data = {
      Auth: await Auth.find({}).select("+password"),
      User: await User.find({}),
      Staff: await Staff.find({}),
      Payment: await Payment.find({}),
      Complain: await Complain.find({}),
      Inventory: await Inventory.find({})
    };
    fs.writeFileSync("atlas_data.json", JSON.stringify(data, null, 2));
    console.log("Data successfully exported to atlas_data.json!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });
