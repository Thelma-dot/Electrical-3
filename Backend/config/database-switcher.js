const sqliteDB = require('./db-sqlite');
const postgresDB = require('./database-postgresql');

// Determine which database to use based on environment
function getDatabase() {
  const dbType = process.env.DB_TYPE || 'sqlite';

  console.log(`🗄️ Using database: ${dbType.toUpperCase()}`);

  if (dbType === 'postgresql' || dbType === 'postgres') {
    return postgresDB;
  } else {
    return sqliteDB;
  }
}

// Export the selected database
module.exports = getDatabase();
