const sqlite3 = require("sqlite3").verbose();
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "config.env") });

// Database file path
const dbPath = path.join(__dirname, process.env.DB_PATH || "electrical_management.db");

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

async function fixToolboxSchema() {
  return new Promise((resolve, reject) => {
    try {
      console.log("🔧 Checking and fixing toolbox table schema...");
      
      // First, check if toolbox table exists
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='toolbox'", (err, row) => {
        if (err) {
          console.error("❌ Error checking table existence:", err.message);
          return reject(err);
        }
        
        if (!row) {
          console.log("📋 Toolbox table doesn't exist, creating it...");
          createToolboxTable();
        } else {
          console.log("📋 Toolbox table exists, checking schema...");
          checkAndFixSchema();
        }
      });
      
      function createToolboxTable() {
        const createTableSQL = `
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
            hazards TEXT,
            circulars TEXT,
            risk_assessment TEXT,
            permit TEXT,
            remarks TEXT,
            prepared_by TEXT,
            verified_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `;
        
        db.run(createTableSQL, (err) => {
          if (err) {
            console.error("❌ Error creating toolbox table:", err.message);
            return reject(err);
          }
          console.log("✅ Toolbox table created successfully");
          resolve();
        });
      }
      
      function checkAndFixSchema() {
        // Get current table schema
        db.all("PRAGMA table_info(toolbox)", (err, columns) => {
          if (err) {
            console.error("❌ Error getting table schema:", err.message);
            return reject(err);
          }
          
          console.log("📋 Current columns:", columns.map(col => col.name));
          
          // Check if required columns exist
          const requiredColumns = [
            'work_activity', 'date', 'work_location', 'name_company', 
            'sign', 'ppe_no', 'tools_used', 'hazards', 'circulars', 
            'risk_assessment', 'permit', 'remarks', 'prepared_by', 'verified_by'
          ];
          
          const existingColumns = columns.map(col => col.name);
          const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
          
          if (missingColumns.length === 0) {
            console.log("✅ All required columns exist");
            resolve();
            return;
          }
          
          console.log("⚠️ Missing columns:", missingColumns);
          console.log("🔧 Adding missing columns...");
          
          // Add missing columns one by one
          let columnsAdded = 0;
          missingColumns.forEach((columnName, index) => {
            let columnType = 'TEXT';
            if (columnName === 'date') columnType = 'TEXT';
            if (columnName === 'created_at') columnType = 'DATETIME';
            
            const addColumnSQL = `ALTER TABLE toolbox ADD COLUMN ${columnName} ${columnType}`;
            
            db.run(addColumnSQL, (err) => {
              if (err) {
                console.error(`❌ Error adding column ${columnName}:`, err.message);
                // Continue with other columns
              } else {
                console.log(`✅ Added column: ${columnName}`);
              }
              
              columnsAdded++;
              if (columnsAdded === missingColumns.length) {
                console.log("✅ All missing columns added");
                resolve();
              }
            });
          });
        });
      }
      
    } catch (error) {
      console.error("❌ Error in schema fix:", error);
      reject(error);
    }
  });
}

// Run the fix
fixToolboxSchema()
  .then(() => {
    console.log("✅ Toolbox schema fixed successfully");
    db.close((err) => {
      if (err) {
        console.error("❌ Error closing database:", err.message);
      } else {
        console.log("✅ Database connection closed");
      }
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to fix toolbox schema:", error);
    db.close();
    process.exit(1);
  });
