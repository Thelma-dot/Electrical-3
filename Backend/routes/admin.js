const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const { run, get, all } = require("../config/db-sqlite");

// List users
router.get("/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log("Admin users request received");
        const users = await all(
            "SELECT id, staff_id, email, role, created_at, last_login FROM users ORDER BY created_at DESC"
        );
        console.log(`Found ${users.length} users`);
        res.json(users);
    } catch (err) {
        console.error("Admin list users error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Create user
router.post("/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { staff_id, email, password, role } = req.body;
        if (!staff_id || !password || !role) {
            return res.status(400).json({ error: "staff_id, password, and role are required" });
        }
        const bcrypt = require("bcrypt");
        const hashed = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        const result = await run(
            "INSERT INTO users (staff_id, email, password, role) VALUES (?, ?, ?, ?)",
            [staff_id, email || null, hashed, role]
        );
        const user = await get("SELECT id, staff_id, email, role, created_at FROM users WHERE id = ?", [result.id]);

        // Emit realtime event for user creation
        try {
            req.app.locals.io.emit('user:created', user);
        } catch (e) {
            console.log('Socket not available for user:created event');
        }

        res.status(201).json(user);
    } catch (err) {
        console.error("Admin create user error:", err);
        if (err && err.message && err.message.includes("UNIQUE")) {
            return res.status(409).json({ error: "staff_id already exists" });
        }
        res.status(500).json({ error: "Server error" });
    }
});

// Create and login as user (optional helper)
router.post("/users/create-and-login", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { staff_id, email, password, role } = req.body;
        if (!staff_id || !password || !role) {
            return res.status(400).json({ error: "staff_id, password, and role are required" });
        }
        const bcrypt = require("bcrypt");
        const jwt = require("jsonwebtoken");
        const hashed = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        const result = await run(
            "INSERT INTO users (staff_id, email, password, role) VALUES (?, ?, ?, ?)",
            [staff_id, email || null, hashed, role]
        );
        const user = await get("SELECT * FROM users WHERE id = ?", [result.id]);
        const token = jwt.sign(
            { staffID: user.staff_id, userId: user.id, role: user.role || "staff" },
            process.env.JWT_SECRET || "your_jwt_secret_key_here",
            { expiresIn: process.env.TOKEN_EXPIRY || "24h" }
        );
        const { password: _, reset_token, token_expiry, ...safeUser } = user;

        // Emit realtime event for user creation
        try {
            req.app.locals.io.emit('user:created', safeUser);
        } catch (e) {
            console.log('Socket not available for user:created event');
        }

        res.status(201).json({ token, user: safeUser });
    } catch (err) {
        console.error("Admin create+login user error:", err);
        if (err && err.message && err.message.includes("UNIQUE")) {
            return res.status(409).json({ error: "staff_id already exists" });
        }
        res.status(500).json({ error: "Server error" });
    }
});

