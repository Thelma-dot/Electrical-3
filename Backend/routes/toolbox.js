const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");

// Placeholder for toolbox functionality
router.get("/", authenticateToken, (req, res) => {
  res.json({ message: "Toolbox endpoint - to be implemented" });
});

router.post("/", authenticateToken, (req, res) => {
  res.json({ message: "Create tool - to be implemented" });
});

module.exports = router;
