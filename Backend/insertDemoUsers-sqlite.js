const bcrypt = require("bcrypt");
const sqliteDb = require("./config/db-sqlite");

const SALT_ROUNDS = 10;

const demoUsers = [
  { staffID: "h2412031", password: "password1" },
  { staffID: "h2402117", password: "password2" },
  { staffID: "h2402123", password: "password3" },
  { staffID: "h2402140", password: "password4" },
];

async function insertUsers() {
  try {
    for (const user of demoUsers) {
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

      // Insert user
      await sqliteDb.run(
        `INSERT OR IGNORE INTO users (staff_id, password) 
         VALUES (?, ?)`,
        [user.staffID, hashedPassword]
      );

      console.log(`✅ Added user: ${user.staffID}`);
    }

    console.log("\n🎉 Demo users inserted successfully!");
    console.log("\n📋 Login Credentials:");
    demoUsers.forEach((user) => {
      console.log(`   Staff ID: ${user.staffID} | Password: ${user.password}`);
    });
  } catch (error) {
    console.error("❌ Error inserting users:", error.message);
  } finally {
    sqliteDb.db.close();
  }
}

insertUsers();
