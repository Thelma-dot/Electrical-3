const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validatePassword, validateEmail } = require("../utils/validators");
const { generateResetToken } = require("../utils/passwordReset");
const { sendResetEmail } = require("../utils/emailService");
const { run, get, all } = require("../config/db-sqlite");
const authController = require("../controllers/authController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

// Public routes
router.post("/login", authController.login);
router.post("/request-reset", authController.requestPasswordReset);
router.post("/reset-password", authController.resetPassword);

// Protected routes
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/profile", authenticateToken, authController.updateProfile);

// Admin-only: list users (basic info)
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await all(
            "SELECT id, staff_id, email, role, created_at FROM users ORDER BY created_at DESC"
        );
        res.json(users);
    } catch (err) {
        console.error("List users error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
