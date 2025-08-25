const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const inventoryController = require("../controllers/inventoryController");

// Get all inventory items for a user
router.get("/", authenticateToken, inventoryController.getUserInventory);

// Get inventory summary statistics for dashboard
router.get("/summary", authenticateToken, inventoryController.getInventorySummary);

// Get all users' inventory for admin dashboard chart
router.get("/all-users", authenticateToken, inventoryController.getAllUsersInventory);

// Search inventory (must come before /:id route)
router.get("/search", authenticateToken, inventoryController.searchInventory);

// Get a specific inventory item by ID
router.get("/:id", authenticateToken, inventoryController.getInventoryById);



// Create a new inventory item
router.post("/", authenticateToken, inventoryController.createInventory);

// Update inventory item
router.put("/:id", authenticateToken, inventoryController.updateInventory);

// Delete inventory item
router.delete("/:id", authenticateToken, inventoryController.deleteInventory);

module.exports = router;
