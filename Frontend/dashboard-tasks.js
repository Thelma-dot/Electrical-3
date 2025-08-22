// Dashboard Tasks Management
class DashboardTasksManager {
    constructor() {
        this.apiEndpoints = {
            myTasks: 'http://localhost:5000/api/tasks/my',
            updateTask: 'http://localhost:5000/api/tasks',
            taskCounts: 'http://localhost:5000/api/tasks/counts'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMyTasks();
        this.loadTaskCounts();
    }

    setupEventListeners() {
        // Task status filter
        const statusFilter = document.getElementById('myTaskStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterTasks());
        }

        // Refresh button
        const refreshBtn = document.getElementById('myTasksRefreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadMyTasks());
        }

        // Setup real-time updates
        this.setupRealtimeUpdates();
    }

    async loadMyTasks() {
        try {
            const response = await fetch(this.apiEndpoints.myTasks, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const tasks = await response.json();
                this.displayTasks(tasks);
                this.updateTaskCounts(tasks);
                
                // Update deadline reminders when tasks are loaded
                if (typeof updateTaskDeadlineReminders === 'function') {
                    updateTaskDeadlineReminders();
                }
            } else {
                console.error('Failed to load tasks');
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    async loadTaskCounts() {
        try {
            const response = await fetch(this.apiEndpoints.taskCounts, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const counts = await response.json();
                this.updateDashboardStats(counts);
            }
        } catch (error) {
            console.error('Error loading task counts:', error);
        }
    }

    displayTasks(tasks) {
        const tableBody = document.querySelector('#myTasksTable tbody');
        const emptyMessage = document.getElementById('myTasksEmpty');
        
        if (!tableBody) return;

        if (tasks.length === 0) {
            if (emptyMessage) emptyMessage.style.display = 'block';
            tableBody.innerHTML = '';
            return;
        }

        if (emptyMessage) emptyMessage.style.display = 'none';

        tableBody.innerHTML = tasks.map(task => `
            <tr data-task-id="${task.id}">
                <td>
                    <div class="task-title">
                        <strong>${this.escapeHtml(task.title)}</strong>
                        ${task.description ? `<br><small>${this.escapeHtml(task.description)}</small>` : ''}
                    </div>
                </td>
                <td>
                    <span class="priority-badge priority-${task.priority || 'medium'}">
                        ${this.capitalizeFirst(task.priority || 'medium')}
                    </span>
                </td>
                <td>
                    <select class="task-status-select" onchange="dashboardTasksManager.updateTaskStatus(${task.id}, this.value)">
                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${task.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    ${task.due_date ? this.formatDate(task.due_date) : 'No due date'}
                </td>
                <td>
                    <div class="task-actions">
                        <button class="btn-small btn-primary" onclick="dashboardTasksManager.viewTaskDetails(${task.id})">
                            View
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async updateTaskStatus(taskId, newStatus) {
        try {
            const response = await fetch(`${this.apiEndpoints.updateTask}/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Update the row styling based on new status
                this.updateTaskRowStatus(taskId, newStatus);
                // Refresh task counts
                this.loadTaskCounts();
                
                // Reset alarm if task is completed or cancelled
                if (newStatus === 'completed' || newStatus === 'cancelled') {
                    if (typeof resetTaskAlarm === 'function') {
                        resetTaskAlarm(taskId);
                    }
                }
                
                // Refresh deadline reminders when task status changes
                if (typeof updateTaskDeadlineReminders === 'function') {
                    updateTaskDeadlineReminders();
                }
                
                // Show success message
                this.showNotification('Task status updated successfully!', 'success');
            } else {
                this.showNotification('Failed to update task status', 'error');
            }
        } catch (error) {
            console.error('Error updating task status:', error);
            this.showNotification('Error updating task status', 'error');
        }
    }

    updateTaskRowStatus(taskId, status) {
        const row = document.querySelector(`tr[data-task-id="${taskId}"]`);
        if (row) {
            // Remove existing status classes
            row.classList.remove('status-pending', 'status-in_progress', 'status-completed', 'status-cancelled');
            // Add new status class
            row.classList.add(`status-${status}`);
        }
    }

    filterTasks() {
        const statusFilter = document.getElementById('myTaskStatusFilter');
        const filterValue = statusFilter.value;
        const rows = document.querySelectorAll('#myTasksTable tbody tr');

        rows.forEach(row => {
            const statusSelect = row.querySelector('.task-status-select');
            const taskStatus = statusSelect ? statusSelect.value : '';
            
            if (!filterValue || taskStatus === filterValue) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    updateTaskCounts(tasks) {
        const counts = {
            total: tasks.length,
            pending: tasks.filter(t => t.status === 'pending').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            cancelled: tasks.filter(t => t.status === 'cancelled').length
        };

        this.updateDashboardStats(counts);
    }

    updateDashboardStats(counts) {
        // Update the dashboard stats cards
        const inProgressCard = document.querySelector('.card:nth-child(3) p');
        const completedCard = document.querySelector('.card:nth-child(4) p');
        
        if (inProgressCard) {
            inProgressCard.textContent = counts.in_progress || 0;
        }
        
        if (completedCard) {
            completedCard.textContent = counts.completed || 0;
        }
    }

    viewTaskDetails(taskId) {
        // This could open a modal with detailed task information
        // For now, we'll just show an alert with basic info
        const row = document.querySelector(`tr[data-task-id="${taskId}"]`);
        if (row) {
            const title = row.querySelector('.task-title strong').textContent;
            const description = row.querySelector('.task-title small')?.textContent || 'No description';
            const priority = row.querySelector('.priority-badge').textContent;
            const status = row.querySelector('.task-status-select').value;
            
            alert(`Task Details:\n\nTitle: ${title}\nDescription: ${description}\nPriority: ${priority}\nStatus: ${status}`);
        }
    }

    setupRealtimeUpdates() {
        // Listen for real-time task updates
        if (window.io) {
            const socket = io('http://localhost:5000');
            
            socket.on('task:created', (data) => {
                if (data.assigned_to === this.getCurrentUserId()) {
                    this.loadMyTasks();
                    this.showNotification('New task assigned to you!', 'info');
                    
                    // Reset alarm for new task so it can play when deadline is reached
                    if (typeof resetTaskAlarm === 'function') {
                        resetTaskAlarm(data.id);
                    }
                    
                    // Update deadline reminders for new tasks
                    if (typeof updateTaskDeadlineReminders === 'function') {
                        updateTaskDeadlineReminders();
                    }
                }
            });

            socket.on('task:updated', (data) => {
                this.loadMyTasks();
                this.loadTaskCounts();
                
                // Reset alarm for updated task in case due date changed
                if (typeof resetTaskAlarm === 'function') {
                    resetTaskAlarm(data.id);
                }
                
                // Update deadline reminders when tasks are updated
                if (typeof updateTaskDeadlineReminders === 'function') {
                    updateTaskDeadlineReminders();
                }
            });
        }
    }

    getCurrentUserId() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user ? user.id : null;
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#27ae60';
                break;
            case 'error':
                notification.style.backgroundColor = '#e74c3c';
                break;
            case 'info':
                notification.style.backgroundColor = '#3498db';
                break;
            default:
                notification.style.backgroundColor = '#95a5a6';
        }

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    capitalizeFirst(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    formatDate(dateString) {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Public method to refresh tasks
    refresh() {
        this.loadMyTasks();
        this.loadTaskCounts();
    }
}

// Initialize dashboard tasks manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('myTasksTable')) {
        window.dashboardTasksManager = new DashboardTasksManager();
    }
});

// Global function for status updates
function updateTaskStatus(taskId, newStatus) {
    if (window.dashboardTasksManager) {
        window.dashboardTasksManager.updateTaskStatus(taskId, newStatus);
    }
}
