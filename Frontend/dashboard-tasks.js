// Dashboard Tasks Management
class DashboardTasks {
    constructor() {
        this.tasks = []; // Add tasks property to store task data
        this.init();
    }

    init() {
        this.loadMyTasks();
        this.setupEventListeners();
        this.initDeadlineReminder();
    }

    setupEventListeners() {
        // Task status filter
        const statusFilter = document.getElementById('myTaskStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.loadMyTasks());
        }

        // Show completed tasks toggle
        const showCompletedToggle = document.getElementById('showCompletedTasks');
        if (showCompletedToggle) {
            showCompletedToggle.addEventListener('change', () => this.loadMyTasks());
        }

        // Refresh button
        const refreshBtn = document.getElementById('myTasksRefreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadMyTasks());
        }
    }

    async loadMyTasks() {
        try {
            const showCompleted = document.getElementById('showCompletedTasks')?.checked || false;
            const statusFilter = document.getElementById('myTaskStatusFilter')?.value || '';

            let endpoint = 'http://localhost:5000/api/tasks/my';
            if (showCompleted) {
                endpoint = 'http://localhost:5000/api/tasks/my/completed';
            }

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tasks = await response.json();
            this.tasks = tasks; // Store tasks in the instance property
            this.displayMyTasks(tasks, statusFilter);
        } catch (error) {
            console.error('Error loading my tasks:', error);
            this.showTaskError('Failed to load tasks. Please try again.');
        }
    }