// Update user
router.put("/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { staff_id, email, role } = req.body;
        if (!staff_id || !role) {
            return res.status(400).json({ error: "staff_id and role are required" });
        }
        await run(
            "UPDATE users SET staff_id = ?, email = ?, role = ? WHERE id = ?",
            [staff_id, email || null, role, id]
        );

        // Emit realtime event for user update
        try {
            req.app.locals.io.emit('user:updated', { id, staff_id, email, role });
        } catch (e) {
            console.log('Socket not available for user:updated event');
        }

        res.json({ message: "User updated successfully" });
    } catch (err) {
        console.error("Admin update user error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Reset user password
router.post("/users/:id/reset-password", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ error: "newPassword is required" });
        const bcrypt = require("bcrypt");
        const hashed = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        await run("UPDATE users SET password = ? WHERE id = ?", [hashed, id]);
        res.json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("Admin reset password error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete user
router.delete("/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await run("DELETE FROM users WHERE id = ?", [id]);

        // Emit realtime event for user deletion
        try {
            req.app.locals.io.emit('user:deleted', { id });
        } catch (e) {
            console.log('Socket not available for user:deleted event');
        }

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Admin delete user error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ====================== Admin Reports Management ======================

// Get all reports (admin can see all reports from all users)
router.get("/reports", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const reports = await all(`
            SELECT r.*, u.staff_id as user_staff_id 
            FROM reports r 
            LEFT JOIN users u ON r.user_id = u.id 
            ORDER BY r.created_at DESC
        `);
        res.json(reports);
    } catch (err) {
        console.error("Admin list reports error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update report status (admin can change any report status)
router.put("/reports/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
            return res.status(400).json({ error: "Valid status required: Pending, In Progress, or Completed" });
        }

        await run("UPDATE reports SET status = ? WHERE id = ?", [status, id]);

        // Emit realtime event
        try { req.app.locals.io.emit('report:updated', { id, status }); } catch { }

        res.json({ message: "Report status updated successfully" });
    } catch (err) {
        console.error("Admin update report status error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete report (admin can delete any report)
router.delete("/reports/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await run("DELETE FROM reports WHERE id = ?", [id]);

        // Emit realtime event
        try { req.app.locals.io.emit('report:deleted', { id }); } catch { }

        res.json({ message: "Report deleted successfully" });
    } catch (err) {
        console.error("Admin delete report error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Test endpoint for admin dashboard data
router.get("/dashboard/test", authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log("Admin dashboard test request received");
        
        // Return test data to verify the endpoint is working
        const testData = {
            reports: 5,
            inventory: 10,
            toolbox: 3,
            inProgress: 2,
            completed: 8,
            totalUsers: 15,
            todayLogins: 3
        };
        
        console.log("Test data sent:", testData);
        res.json(testData);
    } catch (err) {
        console.error("Admin dashboard test error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ====================== Admin Dashboard ======================

// Get admin dashboard data (overview statistics)
router.get("/dashboard", authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log("Admin dashboard request received");
        // Get total counts for different entities
        const [reportsResult, inventoryResult, tasksResult, usersResult, toolboxResult] = await Promise.all([
            all("SELECT COUNT(*) as count FROM reports"),
            all("SELECT COUNT(*) as count FROM inventory"),
            all("SELECT COUNT(*) as count FROM tasks"),
            all("SELECT COUNT(*) as count FROM users"),
            all("SELECT COUNT(*) as count FROM toolbox")
        ]);

        // Get task status counts
        const taskStatusResult = await all(`
            SELECT status, COUNT(*) as count 
            FROM tasks 
            GROUP BY status
        `);

        // Get completed vs in-progress tasks
        const completedTasks = taskStatusResult.find(t => t.status === 'completed')?.count || 0;
        const inProgressTasks = taskStatusResult.find(t => t.status === 'in_progress')?.count || 0;

        // Get today's login count from login logs
        const todayLoginsResult = await all(`
            SELECT COUNT(*) as count 
            FROM login_logs 
            WHERE DATE(created_at) = DATE('now') AND success = 1
        `);

        const overviewData = {
            reports: reportsResult[0]?.count || 0,
            inventory: inventoryResult[0]?.count || 0,
            toolbox: toolboxResult[0]?.count || 0,
            inProgress: inProgressTasks,
            completed: completedTasks,
            totalUsers: usersResult[0]?.count || 0,
            todayLogins: todayLoginsResult[0]?.count || 0
        };

        console.log("Dashboard data:", overviewData);
        res.json(overviewData);
    } catch (err) {
        console.error("Admin chart overview error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get admin dashboard revenue chart data (monthly reports performance)
router.get("/chart-data/revenue", authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get monthly report counts for the current year
        const currentYear = new Date().getFullYear();
        const monthlyReports = await all(`
            SELECT strftime('%m', created_at) as month, COUNT(*) as count 
            FROM reports 
            WHERE strftime('%Y', created_at) = ? 
            GROUP BY strftime('%m', created_at) 
            ORDER BY month
        `, [currentYear.toString()]);

        // Get monthly task completion rates
        const monthlyTasks = await all(`
            SELECT strftime('%m', created_at) as month, 
                   COUNT(*) as total,
                   SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM tasks 
            WHERE strftime('%Y', created_at) = ? 
            GROUP BY strftime('%m', created_at) 
            ORDER BY month
        `, [currentYear.toString()]);

        // Process data for charts
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const chartData = months.map(month => {
            const reportData = monthlyReports.find(r => r.month === month);
            const taskData = monthlyTasks.find(t => t.month === month);

            return {
                month: month,
                reports: reportData?.count || 0,
                totalTasks: taskData?.total || 0,
                completedTasks: taskData?.completed || 0,
                completionRate: taskData?.total > 0 ? (taskData.completed / taskData.total) * 100 : 0
            };
        });

        res.json(chartData);
    } catch (err) {
        console.error("Admin chart revenue error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get login statistics for admin dashboard
router.get("/login-stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log("Admin login stats request received");

        // Get today's login count
        const todayLoginsResult = await all(`
            SELECT COUNT(*) as count 
            FROM login_logs 
            WHERE DATE(created_at) = DATE('now') AND success = 1
        `);

        // Get today's failed login count
        const todayFailedLoginsResult = await all(`
            SELECT COUNT(*) as count 
            FROM login_logs 
            WHERE DATE(created_at) = DATE('now') AND success = 0
        `);

        // Get login count by type for today
        const todayLoginsByTypeResult = await all(`
            SELECT login_type, COUNT(*) as count 
            FROM login_logs 
            WHERE DATE(created_at) = DATE('now') AND success = 1
            GROUP BY login_type
        `);

        // Get weekly login trend
        const weeklyLoginsResult = await all(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM login_logs 
            WHERE created_at >= DATE('now', '-7 days') AND success = 1
            GROUP BY DATE(created_at)
            ORDER BY date
        `);

        const loginStats = {
            todayLogins: todayLoginsResult[0]?.count || 0,
            todayFailedLogins: todayFailedLoginsResult[0]?.count || 0,
            todayLoginsByType: todayLoginsByTypeResult,
            weeklyLogins: weeklyLoginsResult
        };

        console.log("Login stats:", loginStats);
        res.json(loginStats);
    } catch (err) {
        console.error("Admin login stats error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Admin Inventory Management Routes
router.get("/inventory", authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log("Admin inventory request received");
        const inventory = await all(`
            SELECT 
                i.id,
                i.product_type as productType,
                i.status,
                i.size,
                i.serial_number as serialNumber,
                i.date as dateAdded,
                i.location,
                i.issued_by as issuedBy,
                i.created_at as lastUpdated,
                u.staff_id as staffId,
                u.name as staffName
            FROM inventory i
            LEFT JOIN users u ON i.user_id = u.id
            ORDER BY i.created_at DESC
        `);
        console.log(`Found ${inventory.length} inventory items`);
        res.json(inventory);
    } catch (err) {
        console.error("Admin inventory error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get inventory statistics
router.get("/inventory/stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log("Admin inventory stats request received");

        // Get total inventory count
        const totalResult = await get("SELECT COUNT(*) as count FROM inventory");
        const totalInventory = totalResult ? totalResult.count : 0;

        // Get UPS count
        const upsResult = await get("SELECT COUNT(*) as count FROM inventory WHERE product_type = 'UPS'");
        const upsCount = upsResult ? upsResult.count : 0;

        // Get AVR count
        const avrResult = await get("SELECT COUNT(*) as count FROM inventory WHERE product_type = 'AVR'");
        const avrCount = avrResult ? avrResult.count : 0;

        // Get new items count
        const newResult = await get("SELECT COUNT(*) as count FROM inventory WHERE status = 'New'");
        const newCount = newResult ? newResult.count : 0;

        // Get replaced items count
        const replacedResult = await get("SELECT COUNT(*) as count FROM inventory WHERE status = 'Replaced'");
        const replacedCount = replacedResult ? replacedResult.count : 0;

        // Get recent activity (items added in last 7 days)
        const recentResult = await get(
            "SELECT COUNT(*) as count FROM inventory WHERE created_at >= datetime('now', '-7 days')"
        );
        const recentActivity = recentResult ? recentResult.count : 0;

        // Get size distribution
        const sizeResults = await all(`
            SELECT size, COUNT(*) as count 
            FROM inventory 
            GROUP BY size 
            ORDER BY count DESC
        `);

        // Get location distribution
        const locationResults = await all(`
            SELECT location, COUNT(*) as count 
            FROM inventory 
            GROUP BY location 
            ORDER BY count DESC 
            LIMIT 5
        `);

        const stats = {
            totalInventory,
            upsCount,
            avrCount,
            newCount,
            replacedCount,
            recentActivity,
            sizeDistribution: sizeResults,
            locationDistribution: locationResults,
            lastUpdated: new Date().toISOString()
        };

        console.log(`Inventory stats calculated: ${totalInventory} total items`);
        res.json(stats);

    } catch (err) {
        console.error("Admin inventory stats error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Delete inventory item (admin)
router.delete("/inventory/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Admin delete inventory request received for ID:", id);

        // Check if inventory item exists
        const inventoryItem = await get("SELECT * FROM inventory WHERE id = ?", [id]);
        if (!inventoryItem) {
            return res.status(404).json({ error: "Inventory item not found" });
        }

        // Delete the inventory item
        await run("DELETE FROM inventory WHERE id = ?", [id]);
        console.log(`Inventory item ${id} deleted successfully`);

        // Emit real-time updates for both admin and user views
        try {
            // Emit admin-specific update
            req.app.locals.io.emit('admin:inventory:deleted', {
                inventoryId: id,
                timestamp: new Date().toISOString()
            });

            // Also emit general inventory update so users can see changes
            req.app.locals.io.emit('inventory:deleted', {
                inventoryId: id,
                timestamp: new Date().toISOString()
            });

            console.log('✅ Emitted both admin:inventory:deleted and inventory:deleted events');
        } catch (e) {
            console.log('Socket not available for real-time updates');
        }

        res.json({ message: "Inventory item deleted successfully" });
    } catch (err) {
        console.error("Admin delete inventory error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update inventory item (admin)
router.put("/inventory/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { productType, status, size, serialNumber, date, location, issuedBy, notes } = req.body;
        console.log("Admin update inventory request received for ID:", id, req.body);

        // Check if inventory item exists
        const inventoryItem = await get("SELECT * FROM inventory WHERE id = ?", [id]);
        if (!inventoryItem) {
            return res.status(404).json({ error: "Inventory item not found" });
        }

        // Update the inventory item
        await run(`
            UPDATE inventory 
            SET product_type = ?, status = ?, size = ?, serial_number = ?, 
                date = ?, location = ?, issued_by = ?, notes = ?
            WHERE id = ?
        `, [productType, status, size, serialNumber, date, location, issuedBy, notes, id]);

        console.log(`Inventory item ${id} updated successfully`);

        // Get updated item for real-time update
        const updatedItem = await get("SELECT * FROM inventory WHERE id = ?", [id]);

        // Emit real-time updates for both admin and user views
        try {
            // Emit admin-specific update
            req.app.locals.io.emit('admin:inventory:updated', {
                inventoryId: id,
                inventory: updatedItem,
                timestamp: new Date().toISOString()
            });

            // Also emit general inventory update so users can see changes
            req.app.locals.io.emit('inventory:updated', {
                inventoryId: id,
                inventory: updatedItem,
                timestamp: new Date().toISOString()
            });

            console.log('✅ Emitted both admin:inventory:updated and inventory:updated events');
        } catch (e) {
            console.log('Socket not available for real-time updates');
        }

        res.json({ message: "Inventory item updated successfully" });
    } catch (err) {
        console.error("Admin update inventory error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Admin Toolbox Management Routes
router.get("/toolbox", authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log("Admin toolbox request received");
        const toolboxController = require('../controllers/toolboxController');
        await toolboxController.getAllToolboxes(req, res);
    } catch (err) {
        console.error("Admin toolbox error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Admin Toolbox Management Routes - Get all toolboxes
router.get("/toolbox/all", authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log("Admin get all toolboxes request received");
        const toolboxController = require('../controllers/toolboxController');
        await toolboxController.getAllToolboxes(req, res);
    } catch (err) {
        console.error("Admin get all toolboxes error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Health check endpoint for admin settings
router.get("/health", authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Test database connection
        const result = await get("SELECT 1 as test");
        if (result && result.test === 1) {
            res.json({
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                status: 'unhealthy',
                database: 'disconnected',
                timestamp: new Date().toISOString()
            });
        }
    } catch (err) {
        console.error("Health check error:", err);
        res.status(503).json({
            status: 'unhealthy',
            database: 'error',
            error: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;


