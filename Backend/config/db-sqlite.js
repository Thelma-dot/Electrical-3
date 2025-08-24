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
  `,
    (err) => {
      if (err) {
        console.error("Error creating inventory table:", err.message);
      } else {
        console.log("✅ Inventory table created/verified");
      }
    }
  );

  // Drop and recreate toolbox table to ensure correct schema
  db.run(`DROP TABLE IF EXISTS toolbox`, (err) => {
    if (err) {
      console.error("Error dropping toolbox table:", err.message);
    } else {
      console.log("🗑️ Old toolbox table dropped");

      // Create toolbox table with correct schema
      db.run(
        `
        CREATE TABLE toolbox (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          work_activity TEXT NOT NULL,
          date TEXT NOT NULL,
          work_location TEXT NOT NULL,
          name_company TEXT NOT NULL,
          sign TEXT NOT NULL,
          ppe_no TEXT NOT NULL,
          tools_used TEXT NOT NULL,
          hazards TEXT NOT NULL,
          circulars TEXT,
          risk_assessment TEXT,
          permit TEXT,
          remarks TEXT,
          prepared_by TEXT NOT NULL,
          verified_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `,
        (err) => {
          if (err) {
            console.error("Error creating toolbox table:", err.message);
          } else {
            console.log("✅ Toolbox table created with correct schema");
          }
        }
      );
    }
  });

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

  // Update existing tables if needed (for schema changes)
  updateTableSchemas();

  // Verify toolbox table structure
  verifyToolboxTable();
}

// Function to update existing table schemas
function updateTableSchemas() {
  // Check if inventory table needs new columns
  db.get("PRAGMA table_info(inventory)", (err, rows) => {
    if (err) {
      console.error("Error checking inventory table schema:", err.message);
      return;
    }

    // Add new columns if they don't exist
    const addColumns = [
      "ALTER TABLE inventory ADD COLUMN item_name TEXT",
      "ALTER TABLE inventory ADD COLUMN category TEXT",
      "ALTER TABLE inventory ADD COLUMN quantity INTEGER DEFAULT 1",
      "ALTER TABLE inventory ADD COLUMN unit TEXT DEFAULT 'piece'",
      "ALTER TABLE inventory ADD COLUMN supplier TEXT",
      "ALTER TABLE inventory ADD COLUMN purchase_date TEXT",
      "ALTER TABLE inventory ADD COLUMN expiry_date TEXT",
      "ALTER TABLE inventory ADD COLUMN notes TEXT",
      "ALTER TABLE inventory ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"
    ];

    addColumns.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error(`Error adding column ${index + 1}:`, err.message);
        }
      });
    });
  });
}

// Function to verify toolbox table structure
function verifyToolboxTable() {
  db.all("PRAGMA table_info(toolbox)", (err, rows) => {
    if (err) {
      console.error("Error checking toolbox table structure:", err.message);
      return;
    }

    console.log("🔍 Toolbox table structure:");
    rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
    });

    // Check if work_activity column exists
    const hasWorkActivity = rows.some(row => row.name === 'work_activity');
    if (hasWorkActivity) {
      console.log("✅ work_activity column found - table structure is correct");
    } else {
      console.error("❌ work_activity column missing - table structure is incorrect");
    }
  });
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
