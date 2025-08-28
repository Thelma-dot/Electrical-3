// Railway Production Server - Optimized for Railway Deployment with PostgreSQL
console.log('🚀 Starting Railway Production Server...');

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Database Configuration for Railway
const dbConfig = {
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'railway',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
  port: process.env.DB_PORT || process.env.PGPORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

console.log('🔧 Database Configuration:', {
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port,
  ssl: dbConfig.ssl
});

// Create PostgreSQL connection pool
let pool;
try {
  pool = new Pool(dbConfig);
  console.log('✅ PostgreSQL connection pool created');
} catch (error) {
  console.error('❌ Failed to create PostgreSQL pool:', error);
  process.exit(1);
}

// Test database connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
  console.log('✅ Database connected successfully:', result.rows[0]);
});

// Middleware
app.use(cors({
    origin: [
        'https://electrical-3.netlify.app',
        'https://electrical-3-production.up.railway.app',
        'http://localhost:5500',
        'http://localhost:3000',
        'http://localhost:5000'
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'Frontend')));

// Health check for Railway
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        environment: 'production',
        database: 'PostgreSQL (Railway)',
        message: 'Railway production server running',
        databaseStatus: pool ? 'connected' : 'disconnected'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Railway production backend working!',
        timestamp: new Date().toISOString(),
        database: 'PostgreSQL',
        environment: process.env.NODE_ENV || 'production'
    });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
    const { staff_id, password } = req.body;

    if (!staff_id || !password) {
        return res.status(400).json({ error: 'Staff ID and password are required' });
    }

    try {
        const query = 'SELECT * FROM users WHERE staff_id = $1';
        const result = await pool.query(query, [staff_id]);
        
        if (result.rows.length === 0) {
            // Log failed login attempt
            await pool.query(
                'INSERT INTO login_logs (user_id, staff_id, status, login_time, ip_address) VALUES ($1, $2, $3, $4, $5)',
                [null, staff_id, 'failed', new Date().toISOString(), req.ip || 'unknown']
            );
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password using bcrypt
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            // Log failed login attempt (wrong password)
            await pool.query(
                'INSERT INTO login_logs (user_id, staff_id, status, login_time, ip_address) VALUES ($1, $2, $3, $4, $5)',
                [user.id, user.staff_id, 'failed', new Date().toISOString(), req.ip || 'unknown']
            );
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Log successful login
        await pool.query(
            'INSERT INTO login_logs (user_id, staff_id, status, login_time, ip_address) VALUES ($1, $2, $3, $4, $5)',
            [user.id, user.staff_id, 'success', new Date().toISOString(), req.ip || 'unknown']
        );

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
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Reports routes
app.get('/api/reports', async (req, res) => {
    try {
        const query = 'SELECT * FROM reports ORDER BY created_at DESC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/reports', async (req, res) => {
    const { user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status } = req.body;

    try {
        const query = `INSERT INTO reports (user_id, title, job_description, location, remarks, report_date, report_time, tools_used, status, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`;

        const result = await pool.query(query, [
            user_id, title, job_description, location, remarks, 
            report_date, report_time, tools_used, status || 'Pending', new Date().toISOString()
        ]);

        res.json({ id: result.rows[0].id, message: 'Report created successfully' });
    } catch (error) {
        console.error('Create report error:', error);
        res.status(500).json({ error: 'Failed to create report' });
    }
});

// Get report by ID for editing
app.get('/api/reports/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = 'SELECT * FROM reports WHERE id = $1';
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update report
app.put('/api/reports/:id', async (req, res) => {
    const { id } = req.params;
    const { title, job_description, location, remarks, report_date, report_time, tools_used, status } = req.body;
    
    if (!title || !job_description || !location || !report_date || !report_time) {
        return res.status(400).json({ error: 'Required fields are missing' });
    }
    
    try {
        const query = `UPDATE reports SET title = $1, job_description = $2, location = $3, remarks = $4, 
                       report_date = $5, report_time = $6, tools_used = $7, status = $8, updated_at = $9 WHERE id = $10`;

        const result = await pool.query(query, [
            title, job_description, location, remarks, report_date, 
            report_time, tools_used, status, new Date().toISOString(), id
        ]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json({ message: 'Report updated successfully' });
    } catch (error) {
        console.error('Update report error:', error);
        res.status(500).json({ error: 'Failed to update report' });
    }
});

// Delete report
app.delete('/api/reports/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = 'DELETE FROM reports WHERE id = $1';
        const result = await pool.query(query, [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Delete report error:', error);
        res.status(500).json({ error: 'Failed to delete report' });
    }
});

// Get reports by user ID
app.get('/api/reports/user/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const query = 'SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC';
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('User reports error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get reports by status
app.get('/api/reports/status/:status', async (req, res) => {
    const { status } = req.params;
    
    try {
        const query = 'SELECT * FROM reports WHERE status = $1 ORDER BY created_at DESC';
        const result = await pool.query(query, [status]);
        res.json(result.rows);
    } catch (error) {
        console.error('Status reports error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Search reports
app.get('/api/reports/search', async (req, res) => {
    const { q, location, status, date_from, date_to } = req.query;
    
    let query = 'SELECT * FROM reports WHERE 1=1';
    let params = [];
    let paramCount = 0;
    
    if (q) {
        paramCount++;
        query += ` AND (title LIKE $${paramCount} OR job_description LIKE $${paramCount} OR remarks LIKE $${paramCount})`;
        params.push(`%${q}%`);
    }
    
    if (location) {
        paramCount++;
        query += ` AND location LIKE $${paramCount}`;
        params.push(`%${location}%`);
    }
    
    if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
    }
    
    if (date_from) {
        paramCount++;
        query += ` AND report_date >= $${paramCount}`;
        params.push(date_from);
    }
    
    if (date_to) {
        paramCount++;
        query += ` AND report_date <= $${paramCount}`;
        params.push(date_to);
    }
    
    query += ' ORDER BY created_at DESC';
    
    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Search reports error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Inventory routes
app.get('/api/inventory', async (req, res) => {
    try {
        const query = 'SELECT * FROM inventory ORDER BY created_at DESC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Inventory error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/inventory', async (req, res) => {
    const { user_id, product_type, status, size, serial_number, date, location, issued_by } = req.body;

    try {
        const query = `INSERT INTO inventory (user_id, product_type, status, size, serial_number, date, location, issued_by, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`;

        const result = await pool.query(query, [
            user_id, product_type, status || 'New', size, serial_number, 
            date, location, issued_by, new Date().toISOString()
        ]);

        res.json({ id: result.rows[0].id, message: 'Inventory item created successfully' });
    } catch (error) {
        console.error('Create inventory error:', error);
        res.status(500).json({ error: 'Failed to create inventory item' });
    }
});

// Toolbox routes
app.get('/api/toolbox', async (req, res) => {
    try {
        const query = 'SELECT * FROM toolbox ORDER BY created_at DESC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Toolbox error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/toolbox', async (req, res) => {
    const { user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by } = req.body;

    try {
        const query = `INSERT INTO toolbox (user_id, work_activity, date, work_location, name_company, sign, ppe_no, tools_used, hazards, circulars, risk_assessment, permit, remarks, prepared_by, verified_by, created_at) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`;

        const result = await pool.query(query, [
            user_id, work_activity, date, work_location, name_company, sign, ppe_no, 
            tools_used, hazards, circulars, risk_assessment, permit, remarks, 
            prepared_by, verified_by, new Date().toISOString()
        ]);

        res.json({ id: result.rows[0].id, message: 'Toolbox form created successfully' });
    } catch (error) {
        console.error('Create toolbox error:', error);
        res.status(500).json({ error: 'Failed to create toolbox form' });
    }
});

// Users routes
app.get('/api/auth/users', async (req, res) => {
    try {
        const query = 'SELECT id, staff_id, email, role, created_at FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin users route (for admin dashboard)
app.get('/api/admin/users', async (req, res) => {
    try {
        const query = 'SELECT id, staff_id, email, role, created_at FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// User management endpoints
app.post('/api/admin/users', async (req, res) => {
    const { staff_id, email, password, role } = req.body;

    if (!staff_id || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = 'INSERT INTO users (staff_id, email, password, role, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id';
        const result = await pool.query(query, [staff_id, email, hashedPassword, role, new Date().toISOString()]);

        res.json({ id: result.rows[0].id, message: 'User created successfully' });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.put('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;
    const { staff_id, email, role } = req.body;

    if (!staff_id || !email || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const query = 'UPDATE users SET staff_id = $1, email = $2, role = $3 WHERE id = $4';
        const result = await pool.query(query, [staff_id, email, role, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get user by ID for editing
app.get('/api/admin/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'SELECT id, staff_id, email, role, created_at FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Task management endpoints
app.get('/api/admin/tasks', async (req, res) => {
    try {
        const query = `SELECT t.*, u.staff_id as assigned_to_name 
                       FROM tasks t 
                       LEFT JOIN users u ON t.assigned_to = u.id 
                       ORDER BY t.created_at DESC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Tasks error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/admin/tasks', async (req, res) => {
    const { title, description, assigned_to, priority, status, due_date } = req.body;

    if (!title || !description || !assigned_to || !priority || !due_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const query = `INSERT INTO tasks (title, description, assigned_to, priority, status, due_date, created_at) 
                       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;

        const result = await pool.query(query, [
            title, description, assigned_to, priority, status || 'Pending', 
            due_date, new Date().toISOString()
        ]);

        res.json({ id: result.rows[0].id, message: 'Task created successfully' });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

app.put('/api/admin/tasks/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, assigned_to, priority, status, due_date } = req.body;

    if (!title || !description || !assigned_to || !priority || !due_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const query = 'UPDATE tasks SET title = $1, description = $2, assigned_to = $3, priority = $4, status = $5, due_date = $6 WHERE id = $7';
        const result = await pool.query(query, [title, description, assigned_to, priority, status, due_date, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

app.delete('/api/admin/tasks/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM tasks WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Get user tasks
app.get('/api/tasks/my', async (req, res) => {
    try {
        // This is a placeholder - you'll need to implement proper authentication
        const query = 'SELECT * FROM tasks ORDER BY created_at DESC LIMIT 10';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('My tasks error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Admin routes
app.get('/api/admin/dashboard/test', (req, res) => {
    res.json({
        message: 'Admin dashboard test endpoint working',
        timestamp: new Date().toISOString()
    });
});

// Login statistics endpoint
app.get('/api/admin/login-stats', async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

        // Get today's successful logins
        const successfulLoginsResult = await pool.query(
            'SELECT COUNT(*) as count FROM login_logs WHERE status = $1 AND login_time >= $2 AND login_time <= $3',
            ['success', startOfDay, endOfDay]
        );

        // Get today's failed logins
        const failedLoginsResult = await pool.query(
            'SELECT COUNT(*) as count FROM login_logs WHERE status = $1 AND login_time >= $2 AND login_time <= $3',
            ['failed', startOfDay, endOfDay]
        );

        const successfulLogins = parseInt(successfulLoginsResult.rows[0].count);
        const failedLogins = parseInt(failedLoginsResult.rows[0].count);

        res.json({
            successfulLogins,
            failedLogins,
            totalLogins: successfulLogins + failedLogins,
            date: today.toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Login stats error:', error);
        res.status(500).json({ error: 'Failed to load login statistics' });
    }
});

// Reports performance endpoint for charts
app.get('/api/admin/reports-performance', async (req, res) => {
    try {
        // Get monthly reports count for the last 12 months
        const monthlyReportsResult = await pool.query(`
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as month,
                COUNT(*) as count
            FROM reports 
            WHERE created_at >= NOW() - INTERVAL '12 months'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM')
            ORDER BY month ASC
        `);

        // Get reports by status
        const reportsByStatusResult = await pool.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM reports 
            GROUP BY status
        `);

        // Get reports by location
        const reportsByLocationResult = await pool.query(`
            SELECT 
                location,
                COUNT(*) as count
            FROM reports 
            GROUP BY location
            ORDER BY count DESC
            LIMIT 10
        `);

        res.json({
            monthlyReports: monthlyReportsResult.rows,
            reportsByStatus: reportsByStatusResult.rows,
            reportsByLocation: reportsByLocationResult.rows,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Reports performance error:', error);
        res.status(500).json({ error: 'Failed to load reports performance data' });
    }
});

// Revenue/Performance metrics endpoint
app.get('/api/admin/revenue-metrics', async (req, res) => {
    try {
        // Get performance metrics for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get reports completed in last 30 days
        const recentReportsResult = await pool.query(
            'SELECT COUNT(*) as count FROM reports WHERE status = $1 AND created_at >= $2',
            ['Completed', thirtyDaysAgo.toISOString()]
        );

        // Get average completion time (in days)
        const avgCompletionTimeResult = await pool.query(`
            SELECT AVG(
                CASE 
                    WHEN status = 'Completed' 
                    THEN EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400
                    ELSE NULL 
                END
            ) as avgDays
            FROM reports 
            WHERE status = 'Completed'
        `);

        // Get top performing locations
        const topLocationsResult = await pool.query(`
            SELECT 
                location,
                COUNT(*) as reportCount,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedCount
            FROM reports 
            GROUP BY location
            ORDER BY reportCount DESC
            LIMIT 5
        `);

        const recentReports = parseInt(recentReportsResult.rows[0].count);
        const avgCompletionTime = parseFloat(avgCompletionTimeResult.rows[0].avgdays) || 0;

        res.json({
            recentReports,
            avgCompletionTime: Math.round(avgCompletionTime * 100) / 100,
            topLocations: topLocationsResult.rows,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Revenue metrics error:', error);
        res.status(500).json({ error: 'Failed to load revenue metrics data' });
    }
});

app.get('/api/admin/dashboard', async (req, res) => {
    try {
        // Get counts for admin dashboard
        const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
        const reportsResult = await pool.query('SELECT COUNT(*) as count FROM reports');
        const inventoryResult = await pool.query('SELECT COUNT(*) as count FROM inventory');
        const toolboxResult = await pool.query('SELECT COUNT(*) as count FROM toolbox');

        res.json({
            users: parseInt(usersResult.rows[0].count),
            reports: parseInt(reportsResult.rows[0].count),
            inventory: parseInt(inventoryResult.rows[0].count),
            toolbox: parseInt(toolboxResult.rows[0].count),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to load dashboard data' });
    }
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
    console.log(`💾 Database: PostgreSQL (Railway)`);
    console.log(`🔗 Database Host: ${dbConfig.host}`);
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

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');
    if (pool) {
        await pool.end();
        console.log('✅ Database connections closed');
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');
    if (pool) {
        await pool.end();
        console.log('✅ Database connections closed');
    }
    process.exit(0);
});
