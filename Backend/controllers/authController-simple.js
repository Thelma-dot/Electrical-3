const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sqliteDb = require("../config/db-sqlite");

// Simple login function
exports.login = async (req, res) => {
  try {
    console.log("Login request received:", req.body);

    const { staffid, password } = req.body;

    // Validation
    if (!staffid || !password) {
      console.log("Missing credentials");
      return res
        .status(400)
        .json({ error: "Staff ID and password are required" });
    }

    console.log("Looking for user:", staffid);

    // Find user directly
    const user = await sqliteDb.get("SELECT * FROM users WHERE staff_id = ?", [
      staffid,
    ]);

    if (!user) {
      console.log("User not found");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("User found, verifying password...");

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password verification failed");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("Password verified, creating token...");

    // Create JWT token
    const token = jwt.sign(
      { staffID: user.staff_id },
      process.env.JWT_SECRET || "your_jwt_secret_key_here",
      { expiresIn: "1h" }
    );

    // Remove password before sending user data
    const { password: _, ...userData } = user;

    console.log("Login successful, sending response");
    res.json({ token, user: userData });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
