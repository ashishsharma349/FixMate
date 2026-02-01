const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InventorySchema = new Schema({
    itemName: { type: String, required: true },
    category: { type: String, enum: ['Electrical', 'Plumbing', 'Hardware', 'Cleaning'] },
    quantity: { type: Number, default: 0 },
    unitPrice: { type: Number, required: true }, // Cost per single item
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Inventory", InventorySchema);