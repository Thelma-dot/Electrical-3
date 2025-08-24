const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const toolboxController = require("../controllers/toolboxController");

// Get all toolbox items for a user
router.get("/", authenticateToken, toolboxController.getUserToolboxes);

// Get a single toolbox item by ID
router.get("/:id", authenticateToken, toolboxController.getToolboxById);

// Create a new toolbox item
router.post("/", authenticateToken, toolboxController.createToolbox);

// Update toolbox item
router.put("/:id", authenticateToken, toolboxController.updateToolbox);

// Delete toolbox item
router.delete("/:id", authenticateToken, toolboxController.deleteToolbox);

// Admin routes
router.get("/admin/all", authenticateToken, toolboxController.getAllToolboxes);

module.exports = router;
