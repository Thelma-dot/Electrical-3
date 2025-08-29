const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const TasksController = require("../controllers/tasksController");

// Create task (admin assigns or user self-create)
router.post("/", authenticateToken, TasksController.createTask);

// List tasks for current user
router.get("/my", authenticateToken, TasksController.getMyTasks);

// List completed tasks for current user (including hidden ones)
router.get("/my/completed", authenticateToken, TasksController.getMyCompletedTasks);

// List tasks for a user (admin UI uses this for counts)
router.get("/user/:userId", authenticateToken, TasksController.getUserTasks);

// Get task counts for dashboard
router.get("/counts", authenticateToken, TasksController.getTaskCounts);

// List all tasks (admin only)
router.get('/', authenticateToken, requireAdmin, TasksController.getAllTasks);

// List all tasks including completed ones (admin only)
router.get('/admin/all', authenticateToken, requireAdmin, TasksController.getAllTasks);

// Get a single task by ID
router.get("/:id", authenticateToken, TasksController.getTaskById);

// Update task status/details
router.put('/:id', authenticateToken, TasksController.updateTask);

// Delete task
router.delete('/:id', authenticateToken, TasksController.deleteTask);

module.exports = router;


