const mysql = require("mysql2/promise");
require("dotenv").config();

async function setupDatabase() {
  let connection;
  try {
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log("✅ Connected to MySQL server");

    // Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`
    );
    console.log(`✅ Database '${process.env.DB_NAME}' created/verified`);

    // Use the database
    await connection.query(`USE ${process.env.DB_NAME}`);

    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        staff_id VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        reset_token VARCHAR(255),
        token_expiry DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Users table created/verified");

    // Create reports table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        job_description TEXT,
        location VARCHAR(255),
        remarks TEXT,
        report_date DATE,
        report_time TIME,
        tools_used TEXT,
        status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Reports table created/verified");

    // Create inventory table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_type VARCHAR(100) NOT NULL,
        status ENUM('New', 'Used', 'Damaged', 'Under Maintenance') DEFAULT 'New',
        size VARCHAR(50),
        serial_number VARCHAR(100),
        date DATE,
        location VARCHAR(255),
        issued_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Inventory table created/verified");

    // Create toolbox table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS toolbox (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tool_name VARCHAR(100) NOT NULL,
        tool_type VARCHAR(100),
        status ENUM('Available', 'In Use', 'Under Maintenance', 'Lost') DEFAULT 'Available',
        location VARCHAR(255),
        assigned_to VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Toolbox table created/verified");

    // Create settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        setting_key VARCHAR(100) NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_setting (user_id, setting_key)
      )
    `);
    console.log("✅ Settings table created/verified");

    console.log("\n🎉 Database setup completed successfully!");
    console.log("You can now run the application.");
  } catch (err) {
    console.error("❌ Database setup failed:", err.message);
    console.error("Error details:", err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();

