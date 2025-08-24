const sqliteDb = require("./config/db-sqlite");

const demoToolbox = [
  {
    tool_name: "Multimeter",
    tool_type: "Testing Equipment",
    status: "Available",
    location: "Tool Cabinet A",
    assigned_to: "John Doe",
    notes: "Digital multimeter for electrical measurements"
  },
  {
    tool_name: "Wire Stripper",
    tool_type: "Hand Tool",
    status: "In Use",
    location: "Work Area B",
    assigned_to: "Jane Smith",
    notes: "Automatic wire stripper for various wire gauges"
  },
  {
    tool_name: "Circuit Tester",
    tool_type: "Testing Equipment",
    status: "Available",
    location: "Tool Cabinet A",
    assigned_to: "Mike Johnson",
    notes: "Non-contact voltage tester"
  },
  {
    tool_name: "Screwdriver Set",
    tool_type: "Hand Tool",
    status: "Available",
    location: "Tool Cabinet B",
    assigned_to: "Sarah Wilson",
    notes: "Complete set of insulated screwdrivers"
  },
  {
    tool_name: "Cable Crimper",
    tool_type: "Hand Tool",
    status: "In Use",
    location: "Work Area C",
    assigned_to: "David Brown",
    notes: "Hydraulic crimping tool for cable lugs"
  },
  {
    tool_name: "Insulation Tester",
    tool_type: "Testing Equipment",
    status: "Available",
    location: "Tool Cabinet A",
    assigned_to: "Lisa Davis",
    notes: "Megohmmeter for insulation resistance testing"
  },
  {
    tool_name: "Thermal Camera",
    tool_type: "Diagnostic Equipment",
    status: "Available",
    location: "Equipment Room",
    assigned_to: "Robert Miller",
    notes: "Infrared camera for electrical inspections"
  },
  {
    tool_name: "Cable Puller",
    tool_type: "Installation Tool",
    status: "In Use",
    location: "Work Area D",
    assigned_to: "Jennifer Garcia",
    notes: "Mechanical cable pulling device"
  }
];

async function insertDemoToolbox() {
  try {
    console.log("🔧 Setting up demo toolbox data...");
    
    // Get a user ID for the toolbox entries (use the first available user)
    const users = await sqliteDb.all("SELECT id FROM users LIMIT 1");
    
    if (users.length === 0) {
      console.log("❌ No users found. Please run insertDemoUsers-sqlite.js first.");
      return;
    }
    
    const userId = users[0].id;
    console.log(`✅ Using user ID: ${userId}`);
    
    // Insert demo toolbox entries
    for (let i = 0; i < demoToolbox.length; i++) {
      const toolbox = demoToolbox[i];
      
      await sqliteDb.run(
        `INSERT OR IGNORE INTO toolbox 
         (user_id, tool_name, tool_type, status, location, assigned_to, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          toolbox.tool_name,
          toolbox.tool_type,
          toolbox.status,
          toolbox.location,
          toolbox.assigned_to,
          toolbox.notes
        ]
      );
      
      console.log(`✅ Toolbox entry added: ${toolbox.tool_name} (${toolbox.tool_type})`);
    }

    console.log("\n🎉 Demo toolbox data inserted successfully!");
    console.log("\n🔧 Toolbox Summary:");
    console.log("   - 8 demo toolbox entries created");
    console.log("   - Various tool types: Testing Equipment, Hand Tools, Diagnostic Equipment");
    console.log("   - Different statuses: Available, In Use");
    console.log("   - Multiple locations and assigned users");
    console.log("\n📊 The admin dashboard bar chart should now show toolbox count!");
    console.log("\n🔗 Test by:");
    console.log("   1. Refreshing the admin dashboard");
    console.log("   2. Checking the System Overview bar chart");
    console.log("   3. Verifying toolbox count is displayed");

  } catch (error) {
    console.error("❌ Error inserting demo toolbox data:", error);
  } finally {
    process.exit(0);
  }
}

// Run the script
insertDemoToolbox();
