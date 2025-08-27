// Railway PostgreSQL Fix Server
console.log('🚀 Starting Railway PostgreSQL Fix Server...');

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'https://electrical-3.netlify.app',
    'https://electrical-3-production.up.railway.app',
    'http://localhost:5500',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'Frontend')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    database: 'PostgreSQL (Railway)',
    message: 'Railway server is running'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Railway backend is working!',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    // Check if PostgreSQL environment variables are set
    const hasDbVars = process.env.PGHOST && process.env.PGDATABASE && process.env.PGPASSWORD;
    
    if (!hasDbVars) {
      return res.status(500).json({
        error: 'PostgreSQL environment variables missing',
        message: 'PGHOST, PGDATABASE, or PGPASSWORD not set in Railway',
        fix: 'Set these variables in Railway dashboard'
      });
    }

    // Try to connect to PostgreSQL
    const { Pool } = require('pg');
    const pool = new Pool({
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT || 5432,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await pool.end();

    res.json({
      status: 'success',
      message: 'PostgreSQL connection successful',
      database: process.env.PGDATABASE,
      host: process.env.PGHOST
    });

  } catch (error) {
    res.status(500).json({
      error: 'PostgreSQL connection failed',
      message: error.message,
      fix: 'Check Railway PostgreSQL service and environment variables'
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('✅ Railway Fix Server started successfully!');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`💾 Database: PostgreSQL (Railway)`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔍 Database Test: http://localhost:${PORT}/api/db-test`);
});