    displayMyTasks(tasks, statusFilter) {
        const tbody = document.querySelector('#myTasksTable tbody');
        const emptyMessage = document.getElementById('myTasksEmpty');

        if (!tbody) return;

        // Filter tasks by status if filter is applied
        let filteredTasks = tasks;
        if (statusFilter) {
            filteredTasks = tasks.filter(task =>
                task.status && task.status.toLowerCase() === statusFilter.toLowerCase()
            );
        }

        if (filteredTasks.length === 0) {
            tbody.innerHTML = '';
            if (emptyMessage) {
                emptyMessage.style.display = 'block';
            }
            return;
        }

        if (emptyMessage) {
            emptyMessage.style.display = 'none';
        }

        tbody.innerHTML = filteredTasks.map(task => `
            <tr>
                <td>${task.title || 'N/A'}</td>
                <td>${task.description || 'No description'}</td>
                <td>
                    <span class="priority-badge priority-${(task.priority || 'medium').toLowerCase()}">
                        ${task.priority || 'Medium'}
                    </span>
                </td>
                <td>
                                    <span class="status-badge status-${(task.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-')}">
                    ${task.status || 'Pending'}
                </span>
                </td>
                <td>${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="dashboardTasks.viewTaskDetails(${task.id})">
                            View
                        </button>
                    ${task.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="dashboardTasks.startTask(${task.id})">
                            Start
                        </button>
                    ` : ''}
                    ${task.status === 'in_progress' ? `
                        <button class="btn btn-success btn-sm" onclick="dashboardTasks.completeTask(${task.id})">
                            Complete
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    async startTask(taskId) {
        try {
            const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: 'in_progress' })
            });

            if (response.ok) {
                this.showTaskSuccess('Task started successfully!');
                this.loadMyTasks();
                // Refresh dashboard to update counts
                if (typeof refreshDashboard === 'function') {
                    refreshDashboard();
                }
            } else {
                throw new Error('Failed to start task');
            }
        } catch (error) {
            console.error('Error starting task:', error);
            this.showTaskError('Failed to start task. Please try again.');
        }
    }

    async completeTask(taskId) {
        try {
            const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: 'completed' })
            });

            if (response.ok) {
                this.showTaskSuccess('Task completed successfully!');
                this.loadMyTasks();
                // Refresh dashboard to update counts
                if (typeof refreshDashboard === 'function') {
                    refreshDashboard();
                }
            } else {
                throw new Error('Failed to complete task');
            }
        } catch (error) {
            console.error('Error completing task:', error);
            this.showTaskError('Failed to complete task. Please try again.');
        }
    }

    async viewTaskDetails(taskId) {
        try {
            // Fetch the specific task details
            const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch task details');
            }

            const task = await response.json();
            this.showTaskDetailsModal(task);
        } catch (error) {
            console.error('Error fetching task details:', error);
            this.showTaskError('Failed to load task details. Please try again.');
        }
    }

    showTaskDetailsModal(task) {
        // Populate modal with task data
        document.getElementById('modalTaskTitle').textContent = 'Task Details';
        document.getElementById('modalTaskTitleText').textContent = task.title || 'N/A';
        document.getElementById('modalTaskDescription').textContent = task.description || 'No description provided';

        // Set priority with badge styling
        const priorityElement = document.getElementById('modalTaskPriority');
        priorityElement.innerHTML = `<span class="priority-badge priority-${(task.priority || 'medium').toLowerCase()}">${task.priority || 'Medium'}</span>`;

        // Set status with badge styling
        const statusElement = document.getElementById('modalTaskStatus');
        const statusClass = (task.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-');
        statusElement.innerHTML = `<span class="status-badge status-${statusClass}">${task.status || 'Pending'}</span>`;

        document.getElementById('modalTaskDueDate').textContent = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A';

        // Show/hide action button based on task status
        const actionBtn = document.getElementById('modalTaskActionBtn');
        if (task.status === 'pending') {
            actionBtn.textContent = 'Start Task';
            actionBtn.onclick = () => {
                this.startTask(task.id);
                closeTaskModal();
            };
            actionBtn.style.display = 'inline-block';
        } else if (task.status === 'in_progress') {
            actionBtn.textContent = 'Complete Task';
            actionBtn.onclick = () => {
                this.completeTask(task.id);
                closeTaskModal();
            };
            actionBtn.style.display = 'inline-block';
        } else {
            actionBtn.style.display = 'none';
        }

        // Show the modal
        document.getElementById('taskDetailsModal').style.display = 'block';
    }

    printTaskDetails(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            this.showTaskError('Task not found for printing');
            return;
        }

        // Create print-friendly content
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Task Details - ${task.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .task-title { font-size: 24px; font-weight: bold; color: #2c3e50; }
                    .task-meta { margin: 20px 0; }
                    .meta-item { margin: 10px 0; }
                    .label { font-weight: bold; color: #34495e; }
                    .priority-badge, .status-badge { 
                        display: inline-block; 
                        padding: 4px 12px; 
                        border-radius: 20px; 
                        font-size: 12px; 
                        font-weight: bold; 
                        text-transform: uppercase; 
                        margin-left: 10px;
                    }
                    .priority-medium { background: #f39c12; color: white; }
                    .priority-high { background: #e74c3c; color: white; }
                    .priority-urgent { background: #c0392b; color: white; }
                    .status-pending { background: #f39c12; color: white; }
                    .status-in-progress { background: #3498db; color: white; }
                    .status-completed { background: #27ae60; color: white; }
                    .status-cancelled { background: #95a5a6; color: white; }
                    .description { margin: 20px 0; line-height: 1.6; }
                    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #7f8c8d; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="task-title">${task.title || 'Untitled Task'}</div>
                    <div class="task-meta">
                        <span class="label">Priority:</span>
                        <span class="priority-badge priority-${(task.priority || 'medium').toLowerCase()}">${task.priority || 'Medium'}</span>
                        <span class="label" style="margin-left: 20px;">Status:</span>
                        <span class="status-badge status-${(task.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-')}">${task.status || 'Pending'}</span>
                    </div>
                </div>
                
                <div class="meta-item">
                    <span class="label">Description:</span>
                    <span>${task.description || 'No description provided'}</span>
                </div>
                
                <div class="meta-item">
                    <span class="label">Assigned To:</span>
                    <span>${task.assigned_to || 'Unassigned'}</span>
                </div>
                
                <div class="meta-item">
                    <span class="label">Due Date:</span>
                    <span>${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                </div>
                
                <div class="meta-item">
                    <span class="label">Created:</span>
                    <span>${task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Unknown'}</span>
                </div>
                
                ${task.updated_at ? `
                    <div class="meta-item">
                        <span class="label">Last Updated:</span>
                        <span>${new Date(task.updated_at).toLocaleDateString()}</span>
                    </div>
                ` : ''}
                
                <div class="footer">
                    <p>Printed on ${new Date().toLocaleString()}</p>
                    <p>Electrical Management System</p>
                </div>
            </body>
            </html>
        `;

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Wait for content to load then print
        printWindow.onload = function () {
            printWindow.print();
            printWindow.close();
        };
    }

    showTaskSuccess(message) {
        // Create a simple success notification
        const notification = document.createElement('div');
        notification.className = 'task-notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showTaskError(message) {
        // Create a simple error notification
        const notification = document.createElement('div');
        notification.className = 'task-notification error';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Deadline reminder functionality
    initDeadlineReminder() {
        this.updateTaskDeadlineReminders();
        // Update every minute
        setInterval(() => {
            this.updateTaskDeadlineReminders();
        }, 60000);
    }

    async updateTaskDeadlineReminders() {
        try {
            const response = await fetch('http://localhost:5000/api/tasks/my', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }

            const tasks = await response.json();
            this.displayDeadlineReminders(tasks);
        } catch (error) {
            console.error('Error updating deadline reminders:', error);
        }
    }

    displayDeadlineReminders(tasks) {
        const upcomingDeadlines = document.getElementById('upcomingDeadlines');
        const noDeadlines = document.getElementById('noDeadlines');
        const deadlineReminders = document.getElementById('deadlineReminders');

        if (!upcomingDeadlines || !noDeadlines || !deadlineReminders) return;

        // Filter tasks with upcoming deadlines (next 7 days)
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const upcomingTasks = tasks.filter(task => {
            if (!task.due_date || task.status === 'completed') return false;
            const dueDate = new Date(task.due_date);
            return dueDate >= now && dueDate <= nextWeek;
        }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

        if (upcomingTasks.length === 0) {
            upcomingDeadlines.style.display = 'none';
            noDeadlines.style.display = 'block';
            deadlineReminders.innerHTML = '';
            return;
        }

        upcomingDeadlines.style.display = 'none';
        noDeadlines.style.display = 'none';

        deadlineReminders.innerHTML = upcomingTasks.map(task => {
            const dueDate = new Date(task.due_date);
            const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            const isUrgent = daysUntilDue <= 1;
            const isWarning = daysUntilDue <= 3;

            return `
                <div class="deadline-item ${isUrgent ? 'urgent' : isWarning ? 'warning' : 'normal'}">
                    <div class="deadline-header">
                        <span class="deadline-title">${task.title}</span>
                        <span class="deadline-days ${isUrgent ? 'urgent' : isWarning ? 'warning' : 'normal'}">
                            ${daysUntilDue === 0 ? 'Due today' : daysUntilDue === 1 ? 'Due tomorrow' : `Due in ${daysUntilDue} days`}
                        </span>
                    </div>
                    <div class="deadline-details">
                        <span class="deadline-date">${dueDate.toLocaleDateString()}</span>
                        <span class="deadline-priority priority-${(task.priority || 'medium').toLowerCase()}">
                            ${task.priority || 'Medium'}
                        </span>
                    </div>
                </div>
            `;
        }).join('');

        // Add CSS for deadline items
        this.addDeadlineStyles();
    }

    addDeadlineStyles() {
        if (document.getElementById('deadline-styles')) return;

        const style = document.createElement('style');
        style.id = 'deadline-styles';
        style.textContent = `
            .deadline-item {
                background: white;
                border-radius: 8px;
                padding: 15px;
                margin: 10px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border-left: 4px solid #3498db;
            }

            .deadline-item.urgent {
                border-left-color: #e74c3c;
                background: #fdf2f2;
            }

            .deadline-item.warning {
                border-left-color: #f39c12;
                background: #fef9e7;
            }

            .deadline-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .deadline-title {
                font-weight: 600;
                color: #2c3e50;
            }

            .deadline-days {
                font-size: 0.9em;
                font-weight: 500;
            }

            .deadline-days.urgent {
                color: #e74c3c;
            }

            .deadline-days.warning {
                color: #f39c12;
            }

            .deadline-days.normal {
                color: #3498db;
            }

            .deadline-details {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.85em;
                color: #7f8c8d;
            }

            .deadline-priority {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.8em;
                font-weight: 500;
            }

            .priority-high {
                background: #e74c3c;
                color: white;
            }

            .priority-medium {
                background: #f39c12;
                color: white;
            }

            .priority-low {
                background: #27ae60;
                color: white;
            }

            .priority-badge, .status-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8em;
                font-weight: 500;
            }

            .status-pending {
                background: #f39c12;
                color: white;
            }

            .status-in_progress {
                background: #3498db;
                color: white;
            }

            .status-completed {
                background: #27ae60;
            color: white;
            }

            .status-cancelled {
                background: #95a5a6;
                color: white;
            }

            .btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.85em;
                margin: 0 2px;
            }

            .btn-primary {
                background: #3498db;
                color: white;
            }

            .btn-success {
                background: #27ae60;
                color: white;
            }

            .btn-sm {
                padding: 4px 8px;
                font-size: 0.8em;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize dashboard tasks when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardTasks = new DashboardTasks();
});

// Make functions globally accessible
window.updateTaskDeadlineReminders = function () {
    if (window.dashboardTasks) {
        window.dashboardTasks.updateTaskDeadlineReminders();
    }
};
