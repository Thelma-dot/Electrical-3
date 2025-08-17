const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

// Placeholder for inventory functionality
router.get("/", authenticateToken, (req, res) => {
  res.json({ message: "Inventory endpoint - to be implemented" });
});

router.post("/", authenticateToken, (req, res) => {
  res.json({ message: "Create inventory item - to be implemented" });
});

module.exports = router;
