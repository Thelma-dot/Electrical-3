const bcrypt = require("bcrypt");
const sqliteDb = require("./config/db-sqlite");

async function testLogin() {
  try {
    console.log("Testing login functionality...\n");

    // Test user credentials
    const testStaffId = "h2412031";
    const testPassword = "password1";

    console.log(`Testing login for Staff ID: ${testStaffId}`);
    console.log(`Password: ${testPassword}\n`);

    // Check if user exists
    const user = await sqliteDb.get("SELECT * FROM users WHERE staff_id = ?", [
      testStaffId,
    ]);

    if (!user) {
      console.log("❌ User not found in database");
      return;
    }

    console.log("✅ User found in database");
    console.log(`User ID: ${user.id}`);
    console.log(`Staff ID: ${user.staff_id}`);
    console.log(`Password hash: ${user.password.substring(0, 20)}...`);

    // Test password verification
    const isMatch = await bcrypt.compare(testPassword, user.password);

    if (isMatch) {
      console.log("✅ Password verification successful!");
      console.log("\n🎉 Login should work!");
      console.log("\nTry logging in with:");
      console.log(`Staff ID: ${testStaffId}`);
      console.log(`Password: ${testPassword}`);
    } else {
      console.log("❌ Password verification failed");
      console.log("This might be due to password hash mismatch");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    sqliteDb.db.close();
  }
}

testLogin();
