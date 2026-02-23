const Inventory = require("./model/Inventory");

// Pre-seeded common materials for all complaint categories
const defaultItems = [
  // Plumbing
  { name: "PVC Pipe (1m)",     category: "Plumbing",   unit: "pcs", quantity: 20, minimum: 5 },
  { name: "Tap Washer",        category: "Plumbing",   unit: "pcs", quantity: 30, minimum: 10 },
  { name: "PVC Fitting",       category: "Plumbing",   unit: "pcs", quantity: 25, minimum: 8 },
  { name: "Sealant Tape",      category: "Plumbing",   unit: "rolls",quantity: 15, minimum: 5 },
  { name: "Water Tap",         category: "Plumbing",   unit: "pcs", quantity: 10, minimum: 3 },

  // Electrical
  { name: "LED Bulb 9W",       category: "Electrical", unit: "pcs", quantity: 20, minimum: 5 },
  { name: "Switch Board",      category: "Electrical", unit: "pcs", quantity: 10, minimum: 3 },
  { name: "Electric Wire (m)", category: "Electrical", unit: "m",   quantity: 50, minimum: 10 },
  { name: "MCB Breaker",       category: "Electrical", unit: "pcs", quantity: 8,  minimum: 2 },
  { name: "Socket Outlet",     category: "Electrical", unit: "pcs", quantity: 12, minimum: 4 },

  // Carpentry
  { name: "Wood Screws",       category: "Carpentry",  unit: "pcs", quantity: 100,minimum: 20 },
  { name: "Door Hinge",        category: "Carpentry",  unit: "pcs", quantity: 20, minimum: 5 },
  { name: "Door Handle",       category: "Carpentry",  unit: "pcs", quantity: 8,  minimum: 2 },
  { name: "Sandpaper Sheet",   category: "Carpentry",  unit: "pcs", quantity: 15, minimum: 5 },
  { name: "Wood Polish",       category: "Carpentry",  unit: "L",   quantity: 5,  minimum: 2 },

  // Cleaning
  { name: "Floor Cleaner",     category: "Cleaning",   unit: "L",   quantity: 10, minimum: 3 },
  { name: "Garbage Bags",      category: "Cleaning",   unit: "pcs", quantity: 50, minimum: 10 },
  { name: "Mop Head",          category: "Cleaning",   unit: "pcs", quantity: 5,  minimum: 2 },
  { name: "Disinfectant",      category: "Cleaning",   unit: "L",   quantity: 8,  minimum: 2 },

  // Security
  { name: "Door Lock",         category: "Security",   unit: "pcs", quantity: 6,  minimum: 2 },
  { name: "Door Bolt",         category: "Security",   unit: "pcs", quantity: 10, minimum: 3 },
  { name: "Door Chain",        category: "Security",   unit: "pcs", quantity: 8,  minimum: 2 },

  // General
  { name: "Cement (kg)",       category: "General",    unit: "kg",  quantity: 30, minimum: 10 },
  { name: "Wall Paint (L)",    category: "General",    unit: "L",   quantity: 10, minimum: 3 },
  { name: "Putty",             category: "General",    unit: "kg",  quantity: 10, minimum: 3 },
  { name: "Adhesive",          category: "General",    unit: "pcs", quantity: 8,  minimum: 2 },
];

// Insert only items that don't already exist
const seedInventory = async () => {
  for (const item of defaultItems) {
    await Inventory.updateOne({ name: item.name }, { $setOnInsert: item }, { upsert: true });
  }
  console.log("[Inventory] Seeded", defaultItems.length, "items");
};

module.exports = seedInventory;