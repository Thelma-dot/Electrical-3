const app = require("../app");
const { initializeDatabase } = require("../config/database-vercel");

// Vercel serverless function handler
module.exports = async (req, res) => {
  try {
    // Initialize database if not already done
    if (!global.dbInitialized) {
      await initializeDatabase();
      global.dbInitialized = true;
    }

    // Handle CORS for Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Forward the request to the Express app
    return app(req, res);
    
  } catch (error) {
    console.error('❌ Vercel function error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
