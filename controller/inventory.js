const Inventory = require("../model/Inventory");
const Finance = require("../model/finance");

// ── GET ALL inventory items ───────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.category = category;
    const items = await Inventory.find(filter).sort({ name: 1 });
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── ADD new inventory item ───────────────────────────────────────────────────
exports.addItem = async (req, res) => {
  try {
    const { name, category, unit, quantity, minQuantity, description, unitPrice, approvedBy, approvedDate } = req.body;
    if (!name || !unitPrice) return res.status(400).json({ error: "Name and cost per unit required" });
    
    const existing = await Inventory.findOne({ name });
    if (existing) return res.status(409).json({ error: "Item already exists" });

    const item = await Inventory.create({ 
      name, 
      category: category || "General", 
      unit: unit || "pcs", 
      quantity: Number(quantity) || 0, 
      minQuantity: Number(minQuantity) || 5, 
      description, 
      unitPrice: Number(unitPrice), 
      supplier: "Default Supplier",
      approvedBy: approvedBy || (req.session && req.session.user ? req.session.user.email : "Admin"),
      approvedDate: approvedDate ? new Date(approvedDate) : new Date()
    });
    res.status(201).json({ message: "Item added", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ... updateItem and deleteItem stay mostly same but use Default Supplier
exports.updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, category, unit, quantity, minQuantity, description, unitPrice, approvedBy, approvedDate } = req.body;
    
    // Construct exactly what to update
    const updatePayload = { name, category, unit, quantity, minQuantity, description, unitPrice, supplier: "Default Supplier", updatedAt: new Date() };
    if (approvedBy) updatePayload.approvedBy = approvedBy;
    if (approvedDate) updatePayload.approvedDate = new Date(approvedDate);
    
    const item = await Inventory.findByIdAndUpdate(
      itemId,
      { $set: updatePayload },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item updated", item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    await Inventory.findByIdAndDelete(itemId);
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── RESTOCK: with bill and expense creation ──────────────────────────────────
exports.restock = async (req, res) => {
  try {
    const { itemId, addQty, costPerUnit, month, year } = req.body;
    const billImage = req.file ? `/uploads/${req.file.filename}` : null;

    if (!itemId || !addQty || !costPerUnit)
      return res.status(400).json({ error: "itemId, quantity and cost are required" });

    const item = await Inventory.findById(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    const totalCost = Number(addQty) * Number(costPerUnit);

    // 1. Increase inventory quantity and update price
    item.quantity += Number(addQty);
    item.unitPrice = Number(costPerUnit);
    item.updatedAt = new Date();
    item.approvedBy = req.session && req.session.user ? req.session.user.email : "Admin";
    item.approvedDate = new Date();
    await item.save();

    // 2. Create Expense (Pending)
    await Finance.create({
      transactionType: "Expense",
      transactionCategory: "Inventory",
      amount: totalCost,
      status: "Pending", // Admin pays later
      description: `Restock: ${addQty} ${item.unit} of ${item.name}`,
      month: Number(month) || new Date().getMonth() + 1,
      year: Number(year) || new Date().getFullYear(),
      billImage,
      quantity: Number(addQty),
      costPerUnit: Number(costPerUnit),
      handledBy: req.session.user.profileId // Logged by admin
    });

    res.json({ message: "Item restocked and expense created", item });
  } catch (err) {
    console.error("[inventory.restock]:", err);
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