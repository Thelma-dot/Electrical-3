const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create database file in the project root
const dbPath = path.join(__dirname, "..", "electrical_management.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
    initializeTables();
  }
});

function initializeTables() {
  // Create users table
  db.run(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      reset_token TEXT,
      token_expiry TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.error("Error creating users table:", err.message);
      } else {
        console.log("✅ Users table created/verified");
      }
    }
  );

  // Create reports table
  db.run(
    `
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
  `,
    (err) => {
      if (err) {
        console.error("Error creating reports table:", err.message);
      } else {
        console.log("✅ Reports table created/verified");
      }
    }
  );

  // Create inventory table
  db.run(
    `
    CREATE TABLE IF NOT EXISTS inventory (
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
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,
    (err) => {
      if (err) {
        console.error("Error creating inventory table:", err.message);
      } else {
        console.log("✅ Inventory table created/verified");
      }
    }
  );

  // Create toolbox table
  db.run(
    `
    CREATE TABLE IF NOT EXISTS toolbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tool_name TEXT NOT NULL,
      tool_type TEXT,
      status TEXT DEFAULT 'Available',
      location TEXT,
      assigned_to TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,
    (err) => {
      if (err) {
        console.error("Error creating toolbox table:", err.message);
      } else {
        console.log("✅ Toolbox table created/verified");
      }
    }
  );

  // Create settings table
  db.run(
    `
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      setting_key TEXT NOT NULL,
      setting_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, setting_key),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,
    (err) => {
      if (err) {
        console.error("Error creating settings table:", err.message);
      } else {
        console.log("✅ Settings table created/verified");
      }
    }
  );
}

// Promisify database operations
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

module.exports = {
  db,
  run,
  get,
  all,
};
