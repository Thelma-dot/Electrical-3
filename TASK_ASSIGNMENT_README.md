# Task Assignment System

This document describes how the task assignment system works in the Electrical Management application.

## Overview

The task assignment system allows administrators to assign tasks to users, and users can view and manage their assigned tasks from their dashboard.

## Features

### For Administrators
- Assign tasks to users with title, description, priority, and due date
- View all assigned tasks across the system
- Monitor task completion status

### For Users
- View assigned tasks in the dashboard
- Update task status (Pending, In Progress, Completed, Cancelled)
- Filter tasks by status
- Receive real-time notifications when new tasks are assigned

## How It Works

### 1. Task Assignment (Admin)
1. Go to **User Management** page
2. Click the **Assign Task** button (🛠️) next to any user
3. Fill in the task details:
   - Title (required)
   - Description (optional)
   - Priority (Low, Medium, High, Urgent)
   - Due Date (optional)
4. Click "Assign Task" to create the task

### 2. Task Management (User)
1. Go to **Dashboard** page
2. Scroll down to "My Task Assignments" section
3. View all assigned tasks with their details
4. Use the status dropdown to update task progress
5. Use the filter to show tasks by specific status
6. Click "View" button to see task details

## Database Structure

The system uses a `tasks` table with the following fields:
- `id`: Unique task identifier
- `title`: Task title
- `description`: Task description
- `assigned_to`: User ID of the person assigned the task
- `assigned_by`: User ID of the admin who assigned the task
- `priority`: Task priority (low, medium, high, urgent)
- `due_date`: Optional due date for the task
- `status`: Current status (pending, in_progress, completed, cancelled)
- `created_at`: When the task was created
- `updated_at`: When the task was last updated

## API Endpoints

- `POST /api/tasks` - Create a new task
- `GET /api/tasks/my` - Get current user's tasks
- `GET /api/tasks/user/:userId` - Get tasks for a specific user (admin only)
- `GET /api/tasks` - Get all tasks (admin only)
- `PUT /api/tasks/:id` - Update task details
- `DELETE /api/tasks/:id` - Delete a task
- `GET /api/tasks/counts` - Get task counts for dashboard

## Real-time Updates

The system uses WebSocket connections to provide real-time updates:
- New task assignments appear immediately
- Task status changes are reflected in real-time
- Dashboard statistics update automatically

## Priority Levels

- **Low**: Green badge - Normal priority tasks
- **Medium**: Yellow badge - Standard priority (default)
- **High**: Red badge - Important tasks
- **Urgent**: Dark red badge - Critical tasks requiring immediate attention

## Status Workflow

1. **Pending**: Task is assigned but not started
2. **In Progress**: User has started working on the task
3. **Completed**: Task has been finished successfully
4. **Cancelled**: Task has been cancelled or is no longer needed

## Files Involved

### Backend
- `Backend/models/Task.js` - Task model and database operations
- `Backend/routes/tasks.js` - Task API endpoints
- `Backend/config/database.js` - Database schema (includes tasks table)

### Frontend
- `Frontend/task-assignment.js` - Admin task assignment functionality
- `Frontend/dashboard-tasks.js` - User dashboard task management
- `Frontend/dashboard.html` - User dashboard with task section
- `Frontend/admin-users.html` - Admin user management with task assignment
- `Frontend/dashboard.css` - Task-related styles
- `Frontend/adminDashboard.css` - Task assignment modal styles

## Usage Examples

### Assigning a Task
```javascript
// Admin assigns a task to user ID 123
const taskData = {
    title: "Fix electrical panel",
    description: "Replace faulty circuit breaker in main panel",
    assigned_to: 123,
    priority: "high",
    due_date: "2024-01-15T14:00:00",
    status: "pending"
};

// Task is automatically created and assigned user is notified
```

### Updating Task Status
```javascript
// User updates task status to "in_progress"
const response = await fetch('/api/tasks/456', {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'in_progress' })
});
```

## Troubleshooting

### Common Issues
1. **Tasks not appearing**: Check if the user is logged in and has a valid token
2. **Cannot assign tasks**: Ensure the user has admin privileges
3. **Real-time updates not working**: Check WebSocket connection and server status

### Debug Information
- Check browser console for JavaScript errors
- Verify API endpoints are accessible
- Ensure database connection is working
- Check user authentication and permissions

## Future Enhancements

- Task categories and tags
- File attachments for tasks
- Task comments and communication
- Automated reminders and notifications
- Task templates for common assignments
- Performance metrics and reporting
