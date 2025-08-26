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
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="dashboardTasks.viewTaskDetails(${task.id})">
                            <i class="fas fa-eye"></i> View
                        </button>
                        ${task.status === 'pending' ? `
                            <button class="btn btn-success btn-sm" onclick="dashboardTasks.startTask(${task.id})">
                                <i class="fas fa-play"></i> Start
                            </button>
                        ` : ''}
                        ${task.status === 'in_progress' ? `
                            <button class="btn btn-success btn-sm" onclick="dashboardTasks.completeTask(${task.id})">
                                <i class="fas fa-check"></i> Complete
                            </button>
                        ` : ''}
                        ${task.status === 'completed' ? `
                            <span class="completed-status">✅ Completed</span>
                        ` : ''}
                    </div>
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
        // Find the task data
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            this.showTaskError('Task not found');
            return;
        }

        // Create and display task details modal with print functionality
        this.showTaskDetailsModal(task);
    }

    showTaskDetailsModal(task) {
        // Remove existing modal if any
        const existingModal = document.querySelector('.task-details-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
        const modalHTML = `
            <div class="task-details-modal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                display: flex;
                justify-content: center;
                align-items: center;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 30px;
                    border-radius: 8px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                    position: relative;
                ">
                    <button class="close-btn" onclick="this.closest('.task-details-modal').remove()" style="
                        position: absolute;
                        top: 15px;
                        right: 20px;
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                    ">&times;</button>
                    
                    <div class="task-header" style="margin-bottom: 20px;">
                        <h2 style="margin: 0 0 10px 0; color: #2c3e50;">${task.title || 'Untitled Task'}</h2>
                        <div class="task-meta" style="display: flex; gap: 15px; flex-wrap: wrap;">
                            <span class="priority-badge priority-${(task.priority || 'medium').toLowerCase()}" style="
                                padding: 4px 12px;
                                border-radius: 20px;
                                font-size: 12px;
                                font-weight: bold;
                                text-transform: uppercase;
                            ">${task.priority || 'Medium'}</span>
                            <span class="status-badge status-${(task.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-')}" style="
                                padding: 4px 12px;
                                border-radius: 20px;
                                font-size: 12px;
                                font-weight: bold;
                                text-transform: capitalize;
                            ">${task.status || 'Pending'}</span>
                        </div>
                    </div>

                    <div class="task-details" style="margin-bottom: 25px;">
                        <div class="detail-row" style="margin-bottom: 15px;">
                            <strong style="display: inline-block; width: 120px; color: #34495e;">Description:</strong>
                            <span>${task.description || 'No description provided'}</span>
                        </div>
                        <div class="detail-row" style="margin-bottom: 15px;">
                            <strong style="display: inline-block; width: 120px; color: #34495e;">Assigned To:</strong>
                            <span>${task.assigned_to || 'Unassigned'}</span>
                        </div>
                        <div class="detail-row" style="margin-bottom: 15px;">
                            <strong style="display: inline-block; width: 120px; color: #34495e;">Due Date:</strong>
                            <span>${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                        </div>
                        <div class="detail-row" style="margin-bottom: 15px;">
                            <strong style="display: inline-block; width: 120px; color: #34495e;">Created:</strong>
                            <span>${task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                        ${task.updated_at ? `
                            <div class="detail-row" style="margin-bottom: 15px;">
                                <strong style="display: inline-block; width: 120px; color: #34495e;">Last Updated:</strong>
                                <span>${new Date(task.updated_at).toLocaleDateString()}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="task-actions" style="
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                        border-top: 1px solid #eee;
                        padding-top: 20px;
                    ">
                        <button class="btn btn-primary" onclick="dashboardTasks.printTaskDetails(${task.id})" style="
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                            background: #3498db;
                            color: white;
                            transition: background-color 0.3s;
                        ">
                            <i class="fas fa-print"></i> Print Task
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.task-details-modal').remove()" style="
                            padding: 10px 20px;
                            border: 1px solid #bdc3c7;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: bold;
                            background: white;
                            color: #7f8c8d;
                            transition: all 0.3s;
                        ">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
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
            const urgencyClass = daysUntilDue <= 1 ? 'urgent' : daysUntilDue <= 3 ? 'warning' : 'normal';

            return `
                <div class="deadline-item ${urgencyClass}" style="
                    padding: 10px;
                    margin: 5px 0;
                    border-radius: 4px;
                    border-left: 4px solid;
                    background: white;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                ">
                    <div style="font-weight: bold; color: #2c3e50;">${task.title}</div>
                    <div style="font-size: 0.9em; color: #7f8c8d;">
                        Due: ${dueDate.toLocaleDateString()} (${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} left)
                    </div>
                </div>
            `;
        }).join('');

        // Add CSS for urgency classes
        const style = document.createElement('style');
        style.textContent = `
            .deadline-item.urgent { border-left-color: #e74c3c; background: #fdf2f2; }
            .deadline-item.warning { border-left-color: #f39c12; background: #fef9e7; }
            .deadline-item.normal { border-left-color: #3498db; background: #f0f8ff; }
        `;
        document.head.appendChild(style);
    }
}

// Initialize dashboard tasks when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardTasks = new DashboardTasks();
});
