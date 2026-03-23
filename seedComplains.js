const mongoose = require("mongoose");
require("dotenv").config();

const Complain = require("./model/Complain");
const User = require("./model/User");

const seedComplains = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/fixmateDB");
    console.log("Connected to MongoDB for Seeding...");

    // Find any user to bind complaints to
    const resident = await User.findOne({});
    if (!resident) {
      console.log("❌ No residents found in the database. Please register a resident first.");
      process.exit(1);
    }

    const dummyComplaints = [
      {
        title: "Pipe bursting in washroom",
        category: "Plumbing",
        priority: "Emergency",
        description: "The sink pipe completely snapped and water is gushing all over the bathroom floor. Please send a plumber immediately!",
        status: "Pending",
        image_url: "/uploads/demo-plumbing.jpg",
        resident: resident._id,
      },
      {
        title: "Main hallway light flickering",
        category: "Electrical",
        priority: "Medium",
        description: "The third light near the elevator on the 4th floor has been flickering since yesterday and making a buzzing noise.",
        status: "Assigned",
        image_url: "/uploads/demo-electrical.jpg",
        resident: resident._id,
      },
      {
        title: "Broken wardrobe hinge",
        category: "Carpentry",
        priority: "Low",
        description: "One of the hinges on my master bedroom wardrobe has come off. Needs to be screwed back or replaced.",
        status: "Pending",
        image_url: "/uploads/demo-carpentry.jpg",
        resident: resident._id,
      },
      {
        title: "Garbage piled up near back exit",
        category: "Cleaning",
        priority: "High",
        description: "The trash bin near the rear emergency exit is overflowing and causing a horrible smell across the entire corridor.",
        status: "InProgress",
        image_url: "/uploads/demo-cleaning.jpg",
        resident: resident._id,
      },
      {
        title: "Main door lock jammed",
        category: "Security",
        priority: "Emergency",
        description: "My front door lock is completely jammed midway. I cannot lock the door and cannot leave the apartment.",
        status: "Pending",
        image_url: "/uploads/demo-security.jpg",
        resident: resident._id,
      },
      {
        title: "Water seepage on ceiling",
        category: "General",
        priority: "High",
        description: "There's a massive yellow water stain developing on my living room ceiling. I think the apartment above me has a leak.",
        status: "Pending",
        image_url: "/uploads/demo-ceiling.jpg",
        resident: resident._id,
      }
    ];

    // Clear old complaints to keep it clean, or just add them
    // await Complain.deleteMany({});
    await Complain.insertMany(dummyComplaints);
    
    console.log(`✅ Successfully seeded ${dummyComplaints.length} realistic complaints!`);
    process.exit(0);

  } catch (err) {
    console.error("Error seeding complaints:", err);
    process.exit(1);
  }
};

seedComplains();
