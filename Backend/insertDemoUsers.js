require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const demoUsers = [
  { staffID: "h2412031", password: "password1" },
  { staffID: "h2402117", password: "password2" },
  { staffID: "h2402123", password: "password3" },
  { staffID: "h2402140", password: "password4" }
];

async function insertUsers() {
  // Create database connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    for (const user of demoUsers) {
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      
      // Insert user
      await connection.execute(
        `INSERT INTO users (staffID, password) 
         VALUES (?, ?)`,
        [user.staffID, hashedPassword]
      );
      
      console.log(`✅ Added user: ${user.staffID}`);
    }
  } catch (error) {
    console.error('❌ Error inserting users:', error.message);
  } finally {
    await connection.end();
  }
}

insertUsers();