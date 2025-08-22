const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: path.join(__dirname, "..", "config.env") });

// Database file path
const dbPath = path.join(__dirname, "..", process.env.DB_PATH || "electrical_management.db");

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
        last_login DATETIME,
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
        work_activity TEXT NOT NULL,
        date TEXT NOT NULL,
        work_location TEXT NOT NULL,
        name_company TEXT NOT NULL,
        sign TEXT NOT NULL,
        ppe_no TEXT NOT NULL,
        tools_used TEXT NOT NULL,
        hazards TEXT,
        circulars TEXT,
        risk_assessment TEXT,
        permit TEXT,
        remarks TEXT,
        prepared_by TEXT,
        verified_by TEXT,
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

      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to INTEGER NOT NULL,
        assigned_by INTEGER NOT NULL,
        priority TEXT DEFAULT 'medium',
        due_date DATETIME,
        status TEXT DEFAULT 'pending',
        hidden_from_user BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
      )`,

      // Login logs table
      `CREATE TABLE IF NOT EXISTS login_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        staff_id TEXT NOT NULL,
        login_type TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        success BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
            ensureUserRoleColumn()
              .then(() => ensureUserLastLoginColumn())
              .then(() => ensureUserNamePhoneColumns())
              .then(() => ensureTaskHiddenColumn())
              .then(() => insertDemoUsers())
              .then(resolve)
              .catch(reject);
          }
        }
      });
    });
  });
}

// Ensure 'role' column exists on users table
function ensureUserRoleColumn() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(users)", [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      const hasRole = rows.some((col) => col.name === "role");
      if (hasRole) {
        // Normalize existing null roles
        db.run("UPDATE users SET role = COALESCE(role, 'staff')", [], (updErr) => {
          if (updErr) return reject(updErr);
          resolve();
        });
        return;
      }
      db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'staff'", [], (alterErr) => {
        if (alterErr) return reject(alterErr);
        // Backfill any nulls just in case
        db.run("UPDATE users SET role = 'staff' WHERE role IS NULL", [], (updErr) => {
          if (updErr) return reject(updErr);
          console.log("🛠️ Added 'role' column to users table");
          resolve();
        });
      });
    });
  });
}

// Ensure 'last_login' column exists on users table
function ensureUserLastLoginColumn() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(users)", [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      const hasCol = rows.some((col) => col.name === "last_login");
      if (hasCol) return resolve();
      db.run("ALTER TABLE users ADD COLUMN last_login DATETIME", [], (alterErr) => {
        if (alterErr) return reject(alterErr);
        console.log("🛠️ Added 'last_login' column to users table");
        resolve();
      });
    });
  });
}

// Ensure 'name' and 'phone' columns exist on users table
function ensureUserNamePhoneColumns() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(users)", [], (err, rows) => {
      if (err) return reject(err);
      const hasName = rows.some(col => col.name === 'name');
      const hasPhone = rows.some(col => col.name === 'phone');
      const tasks = [];
      if (!hasName) tasks.push(new Promise((res, rej) => db.run("ALTER TABLE users ADD COLUMN name TEXT", [], (e) => e ? rej(e) : res())));
      if (!hasPhone) tasks.push(new Promise((res, rej) => db.run("ALTER TABLE users ADD COLUMN phone TEXT", [], (e) => e ? rej(e) : res())));
      Promise.all(tasks).then(() => resolve()).catch(reject);
    });
  });
}

// Ensure 'hidden_from_user' column exists on tasks table
function ensureTaskHiddenColumn() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info(tasks)", [], (err, rows) => {
      if (err) return reject(err);
      const hasHiddenColumn = rows.some(col => col.name === 'hidden_from_user');
      if (hasHiddenColumn) return resolve();

      db.run("ALTER TABLE tasks ADD COLUMN hidden_from_user BOOLEAN DEFAULT 0", [], (alterErr) => {
        if (alterErr) return reject(alterErr);
        console.log("🛠️ Added 'hidden_from_user' column to tasks table");
        resolve();
      });
    });
  });
}

// Insert demo users
async function insertDemoUsers() {
  const demoUsers = [
    { staffID: "admin", password: "admin123", role: "admin" },
    { staffID: "h2412031", password: "password1", role: "staff" },
    { staffID: "h2402117", password: "password2", role: "staff" },
    { staffID: "h2402123", password: "password3", role: "staff" },
    { staffID: "h2402140", password: "password4", role: "staff" },
  ];

  for (const user of demoUsers) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
      await run(
        "INSERT OR IGNORE INTO users (staff_id, password, role) VALUES (?, ?, ?)",
        [user.staffID, hashedPassword, user.role]
      );
      // Ensure role is set to desired value for demo users
      await run(
        "UPDATE users SET role = ? WHERE staff_id = ? AND (role IS NULL OR role <> ?)",
        [user.role, user.staffID, user.role]
      );
      // Force-set admin password to ensure known credentials
      if (user.staffID === 'admin') {
        await run(
          "UPDATE users SET password = ?, role = 'admin' WHERE staff_id = 'admin'",
          [hashedPassword]
        );
      }
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
