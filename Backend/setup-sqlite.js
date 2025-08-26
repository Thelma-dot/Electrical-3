const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

// Create database file in the Backend directory
const dbPath = path.join(__dirname, "electrical_management.db");

console.log("🚀 Setting up SQLite database...");
console.log(`📁 Database path: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Connected to SQLite database");
    initializeTables();
  }
});

function initializeTables() {
  console.log("\n📋 Creating database tables...");
  
  // Create users table
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      reset_token TEXT,
      token_expiry TEXT,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creating users table:", err.message);
      } else {
        console.log("✅ Users table created/verified");
      }
    }
  );

  // Create inventory table
  db.run(
    `CREATE TABLE IF NOT EXISTS inventory (
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
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creating inventory table:", err.message);
      } else {
        console.log("✅ Inventory table created/verified");
      }
    }
  );

  // Create reports table
  db.run(
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
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creating reports table:", err.message);
      } else {
        console.log("✅ Reports table created/verified");
      }
    }
  );

  // Create toolbox table
  db.run(
    `CREATE TABLE IF NOT EXISTS toolbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tool_name TEXT NOT NULL,
      tool_type TEXT,
      condition TEXT,
      location TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creating toolbox table:", err.message);
      } else {
        console.log("✅ Toolbox table created/verified");
      }
    }
  );

  // Create tasks table
  db.run(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to INTEGER,
      status TEXT DEFAULT 'Pending',
      priority TEXT DEFAULT 'Medium',
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creating tasks table:", err.message);
      } else {
        console.log("✅ Tasks table created/verified");
        createLoginLogsTable();
      }
    }
  );
}

function createLoginLogsTable() {
  // Create login_logs table for tracking login attempts
  db.run(
    `CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      staff_id TEXT NOT NULL,
      login_type TEXT,
      ip_address TEXT,
      user_agent TEXT,
      success INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        console.error("❌ Error creating login_logs table:", err.message);
      } else {
        console.log("✅ Login logs table created/verified");
        createDemoUser();
      }
    }
  );
}

function createDemoUser() {
  console.log("\n👤 Creating demo user...");
  
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  
  db.run(
    `INSERT OR IGNORE INTO users (staff_id, password, email, role) VALUES (?, ?, ?, ?)`,
    ["admin", hashedPassword, "admin@example.com", "admin"],
    function(err) {
      if (err) {
        console.error("❌ Error creating demo user:", err.message);
      } else {
        if (this.changes > 0) {
          console.log("✅ Demo user created:");
          console.log("   Staff ID: admin");
          console.log("   Password: admin123");
          console.log("   Role: admin");
        } else {
          console.log("ℹ️ Demo user already exists");
        }
        finishSetup();
      }
    }
  );
}

function finishSetup() {
  console.log("\n🎉 SQLite database setup complete!");
  console.log("\n📊 Database Summary:");
  console.log("   ✅ Users table ready");
  console.log("   ✅ Inventory table ready");
  console.log("   ✅ Reports table ready");
  console.log("   ✅ Toolbox table ready");
  console.log("   ✅ Tasks table ready");
  console.log("   ✅ Demo user created");
  
  console.log("\n🚀 Next steps:");
  console.log("   1. Start your server: npm start");
  console.log("   2. Login with admin/admin123");
  console.log("   3. Your data is stored in SQLite");
  
  db.close((err) => {
    if (err) {
      console.error("❌ Error closing database:", err.message);
    } else {
      console.log("✅ Database connection closed");
    }
    process.exit(0);
  });
}
