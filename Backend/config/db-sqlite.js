const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create database file in the project root
const dbPath = path.join(__dirname, "..", "electrical_management.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
    initializeDatabase();
  }
});

// Initialize database
function initializeDatabase() {
  console.log("🚀 Starting database initialization...");
  console.log("📁 Database file path:", dbPath);
  console.log("🔧 Current working directory:", process.cwd());

  // Test database connection
  db.get("SELECT 1 as test", (err, row) => {
    if (err) {
      console.error("❌ Database connection test failed:", err.message);
      return;
    }
    console.log("✅ Database connection test successful:", row);

    // Start table creation
    initializeTables();
  });
}

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
        // Initialize users after all tables are created
        initializeUsers();
      }
    }
  );
}

// Initialize users for the system
function initializeUsers() {
  console.log("🔧 Initializing system users...");
  console.log("🔍 Starting user creation process...");

  // Create admin user
  createAdminUser();
}

function createAdminUser() {
  const bcrypt = require("bcrypt");
  const hashedPassword = bcrypt.hashSync("admin123", 10);

  // Check if admin user exists
  db.get("SELECT id FROM users WHERE staff_id = ?", ["admin"], (err, row) => {
    if (err) {
      console.error("❌ Error checking for admin user:", err.message);
      return;
    }

    if (row) {
      console.log("ℹ️ Admin user already exists, updating password...");
      updateAdminPassword();
    } else {
      console.log("🔧 Creating admin user...");
      db.run(
        `INSERT INTO users (staff_id, password, email, role) VALUES (?, ?, ?, ?)`,
        ["admin", hashedPassword, "admin@example.com", "admin"],
        function (err) {
          if (err) {
            console.error("❌ Error creating admin user:", err.message);
          } else {
            console.log("✅ Admin user created successfully!");
          }
          createDemoUsers();
        }
      );
    }
  });
}

function updateAdminPassword() {
  const bcrypt = require("bcrypt");
  const hashedPassword = bcrypt.hashSync("admin123", 10);

  db.run(
    `UPDATE users SET password = ?, role = 'admin' WHERE staff_id = ?`,
    [hashedPassword, "admin"],
    function (err) {
      if (err) {
        console.error("❌ Error updating admin password:", err.message);
      } else {
        console.log("✅ Admin password updated successfully!");
      }
      createDemoUsers();
    }
  );
}

function createDemoUsers() {
  console.log("🔧 Creating demo users...");

  const demoUsers = [
    { staffID: "h2412031", password: "password1" },
    { staffID: "h2402117", password: "password2" },
    { staffID: "h2402123", password: "password3" },
    { staffID: "h2402140", password: "password4" }
  ];

  let usersCreated = 0;

  demoUsers.forEach((user) => {
    const bcrypt = require("bcrypt");
    const hashedPassword = bcrypt.hashSync(user.password, 10);

    db.run(
      `INSERT OR IGNORE INTO users (staff_id, password, role) VALUES (?, ?, ?)`,
      [user.staffID, hashedPassword, "staff"],
      function (err) {
        if (err) {
          console.error(`❌ Error creating user ${user.staffID}:`, err.message);
        } else {
          if (this.changes > 0) {
            console.log(`✅ Created user: ${user.staffID}`);
          } else {
            console.log(`ℹ️ User ${user.staffID} already exists`);
          }
        }

        usersCreated++;
        if (usersCreated === demoUsers.length) {
          finishUserSetup();
        }
      }
    );
  });
}

function finishUserSetup() {
  console.log("\n🎉 User initialization complete!");
  console.log("\n📋 Available Login Credentials:");
  console.log("   Admin: admin / admin123");
  console.log("   Demo: h2412031 / password1");
  console.log("   Demo: h2402117 / password2");
  console.log("   Demo: h2402123 / password3");
  console.log("   Demo: h2402140 / password4");
  console.log("\n🚀 Server is ready to handle requests!");

  // Create sample data for dashboard
  createSampleData();
}

function createSampleData() {
  console.log("🔧 Creating sample data for dashboard...");

  // Create sample reports
  createSampleReports();
}

