const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: path.join(__dirname, "..", "config.env") });

// Check if we're running on Vercel
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

let db = null;
let dbType = null;

// Initialize database based on environment
async function initializeDatabase() {
  try {
    if (isVercel) {
      // Use PostgreSQL on Vercel
      await initializePostgreSQL();
    } else {
      // Use SQLite for local development
      await initializeSQLite();
    }
    
    // Create tables
    await createTables();
    console.log("✅ Database initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    return false;
  }
}

// Initialize PostgreSQL for Vercel
async function initializePostgreSQL() {
  try {
    const { Pool } = require('pg');
    
    const pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    db = pool;
    dbType = 'postgresql';
    console.log("✅ Connected to PostgreSQL database");
    
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error);
    throw error;
  }
}

// Initialize SQLite for local development
async function initializeSQLite() {
  try {
    const sqlite3 = require("sqlite3").verbose();
    const dbPath = path.join(__dirname, "..", process.env.DB_PATH || "electrical_management.db");
    
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("❌ Error opening SQLite database:", err.message);
        throw err;
      }
    });
    
    // Enable foreign keys
    db.run("PRAGMA foreign_keys = ON");
    
    dbType = 'sqlite';
    console.log("✅ Connected to SQLite database");
    
  } catch (error) {
    console.error("❌ SQLite initialization failed:", error);
    throw error;
  }
}

// Create database tables
async function createTables() {
  const tables = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id ${dbType === 'postgresql' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      staff_id TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      reset_token TEXT,
      token_expiry TEXT,
      last_login ${dbType === 'postgresql' ? 'TIMESTAMP' : 'DATETIME'},
      role TEXT DEFAULT 'staff',
      created_at ${dbType === 'postgresql' ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'}
    )`,

    // Reports table
    `CREATE TABLE IF NOT EXISTS reports (
      id ${dbType === 'postgresql' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      user_id ${dbType === 'postgresql' ? 'INTEGER' : 'INTEGER'} NOT NULL,
      title TEXT NOT NULL,
      job_description TEXT,
      location TEXT,
      remarks TEXT,
      report_date TEXT,
      report_time TEXT,
      tools_used TEXT,
      status TEXT DEFAULT 'Pending',
      created_at ${dbType === 'postgresql' ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Inventory table
    `CREATE TABLE IF NOT EXISTS inventory (
      id ${dbType === 'postgresql' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      user_id ${dbType === 'postgresql' ? 'INTEGER' : 'INTEGER'} NOT NULL,
      product_type TEXT NOT NULL,
      status TEXT DEFAULT 'New',
      size TEXT,
      serial_number TEXT,
      date TEXT,
      location TEXT,
      issued_by TEXT,
      created_at ${dbType === 'postgresql' ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Toolbox table
    `CREATE TABLE IF NOT EXISTS toolbox (
      id ${dbType === 'postgresql' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      user_id ${dbType === 'postgresql' ? 'INTEGER' : 'INTEGER'} NOT NULL,
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
      created_at ${dbType === 'postgresql' ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,

    // Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      id ${dbType === 'postgresql' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
      user_id ${dbType === 'postgresql' ? 'INTEGER' : 'INTEGER'} NOT NULL,
      theme TEXT DEFAULT 'light',
      notifications BOOLEAN DEFAULT true,
      created_at ${dbType === 'postgresql' ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP'},
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  ];

  for (const table of tables) {
    try {
      if (dbType === 'postgresql') {
        await db.query(table);
      } else {
        await new Promise((resolve, reject) => {
          db.run(table, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    } catch (error) {
      console.error("❌ Error creating table:", error);
    }
  }
}

// Get database instance
function getDatabase() {
  return db;
}

// Get database type
function getDatabaseType() {
  return dbType;
}

// Close database connection
async function closeDatabase() {
  if (db) {
    if (dbType === 'postgresql') {
      await db.end();
    } else {
      db.close();
    }
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  getDatabaseType,
  closeDatabase,
  db,
  dbType
};
