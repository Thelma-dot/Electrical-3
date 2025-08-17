// Use SQLite database for easier setup
const sqliteDb = require("./db-sqlite");

console.log("✅ Using SQLite database for development");

// Create a simple pool-like interface for compatibility
const pool = {
  getConnection: async () => {
    return {
      query: async (sql, params = []) => {
        if (sql.trim().toLowerCase().startsWith("select")) {
          const rows = await sqliteDb.all(sql, params);
          return [rows];
        } else {
          const result = await sqliteDb.run(sql, params);
          return [result];
        }
      },
      release: () => {},
    };
  },
  end: () => {
    sqliteDb.db.close();
  },
};

module.exports = pool;
