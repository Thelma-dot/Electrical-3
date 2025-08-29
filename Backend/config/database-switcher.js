const sqliteDB = require('./db-sqlite');

// Determine which database to use based on environment
function getDatabase() {
  const dbType = process.env.DB_TYPE || 'sqlite';

  console.log(`🗄️ Using database: ${dbType.toUpperCase()}`);

  // Only load PostgreSQL if explicitly requested and available
  if (dbType === 'postgresql' || dbType === 'postgres') {
    try {
      const postgresDB = require('./database-postgresql');
      console.log('✅ PostgreSQL module loaded successfully');
      return postgresDB;
    } catch (error) {
      console.log('⚠️ PostgreSQL module not available, falling back to SQLite:', error.message);
      return sqliteDB;
    }
  } else {
    console.log('✅ Using SQLite database');
    return sqliteDB;
  }
}

// Export the selected database
module.exports = getDatabase();
