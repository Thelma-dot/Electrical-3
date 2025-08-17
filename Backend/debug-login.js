const bcrypt = require("bcrypt");
const sqliteDb = require("./config/db-sqlite");

async function debugLogin() {
  try {
    console.log("🔍 Debugging login process...\n");

    const staffid = "h2412031";
    const password = "password1";

    console.log(`1. Testing with Staff ID: ${staffid}`);
    console.log(`2. Password: ${password}\n`);

    // Step 1: Check if user exists
    console.log("Step 1: Checking if user exists in database...");
    const user = await sqliteDb.get("SELECT * FROM users WHERE staff_id = ?", [
      staffid,
    ]);

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("✅ User found:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Staff ID: ${user.staff_id}`);
    console.log(`   Password hash: ${user.password.substring(0, 20)}...`);

    // Step 2: Test password verification
    console.log("\nStep 2: Testing password verification...");
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      console.log("✅ Password verification successful!");

      // Step 3: Test JWT token creation
      console.log("\nStep 3: Testing JWT token creation...");
      const jwt = require("jsonwebtoken");

      const token = jwt.sign(
        { staffID: user.staff_id },
        "your_jwt_secret_key_here", // Using the default from .env
        { expiresIn: "1h" }
      );

      console.log("✅ JWT token created successfully!");
      console.log(`   Token: ${token.substring(0, 20)}...`);

      // Step 4: Prepare response
      console.log("\nStep 4: Preparing response...");
      const { password: _, ...userData } = user;
      const response = { token, user: userData };

      console.log("✅ Response prepared successfully!");
      console.log("🎉 Login process completed successfully!");
    } else {
      console.log("❌ Password verification failed");
    }
  } catch (error) {
    console.error("❌ Error during debug:", error.message);
    console.error("Stack trace:", error.stack);
  } finally {
    sqliteDb.db.close();
  }
}

debugLogin();
