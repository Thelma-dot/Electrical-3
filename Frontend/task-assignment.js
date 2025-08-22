// Task Assignment JavaScript for Admin User Management
class TaskAssignmentManager {
    constructor() {
        this.apiEndpoints = {
            assignTask: 'http://localhost:5000/api/tasks',
            userTasks: 'http://localhost:5000/api/tasks/user',
            allTasks: 'http://localhost:5000/api/tasks'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Task assignment modal events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('assign-task-btn')) {
                const userId = e.target.dataset.userId;
                this.showTaskAssignmentModal(userId);
            }
        });
    }

    async showTaskAssignmentModal(userId) {
        const user = await this.getUserById(userId);
        if (!user) return;

        const modal = this.createTaskAssignmentModal(user);
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    createTaskAssignmentModal(user) {
        const modal = document.createElement('div');
        modal.className = 'modal task-assignment-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Assign Task to ${user.name || user.staff_id}</h2>
                    <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                </div>
                <form id="taskAssignmentForm">
                    <input type="hidden" name="assigned_to" value="${user.id}">
                    
                    <div class="form-group">
                        <label for="taskTitle">Task Title *</label>
                        <input type="text" id="taskTitle" name="title" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="taskDescription">Description</label>
                        <textarea id="taskDescription" name="description" rows="3"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="taskDueDate">Due Date</label>
                        <input type="datetime-local" id="taskDueDate" name="due_date">
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
                        <button type="submit" class="btn primary">Assign Task</button>
                    </div>
                </form>
            </div>
        `;

        const form = modal.querySelector('#taskAssignmentForm');
        form.addEventListener('submit', (e) => this.handleTaskAssignment(e, user.id));

        return modal;
    }

    async handleTaskAssignment(event, userId) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const taskData = {
            title: formData.get('title'),
            description: formData.get('description'),
            assigned_to: userId,
            assigned_by: this.getCurrentUserId(),
            due_date: formData.get('due_date') || null,
            status: 'pending'
        };

        try {
            const response = await fetch(this.apiEndpoints.assignTask, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(taskData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Task assigned successfully!');
                event.target.parentElement.parentElement.remove();
                this.refreshUserTasks(userId);
            } else {
                alert(result.error || 'Failed to assign task');
            }
        } catch (error) {
            console.error('Error assigning task:', error);
            alert('Failed to assign task');
        }
    }

    async getUserById(userId) {
        try {
            const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }

    getCurrentUserId() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user ? user.id : null;
    }

    async refreshUserTasks(userId) {
        try {
            const response = await fetch(`${this.apiEndpoints.userTasks}/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const tasks = await response.json();
            this.updateUserTasksDisplay(userId, tasks);
        } catch (error) {
            console.error('Error refreshing user tasks:', error);
        }
    }

    updateUserTasksDisplay(userId, tasks) {
        const taskCountElement = document.querySelector(`[data-user-id="${userId}"] .task-count`);
        if (taskCountElement) {
            taskCountElement.textContent = tasks.length;
        }
    }

    async loadUserTasks(userId) {
        try {
            const response = await fetch(`${this.apiEndpoints.userTasks}/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error loading user tasks:', error);
            return [];
        }
    }
}

// Initialize task assignment manager
const taskAssignmentManager = new TaskAssignmentManager();

// Global functions for admin-users.js
function assignTask(userId) {
    taskAssignmentManager.showTaskAssignmentModal(userId);
}

// Add task count display to user rows
function addTaskCountToUserRow(userId, taskCount) {
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (row) {
        const taskCell = row.insertCell(-1);
        taskCell.innerHTML = `<span class="task-count">${taskCount}</span>`;
    }
}
