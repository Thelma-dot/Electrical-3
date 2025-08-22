const bcrypt = require("bcrypt");
const sqliteDb = require("./config/db-sqlite");

const SALT_ROUNDS = 10;

const demoUsers = [
  { staffID: "h2412031", password: "password1" },
  { staffID: "h2402117", password: "password2" },
  { staffID: "h2402123", password: "password3" },
  { staffID: "h2402140", password: "password4" }
];

const demoTasks = [
  {
    title: "Complete Electrical Safety Inspection",
    description: "Perform comprehensive safety inspection of all electrical equipment in Building A",
    priority: "high",
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    status: "pending"
  },
  {
    title: "Update Circuit Breaker Documentation",
    description: "Review and update circuit breaker specifications and maintenance records",
    priority: "medium",
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    status: "in_progress"
  },
  {
    title: "Emergency Response Training",
    description: "Conduct emergency response training for electrical incidents",
    priority: "urgent",
    due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    status: "pending"
  },
  {
    title: "Monthly Equipment Maintenance",
    description: "Perform routine maintenance on electrical panels and switches",
    priority: "low",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    status: "pending"
  },
  {
    title: "Overdue: Safety Protocol Review",
    description: "Review and update electrical safety protocols (OVERDUE)",
    priority: "high",
    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago (overdue)
    status: "pending"
  }
];

async function insertDemoData() {
  try {
    // First, ensure demo users exist
    console.log("👥 Setting up demo users...");
    for (const user of demoUsers) {
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      
      await sqliteDb.run(
        `INSERT OR IGNORE INTO users (staff_id, password, role) 
         VALUES (?, ?, ?)`,
        [user.staffID, hashedPassword, 'staff']
      );
      
      console.log(`✅ User ready: ${user.staffID}`);
    }

    // Get user IDs for task assignment
    const users = await sqliteDb.all("SELECT id, staff_id FROM users WHERE staff_id IN (?, ?, ?, ?)", 
      demoUsers.map(u => u.staffID));
    
    if (users.length === 0) {
      console.log("❌ No users found. Please run insertDemoUsers-sqlite.js first.");
      return;
    }

    console.log("\n📋 Inserting demo tasks...");
    
    // Insert demo tasks
    for (let i = 0; i < demoTasks.length; i++) {
      const task = demoTasks[i];
      const assignedTo = users[i % users.length].id; // Distribute tasks among users
      const assignedBy = users[0].id; // First user as admin
      
      await sqliteDb.run(
        `INSERT OR IGNORE INTO tasks (title, description, assigned_to, assigned_by, priority, due_date, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [task.title, task.description, assignedTo, assignedBy, task.priority, task.due_date, task.status]
      );
      
      console.log(`✅ Task added: ${task.title}`);
    }

    console.log("\n🎉 Demo tasks inserted successfully!");
    console.log("\n📋 Task Summary:");
    console.log("   - 5 demo tasks created with various due dates");
    console.log("   - 1 overdue task for testing");
    console.log("   - Tasks distributed among demo users");
    console.log("\n🔗 Test the deadline reminder system by:");
    console.log("   1. Logging in with any demo user");
    console.log("   2. Going to the dashboard");
    console.log("   3. Checking the 'Task Deadline Reminders' section");
    
  } catch (error) {
    console.error("❌ Error inserting demo data:", error.message);
  } finally {
    sqliteDb.db.close();
  }
}

insertDemoData();
