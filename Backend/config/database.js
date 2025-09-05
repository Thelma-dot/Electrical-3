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
  return new Promise((resolve, reject) => {
    try {
      // Enable foreign keys
      db.run("PRAGMA foreign_keys = ON", (err) => {
        if (err) {
          console.error("❌ Error enabling foreign keys:", err.message);
        } else {
          console.log("✅ Foreign keys enabled");
        }
      });

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
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'Pending',
          priority TEXT DEFAULT 'Medium',
          due_date TEXT,
          assigned_by TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,

        // Login logs table
        `CREATE TABLE IF NOT EXISTS login_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          staff_id TEXT NOT NULL,
          login_type TEXT DEFAULT 'staff',
          ip_address TEXT,
          user_agent TEXT,
          success INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`
      ];

      let tablesCreated = 0;
      const totalTables = tables.length;

      tables.forEach((tableSQL, index) => {
        db.run(tableSQL, (err) => {
          if (err) {
            console.error(`❌ Error creating table ${index + 1}:`, err.message);
            reject(err);
          } else {
            tablesCreated++;
            console.log(`✅ Table ${index + 1} created successfully`);

            if (tablesCreated === totalTables) {
              console.log("✅ All tables created successfully");

              // Demo data creation disabled - start with clean database
              // Only create admin user for system access
              insertDemoUsers()
                .then(() => {
                  console.log("✅ Admin user created successfully");
                  console.log("🎉 Database initialization complete - no sample data created");
                  resolve();
                })
                .catch((err) => {
                  console.error("❌ Error creating admin user:", err);
                  // Don't reject here, as tables are created successfully
                  resolve();
                });
            }
          }
        });
      });
    } catch (error) {
      console.error("❌ Error in database initialization:", error);
      reject(error);
    }
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

// Insert demo data (reports, inventory, tasks, toolbox)
async function insertDemoData() {
  const demoReports = [
    { userID: 2, title: "Electrical Maintenance Report", jobDescription: "Routine electrical maintenance and safety checks", location: "Building A - Floor 1", remarks: "All systems functioning normally" },
    { userID: 3, title: "Circuit Breaker Inspection", jobDescription: "Monthly inspection of main circuit breakers", location: "Main Electrical Room", remarks: "No issues found, all breakers operational" },
    { userID: 4, title: "Equipment Calibration Report", jobDescription: "Calibrate all testing equipment for accuracy", location: "Building C - Storage", remarks: "All equipment calibrated successfully" },
  ];
  const demoInventory = [
    { userID: 2, productType: "UPS", status: "New", size: "3kva", serialNumber: "UPS001", date: "2023-01-01", location: "Main Electrical Room", issuedBy: "Calvin Odzor" },
    { userID: 3, productType: "AVR", status: "Used", size: "6kva", serialNumber: "AVR001", date: "2023-02-01", location: "Building B - Floor 1", issuedBy: "David" },
    { userID: 4, productType: "UPS", status: "New", size: "10kva", serialNumber: "UPS002", date: "2023-03-01", location: "Building C - Main Room", issuedBy: "Collins Oduro" },
  ];
  const demoTasks = [
    { userID: 2, title: "Monthly Safety Inspection", description: "Conduct monthly electrical safety inspection of all buildings", status: "In Progress", priority: "High", dueDate: "2023-10-01", assignedBy: "Calvin Odzor" },
    { userID: 3, title: "Equipment Calibration", description: "Calibrate all testing equipment for accuracy", status: "Pending", priority: "Medium", dueDate: "2023-10-10", assignedBy: "David" },
    { userID: 4, title: "System Maintenance", description: "Perform routine maintenance on electrical systems", status: "Pending", priority: "Low", dueDate: "2023-10-20", assignedBy: "Collins Oduro" },
  ];
  const demoToolbox = [
    { userID: 2, workActivity: "Activity 1", date: "2023-09-01", workLocation: "Location X", nameCompany: "Company A", sign: "Sign 1", ppeNo: "PPE001", toolsUsed: "Tool 1, Tool 2", hazards: "Hazard 1", circulars: "Circular 1", riskAssessment: "Risk 1", permit: "Permit 1", remarks: "Remarks 1", preparedBy: "User A", verifiedBy: "User B" },
    { userID: 2, workActivity: "Activity 2", date: "2023-09-10", workLocation: "Location Y", nameCompany: "Company B", sign: "Sign 2", ppeNo: "PPE002", toolsUsed: "Tool 3, Tool 4", hazards: "Hazard 2", circulars: "Circular 2", riskAssessment: "Risk 2", permit: "Permit 2", remarks: "Remarks 2", preparedBy: "User A", verifiedBy: "User B" },
    { userID: 3, workActivity: "Activity 3", date: "2023-09-20", workLocation: "Location Z", nameCompany: "Company A", sign: "Sign 1", ppeNo: "PPE001", toolsUsed: "Tool 5, Tool 6", hazards: "Hazard 1", circulars: "Circular 1", riskAssessment: "Risk 1", permit: "Permit 1", remarks: "Remarks 1", preparedBy: "User A", verifiedBy: "User B" },
  ];

  for (const report of demoReports) {
    await run(
      "INSERT OR IGNORE INTO reports (user_id, title, job_description, location, remarks) VALUES (?, ?, ?, ?, ?)",
      [report.userID, report.title, report.jobDescription, report.location, report.remarks]
    );
  }
  for (const inventory of demoInventory) {
    await run(
      "INSERT OR IGNORE INTO inventory (user_id, product_type, status, size, serial_number, date, location, issued_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [inventory.userID, inventory.productType, inventory.status, inventory.size, inventory.serialNumber, inventory.date, inventory.location, inventory.issuedBy]
    );
  }
  for (const task of demoTasks) {
    await run(
      "INSERT OR IGNORE INTO tasks (user_id, title, description, status, priority, due_date, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [task.userID, task.title, task.description, task.status, task.priority, task.dueDate, task.assignedBy]
    );
  }
  for (const toolbox of demoToolbox) {
    await run(
      "INSERT OR IGNORE INTO toolbox (user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [toolbox.userID, toolbox.workActivity, toolbox.date, toolbox.workLocation, toolbox.nameCompany, toolbox.sign, toolbox.ppeNo, toolbox.toolsUsed, toolbox.hazards, toolbox.circulars, toolbox.riskAssessment, toolbox.permit, toolbox.remarks, toolbox.preparedBy, toolbox.verifiedBy]
    );
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
