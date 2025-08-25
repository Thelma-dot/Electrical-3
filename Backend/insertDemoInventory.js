const sqliteDb = require("./config/db-sqlite");

const demoInventory = [
  {
    user_id: 1, // Assuming user ID 1 exists
    product_type: 'UPS',
    status: 'New',
    size: '3kva',
    serial_number: 'UPS001',
    date: '2024-01-15',
    location: 'Main Office',
    issued_by: 'Admin'
  },
  {
    user_id: 1,
    product_type: 'AVR',
    status: 'New',
    size: '6kva',
    serial_number: 'AVR001',
    date: '2024-01-16',
    location: 'Main Office',
    issued_by: 'Admin'
  },
  {
    user_id: 1,
    product_type: 'UPS',
    status: 'Replaced',
    size: '10kva',
    serial_number: 'UPS002',
    date: '2024-01-10',
    location: 'Branch A',
    issued_by: 'Manager'
  },
  {
    user_id: 1,
    product_type: 'AVR',
    status: 'New',
    size: '1.5kva',
    serial_number: 'AVR002',
    date: '2024-01-17',
    location: 'Branch B',
    issued_by: 'Admin'
  },
  {
    user_id: 1,
    product_type: 'UPS',
    status: 'New',
    size: '20kva',
    serial_number: 'UPS003',
    date: '2024-01-18',
    location: 'Main Office',
    issued_by: 'Admin'
  }
];

async function insertDemoInventory() {
  try {
    // First, check if inventory table exists
    const tableExists = await sqliteDb.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='inventory'"
    );

    if (!tableExists) {
      console.log("❌ Inventory table does not exist. Please run setup-db.js first.");
      return;
    }

    // Check if we have any users
    const userCount = await sqliteDb.get("SELECT COUNT(*) as count FROM users");
    if (userCount.count === 0) {
      console.log("❌ No users found. Please run insertDemoUsers-sqlite.js first.");
      return;
    }

    // Get the first user ID
    const firstUser = await sqliteDb.get("SELECT id FROM users LIMIT 1");
    const userId = firstUser.id;

    console.log(`📦 Inserting demo inventory for user ID: ${userId}`);

    for (const item of demoInventory) {
      // Update user_id to use the actual user ID from database
      item.user_id = userId;
      
      await sqliteDb.run(
        `INSERT OR IGNORE INTO inventory 
         (user_id, product_type, status, size, serial_number, date, location, issued_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.user_id, item.product_type, item.status, item.size, item.serial_number, item.date, item.location, item.issued_by]
      );

      console.log(`✅ Added inventory item: ${item.product_type} ${item.size} - ${item.status}`);
    }

    // Verify the data was inserted
    const inventoryCount = await sqliteDb.get("SELECT COUNT(*) as count FROM inventory");
    console.log(`\n🎉 Demo inventory inserted successfully!`);
    console.log(`📊 Total inventory items: ${inventoryCount.count}`);

    // Show summary
    const summary = await sqliteDb.all(`
      SELECT 
        product_type,
        status,
        size,
        COUNT(*) as count
      FROM inventory 
      GROUP BY product_type, status, size
      ORDER BY product_type, status, size
    `);

    console.log("\n📋 Inventory Summary:");
    summary.forEach(item => {
      console.log(`   ${item.product_type} - ${item.status} - ${item.size}: ${item.count}`);
    });

  } catch (error) {
    console.error("❌ Error inserting inventory:", error.message);
  } finally {
    sqliteDb.db.close();
  }
}

insertDemoInventory();
