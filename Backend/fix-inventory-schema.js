const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database file path
const dbPath = path.join(__dirname, "electrical_management.db");

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error opening database:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

// Add missing fields to inventory table
async function fixInventorySchema() {
  return new Promise((resolve, reject) => {
    try {
      console.log("🔧 Fixing inventory table schema...");
      
      // Check if updated_at column exists
      db.get("PRAGMA table_info(inventory)", [], (err, rows) => {
        if (err) {
          console.error("❌ Error checking table info:", err);
          reject(err);
          return;
        }
        
        db.all("PRAGMA table_info(inventory)", [], (err, columns) => {
          if (err) {
            console.error("❌ Error getting table columns:", err);
            reject(err);
            return;
          }
          
          const columnNames = columns.map(col => col.name);
          console.log("📋 Current inventory table columns:", columnNames);
          
          // Add updated_at column if it doesn't exist
          if (!columnNames.includes('updated_at')) {
            console.log("➕ Adding updated_at column...");
            db.run("ALTER TABLE inventory ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
              if (err) {
                console.error("❌ Error adding updated_at column:", err);
              } else {
                console.log("✅ Added updated_at column");
              }
            });
          }
          
          // Add notes column if it doesn't exist
          if (!columnNames.includes('notes')) {
            console.log("➕ Adding notes column...");
            db.run("ALTER TABLE inventory ADD COLUMN notes TEXT", (err) => {
              if (err) {
                console.error("❌ Error adding notes column:", err);
              } else {
                console.log("✅ Added notes column");
              }
            });
          }
          
          // Add last_updated column if it doesn't exist (for display purposes)
          if (!columnNames.includes('last_updated')) {
            console.log("➕ Adding last_updated column...");
            db.run("ALTER TABLE inventory ADD COLUMN last_updated DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
              if (err) {
                console.error("❌ Error adding last_updated column:", err);
              } else {
                console.log("✅ Added last_updated column");
              }
            });
          }
          
          console.log("✅ Inventory table schema fixed!");
          resolve();
        });
      });
      
    } catch (error) {
      console.error("❌ Error fixing inventory schema:", error);
      reject(error);
    }
  });
}

// Run the fix
fixInventorySchema()
  .then(() => {
    console.log("✅ Schema fix completed successfully");
    db.close();
  })
  .catch((error) => {
    console.error("❌ Schema fix failed:", error);
    db.close();
  });
