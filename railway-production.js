// Railway Production Server - Optimized for Railway Deployment
console.log('🚀 Starting Railway Production Server...');

const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'Frontend')));

// Database connection
const dbPath = path.join(__dirname, 'Backend', 'electrical_management.db');
const db = new sqlite3.Database(dbPath);

console.log('✅ Connected to SQLite database:', dbPath);

// Health check for Railway
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        environment: 'production',
        database: 'SQLite (Railway)',
        message: 'Railway production server running'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Railway production backend working!',
        timestamp: new Date().toISOString()
    });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
    const { staff_id, password } = req.body;

    if (!staff_id || !password) {
        return res.status(400).json({ error: 'Staff ID and password are required' });
    }

    const query = 'SELECT * FROM users WHERE staff_id = ?';
    db.get(query, [staff_id], async (err, user) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password using bcrypt
        try {
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (bcryptError) {
            console.error('Password verification error:', bcryptError);
            return res.status(500).json({ error: 'Password verification failed' });
        }

        // Generate a simple token (in production, use proper JWT)
        const token = Buffer.from(JSON.stringify({
            id: user.id,
            staff_id: user.staff_id,
            role: user.role,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        })).toString('base64');

        res.json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                staff_id: user.staff_id,
                role: user.role,
                email: user.email
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

    db.run(query, [user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status || 'Pending'], function (err) {
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

    db.run(query, [user_id, product_type, status || 'New', size, serial_number, date, location, issued_by], function (err) {
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

    db.run(query, [user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by], function (err) {
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

// Admin routes
app.get('/api/admin/dashboard', (req, res) => {
    // Get counts for admin dashboard
    const queries = {
        users: 'SELECT COUNT(*) as count FROM users',
        reports: 'SELECT COUNT(*) as count FROM reports',
        inventory: 'SELECT COUNT(*) as count FROM inventory',
        toolbox: 'SELECT COUNT(*) as count FROM toolbox'
    };

    Promise.all([
        new Promise((resolve) => db.get(queries.users, (err, result) => resolve(err ? 0 : result.count))),
        new Promise((resolve) => db.get(queries.reports, (err, result) => resolve(err ? 0 : result.count))),
        new Promise((resolve) => db.get(queries.inventory, (err, result) => resolve(err ? 0 : result.count))),
        new Promise((resolve) => db.get(queries.toolbox, (err, result) => resolve(err ? 0 : result.count)))
    ]).then(([users, reports, inventory, toolbox]) => {
        res.json({
            users,
            reports,
            inventory,
            toolbox,
            timestamp: new Date().toISOString()
        });
    }).catch(err => {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log('✅ Railway Production Server started successfully!');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: production`);
    console.log(`💾 Database: SQLite (${dbPath})`);
    console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`📋 Reports: GET/POST http://localhost:${PORT}/api/reports`);
    console.log(`📦 Inventory: GET/POST http://localhost:${PORT}/api/inventory`);
    console.log(`🛠️ Toolbox: GET/POST http://localhost:${PORT}/api/toolbox`);
    console.log(`👥 Users: GET http://localhost:${PORT}/api/auth/users`);
    console.log(`👑 Admin: GET http://localhost:${PORT}/api/admin/dashboard`);
});

// Error handling
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
});
