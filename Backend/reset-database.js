const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database path
const dbPath = path.join(__dirname, "electrical_management.db");

console.log("🗑️ Resetting database...");
console.log("📁 Database path:", dbPath);

// Delete existing database file
const fs = require('fs');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log("✅ Old database file deleted");
}

// Create new database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error creating new database:", err.message);
    return;
  }
  console.log("✅ New database created");
  
  // Create inventory table with correct schema
  db.run(`
    CREATE TABLE inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_type TEXT NOT NULL,
      status TEXT NOT NULL,
      size TEXT NOT NULL,
      serial_number TEXT NOT NULL UNIQUE,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      issued_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error("❌ Error creating inventory table:", err.message);
    } else {
      console.log("✅ Inventory table created with correct schema");
    }
    
    // Create users table
    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        email TEXT,
        phone TEXT,
        role TEXT DEFAULT 'staff',
        last_login DATETIME,
        reset_token TEXT,
        token_expiry TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error("❌ Error creating users table:", err.message);
      } else {
        console.log("✅ Users table created");
      }
      
      // Create admin user
      const bcrypt = require("bcrypt");
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      
      db.run(`
        INSERT INTO users (staff_id, password, email, role) 
        VALUES (?, ?, ?, ?)
      `, ["admin", hashedPassword, "admin@example.com", "admin"], (err) => {
        if (err) {
          console.error("❌ Error creating admin user:", err.message);
        } else {
          console.log("✅ Admin user created (admin / admin123)");
        }
        
        console.log("\n🎉 Database reset complete!");
        console.log("📋 Login credentials:");
        console.log("   Admin: admin / admin123");
        console.log("\n🚀 You can now restart your server and test inventory creation.");
        
        db.close();
      });
    });
  });
});
