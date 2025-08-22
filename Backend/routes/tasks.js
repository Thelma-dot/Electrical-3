const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const Task = require("../models/Task");

// Create task (admin assigns or user self-create)
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { title, description, assigned_to, priority, due_date, status } = req.body;
        if (!title || !assigned_to) {
            return res.status(400).json({ error: "title and assigned_to are required" });
        }
        
        const taskData = {
            title,
            description: description || null,
            assigned_to,
            assigned_by: req.user.userId,
            priority: priority || 'medium',
            due_date: due_date || null,
            status: status || 'pending'
        };
        
        const task = await Task.create(taskData);
        
        // Emit realtime event (to assigned user and admin dashboards)
        try { 
            req.app.locals.io.emit('task:created', { 
                id: task.id, 
                assigned_to, 
                assigned_by: req.user.userId, 
                title, 
                status: status || 'pending' 
            }); 
        } catch { }
        
        res.status(201).json({ message: 'Task created', id: task.id });
    } catch (err) {
        console.error('Create task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// List tasks for current user
router.get("/my", authenticateToken, async (req, res) => {
    try {
        const tasks = await Task.findByUser(req.user.userId);
        res.json(tasks);
    } catch (err) {
        console.error('List my tasks error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// List tasks for a user (admin UI uses this for counts)
router.get("/user/:userId", authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const tasks = await Task.findByUser(userId);
        res.json(tasks);
    } catch (err) {
        console.error('List user tasks error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update task status/details
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, priority, due_date, status } = req.body;
        
        const updatedTask = await Task.update(id, {
            title,
            description,
            priority,
            due_date,
            status
        });
        
        // Emit realtime event
        try { 
            req.app.locals.io.emit('task:updated', { 
                id, 
                status: updatedTask.status, 
                title: updatedTask.title 
            }); 
        } catch { }
        
        res.json({ message: 'Task updated', task: updatedTask });
    } catch (err) {
        console.error('Update task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await Task.delete(id);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        console.error('Delete task error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get task counts for dashboard
router.get("/counts", authenticateToken, async (req, res) => {
    try {
        const counts = await Task.getTaskCounts(req.user.userId);
        res.json(counts);
    } catch (err) {
        console.error('Get task counts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

// List all tasks (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const tasks = await Task.findAll();
        res.json(tasks);
    } catch (err) {
        console.error('List all tasks error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});


