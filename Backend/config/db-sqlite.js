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
      role TEXT DEFAULT 'staff',
      last_login DATETIME,
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
        createReportsTable();
      }
    }
  );



  // Update existing tables if needed (for schema changes)
  updateTableSchemas();

  // Verify toolbox table structure
  verifyToolboxTable();
}

// Create login_logs table for tracking login attempts
function createLoginLogsTable() {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      staff_id TEXT NOT NULL,
      login_type TEXT DEFAULT 'staff',
      ip_address TEXT,
      user_agent TEXT,
      success INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `,
    (err) => {
      if (err) {
        console.error("Error creating login_logs table:", err.message);
      } else {
        console.log("✅ Login logs table created/verified");
      }
    }
  );
}

// Create reports table
function createReportsTable() {
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
        createInventoryTable();
      }
    }
  );
}

// Create inventory table
function createInventoryTable() {
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
        createToolboxTable();
      }
    }
  );
}

// Create toolbox table
function createToolboxTable() {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS toolbox (
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
      status TEXT DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `,
    (err) => {
      if (err) {
        console.error("Error creating toolbox table:", err.message);
      } else {
        console.log("✅ Toolbox table created/verified");
        createSettingsTable();
      }
    }
  );
}

// Create settings table
function createSettingsTable() {
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
        createTasksTable();
      }
    }
  );
}

// Create tasks table
function createTasksTable() {
  db.run(
    `
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
  `,
    (err) => {
      if (err) {
        console.error("Error creating tasks table:", err.message);
      } else {
        console.log("✅ Tasks table created/verified");
        createLoginLogsTable();
      }
    }
  );
}

// Function to update existing table schemas
function updateTableSchemas() {
  // Check if inventory table needs new columns
  db.all("PRAGMA table_info(inventory)", (err, rows) => {
    if (err) {
      console.error("Error checking inventory table schema:", err.message);
      return;
    }

    const existingColumns = rows.map(row => row.name);

    // Add new columns if they don't exist
    const columnsToAdd = [
      { name: 'item_name', type: 'TEXT' },
      { name: 'category', type: 'TEXT' },
      { name: 'quantity', type: 'INTEGER' },
      { name: 'unit', type: 'TEXT' },
      { name: 'supplier', type: 'TEXT' },
      { name: 'purchase_date', type: 'TEXT' },
      { name: 'expiry_date', type: 'TEXT' },
      { name: 'notes', type: 'TEXT' },
      { name: 'updated_at', type: 'DATETIME' }
    ];

    columnsToAdd.forEach((column) => {
      if (!existingColumns.includes(column.name)) {
        const sql = `ALTER TABLE inventory ADD COLUMN ${column.name} ${column.type}`;
        db.run(sql, (err) => {
          if (err) {
            console.error(`Error adding column ${column.name}:`, err.message);
          } else {
            console.log(`✅ Added column ${column.name} to inventory table`);
          }
        });
      } else {
        console.log(`ℹ️ Column ${column.name} already exists in inventory table`);
      }
    });
  });

  // Check if toolbox table needs status column
  db.all("PRAGMA table_info(toolbox)", (err, rows) => {
    if (err) {
      console.error("Error checking toolbox table schema:", err.message);
      return;
    }

    const existingColumns = rows.map(row => row.name);

    // Check if status column exists
    if (!existingColumns.includes('status')) {
      console.log("🔧 Adding status column to toolbox table...");
      db.run("ALTER TABLE toolbox ADD COLUMN status TEXT DEFAULT 'draft'", (err) => {
        if (err) {
          console.error("Error adding status column to toolbox table:", err.message);
        } else {
          console.log("✅ Status column added to toolbox table");
        }
      });
    } else {
      console.log("✅ Status column already exists in toolbox table");
    }
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
