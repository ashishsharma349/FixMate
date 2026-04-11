const express = require("express");
const inventoryControllers = require("../controller/inventory");
const upload = require("../config/multerconfig");

const inventoryRoute = express.Router();
inventoryRoute.use(express.json());

// ── Guard: admin for modifications, staff allowed to GET ───────────
inventoryRoute.use((req, res, next) => {
  if (!req.session.user)
    return res.status(401).json({ error: "Not logged in" });
  
  const role = req.session.user.role;
  if (role === "admin") return next();
  if (role === "staff" && req.method === "GET") return next();

  return res.status(403).json({ error: "Forbidden: Not authorized" });
});

// ── CRUD + restock ───────────────────────────────────────────────────────────
inventoryRoute.get("/",                 inventoryControllers.getAll);
inventoryRoute.post("/",                inventoryControllers.addItem);
inventoryRoute.put("/:itemId",          inventoryControllers.updateItem);
inventoryRoute.delete("/:itemId",       inventoryControllers.deleteItem);
inventoryRoute.post("/restock",         upload.single("billImage"), inventoryControllers.restock);
inventoryRoute.get("/low-stock",        inventoryControllers.getLowStock);

module.exports = inventoryRoute;