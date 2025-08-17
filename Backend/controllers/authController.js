const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { run, get } = require("../config/database");
const { generateResetToken } = require("../utils/passwordReset");
const { validatePassword, validateEmail } = require("../utils/validators");

// Login
exports.login = async (req, res) => {
  try {
    const { staffid, password } = req.body;

    // Validation
    if (!staffid || !password) {
      return res
        .status(400)
        .json({ error: "Staff ID and password are required" });
    }

    // Find user
    const user = await get("SELECT * FROM users WHERE staff_id = ?", [staffid]);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { staffID: user.staff_id, userId: user.id },
      process.env.JWT_SECRET || "your_jwt_secret_key_here",
      { expiresIn: "24h" }
    );

    // Remove password before sending user data
    const { password: _, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Request Password Reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { staffid } = req.body;
    if (!staffid) {
      return res.status(400).json({ error: "Staff ID is required" });
    }

    const user = await get("SELECT * FROM users WHERE staff_id = ?", [staffid]);
    if (!user) {
      return res.status(404).json({ error: "Staff ID not found" });
    }

    const token = generateResetToken();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    await run(
      "UPDATE users SET reset_token = ?, token_expiry = ? WHERE staff_id = ?",
      [token, expiry, staffid]
    );

    // For now, return token in response (in production, send email)
    res.json({ message: "Password reset token generated", token });
  } catch (err) {
    console.error("Request reset error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { staffid, token, newPassword } = req.body;

    if (!staffid || !token || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters, include a number and an uppercase letter",
      });
    }

    const user = await get(
      'SELECT * FROM users WHERE reset_token = ? AND token_expiry > datetime("now")',
      [token]
    );

    if (!user || user.staff_id !== staffid) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await run(
      "UPDATE users SET password = ?, reset_token = NULL, token_expiry = NULL WHERE staff_id = ?",
      [hashedPassword, staffid]
    );

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await get("SELECT * FROM users WHERE staff_id = ?", [
      req.user.staffID,
    ]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password, reset_token, token_expiry, ...userData } = user;
    res.json(userData);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await get("SELECT * FROM users WHERE staff_id = ?", [
      req.user.staffID,
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update password if requested
    if (newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await run("UPDATE users SET password = ? WHERE staff_id = ?", [
        hashedPassword,
        req.user.staffID,
      ]);
    }

    // Update email if valid
    if (email && validateEmail(email)) {
      await run("UPDATE users SET email = ? WHERE staff_id = ?", [
        email,
        req.user.staffID,
      ]);
    }

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
