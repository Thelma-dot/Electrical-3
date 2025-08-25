// Dashboard Tasks Management
class DashboardTasks {
    constructor() {
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

    viewTaskDetails(taskId) {
        // This could open a modal or navigate to a detailed view
        console.log('Viewing task details for ID:', taskId);
        // For now, just show an alert
        alert('Task details view - to be implemented');
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
