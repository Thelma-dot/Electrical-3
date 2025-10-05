const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'config.env') });

// PostgreSQL connection configuration (supports Render's DATABASE_URL)
const useConnectionString = !!process.env.DATABASE_URL;
const pool = new Pool(
  useConnectionString
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'electrical_management',
        password: process.env.DB_PASSWORD || 'password',
        port: process.env.DB_PORT || 5432,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database tables
async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // Create tables
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        staff_id VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        reset_token VARCHAR(255),
        token_expiry TIMESTAMP,
        last_login TIMESTAMP,
        role VARCHAR(50) DEFAULT 'staff',
        name VARCHAR(255),
        phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Reports table
      `CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        job_description TEXT,
        location VARCHAR(255),
        remarks TEXT,
        report_date VARCHAR(50),
        report_time VARCHAR(50),
        tools_used TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Inventory table
      `CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        product_type VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'New',
        size VARCHAR(100),
        serial_number VARCHAR(255),
        date VARCHAR(50),
        location VARCHAR(255),
        issued_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Toolbox table
      `CREATE TABLE IF NOT EXISTS toolbox (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        work_activity TEXT NOT NULL,
        date VARCHAR(50) NOT NULL,
        work_location VARCHAR(255) NOT NULL,
        name_company VARCHAR(255) NOT NULL,
        sign VARCHAR(255) NOT NULL,
        ppe_no VARCHAR(255) NOT NULL,
        tools_used TEXT NOT NULL,
        hazards TEXT,
        circulars TEXT,
        risk_assessment TEXT,
        permit TEXT,
        remarks TEXT,
        prepared_by VARCHAR(255),
        verified_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Settings table
      `CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        setting_key VARCHAR(255) NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, setting_key),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        priority VARCHAR(50) DEFAULT 'Medium',
        due_date VARCHAR(50),
        assigned_by VARCHAR(255),
        hidden_from_user BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Login logs table
      `CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        staff_id VARCHAR(255) NOT NULL,
        login_type VARCHAR(50) DEFAULT 'staff',
        ip_address VARCHAR(45),
        user_agent TEXT,
        success BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ];

    // Create tables
    for (let i = 0; i < tables.length; i++) {
      await client.query(tables[i]);
      console.log(`✅ Table ${i + 1} created successfully`);
    }

    console.log('✅ All tables created successfully');

    // Demo data creation disabled - start with clean database
    // Only create admin user for system access
    await insertDemoUsers(client);
    console.log('✅ Admin user created successfully');
    console.log('🎉 Database initialization complete - no sample data created');

    // await insertDemoData(client);
    // console.log('✅ Demo data inserted successfully');

  } catch (error) {
    console.error('❌ Error in database initialization:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Insert demo users
async function insertDemoUsers(client) {
  const demoUsers = [
    { staffID: "admin", password: "admin123", role: "admin" },
    { staffID: "h2412031", password: "password1", role: "staff" },
    { staffID: "h2402117", password: "password2", role: "staff" },
    { staffID: "h2402123", password: "password3", role: "staff" },
    { staffID: "h2402140", password: "password4", role: "staff" },
  ];

  for (const user of demoUsers) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_ROUNDS) || 10);

      // Check if user exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE staff_id = $1',
        [user.staffID]
      );

      if (existingUser.rows.length === 0) {
        await client.query(
          'INSERT INTO users (staff_id, password, role) VALUES ($1, $2, $3)',
          [user.staffID, hashedPassword, user.role]
        );
        console.log(`✅ Demo user added: ${user.staffID}`);
      } else {
        // Update existing user's role and password
        await client.query(
          'UPDATE users SET password = $1, role = $2 WHERE staff_id = $3',
          [hashedPassword, user.role, user.staffID]
        );
        console.log(`✅ Demo user updated: ${user.staffID}`);
      }
    } catch (error) {
      console.log(`⚠️ Demo user ${user.staffID} error:`, error.message);
    }
  }
}

// Insert demo data (reports, inventory, tasks, toolbox)
async function insertDemoData(client) {
  const demoReports = [
    { userID: 2, title: "Electrical Maintenance Report", jobDescription: "Routine electrical maintenance and safety checks", location: "Building A - Floor 1", remarks: "All systems functioning normally" },
    { userID: 3, title: "Circuit Breaker Inspection", jobDescription: "Monthly inspection of main circuit breakers", location: "Main Electrical Room", remarks: "No issues found, all breakers operational" },
    { userID: 4, title: "Equipment Calibration Report", jobDescription: "Calibrate all testing equipment for accuracy", location: "Building C - Storage", remarks: "All equipment calibrated successfully" },
  ];

  const demoInventory = [
    { userID: 2, productType: "UPS", status: "New", size: "3kva", serialNumber: "UPS001", date: "2023-01-01", location: "Main Electrical Room", issuedBy: "Calvin Odzor" },
    { userID: 3, productType: "AVR", status: "Used", size: "6kva", serialNumber: "AVR001", date: "2023-02-01", location: "Building B - Floor 1", issuedBy: "David" },
    { userID: 4, productType: "UPS", status: "New", size: "10kva", serialNumber: "UPS002", date: "2023-03-01", location: "Building C - Main Room", issuedBy: "Collins Oduro" },
  ];

  const demoTasks = [
    { userID: 2, title: "Monthly Safety Inspection", description: "Conduct monthly electrical safety inspection of all buildings", status: "In Progress", priority: "High", dueDate: "2023-10-01", assignedBy: "Calvin Odzor" },
    { userID: 3, title: "Equipment Calibration", description: "Calibrate all testing equipment for accuracy", status: "Pending", priority: "Medium", dueDate: "2023-10-10", assignedBy: "David" },
    { userID: 4, title: "System Maintenance", description: "Perform routine maintenance on electrical systems", status: "Pending", priority: "Low", dueDate: "2023-10-20", assignedBy: "Collins Oduro" },
  ];

  const demoToolbox = [
    { userID: 2, workActivity: "Activity 1", date: "2023-09-01", workLocation: "Location X", nameCompany: "Company A", sign: "Sign 1", ppeNo: "PPE001", toolsUsed: "Tool 1, Tool 2", hazards: "Hazard 1", circulars: "Circular 1", riskAssessment: "Risk 1", permit: "Permit 1", remarks: "Remarks 1", preparedBy: "User A", verifiedBy: "User B" },
    { userID: 2, workActivity: "Activity 2", date: "2023-09-10", workLocation: "Location Y", nameCompany: "Company B", sign: "Sign 2", ppeNo: "PPE002", toolsUsed: "Tool 3, Tool 4", hazards: "Hazard 2", circulars: "Circular 2", riskAssessment: "Risk 2", permit: "Permit 2", remarks: "Remarks 2", preparedBy: "User A", verifiedBy: "User B" },
    { userID: 3, workActivity: "Activity 3", date: "2023-09-20", workLocation: "Location Z", nameCompany: "Company A", sign: "Sign 1", ppeNo: "PPE001", toolsUsed: "Tool 5, Tool 6", hazards: "Hazard 1", circulars: "Circular 1", riskAssessment: "Risk 1", permit: "Permit 1", remarks: "Remarks 1", preparedBy: "User A", verifiedBy: "User B" },
  ];

  // Insert demo reports
  for (const report of demoReports) {
    try {
      await client.query(
        'INSERT INTO reports (user_id, title, job_description, location, remarks) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
        [report.userID, report.title, report.jobDescription, report.location, report.remarks]
      );
    } catch (error) {
      console.log(`⚠️ Demo report insert error:`, error.message);
    }
  }

  // Insert demo inventory
  for (const inventory of demoInventory) {
    try {
      await client.query(
        'INSERT INTO inventory (user_id, product_type, status, size, serial_number, date, location, issued_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING',
        [inventory.userID, inventory.productType, inventory.status, inventory.size, inventory.serialNumber, inventory.date, inventory.location, inventory.issuedBy]
      );
    } catch (error) {
      console.log(`⚠️ Demo inventory insert error:`, error.message);
    }
  }

  // Insert demo tasks
  for (const task of demoTasks) {
    try {
      await client.query(
        'INSERT INTO tasks (user_id, title, description, status, priority, due_date, assigned_by) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
        [task.userID, task.title, task.description, task.status, task.priority, task.dueDate, task.assignedBy]
      );
    } catch (error) {
      console.log(`⚠️ Demo task insert error:`, error.message);
    }
  }

  // Insert demo toolbox
  for (const toolbox of demoToolbox) {
    try {
      await client.query(
        'INSERT INTO toolbox (user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) ON CONFLICT DO NOTHING',
        [toolbox.userID, toolbox.workActivity, toolbox.date, toolbox.workLocation, toolbox.nameCompany, toolbox.sign, toolbox.ppeNo, toolbox.toolsUsed, toolbox.hazards, toolbox.circulars, toolbox.riskAssessment, toolbox.permit, toolbox.remarks, toolbox.preparedBy, toolbox.verifiedBy]
      );
    } catch (error) {
      console.log(`⚠️ Demo toolbox insert error:`, error.message);
    }
  }
}

// Database helper functions
async function run(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return {
      id: result.rows[0]?.id || result.insertId,
      changes: result.rowCount
    };
  } finally {
    client.release();
  }
}

async function get(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

async function all(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

async function close() {
  await pool.end();
  console.log('PostgreSQL connection pool closed');
}

module.exports = {
  pool,
  run,
  get,
  all,
  close,
  initializeDatabase,
};
