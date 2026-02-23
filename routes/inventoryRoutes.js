const express = require("express");
const inventoryControllers = require("../controller/inventory");

const inventoryRoute = express.Router();
inventoryRoute.use(express.json());

// ── Guard: admin only ────────────────────────────────────────────────────────
inventoryRoute.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });
  next();
});

// ── CRUD + restock ───────────────────────────────────────────────────────────
inventoryRoute.get("/",                 inventoryControllers.getAll);
inventoryRoute.post("/",                inventoryControllers.addItem);
inventoryRoute.put("/:itemId",          inventoryControllers.updateItem);
inventoryRoute.delete("/:itemId",       inventoryControllers.deleteItem);
inventoryRoute.post("/restock",         inventoryControllers.restock);
inventoryRoute.get("/low-stock",        inventoryControllers.getLowStock);

module.exports = inventoryRoute;