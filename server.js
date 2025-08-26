const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// ====================== Middleware ======================
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for production deployment
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(
  cors({
    origin: [
      "https://electrical-management-system.onrender.com",
      "http://localhost:5500",
      "http://localhost:3000",
      "http://localhost:8080",
      "http://127.0.0.1:5500",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:8080"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ====================== Static Files ======================
// Serve frontend files
app.use(express.static(path.join(__dirname, "Frontend")));

// ====================== Database Connection ======================
const sqlite3 = require("sqlite3").verbose();
const dbPath = path.join(__dirname, "Backend", "electrical_management.db");
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      reset_token TEXT,
      token_expiry TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create inventory table
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      category TEXT,
      product_type TEXT,
      quantity INTEGER DEFAULT 1,
      unit TEXT DEFAULT 'piece',
      size TEXT,
      serial_number TEXT,
      status TEXT DEFAULT 'Available',
      date TEXT,
      location TEXT,
      supplier TEXT,
      purchase_date TEXT,
      expiry_date TEXT,
      issued_by TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create reports table
  db.run(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      job_description TEXT,
      location TEXT,
      remarks TEXT,
      report_date TEXT,
      report_time TEXT,
      tools_used TEXT,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create toolbox table
  db.run(`
    CREATE TABLE IF NOT EXISTS toolbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tool_name TEXT NOT NULL,
      tool_type TEXT,
      condition TEXT,
      location TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Create tasks table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to INTEGER,
      status TEXT DEFAULT 'Pending',
      priority TEXT DEFAULT 'Medium',
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `);

  console.log("✅ Database tables initialized");
});

// ====================== Routes ======================

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    database: "SQLite",
    platform: "Render"
  });
});

// Test Endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working on Render!" });
});

// Auth Routes
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Login route
app.post("/api/auth/login", (req, res) => {
  const { staff_id, password } = req.body;

  if (!staff_id || !password) {
    return res.status(400).json({ error: "Staff ID and password are required" });
  }

  db.get("SELECT * FROM users WHERE staff_id = ?", [staff_id], (err, user) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error("Password comparison error:", err);
        return res.status(500).json({ error: "Authentication error" });
      }

      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, staff_id: user.staff_id, role: user.role },
        process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production",
        { expiresIn: "24h" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          staff_id: user.staff_id,
          email: user.email,
          role: user.role
        }
      });
    });
  });
});

// Profile route
app.get("/api/auth/profile", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_super_secret_jwt_key_change_this_in_production");
    res.json({ message: "Profile accessed", user: decoded });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Inventory Routes
app.get("/api/inventory", (req, res) => {
  db.all("SELECT * FROM inventory ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

app.post("/api/inventory", (req, res) => {
  const { user_id, item_name, category, product_type, quantity, unit, size, serial_number, status, date, location, supplier, purchase_date, expiry_date, issued_by, notes } = req.body;

  db.run(
    "INSERT INTO inventory (user_id, item_name, category, product_type, quantity, unit, size, serial_number, status, date, location, supplier, purchase_date, expiry_date, issued_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [user_id, item_name, category, product_type, quantity, unit, size, serial_number, status, date, location, supplier, purchase_date, expiry_date, issued_by, notes],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to create inventory item" });
      }
      res.json({ id: this.lastID, message: "Inventory item created successfully" });
    }
  );
});

// Reports Routes
app.get("/api/reports", (req, res) => {
  db.all("SELECT * FROM reports ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

app.post("/api/reports", (req, res) => {
  const { user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status } = req.body;

  db.run(
    "INSERT INTO reports (user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to create report" });
      }
      res.json({ id: this.lastID, message: "Report created successfully" });
    }
  );
});

// Toolbox Routes
app.get("/api/toolbox", (req, res) => {
  db.all("SELECT * FROM toolbox ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

app.post("/api/toolbox", (req, res) => {
  const { user_id, tool_name, tool_type, condition, location, notes } = req.body;

  db.run(
    "INSERT INTO toolbox (user_id, tool_name, tool_type, condition, location, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [user_id, tool_name, tool_type, condition, location, notes],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to create toolbox item" });
      }
      res.json({ id: this.lastID, message: "Toolbox item created successfully" });
    }
  );
});

// Tasks Routes
app.get("/api/tasks", (req, res) => {
  db.all("SELECT * FROM tasks ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

app.post("/api/tasks", (req, res) => {
  const { title, description, assigned_to, status, priority, due_date } = req.body;

  db.run(
    "INSERT INTO tasks (title, description, assigned_to, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?)",
    [title, description, assigned_to, status, priority, due_date],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to create task" });
      }
      res.json({ id: this.lastID, message: "Task created successfully" });
    }
  );
});

// ====================== Root Route ======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Frontend", "index.html"));
});

// ====================== Error Handling ======================
// 404 Handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 Render Server started successfully!");
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "production"}`);
  console.log(`💾 Database: SQLite (${dbPath})`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
});
