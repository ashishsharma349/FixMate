require('dotenv').config();
const app = require("./app");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.MONGO_URI;

mongoose.connect(DB_PATH).then(() => {
  console.log("[Database Name] :", mongoose.connection.name);
  console.log("Connected to MongoDB");
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Database connection error: " + err);
});
