const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

// Placeholder for settings functionality
router.get("/", authenticateToken, (req, res) => {
  res.json({ message: "Settings endpoint - to be implemented" });
});

router.post("/", authenticateToken, (req, res) => {
  res.json({ message: "Update settings - to be implemented" });
});

module.exports = router;
