const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sqliteDb = require("./config/db-sqlite");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test login endpoint
app.post("/api/auth/login", async (req, res) => {
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
      "your_jwt_secret_key_here",
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
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "UP" });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(
    'Try: curl -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d \'{"staffid":"h2412031","password":"password1"}\''
  );
});
