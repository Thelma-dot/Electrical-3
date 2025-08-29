const express = require('express');
const router = express.Router();
const { get, all } = require('../config/db-sqlite');

// Health check endpoint
router.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database health check
router.get('/db', async (req, res) => {
  try {
    // Test basic database connection
    const testResult = await get('SELECT 1 as test');
    console.log('🔍 Database health check result:', testResult);
    
    // Check if tables exist
    const tablesResult = await all("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('🔍 Available tables:', tablesResult);
    
    // Check reports table structure
    const reportsStructure = await all("PRAGMA table_info(reports)");
    console.log('🔍 Reports table structure:', reportsStructure);
    
    // Check users table structure
    const usersStructure = await all("PRAGMA table_info(users)");
    console.log('🔍 Users table structure:', usersStructure);
    
    res.json({
      status: 'OK',
      database: 'Connected',
      tables: tablesResult.map(t => t.name),
      reportsStructure,
      usersStructure,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      database: 'Failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
