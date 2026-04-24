const Inventory = require("./model/Inventory");

// Pre-seeded common materials for all complaint categories
const defaultItems = [
  // Plumbing
  { name: "PVC Pipe (1m)",     category: "Plumbing",   unit: "pcs", quantity: 20, minQuantity: 5, description: "High-pressure 1-inch ASTM PVC pipe used for mainstream water line repairs and extensions." },
  { name: "Tap Washer",        category: "Plumbing",   unit: "pcs", quantity: 30, minQuantity: 10, description: "Standard rubber O-ring washers to prevent basic faucet and showerhead leaks." },
  { name: "PVC Fitting",       category: "Plumbing",   unit: "pcs", quantity: 25, minQuantity: 8, description: "L-shaped and T-shaped PVC junction fittings for routing new plumbing lines." },
  { name: "Sealant Tape",      category: "Plumbing",   unit: "rolls",quantity: 15, minQuantity: 5, description: "Teflon plumbing tape for wrapping threads and creating watertight seals on metal/PVC joints." },
  { name: "Water Tap",         category: "Plumbing",   unit: "pcs", quantity: 10, minQuantity: 3, description: "Standard brass-finish bibcock tap for washrooms and exterior utility sinks." },

  // Electrical
  { name: "LED Bulb 9W",       category: "Electrical", unit: "pcs", quantity: 20, minQuantity: 5, description: "Energy-efficient 9-watt cool white LED bulb for common areas and corridors." },
  { name: "Switch Board",      category: "Electrical", unit: "pcs", quantity: 10, minQuantity: 3, description: "Modular 4-way switchboard panel with dual socket cutouts for apartment replacements." },
  { name: "Electric Wire (m)", category: "Electrical", unit: "m",   quantity: 50, minQuantity: 10, description: "Heavy-duty 2.5 sq mm copper insulated wiring for mains and high-load appliances." },
  { name: "MCB Breaker",       category: "Electrical", unit: "pcs", quantity: 8,  minQuantity: 2, description: "16 Amp Miniature Circuit Breaker for protecting individual distribution board circuits." },
  { name: "Socket Outlet",     category: "Electrical", unit: "pcs", quantity: 12, minQuantity: 4, description: "Standard 3-pin 6A/16A universal socket for wall mounting." },

  // Carpentry
  { name: "Wood Screws",       category: "Carpentry",  unit: "pcs", quantity: 100,minQuantity: 20, description: "Assorted length galvanized steel wood screws for furniture repair and door hinges." },
  { name: "Door Hinge",        category: "Carpentry",  unit: "pcs", quantity: 20, minQuantity: 5, description: "Stainless steel 4-inch butt hinges for repairing main doors and heavy cabinet panels." },
  { name: "Door Handle",       category: "Carpentry",  unit: "pcs", quantity: 8,  minQuantity: 2, description: "Lever-action brushed steel door handle with internal latch mechanism." },
  { name: "Sandpaper Sheet",   category: "Carpentry",  unit: "pcs", quantity: 15, minQuantity: 5, description: "120-grit commercial sandpaper sheets for smoothing rough wood edges before polishing." },
  { name: "Wood Polish",       category: "Carpentry",  unit: "L",   quantity: 5,  minQuantity: 2, description: "Clear polyurethane wood polish and sealer for restoring dull wooden surfaces and cabinets." },

  // Cleaning
  { name: "Floor Cleaner",     category: "Cleaning",   unit: "L",   quantity: 10, minQuantity: 3, description: "Industrial-grade concentrated pine floor cleaner for mopping active lobbies and corridors." },
  { name: "Garbage Bags",      category: "Cleaning",   unit: "pcs", quantity: 50, minQuantity: 10, description: "Heavy-duty ultra-thick black refuse sacks for central garbage disposal units." },
  { name: "Mop Head",          category: "Cleaning",   unit: "pcs", quantity: 5,  minQuantity: 2, description: "Replacement cotton string mop heads for daily janitorial cleaning tasks." },
  { name: "Disinfectant",      category: "Cleaning",   unit: "L",   quantity: 8,  minQuantity: 2, description: "Hospital-grade surface disinfectant for sanitizing elevator buttons and handrails." },

  // Security
  { name: "Door Lock",         category: "Security",   unit: "pcs", quantity: 6,  minQuantity: 2, description: "Heavy-duty mortise lock cylinder for securing resident main doors." },
  { name: "Door Bolt",         category: "Security",   unit: "pcs", quantity: 10, minQuantity: 3, description: "Sliding brass tower bolt for interior locking of doors and windows." },
  { name: "Door Chain",        category: "Security",   unit: "pcs", quantity: 8,  minQuantity: 2, description: "Reinforced steel security door chain guard for safe visitor verification." },

  // General
  { name: "Cement (kg)",       category: "General",    unit: "kg",  quantity: 30, minQuantity: 10, description: "Portland grey cement mix for patching structural cracks and masonry repairs." },
  { name: "Wall Paint (L)",    category: "General",    unit: "L",   quantity: 10, minQuantity: 3, description: "White semi-gloss acrylic emulsion paint for touching up common area scuffs." },
  { name: "Putty",             category: "General",    unit: "kg",  quantity: 10, minQuantity: 3, description: "Wall care putty paste for filling nail holes and levelling uneven wall surfaces." },
  { name: "Adhesive",          category: "General",    unit: "pcs", quantity: 8,  minQuantity: 2, description: "Industrial strength synthetic resin adhesive for binding wood, laminates, and veneers." },
];

// Insert or update descriptions
const seedInventory = async () => {
  for (const item of defaultItems) {
    // Upsert the whole item, but ensure description is patched
    await Inventory.updateOne(
      { name: item.name },
      { 
        $setOnInsert: { category: item.category, unit: item.unit, minQuantity: item.minQuantity, quantity: item.quantity },
        $set: { description: item.description }
      },
      { upsert: true }
    );
  }
  
  // Backfill any other custom items the user created that have no description
  await Inventory.updateMany({ description: { $exists: false } }, { $set: { description: "Miscellaneous supply." } });
  
  console.log("[Inventory] Seeded and updated descriptions for", defaultItems.length, "items");
};

module.exports = seedInventory;