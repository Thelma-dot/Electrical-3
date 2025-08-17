const pool = require("./db");
const colors = require("colors"); // For colored console output

// Test database structure and connections
async function testDatabase() {
  let connection;
  try {
    // 1. Get database connection
    connection = await pool.getConnection();
    console.log(colors.green("✅ Database connection successful!"));

    // 2. Verify database exists
    const [dbs] = await connection.query("SHOW DATABASES LIKE ?", [
      process.env.DB_NAME,
    ]);
    if (dbs.length === 0) {
      throw new Error(`Database '${process.env.DB_NAME}' does not exist`);
    }
    console.log(colors.green(`✅ Database '${process.env.DB_NAME}' exists`));

    // 3. Verify tables exist
    const requiredTables = [
      "users",
      "reports",
      "inventory",
      "toolbox",
      "settings",
    ];
    const [tables] = await connection.query("SHOW TABLES");
    const existingTables = tables.map(
      (t) => t[`Tables_in_${process.env.DB_NAME}`]
    );

    console.log("\nChecking required tables:");
    requiredTables.forEach((table) => {
      if (existingTables.includes(table)) {
        console.log(colors.green(`✅ Table '${table}' exists`));
      } else {
        console.log(colors.red(`❌ Table '${table}' is missing`));
      }
    });

    // 4. Verify table structures
    console.log("\nVerifying table structures:");
    await verifyTableStructure(connection, "users", [
      "id",
      "staff_id",
      "password",
      "email",
      "reset_token",
      "token_expiry",
      "created_at",
    ]);

    await verifyTableStructure(connection, "reports", [
      "id",
      "user_id",
      "title",
      "job_description",
      "location",
      "remarks",
      "report_date",
      "report_time",
      "tools_used",
      "status",
      "created_at",
    ]);

    // Add other tables similarly...

    // 5. Verify foreign key relationships
    console.log("\nVerifying foreign keys:");
    await verifyForeignKey(connection, "reports", "user_id", "users", "id");
    await verifyForeignKey(connection, "inventory", "user_id", "users", "id");
    await verifyForeignKey(connection, "toolbox", "user_id", "users", "id");
    await verifyForeignKey(connection, "settings", "user_id", "users", "id");

    // 6. Test data insertion and retrieval
    console.log("\nTesting data operations:");
    await testDataOperations(connection);

    console.log(colors.rainbow("\nAll database tests passed successfully!"));
  } catch (err) {
    console.error(colors.red("❌ Database test failed:"), err.message);
    console.error(colors.grey(err.stack));
  } finally {
    if (connection) connection.release();
    pool.end(); // Close all connections
  }
}

async function verifyTableStructure(connection, tableName, expectedColumns) {
  try {
    const [columns] = await connection.query(
      `
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    `,
      [process.env.DB_NAME, tableName]
    );

    const existingColumns = columns.map((c) => c.COLUMN_NAME);
    const missingColumns = expectedColumns.filter(
      (col) => !existingColumns.includes(col)
    );

    if (missingColumns.length === 0) {
      console.log(
        colors.green(`✅ Table '${tableName}' has all expected columns`)
      );
    } else {
      throw new Error(
        `Table '${tableName}' missing columns: ${missingColumns.join(", ")}`
      );
    }
  } catch (err) {
    console.error(
      colors.red(`❌ Table structure verification failed for '${tableName}':`),
      err.message
    );
    throw err;
  }
}

async function verifyForeignKey(
  connection,
  childTable,
  fkColumn,
  parentTable,
  pkColumn
) {
  try {
    const [fks] = await connection.query(
      `
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE 
        TABLE_SCHEMA = ? 
        AND TABLE_NAME = ? 
        AND COLUMN_NAME = ?
        AND REFERENCED_TABLE_NAME = ?
        AND REFERENCED_COLUMN_NAME = ?
    `,
      [process.env.DB_NAME, childTable, fkColumn, parentTable, pkColumn]
    );

    if (fks.length > 0) {
      console.log(
        colors.green(
          `✅ Foreign key ${childTable}.${fkColumn} → ${parentTable}.${pkColumn} exists`
        )
      );
    } else {
      throw new Error(
        `Missing foreign key: ${childTable}.${fkColumn} should reference ${parentTable}.${pkColumn}`
      );
    }
  } catch (err) {
    console.error(
      colors.red(`❌ Foreign key verification failed:`),
      err.message
    );
    throw err;
  }
}

async function testDataOperations(connection) {
  try {
    // Test user creation
    const [userResult] = await connection.query(
      `
      INSERT INTO users (staff_id, password, email)
      VALUES (?, ?, ?)
    `,
      ["test_user", "test_password", "test@example.com"]
    );

    const userId = userResult.insertId;
    console.log(colors.green(`✅ User created with ID: ${userId}`));

    // Test report creation
    const [reportResult] = await connection.query(
      `
      INSERT INTO reports (
        user_id, title, job_description, location, 
        report_date, report_time, tools_used, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        "Test Report",
        "Testing report functionality",
        "Test Location",
        "2023-10-25",
        "14:30:00",
        "Test Tools",
        "In Progress",
      ]
    );

    const reportId = reportResult.insertId;
    console.log(colors.green(`✅ Report created with ID: ${reportId}`));

    // Test inventory creation
    const [inventoryResult] = await connection.query(
      `
      INSERT INTO inventory (
        user_id, product_type, status, size,
        serial_number, date, location, issued_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        "UPS",
        "New",
        "10kva",
        "TEST-123",
        "2023-10-25",
        "Test Location",
        "Test Issuer",
      ]
    );

    const inventoryId = inventoryResult.insertId;
    console.log(
      colors.green(`✅ Inventory item created with ID: ${inventoryId}`)
    );

    // Test data retrieval
    const [userReports] = await connection.query(
      "SELECT * FROM reports WHERE user_id = ?",
      [userId]
    );

    console.log(
      colors.green(`✅ Retrieved ${userReports.length} reports for user`)
    );

    // Cleanup test data
    await connection.query("DELETE FROM inventory WHERE id = ?", [inventoryId]);
    await connection.query("DELETE FROM reports WHERE id = ?", [reportId]);
    await connection.query("DELETE FROM users WHERE id = ?", [userId]);

    console.log(colors.green("✅ Test data cleaned up"));
  } catch (err) {
    console.error(colors.red("❌ Data operations test failed:"), err.message);
    throw err;
  }
}

// Run the tests
testDatabase();
