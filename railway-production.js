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
            // Log failed login attempt
            const logQuery = `INSERT INTO login_logs (user_id, staff_id, status, login_time, ip_address) VALUES (?, ?, ?, ?, ?)`;
            db.run(logQuery, [null, staff_id, 'failed', new Date().toISOString(), req.ip || 'unknown'], (err) => {
                if (err) console.error('Failed to log failed login:', err);
            });
            
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password using bcrypt
        try {
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                // Log failed login attempt (wrong password)
                const logQuery = `INSERT INTO login_logs (user_id, staff_id, status, login_time, ip_address) VALUES (?, ?, ?, ?, ?)`;
                db.run(logQuery, [user.id, user.staff_id, 'failed', new Date().toISOString(), req.ip || 'unknown'], (err) => {
                    if (err) console.error('Failed to log failed login:', err);
                });
                
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (bcryptError) {
            console.error('Password verification error:', bcryptError);
            return res.status(500).json({ error: 'Password verification failed' });
        }

                // Log successful login
        const logQuery = `INSERT INTO login_logs (user_id, staff_id, status, login_time, ip_address) VALUES (?, ?, ?, ?, ?)`;
        db.run(logQuery, [user.id, user.staff_id, 'success', new Date().toISOString(), req.ip || 'unknown'], (err) => {
            if (err) console.error('Failed to log successful login:', err);
        });

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

// Admin users route (for admin dashboard)
app.get('/api/admin/users', (req, res) => {
    const query = 'SELECT id, staff_id, email, role, created_at FROM users ORDER BY created_at DESC';
    db.all(query, (err, users) => {
        if (err) {
            console.error('Admin users error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(users);
    });
});

// User management endpoints
app.post('/api/admin/users', (req, res) => {
    const { staff_id, email, password, role } = req.body;
    
    if (!staff_id || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Password hashing error:', err);
            return res.status(500).json({ error: 'Failed to hash password' });
        }
        
        const query = `INSERT INTO users (staff_id, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)`;
        db.run(query, [staff_id, email, hashedPassword, role, new Date().toISOString()], function (err) {
            if (err) {
                console.error('Create user error:', err);
                return res.status(500).json({ error: 'Failed to create user' });
            }
            res.json({ id: this.lastID, message: 'User created successfully' });
        });
    });
});

app.put('/api/admin/users/:id', (req, res) => {
    const { id } = req.params;
    const { staff_id, email, role } = req.body;
    
    if (!staff_id || !email || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    const query = `UPDATE users SET staff_id = ?, email = ?, role = ? WHERE id = ?`;
    db.run(query, [staff_id, email, role, id], function (err) {
        if (err) {
            console.error('Update user error:', err);
            return res.status(500).json({ error: 'Failed to update user' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    });
});

app.delete('/api/admin/users/:id', (req, res) => {
    const { id } = req.params;
    
    const query = `DELETE FROM users WHERE id = ?`;
    db.run(query, [id], function (err) {
        if (err) {
            console.error('Delete user error:', err);
            return res.status(500).json({ error: 'Failed to delete user' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

// Get user by ID for editing
app.get('/api/admin/users/:id', (req, res) => {
    const { id } = req.params;
    
    const query = `SELECT id, staff_id, email, role, created_at FROM users WHERE id = ?`;
    db.get(query, [id], (err, user) => {
        if (err) {
            console.error('Get user error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
    });
});

// Task management endpoints
app.get('/api/admin/tasks', (req, res) => {
    const query = `SELECT t.*, u.staff_id as assigned_to_name 
                   FROM tasks t 
                   LEFT JOIN users u ON t.assigned_to = u.id 
                   ORDER BY t.created_at DESC`;
    db.all(query, (err, tasks) => {
        if (err) {
            console.error('Tasks error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(tasks);
    });
});

app.post('/api/admin/tasks', (req, res) => {
    const { title, description, assigned_to, priority, status, due_date } = req.body;
    
    if (!title || !description || !assigned_to || !priority || !due_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    const query = `INSERT INTO tasks (title, description, assigned_to, priority, status, due_date, created_at) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [title, description, assigned_to, priority, status || 'Pending', due_date, new Date().toISOString()], function (err) {
        if (err) {
            console.error('Create task error:', err);
            return res.status(500).json({ error: 'Failed to create task' });
        }
        res.json({ id: this.lastID, message: 'Task created successfully' });
    });
});

app.put('/api/admin/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, assigned_to, priority, status, due_date } = req.body;
    
    if (!title || !description || !assigned_to || !priority || !due_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    const query = `UPDATE tasks SET title = ?, description = ?, assigned_to = ?, priority = ?, status = ?, due_date = ? WHERE id = ?`;
    db.run(query, [title, description, assigned_to, priority, status, due_date, id], function (err) {
        if (err) {
            console.error('Update task error:', err);
            return res.status(500).json({ error: 'Failed to update task' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task updated successfully' });
    });
});

app.delete('/api/admin/tasks/:id', (req, res) => {
    const { id } = req.params;
    
    const query = `DELETE FROM tasks WHERE id = ?`;
    db.run(query, [id], function (err) {
        if (err) {
            console.error('Delete task error:', err);
            return res.status(500).json({ error: 'Failed to delete task' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    });
});

// Admin routes
app.get('/api/admin/dashboard/test', (req, res) => {
    res.json({
        message: 'Admin dashboard test endpoint working',
        timestamp: new Date().toISOString()
    });
});

// Login statistics endpoint
app.get('/api/admin/login-stats', (req, res) => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    
    // Get today's successful logins
    const successfulLoginsQuery = `
        SELECT COUNT(*) as count 
        FROM login_logs 
        WHERE status = 'success' 
        AND login_time >= ? AND login_time <= ?
    `;
    
    // Get today's failed logins
    const failedLoginsQuery = `
        SELECT COUNT(*) as count 
        FROM login_logs 
        WHERE status = 'failed' 
        AND login_time >= ? AND login_time <= ?
    `;
    
    Promise.all([
        new Promise((resolve) => db.get(successfulLoginsQuery, [startOfDay, endOfDay], (err, result) => resolve(err ? 0 : result.count))),
        new Promise((resolve) => db.get(failedLoginsQuery, [startOfDay, endOfDay], (err, result) => resolve(err ? 0 : result.count)))
    ]).then(([successfulLogins, failedLogins]) => {
        res.json({
            successfulLogins,
            failedLogins,
            totalLogins: successfulLogins + failedLogins,
            date: today.toISOString().split('T')[0]
        });
    }).catch(err => {
        console.error('Login stats error:', err);
        res.status(500).json({ error: 'Failed to load login statistics' });
    });
});

// Reports performance endpoint for charts
app.get('/api/admin/reports-performance', (req, res) => {
    // Get monthly reports count for the last 12 months
    const monthlyReportsQuery = `
        SELECT 
            strftime('%Y-%m', created_at) as month,
            COUNT(*) as count
        FROM reports 
        WHERE created_at >= date('now', '-12 months')
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month ASC
    `;
    
    // Get reports by status
    const reportsByStatusQuery = `
        SELECT 
            status,
            COUNT(*) as count
        FROM reports 
        GROUP BY status
    `;
    
    // Get reports by location
    const reportsByLocationQuery = `
        SELECT 
            location,
            COUNT(*) as count
        FROM reports 
        GROUP BY location
        ORDER BY count DESC
        LIMIT 10
    `;
    
    Promise.all([
        new Promise((resolve) => db.all(monthlyReportsQuery, (err, results) => resolve(err ? [] : results))),
        new Promise((resolve) => db.all(reportsByStatusQuery, (err, results) => resolve(err ? [] : results))),
        new Promise((resolve) => db.all(reportsByLocationQuery, (err, results) => resolve(err ? [] : results)))
    ]).then(([monthlyReports, reportsByStatus, reportsByLocation]) => {
        res.json({
            monthlyReports,
            reportsByStatus,
            reportsByLocation,
            timestamp: new Date().toISOString()
        });
    }).catch(err => {
        console.error('Reports performance error:', err);
        res.status(500).json({ error: 'Failed to load reports performance data' });
    });
});

// Revenue/Performance metrics endpoint
app.get('/api/admin/revenue-metrics', (req, res) => {
    // Get performance metrics for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get reports completed in last 30 days
    const recentReportsQuery = `
        SELECT COUNT(*) as count
        FROM reports 
        WHERE status = 'Completed' 
        AND created_at >= ?
    `;
    
    // Get average completion time (in days)
    const avgCompletionTimeQuery = `
        SELECT AVG(
            CASE 
                WHEN status = 'Completed' 
                THEN julianday(updated_at) - julianday(created_at)
                ELSE NULL 
            END
        ) as avgDays
        FROM reports 
        WHERE status = 'Completed'
    `;
    
    // Get top performing locations
    const topLocationsQuery = `
        SELECT 
            location,
            COUNT(*) as reportCount,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedCount
        FROM reports 
        GROUP BY location
        ORDER BY reportCount DESC
        LIMIT 5
    `;
    
    Promise.all([
        new Promise((resolve) => db.get(recentReportsQuery, [thirtyDaysAgo.toISOString()], (err, result) => resolve(err ? 0 : result.count))),
        new Promise((resolve) => db.get(avgCompletionTimeQuery, (err, result) => resolve(err ? 0 : result.avgDays))),
        new Promise((resolve) => db.all(topLocationsQuery, (err, results) => resolve(err ? [] : results)))
    ]).then(([recentReports, avgCompletionTime, topLocations]) => {
        res.json({
            recentReports,
            avgCompletionTime: Math.round(avgCompletionTime * 100) / 100, // Round to 2 decimal places
            topLocations,
            timestamp: new Date().toISOString()
        });
    }).catch(err => {
        console.error('Revenue metrics error:', err);
        res.status(500).json({ error: 'Failed to load revenue metrics data' });
    });
});

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
