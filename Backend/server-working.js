// Working Server - Loads Essential Routes Only
console.log('🚀 Starting Working Server...');

const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5500',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'https://electrical-3.netlify.app',
    'https://electrical-3-production.up.railway.app'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'Frontend')));

// Database connection
const dbPath = path.join(__dirname, 'electrical_management.db');
const db = new sqlite3.Database(dbPath);

console.log('✅ Connected to SQLite database:', dbPath);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: 'SQLite',
    message: 'Working server is running'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Working backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Auth routes (simplified)
app.post('/api/auth/login', (req, res) => {
  const { staff_id, password } = req.body;
  
  if (!staff_id || !password) {
    return res.status(400).json({ error: 'Staff ID and password are required' });
  }

  const query = 'SELECT * FROM users WHERE staff_id = ? AND password = ?';
  db.get(query, [staff_id, password], (err, user) => {
    if (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // In production, you should hash passwords and use JWT
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        staff_id: user.staff_id,
        role: user.role
      }
    });
  });
});

// Reports routes
app.get('/api/reports', (req, res) => {
  const query = 'SELECT * FROM reports ORDER BY created_at DESC';
  db.all(query, (err, reports) => {
    if (err) {
      console.error('Reports error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(reports);
  });
});

app.post('/api/reports', (req, res) => {
  const { user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status } = req.body;
  
  const query = `INSERT INTO reports (user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status || 'Pending'], function(err) {
    if (err) {
      console.error('Create report error:', err);
      return res.status(500).json({ error: 'Failed to create report' });
    }
    res.json({ id: this.lastID, message: 'Report created successfully' });
  });
});

// Inventory routes
app.get('/api/inventory', (req, res) => {
  const query = 'SELECT * FROM inventory ORDER BY created_at DESC';
  db.all(query, (err, inventory) => {
    if (err) {
      console.error('Inventory error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(inventory);
  });
});

app.post('/api/inventory', (req, res) => {
  const { user_id, product_type, status, size, serial_number, date, location, issued_by } = req.body;
  
  const query = `INSERT INTO inventory (user_id, product_type, status, size, serial_number, date, location, issued_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [user_id, product_type, status || 'New', size, serial_number, date, location, issued_by], function(err) {
    if (err) {
      console.error('Create inventory error:', err);
      return res.status(500).json({ error: 'Failed to create inventory item' });
    }
    res.json({ id: this.lastID, message: 'Inventory item created successfully' });
  });
});

// Toolbox routes
app.get('/api/toolbox', (req, res) => {
  const query = 'SELECT * FROM toolbox ORDER BY created_at DESC';
  db.all(query, (err, toolbox) => {
    if (err) {
      console.error('Toolbox error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(toolbox);
  });
});

app.post('/api/toolbox', (req, res) => {
  const { user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by } = req.body;
  
  const query = `INSERT INTO toolbox (user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(query, [user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by], function(err) {
    if (err) {
      console.error('Create toolbox error:', err);
      return res.status(500).json({ error: 'Failed to create toolbox form' });
    }
    res.json({ id: this.lastID, message: 'Toolbox form created successfully' });
  });
});

// Users routes
app.get('/api/auth/users', (req, res) => {
  const query = 'SELECT id, staff_id, email, role, created_at FROM users ORDER BY created_at DESC';
  db.all(query, (err, users) => {
    if (err) {
      console.error('Users error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('✅ Working Server started successfully!');
  console.log(`📍 Port: ${PORT}`);
  console.log(`💾 Database: SQLite (${dbPath})`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📋 Reports: GET/POST http://localhost:${PORT}/api/reports`);
  console.log(`📦 Inventory: GET/POST http://localhost:${PORT}/api/inventory`);
  console.log(`🛠️ Toolbox: GET/POST http://localhost:${PORT}/api/toolbox`);
  console.log(`👥 Users: GET http://localhost:${PORT}/api/auth/users`);
});
