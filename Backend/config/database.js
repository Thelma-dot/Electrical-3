const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

// Database file path
const dbPath = path.join(__dirname, "..", "electrical_management.db");

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

// Initialize database tables
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");

    // Create tables
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        reset_token TEXT,
        token_expiry TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Reports table
      `CREATE TABLE IF NOT EXISTS reports (
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
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Inventory table
      `CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_type TEXT NOT NULL,
        status TEXT DEFAULT 'New',
        size TEXT,
        serial_number TEXT,
        date TEXT,
        location TEXT,
        issued_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Toolbox table
      `CREATE TABLE IF NOT EXISTS toolbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tool_name TEXT NOT NULL,
        tool_type TEXT,
        status TEXT DEFAULT 'Available',
        location TEXT,
        assigned_to TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        setting_key TEXT NOT NULL,
        setting_value TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, setting_key),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
    ];

    let completed = 0;
    const total = tables.length;

    tables.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`❌ Error creating table ${index + 1}:`, err.message);
          reject(err);
        } else {
          completed++;
          console.log(`✅ Table ${index + 1} created/verified`);

          if (completed === total) {
            console.log("🎉 Database initialization completed!");
            insertDemoUsers().then(resolve).catch(reject);
          }
        }
      });
    });
  });
}

// Insert demo users
async function insertDemoUsers() {
  const demoUsers = [
    { staffID: "h2412031", password: "password1" },
    { staffID: "h2402117", password: "password2" },
    { staffID: "h2402123", password: "password3" },
    { staffID: "h2402140", password: "password4" },
  ];

  for (const user of demoUsers) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await run(
        "INSERT OR IGNORE INTO users (staff_id, password) VALUES (?, ?)",
        [user.staffID, hashedPassword]
      );
      console.log(`✅ Demo user added: ${user.staffID}`);
    } catch (error) {
      console.log(`⚠️ Demo user ${user.staffID} already exists`);
    }
  }
}

// Database helper functions
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function close() {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed");
      }
      resolve();
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,
  close,
  initializeDatabase,
};
