const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'electrical_management.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

// Check admin user
console.log('🔍 Checking admin user in database...');

db.get("SELECT * FROM users WHERE staff_id = ?", ["admin"], (err, row) => {
  if (err) {
    console.error('❌ Error querying database:', err.message);
    return;
  }
  
  if (row) {
    console.log('✅ Admin user found:');
    console.log('   Staff ID:', row.staff_id);
    console.log('   Role:', row.role);
    console.log('   Email:', row.email);
    console.log('   Created:', row.created_at);
    console.log('   Last Login:', row.last_login);
  } else {
    console.log('❌ Admin user not found!');
    console.log('🔍 Checking all users in database...');
    
    db.all("SELECT staff_id, role, email FROM users", (err, rows) => {
      if (err) {
        console.error('❌ Error querying all users:', err.message);
        return;
      }
      
      console.log('📋 All users in database:');
      rows.forEach(user => {
        console.log(`   - ${user.staff_id} (${user.role}) - ${user.email}`);
      });
    });
  }
});

// Close database connection
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
  });
}, 2000);


