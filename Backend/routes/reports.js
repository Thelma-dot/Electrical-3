const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

// Placeholder for reports functionality
router.get("/", authenticateToken, (req, res) => {
  res.json({ message: "Reports endpoint - to be implemented" });
});

router.post("/", authenticateToken, (req, res) => {
  res.json({ message: "Create report - to be implemented" });
});

module.exports = router;
