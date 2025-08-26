const sqliteDB = require('./config/db-sqlite');
const postgresDB = require('./config/database-postgresql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'config.env') });

async function migrateToPostgreSQL() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...');
  
  try {
    // Initialize PostgreSQL database
    console.log('📊 Initializing PostgreSQL database...');
    await postgresDB.initializeDatabase();
    
    // Get all data from SQLite
    console.log('📥 Extracting data from SQLite...');
    
    // Get users
    const users = await sqliteDB.all('SELECT * FROM users');
    console.log(`👥 Found ${users.length} users`);
    
    // Get reports
    const reports = await sqliteDB.all('SELECT * FROM reports');
    console.log(`📋 Found ${reports.length} reports`);
    
    // Get inventory
    const inventory = await sqliteDB.all('SELECT * FROM inventory');
    console.log(`📦 Found ${inventory.length} inventory items`);
    
    // Get tasks
    const tasks = await sqliteDB.all('SELECT * FROM tasks');
    console.log(`✅ Found ${tasks.length} tasks`);
    
    // Get toolbox
    const toolbox = await sqliteDB.all('SELECT * FROM toolbox');
    console.log(`🛠️ Found ${toolbox.length} toolbox entries`);
    
    // Get settings
    const settings = await sqliteDB.all('SELECT * FROM settings');
    console.log(`⚙️ Found ${settings.length} settings`);
    
    // Get login logs
    const loginLogs = await sqliteDB.all('SELECT * FROM login_logs');
    console.log(`🔐 Found ${loginLogs.length} login logs`);
    
    // Migrate data to PostgreSQL
    console.log('📤 Migrating data to PostgreSQL...');
    
    const client = await postgresDB.pool.connect();
    
    try {
      // Clear existing data (since we already have demo data)
      console.log('🧹 Clearing existing PostgreSQL data...');
      await client.query('DELETE FROM login_logs');
      await client.query('DELETE FROM settings');
      await client.query('DELETE FROM toolbox');
      await client.query('DELETE FROM tasks');
      await client.query('DELETE FROM inventory');
      await client.query('DELETE FROM reports');
      await client.query('DELETE FROM users WHERE staff_id != \'admin\'');
      
      // Migrate users (skip admin as it's already there)
      for (const user of users) {
        if (user.staff_id !== 'admin') {
          await client.query(
            'INSERT INTO users (staff_id, password, email, reset_token, token_expiry, last_login, role, name, phone, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [
              user.staff_id,
              user.password,
              user.email,
              user.reset_token,
              user.token_expiry,
              user.last_login,
              user.role,
              user.name,
              user.phone,
              user.created_at
            ]
          );
        }
      }
      console.log('✅ Users migrated');
      
      // Migrate reports
      for (const report of reports) {
        await client.query(
          'INSERT INTO reports (user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [
            report.user_id,
            report.title,
            report.job_description,
            report.location,
            report.remarks,
            report.report_date,
            report.report_time,
            report.tools_used,
            report.status,
            report.created_at
          ]
        );
      }
      console.log('✅ Reports migrated');
      
      // Migrate inventory
      for (const item of inventory) {
        await client.query(
          'INSERT INTO inventory (user_id, product_type, status, size, serial_number, date, location, issued_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            item.user_id,
            item.product_type,
            item.status,
            item.size,
            item.serial_number,
            item.date,
            item.location,
            item.issued_by,
            item.created_at
          ]
        );
      }
      console.log('✅ Inventory migrated');
      
      // Migrate tasks
      for (const task of tasks) {
        await client.query(
          'INSERT INTO tasks (user_id, title, description, status, priority, due_date, assigned_by, hidden_from_user, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
          [
            task.user_id,
            task.title,
            task.description,
            task.status,
            task.priority,
            task.due_date,
            task.assigned_by,
            task.hidden_from_user || false,
            task.created_at,
            task.updated_at
          ]
        );
      }
      console.log('✅ Tasks migrated');
      
      // Migrate toolbox
      for (const item of toolbox) {
        await client.query(
          'INSERT INTO toolbox (user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)',
          [
            item.user_id,
            item.work_activity,
            item.date,
            item.work_location,
            item.name_company,
            item.sign,
            item.ppe_no,
            item.tools_used,
            item.hazards,
            item.circulars,
            item.risk_assessment,
            item.permit,
            item.remarks,
            item.prepared_by,
            item.verified_by,
            item.created_at
          ]
        );
      }
      console.log('✅ Toolbox migrated');
      
      // Migrate settings
      for (const setting of settings) {
        await client.query(
          'INSERT INTO settings (user_id, setting_key, setting_value, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
          [
            setting.user_id,
            setting.setting_key,
            setting.setting_value,
            setting.created_at,
            setting.updated_at
          ]
        );
      }
      console.log('✅ Settings migrated');
      
      // Migrate login logs
      for (const log of loginLogs) {
        await client.query(
          'INSERT INTO login_logs (user_id, staff_id, login_type, ip_address, user_agent, success, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [
            log.user_id,
            log.staff_id,
            log.login_type,
            log.ip_address,
            log.user_agent,
            log.success === 1,
            log.created_at
          ]
        );
      }
      console.log('✅ Login logs migrated');
      
    } finally {
      client.release();
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('📊 Data summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   📋 Reports: ${reports.length}`);
    console.log(`   📦 Inventory: ${inventory.length}`);
    console.log(`   ✅ Tasks: ${tasks.length}`);
    console.log(`   🛠️ Toolbox: ${toolbox.length}`);
    console.log(`   ⚙️ Settings: ${settings.length}`);
    console.log(`   🔐 Login logs: ${loginLogs.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close both database connections
    await sqliteDB.close();
    await postgresDB.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToPostgreSQL();
}

module.exports = migrateToPostgreSQL;
