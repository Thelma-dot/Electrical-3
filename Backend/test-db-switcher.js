require('dotenv').config({ path: require('path').join(__dirname, 'config.env') });

console.log('Testing database switcher...');
console.log('DB_TYPE:', process.env.DB_TYPE);

try {
    const db = require('./config/database-switcher');
    console.log('✅ Database switcher loaded successfully');
    console.log('Database type:', db.db ? 'SQLite' : 'PostgreSQL');
} catch (error) {
    console.error('❌ Error loading database switcher:', error);
}
