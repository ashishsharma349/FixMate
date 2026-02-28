const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InventorySchema = new Schema({
  name:        { type: String, required: true, unique: true },
  category:    { type: String, enum: ["Plumbing", "Electrical", "Carpentry", "Cleaning", "Security", "General"], default: "General" },
  unit:        { type: String, default: "pcs" },   // pcs, kg, m, L, rolls
  quantity:    { type: Number, default: 0, min: 0 },
  minQuantity: { type: Number, default: 5 },        // below this = low stock alert
  unitPrice:   { type: Number, default: 0 },        // price per unit (NEW)
  supplier:    { type: String, default: "" },       // supplier name (NEW)
  approvedBy:  { type: String, default: "" },       // admin name who approved (NEW)
  approvedDate:{ type: Date },                      // when approved (NEW)
  updatedAt:   { type: Date, default: Date.now },
});

InventorySchema.pre("save", function (next) { this.updatedAt = new Date(); next(); });

module.exports = mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);