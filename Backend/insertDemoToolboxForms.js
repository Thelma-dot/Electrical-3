const sqliteDb = require("./config/db-sqlite");

const demoToolboxForms = [
  {
    workActivity: "Electrical Panel Maintenance",
    date: "2024-01-15",
    workLocation: "Main Electrical Room",
    nameCompany: "John Doe / ABC Electrical",
    sign: "JD",
    ppeNo: "PPE001",
    toolsUsed: "Multimeter, Screwdriver Set, Wire Stripper",
    hazards: "Electrical shock, Arc flash",
    circulars: "Safety Alert 2024-01: Panel Maintenance Procedures",
    riskAssessment: "RA-2024-001",
    permit: "PTW-2024-015",
    remarks: "Routine maintenance of main distribution panel",
    preparedBy: "John Doe",
    verifiedBy: "Mike Johnson"
  },
  {
    workActivity: "Cable Installation",
    date: "2024-01-16",
    workLocation: "Building A - Floor 2",
    nameCompany: "Jane Smith / XYZ Contractors",
    sign: "JS",
    ppeNo: "PPE002",
    toolsUsed: "Cable Puller, Cable Crimper, Multimeter",
    hazards: "Working at height, Manual handling",
    circulars: "Updated cable installation standards",
    riskAssessment: "RA-2024-002",
    permit: "PTW-2024-016",
    remarks: "Installing new power cables for office expansion",
    preparedBy: "Jane Smith",
    verifiedBy: "David Brown"
  },
  {
    workActivity: "Circuit Testing",
    date: "2024-01-17",
    workLocation: "Control Room",
    nameCompany: "Mike Johnson / Control Systems Ltd",
    sign: "MJ",
    ppeNo: "PPE003",
    toolsUsed: "Circuit Tester, Insulation Tester, Thermal Camera",
    hazards: "Electrical testing, High voltage",
    circulars: "Circuit testing safety procedures",
    riskAssessment: "RA-2024-003",
    permit: "PTW-2024-017",
    remarks: "Testing control circuits for new equipment",
    preparedBy: "Mike Johnson",
    verifiedBy: "Sarah Wilson"
  }
];

async function insertDemoToolboxForms() {
  try {
    console.log("🔧 Setting up demo toolbox form data...");
    
    // Get a user ID for the toolbox entries (use the first available user)
    const users = await sqliteDb.all("SELECT id FROM users LIMIT 1");
    
    if (users.length === 0) {
      console.log("❌ No users found. Please run insertDemoUsers-sqlite.js first.");
      return;
    }
    
    const userId = users[0].id;
    console.log(`✅ Using user ID: ${userId}`);
    
    // Insert demo toolbox form entries
    for (let i = 0; i < demoToolboxForms.length; i++) {
      const form = demoToolboxForms[i];
      
      await sqliteDb.run(
        `INSERT OR IGNORE INTO toolbox 
         (user_id, work_activity, date, work_location, name_company, sign, ppe_no, 
          tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          form.workActivity,
          form.date,
          form.workLocation,
          form.nameCompany,
          form.sign,
          form.ppeNo,
          form.toolsUsed,
          form.hazards,
          form.circulars,
          form.riskAssessment,
          form.permit,
          form.remarks,
          form.preparedBy,
          form.verifiedBy
        ]
      );
      
      console.log(`✅ Toolbox form added: ${form.workActivity} at ${form.workLocation}`);
    }

    console.log("\n🎉 Demo toolbox form data inserted successfully!");
    console.log("\n🔧 Toolbox Forms Summary:");
    console.log("   - 3 demo toolbox forms created");
    console.log("   - Various work activities: Maintenance, Installation, Testing");
    console.log("   - Different locations and tools used");
    console.log("   - Complete safety information included");
    console.log("\n📊 The toolbox table should now show proper form data!");
    console.log("\n🔗 Test by:");
    console.log("   1. Submitting a new toolbox form");
    console.log("   2. Viewing the toolbox table");
    console.log("   3. Checking that data displays correctly (not N/A)");

  } catch (error) {
    console.error("❌ Error inserting demo toolbox form data:", error);
  } finally {
    process.exit(0);
  }
}

// Run the script
insertDemoToolboxForms();
