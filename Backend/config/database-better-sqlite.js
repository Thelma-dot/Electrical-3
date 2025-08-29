const Database = require("better-sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: path.join(__dirname, "..", "config.env") });

// Database file path
const dbPath = path.join(__dirname, "..", process.env.DB_PATH || "electrical_management.db");

// Create database connection
let db;
try {
  db = new Database(dbPath);
  console.log("✅ Connected to SQLite database");
} catch (err) {
  console.error("❌ Error opening database:", err.message);
  process.exit(1);
}

// Initialize database tables
async function initializeDatabase() {
  try {
    // Enable foreign keys
    db.pragma("foreign_keys = ON");
    console.log("✅ Foreign keys enabled");

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
        role TEXT DEFAULT 'staff',
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
        theme TEXT DEFAULT 'light',
        notifications BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'Pending',
        priority TEXT DEFAULT 'Medium',
        due_date TEXT,
        assigned_by TEXT,
        hidden_from_user BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ];

    // Execute table creation
    for (const tableSQL of tables) {
      db.exec(tableSQL);
    }
    console.log("✅ Database tables initialized");

    // Check and add missing columns
    await addMissingColumns();
    
    return true;
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  }
}

// Add missing columns if they don't exist
async function addMissingColumns() {
  try {
    // Check if role column exists in users table
    const userColumns = db.pragma("table_info(users)");
    const hasRole = userColumns.some(col => col.name === 'role');
    
    if (!hasRole) {
      db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'staff'");
      db.exec("UPDATE users SET role = 'staff' WHERE role IS NULL");
      console.log("✅ Added role column to users table");
    }

    // Check if last_login column exists
    const hasLastLogin = userColumns.some(col => col.name === 'last_login');
    if (!hasLastLogin) {
      db.exec("ALTER TABLE users ADD COLUMN last_login DATETIME");
      console.log("✅ Added last_login column to users table");
    }

    // Check if name and phone columns exist
    const hasName = userColumns.some(col => col.name === 'name');
    const hasPhone = userColumns.some(col => col.name === 'phone');
    
    if (!hasName) {
      db.exec("ALTER TABLE users ADD COLUMN name TEXT");
      console.log("✅ Added name column to users table");
    }
    if (!hasPhone) {
      db.exec("ALTER TABLE users ADD COLUMN phone TEXT");
      console.log("✅ Added phone column to users table");
    }

    // Check tasks table for hidden_from_user column
    const taskColumns = db.pragma("table_info(tasks)");
    const hasHiddenFromUser = taskColumns.some(col => col.name === 'hidden_from_user');
    
    if (!hasHiddenFromUser) {
      db.exec("ALTER TABLE tasks ADD COLUMN hidden_from_user BOOLEAN DEFAULT 0");
      console.log("✅ Added hidden_from_user column to tasks table");
    }

  } catch (error) {
    console.error("❌ Error adding missing columns:", error);
  }
}

// Database operation methods
function run(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(params);
    return { success: true, lastID: result.lastInsertRowid, changes: result.changes };
  } catch (error) {
    console.error("❌ Database run error:", error);
    return { success: false, error: error.message };
  }
}

function get(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(params);
  } catch (error) {
    console.error("❌ Database get error:", error);
    return null;
  }
}

function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(params);
  } catch (error) {
    console.error("❌ Database all error:", error);
    return [];
  }
}

// Close database connection
function close() {
  if (db) {
    db.close();
    console.log("✅ Database connection closed");
  }
}

module.exports = {
  db,
  initializeDatabase,
  run,
  get,
  all,
  close
};
