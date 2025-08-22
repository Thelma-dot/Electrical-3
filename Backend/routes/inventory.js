const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const inventoryController = require("../controllers/inventoryController");

// Get all inventory items for a user
router.get("/", authenticateToken, inventoryController.getUserInventory);

// Create a new inventory item
router.post("/", authenticateToken, inventoryController.createInventory);

// Update inventory item
router.put("/:id", authenticateToken, inventoryController.updateInventory);

// Delete inventory item
router.delete("/:id", authenticateToken, inventoryController.deleteInventory);

// Search inventory
router.get("/search", authenticateToken, inventoryController.searchInventory);

module.exports = router;
