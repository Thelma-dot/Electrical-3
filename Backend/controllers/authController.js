const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { run, get } = require("../config/db-sqlite");
const { generateResetToken } = require("../utils/passwordReset");
const { validatePassword, validateEmail } = require("../utils/validators");
require("dotenv").config({ path: require("path").join(__dirname, "..", "config.env") });

// Login
exports.login = async (req, res) => {
  try {
    console.log('🔍 Login request received:', {
      body: req.body,
      contentType: req.headers['content-type'],
      method: req.method,
      url: req.url
    });
    
    // Accept both staffid and staff_id field names for compatibility
    const staffid = req.body.staffid || req.body.staff_id;
    const { password } = req.body;

    // Validation
    if (!staffid || !password) {
      console.log('❌ Validation failed:', { staffid: !!staffid, password: !!password, staffidValue: staffid, passwordValue: password, requestBody: req.body });
      return res
        .status(400)
        .json({ error: "Staff ID and password are required" });
    }

    // Find user
    const user = await get("SELECT * FROM users WHERE staff_id = ?", [staffid]);
    if (!user) {
      // Log failed login attempt (user not found)
      try {
        await run(
          "INSERT INTO login_logs (user_id, staff_id, login_type, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?, ?)",
          [null, staffid, 'unknown', req.ip || 'unknown', req.headers['user-agent'] || 'unknown', 0]
        );
      } catch (logError) {
        console.error("Failed to log failed login:", logError);
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log failed login attempt (wrong password)
      try {
        await run(
          "INSERT INTO login_logs (user_id, staff_id, login_type, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?, ?)",
          [user.id, user.staff_id, user.role || 'staff', req.ip || 'unknown', req.headers['user-agent'] || 'unknown', 0]
        );
      } catch (logError) {
        console.error("Failed to log failed login:", logError);
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT token (include role)
    const token = jwt.sign(
      { staffID: user.staff_id, userId: user.id, role: user.role || "staff" },
      process.env.JWT_SECRET || "your_jwt_secret_key_here",
      { expiresIn: process.env.TOKEN_EXPIRY || "24h" }
    );

    // Remove password before sending user data
    const { password: _, ...userData } = user;
    
    // Update last_login
    try { await run("UPDATE users SET last_login = datetime('now') WHERE id = ?", [user.id]); } catch { }
    
    // Log successful login
    try {
      await run(
        "INSERT INTO login_logs (user_id, staff_id, login_type, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?, ?)",
        [user.id, user.staff_id, user.role || 'staff', req.ip || 'unknown', req.headers['user-agent'] || 'unknown', 1]
      );
    } catch (logError) {
      console.error("Failed to log login:", logError);
    }
    
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
    const expiry = new Date(Date.now() + parseInt(process.env.RESET_TOKEN_EXPIRY || "15") * 60 * 1000).toISOString();

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

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await get("SELECT * FROM users WHERE id = ?", [userId]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove sensitive data
    const { password: _, reset_token: __, token_expiry: ___, ...userData } = user;
    
    res.json(userData);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, email, phone } = req.body;

    // Validate input
    if (!fullName || !email) {
      return res.status(400).json({ error: "Full name and email are required" });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if email is already taken by another user
    const existingUser = await get("SELECT id FROM users WHERE email = ? AND id != ?", [email, userId]);
    if (existingUser) {
      return res.status(400).json({ error: "Email is already taken" });
    }

    // Update user profile
    await run(
      "UPDATE users SET full_name = ?, email = ?, phone = ? WHERE id = ?",
      [fullName, email, phone || null, userId]
    );

    // Get updated user data
    const updatedUser = await get("SELECT * FROM users WHERE id = ?", [userId]);
    const { password: _, reset_token: __, token_expiry: ___, ...userData } = updatedUser;

    res.json({ message: "Profile updated successfully", user: userData });
  } catch (err) {
    console.error("Update profile error:", err);
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
    const { name, email, phone, currentPassword, newPassword } = req.body;
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

    const updates = [];
    const params = [];
    if (name !== undefined) { updates.push('name = ?'); params.push(name || null); }
    if (email && validateEmail(email)) { updates.push('email = ?'); params.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone || null); }
    if (updates.length) {
      params.push(req.user.staffID);
      await run(`UPDATE users SET ${updates.join(', ')} WHERE staff_id = ?`, params);
    }

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
