const Task = require('../models/Task');

class TasksController {
    // Create a new task
    static async createTask(req, res) {
        try {
            const { title, description, assigned_to, priority, due_date, status } = req.body;
            
            if (!title || !assigned_to) {
                return res.status(400).json({ error: "Title and assigned_to are required" });
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

            // Emit realtime event if Socket.IO is available
            try {
                if (req.app.locals.io) {
                    req.app.locals.io.emit('task:created', {
                        id: task.id,
                        assigned_to,
                        assigned_by: req.user.userId,
                        title,
                        status: status || 'pending'
                    });
                }
            } catch (socketError) {
                console.log('Socket.IO not available for task creation event');
            }

            res.status(201).json({ message: 'Task created successfully', task });
        } catch (error) {
            console.error('Create task error:', error);
            res.status(500).json({ error: 'Failed to create task' });
        }
    }

    // Get tasks for current user
    static async getMyTasks(req, res) {
        try {
            const tasks = await Task.findByUser(req.user.userId);
            res.json(tasks);
        } catch (error) {
            console.error('Get my tasks error:', error);
            res.status(500).json({ error: 'Failed to fetch tasks' });
        }
    }

    // Get completed tasks for current user
    static async getMyCompletedTasks(req, res) {
        try {
            const tasks = await Task.findCompletedByUser(req.user.userId);
            res.json(tasks);
        } catch (error) {
            console.error('Get completed tasks error:', error);
            res.status(500).json({ error: 'Failed to fetch completed tasks' });
        }
    }

    // Get a single task by ID
    static async getTaskById(req, res) {
        try {
            const { id } = req.params;
            const task = await Task.findById(id);
            
            if (!task) {
                return res.status(404).json({ error: 'Task not found' });
            }

            // Check if user has access to this task (either assigned to them or they're admin)
            if (task.assigned_to !== req.user.userId && req.user.role !== 'admin') {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json(task);
        } catch (error) {
            console.error('Get task by ID error:', error);
            res.status(500).json({ error: 'Failed to fetch task' });
        }
    }

    // Get tasks for a specific user (admin function)
    static async getUserTasks(req, res) {
        try {
            const { userId } = req.params;
            const tasks = await Task.findByUser(userId);
            res.json(tasks);
        } catch (error) {
            console.error('Get user tasks error:', error);
            res.status(500).json({ error: 'Failed to fetch user tasks' });
        }
    }

    // Get all tasks (admin function)
    static async getAllTasks(req, res) {
        try {
            const tasks = await Task.findAllForAdmin();
            res.json(tasks);
        } catch (error) {
            console.error('Get all tasks error:', error);
            res.status(500).json({ error: 'Failed to fetch all tasks' });
        }
    }

    // Update a task
    static async updateTask(req, res) {
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

            // Emit realtime event if Socket.IO is available
            try {
                if (req.app.locals.io) {
                    req.app.locals.io.emit('task:updated', {
                        id,
                        status: updatedTask.status,
                        title: updatedTask.title
                    });
                }
            } catch (socketError) {
                console.log('Socket.IO not available for task update event');
            }

            res.json({ message: 'Task updated successfully', task: updatedTask });
        } catch (error) {
            console.error('Update task error:', error);
            res.status(500).json({ error: 'Failed to update task' });
        }
    }

    // Delete a task
    static async deleteTask(req, res) {
        try {
            const { id } = req.params;
            await Task.delete(id);
            
            // Emit realtime event if Socket.IO is available
            try {
                if (req.app.locals.io) {
                    req.app.locals.io.emit('task:deleted', { id });
                }
            } catch (socketError) {
                console.log('Socket.IO not available for task deletion event');
            }

            res.json({ message: 'Task deleted successfully' });
        } catch (error) {
            console.error('Delete task error:', error);
            res.status(500).json({ error: 'Failed to delete task' });
        }
    }

    // Get task statistics
    static async getTaskStats(req, res) {
        try {
            const stats = await Task.getStats();
            res.json(stats);
        } catch (error) {
            console.error('Get task stats error:', error);
            res.status(500).json({ error: 'Failed to fetch task statistics' });
        }
    }

    // Get task counts for dashboard
    static async getTaskCounts(req, res) {
        try {
            const counts = await Task.getTaskCounts(req.user.userId);
            res.json(counts);
        } catch (error) {
            console.error('Get task counts error:', error);
            res.status(500).json({ error: 'Failed to fetch task counts' });
        }
    }
}

module.exports = TasksController;
