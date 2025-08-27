// Railway SQLite Server - More Reliable than PostgreSQL
console.log('🚀 Starting Railway SQLite Server...');

const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// SQLite database setup
const dbPath = path.join(__dirname, 'Backend', 'electrical_management.db');
const db = new sqlite3.Database(dbPath);

// Middleware
app.use(cors({
  origin: [
    'https://electrical-3.netlify.app',
    'https://electrical-3-production.up.railway.app',
    'http://localhost:5500'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'Frontend')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: 'SQLite (Railway)',
    message: 'Railway SQLite server running'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Railway SQLite backend working!',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

app.listen(PORT, () => {
  console.log('✅ Railway SQLite Server started!');
  console.log(`📍 Port: ${PORT}`);
  console.log(`💾 Database: SQLite (${dbPath})`);
});
