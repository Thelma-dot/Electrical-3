const express = require('express');
const router = express.Router();

// Health check endpoint for Render
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: process.env.NODE_ENV === 'production' ? 'Render' : 'Local',
      database: 'Connected', // You can add actual DB check here
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
