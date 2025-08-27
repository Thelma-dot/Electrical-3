const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('electrical_management.db');

console.log('🔍 Checking users in database...');

db.all('SELECT staff_id, password, role FROM users LIMIT 5', (err, rows) => {
    if (err) {
        console.error('❌ Database error:', err);
    } else {
        console.log('✅ Users found:');
        rows.forEach(row => {
            console.log(`- ${row.staff_id} (${row.role}): password = "${row.password}"`);
        });
    }
    db.close();
});
