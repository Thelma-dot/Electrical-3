// PostgreSQL Database Setup Script for Railway Deployment
const { Pool } = require('pg');

console.log('🚀 Setting up PostgreSQL database for Railway...');

// Database Configuration for Railway
const dbConfig = {
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'railway',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log('🔧 Database Configuration:', {
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port,
  ssl: dbConfig.ssl
});

// Create PostgreSQL connection pool
let pool;
try {
  pool = new Pool(dbConfig);
  console.log('✅ PostgreSQL connection pool created');
} catch (error) {
  console.error('❌ Failed to create PostgreSQL pool:', error);
  process.exit(1);
}

// Test database connection
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Create tables
async function createTables() {
  try {
    console.log('📋 Creating database tables...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        staff_id VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Login logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        staff_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Login logs table created');

    // Reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        job_description TEXT,
        location VARCHAR(255),
        remarks TEXT,
        report_date DATE NOT NULL,
        report_time TIME NOT NULL,
        tools_used TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Reports table created');

    // Inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_type VARCHAR(255) NOT NULL,
        status VARCHAR(100) DEFAULT 'New',
        size VARCHAR(100),
        serial_number VARCHAR(255),
        date DATE,
        location VARCHAR(255),
        issued_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Inventory table created');

    // Toolbox table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS toolbox (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        work_activity TEXT NOT NULL,
        date DATE NOT NULL,
        work_location VARCHAR(255),
        name_company VARCHAR(255),
        sign VARCHAR(255),
        ppe_no VARCHAR(255),
        tools_used TEXT,
        hazards TEXT,
        circulars TEXT,
        risk_assessment TEXT,
        permit VARCHAR(255),
        remarks TEXT,
        prepared_by VARCHAR(255),
        verified_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Toolbox table created');

    // Tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assigned_to INTEGER REFERENCES users(id),
        priority VARCHAR(20) DEFAULT 'Medium',
        status VARCHAR(20) DEFAULT 'Pending',
        due_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tasks table created');

    console.log('🎉 All tables created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    return false;
  }
}

// Insert demo data
async function insertDemoData() {
  try {
    console.log('📝 Inserting demo data...');

    // Check if demo data already exists
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) > 0) {
      console.log('ℹ️ Demo data already exists, skipping...');
      return true;
    }

    // Insert demo users
    const demoUsers = [
      { staff_id: 'ADMIN001', email: 'admin@electrical.com', password: '$2b$10$rQZ9K8mN2pL1vX3yJ6hG4eF7sA9dC5bV8nM4kL7pQ2rT6uW9xY3zA1bE4fG7hJ', role: 'admin' },
      { staff_id: 'USER001', email: 'user1@electrical.com', password: '$2b$10$rQZ9K8mN2pL1vX3yJ6hG4eF7sA9dC5bV8nM4kL7pQ2rT6uW9xY3zA1bE4fG7hJ', role: 'user' },
      { staff_id: 'USER002', email: 'user2@electrical.com', password: '$2b$10$rQZ9K8mN2pL1vX3yJ6hG4eF7sA9dC5bV8nM4kL7pQ2rT6uW9xY3zA1bE4fG7hJ', role: 'user' }
    ];

    for (const user of demoUsers) {
      await pool.query(
        'INSERT INTO users (staff_id, email, password, role) VALUES ($1, $2, $3, $4)',
        [user.staff_id, user.email, user.password, user.role]
      );
    }
    console.log('✅ Demo users inserted');

    // Insert demo reports
    const demoReports = [
      { user_id: 2, title: 'Electrical Maintenance', job_description: 'Routine maintenance of electrical systems', location: 'Building A', report_date: '2024-01-15', report_time: '09:00:00', status: 'Completed' },
      { user_id: 3, title: 'Circuit Repair', job_description: 'Fixed faulty circuit in office area', location: 'Building B', report_date: '2024-01-16', report_time: '14:30:00', status: 'In Progress' }
    ];

    for (const report of demoReports) {
      await pool.query(
        'INSERT INTO reports (user_id, title, job_description, location, report_date, report_time, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [report.user_id, report.title, report.job_description, report.location, report.report_date, report.report_time, report.status]
      );
    }
    console.log('✅ Demo reports inserted');

    // Insert demo inventory
    const demoInventory = [
      { user_id: 2, product_type: 'Circuit Breaker', status: 'Available', size: '20A', location: 'Storage Room A' },
      { user_id: 3, product_type: 'Cable', status: 'In Use', size: '100m', location: 'Site B' }
    ];

    for (const item of demoInventory) {
      await pool.query(
        'INSERT INTO inventory (user_id, product_type, status, size, location) VALUES ($1, $2, $3, $4, $5)',
        [item.user_id, item.product_type, item.status, item.size, item.location]
      );
    }
    console.log('✅ Demo inventory inserted');

    console.log('🎉 Demo data inserted successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error inserting demo data:', error);
    return false;
  }
}

// Main setup function
async function setupDatabase() {
  try {
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot proceed without database connection');
      process.exit(1);
    }

    // Create tables
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      console.error('❌ Failed to create tables');
      process.exit(1);
    }

    // Insert demo data
    const demoDataInserted = await insertDemoData();
    if (!demoDataInserted) {
      console.error('❌ Failed to insert demo data');
      process.exit(1);
    }

    console.log('🎉 Railway PostgreSQL database setup completed successfully!');
    console.log('📊 Database is ready for production use');
    
    // Close connection
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    if (pool) {
      await pool.end();
    }
    process.exit(1);
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase, testConnection, createTables, insertDemoData };
