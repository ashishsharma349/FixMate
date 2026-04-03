const Inventory = require("../model/Inventory");

// ── GET ALL inventory items (with optional search) ───────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" }; // case-insensitive search
    if (category && category !== "All") filter.category = category;
    const items = await Inventory.find(filter).sort({ category: 1, name: 1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── ADD new inventory item ───────────────────────────────────────────────────
exports.addItem = async (req, res) => {
  try {
    const { name, category, unit, quantity, minimum, minQuantity, description, unitPrice, supplier, approvedBy, approvedDate } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const existing = await Inventory.findOne({ name });
    if (existing) return res.status(409).json({ error: "Item already exists" });
    const item = await Inventory.create({ name, category, unit, quantity, minQuantity: minQuantity || minimum || 5, description, unitPrice, supplier, approvedBy, approvedDate });
    res.status(201).json({ message: "Item added", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── UPDATE inventory item (name, qty, minimum etc) ───────────────────────────
exports.updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, category, unit, quantity, minimum, minQuantity, description, unitPrice, supplier, approvedBy, approvedDate } = req.body;
    const item = await Inventory.findByIdAndUpdate(
      itemId,
      { $set: { name, category, unit, quantity, minQuantity: minQuantity || minimum, description, unitPrice, supplier, approvedBy, approvedDate, updatedAt: new Date() } },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item updated", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── DELETE inventory item ────────────────────────────────────────────────────
exports.deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await Inventory.findByIdAndDelete(itemId);
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── RESTOCK: manually add quantity to an item ────────────────────────────────
exports.restock = async (req, res) => {
  try {
    const { itemId, addQty } = req.body;
    if (!itemId || !addQty || addQty <= 0)
      return res.status(400).json({ error: "itemId and positive addQty required" });
    const item = await Inventory.findByIdAndUpdate(
      itemId,
      { $inc: { quantity: Number(addQty) }, $set: { updatedAt: new Date() } },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ message: `Restocked +${addQty}`, item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── AUTO-DEDUCT: called internally when staff completes a CommonArea task ────
// materialsUsed = [{ name, qty }] — deducts from inventory for each item
exports.deductMaterials = async (materialsUsed = []) => {
  if (!materialsUsed || materialsUsed.length === 0) return;
  for (const mat of materialsUsed) {
    const item = await Inventory.findOne({ name: mat.name });
    if (!item) continue;
    const newQty = Math.max(0, item.quantity - Math.abs(Number(mat.qty)));
    await Inventory.findOneAndUpdate(
      { name: mat.name },
      { $set: { quantity: newQty, updatedAt: new Date() } }
    );
  }
};

// ── GET low stock items (below minimum) — used by admin dashboard ─────────────
exports.getLowStock = async (req, res) => {
  try {
    // Returns items where current quantity < minimum threshold
    const items = await Inventory.find({ $expr: { $lt: ["$quantity", "$minQuantity"] } }).sort({ quantity: 1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};