function createSampleReports() {
  const sampleReports = [
    {
      user_id: 1, // admin user
      title: "Electrical Maintenance - Building A",
      job_description: "Routine electrical maintenance and safety checks",
      location: "Building A - Floor 1",
      remarks: "All systems functioning normally",
      report_date: new Date().toISOString().split('T')[0],
      report_time: new Date().toTimeString().split(' ')[0],
      tools_used: "Multimeter, Screwdriver, Safety Gloves",
      status: "Completed"
    },
    {
      user_id: 1,
      title: "Circuit Breaker Inspection",
      job_description: "Monthly inspection of main circuit breakers",
      location: "Main Electrical Room",
      remarks: "No issues found, all breakers operational",
      report_date: new Date().toISOString().split('T')[0],
      report_time: new Date().toTimeString().split(' ')[0],
      tools_used: "Thermal Camera, Multimeter",
      status: "Completed"
    }
  ];

  let reportsCreated = 0;
  sampleReports.forEach((report) => {
    db.run(
      `INSERT OR IGNORE INTO reports (user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [report.user_id, report.title, report.job_description, report.location, report.remarks, report.report_date, report.report_time, report.tools_used, report.status],
      function (err) {
        if (err) {
          console.error("❌ Error creating sample report:", err.message);
        } else {
          if (this.changes > 0) {
            console.log("✅ Created sample report:", report.title);
          }
        }
        reportsCreated++;
        if (reportsCreated === sampleReports.length) {
          createSampleInventory();
        }
      }
    );
  });
}

function createSampleInventory() {
  const sampleInventory = [
    {
      user_id: 1,
      item_name: "Digital Multimeter",
      category: "Testing Equipment",
      product_type: "Electrical Testing",
      quantity: 5,
      unit: "piece",
      status: "Available",
      location: "Tool Room A"
    },
    {
      user_id: 1,
      item_name: "Safety Gloves",
      category: "Safety Equipment",
      product_type: "Personal Protection",
      quantity: 20,
      unit: "pair",
      status: "Available",
      location: "Safety Storage"
    }
  ];

  let inventoryCreated = 0;
  sampleInventory.forEach((item) => {
    db.run(
      `INSERT OR IGNORE INTO inventory (user_id, item_name, category, product_type, quantity, unit, status, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.user_id, item.item_name, item.category, item.product_type, item.quantity, item.unit, item.status, item.location],
      function (err) {
        if (err) {
          console.error("❌ Error creating sample inventory item:", err.message);
        } else {
          if (this.changes > 0) {
            console.log("✅ Created sample inventory item:", item.item_name);
          }
        }
        inventoryCreated++;
        if (inventoryCreated === sampleInventory.length) {
          createSampleTasks();
        }
      }
    );
  });
}

function createSampleTasks() {
  const sampleTasks = [
    {
      title: "Monthly Safety Inspection",
      description: "Conduct monthly electrical safety inspection of all buildings",
      assigned_to: 1,
      status: "In Progress",
      priority: "High"
    },
    {
      title: "Equipment Calibration",
      description: "Calibrate all testing equipment for accuracy",
      assigned_to: 1,
      status: "Pending",
      priority: "Medium"
    }
  ];

  let tasksCreated = 0;
  sampleTasks.forEach((task) => {
    db.run(
      `INSERT OR IGNORE INTO tasks (title, description, assigned_to, status, priority) VALUES (?, ?, ?, ?, ?)`,
      [task.title, task.description, task.assigned_to, task.status, task.priority],
      function (err) {
        if (err) {
          console.error("❌ Error creating sample task:", err.message);
        } else {
          if (this.changes > 0) {
            console.log("✅ Created sample task:", task.title);
          }
        }
        tasksCreated++;
        if (tasksCreated === sampleTasks.length) {
          console.log("🎉 Sample data creation complete!");

          // Now that all tables and data are created, update table schemas if needed
          console.log("🔧 Updating table schemas...");
          updateTableSchemas();
        }
      }
    );
  });
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
