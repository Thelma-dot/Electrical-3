// Admin User Management JavaScript

// Navbar functionality
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

let allUsers = [];
let allTasks = [];
let currentPage = 1;
let currentTaskPage = 1;
const usersPerPage = 10;
const tasksPerPage = 10;

// Initialize user management
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 Admin users page loaded');

    // Check authentication first
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    console.log('🔍 Authentication check:', { hasToken: !!token, user: user });

    if (!token) {
        console.log('❌ No token found - redirecting to login');
        showAlert('Please login to access user management', 'error');
        window.location.href = 'index.html';
        return;
    }

    if (!user || user.role !== 'admin') {
        console.log('❌ User is not admin - redirecting to dashboard');
        showAlert('Admin privileges required to access user management', 'error');
        window.location.href = 'dashboard.html';
        return;
    }

    console.log('✅ User is authenticated as admin:', user.staff_id);

    // Load users and tasks immediately - don't wait for health check
    console.log('🔄 Loading users and tasks...');
    console.log('🔍 Current authentication status:', {
        hasToken: !!localStorage.getItem('token'),
        user: JSON.parse(localStorage.getItem('user') || '{}'),
        isAdmin: user.role === 'admin'
    });

    loadUsers();
    loadAllTasks();

    // Test API connection in background (optional)
    testApiConnection().then(() => {
        console.log('✅ API connection test passed');
    }).catch((error) => {
        console.log('⚠️ Health check failed (this is not critical):', error.message);
        // Don't show error to user - health check is optional
    });

    setActiveNavLink();

    // Check if we should show the return to admin button
    checkReturnToAdminButton();

    // Initialize Socket.IO connection for real-time updates
    initializeSocketConnection();

    // Periodically refresh admin task overview so user updates reflect here
    setInterval(() => {
        loadAllTasks();
    }, 30000);

    // Check for edit/delete parameters
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    const deleteId = urlParams.get('delete');

    if (editId) {
        setTimeout(() => editUser(parseInt(editId)), 100);
    } else if (deleteId) {
        setTimeout(() => deleteUser(parseInt(deleteId)), 100);
    }
});

// Check if user is admin
function isAdmin() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.role === 'admin';
}

// Helper function to get API URL with fallback
function getApiUrl() {
    const defaultUrl = 'http://localhost:5000/api';

    console.log('🔍 getApiUrl called');
    console.log('🔍 window.appConfig exists:', !!window.appConfig);
    console.log('🔍 window.appConfig:', window.appConfig);

    // Always return a valid URL
    if (!window.appConfig) {
        console.log('🔍 No appConfig found, using default URL:', defaultUrl);
        return defaultUrl;
    }

    if (typeof window.appConfig.getApiUrl !== 'function') {
        console.log('🔍 appConfig.getApiUrl is not a function, using default URL:', defaultUrl);
        return defaultUrl;
    }

    try {
        // Use the apiBaseUrl directly from appConfig
        const configUrl = window.appConfig.apiBaseUrl;
        console.log('🔍 Config URL from appConfig:', configUrl);

        // Validate the URL
        if (!configUrl || configUrl === 'undefined' || configUrl.trim() === '') {
            console.log('🔍 Invalid config URL, using default URL:', defaultUrl);
            return defaultUrl;
        }

        // Test if it's a valid URL
        new URL(configUrl);
        console.log('🔍 Using config URL:', configUrl);
        return configUrl;

    } catch (error) {
        console.error('🔍 Error with config URL:', error);
        console.log('🔍 Using default URL:', defaultUrl);
        return defaultUrl;
    }
}

// Helper function to get Socket URL with fallback
function getSocketUrl() {
    const defaultUrl = 'http://localhost:5000';

    // Always return a valid URL
    if (!window.appConfig) {
        console.log('🔍 No appConfig found, using default socket URL:', defaultUrl);
        return defaultUrl;
    }

    if (typeof window.appConfig.getSocketUrl !== 'function') {
        console.log('🔍 appConfig.getSocketUrl is not a function, using default socket URL:', defaultUrl);
        return defaultUrl;
    }

    try {
        // Use the socketUrl directly from appConfig
        const configUrl = window.appConfig.socketUrl;
        console.log('🔍 Config socket URL from appConfig:', configUrl);

        // Validate the URL
        if (!configUrl || configUrl === 'undefined' || configUrl.trim() === '') {
            console.log('🔍 Invalid config socket URL, using default URL:', defaultUrl);
            return defaultUrl;
        }

        // Test if it's a valid URL
        new URL(configUrl);
        console.log('🔍 Using config socket URL:', configUrl);
        return configUrl;

    } catch (error) {
        console.error('🔍 Error with config socket URL:', error);
        console.log('🔍 Using default socket URL:', defaultUrl);
        return defaultUrl;
    }
}

// Test API connection
async function testApiConnection() {
    try {
        const apiUrl = getApiUrl();
        console.log('🔍 API URL for testing:', apiUrl);

        // Construct health URL safely - use the base URL without /api
        let healthUrl;
        if (apiUrl.endsWith('/api')) {
            healthUrl = apiUrl.replace('/api', '') + '/health';
        } else {
            // If API URL doesn't end with /api, try to construct health URL
            const baseUrl = apiUrl.replace(/\/api.*$/, '');
            healthUrl = baseUrl + '/health';
        }

        console.log('🔍 Testing API connection to:', healthUrl);

        // Validate the health URL before making the request
        new URL(healthUrl);

        // Create timeout manually for better browser compatibility
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('🔍 Health check response status:', response.status);

        if (response.ok) {
            const healthData = await response.json();
            console.log('✅ API connection test successful:', healthData);
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Health check failed:', { status: response.status, statusText: response.statusText, body: errorText });
            throw new Error(`Health check failed with status: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ API connection test failed:', error);

        // Provide more specific error messages
        if (error.name === 'AbortError') {
            throw new Error('Connection timeout - server may be slow or unresponsive');
        } else if (error.message.includes('fetch')) {
            throw new Error('Network error - cannot reach server. Please check if backend is running on port 5000');
        } else if (error.message.includes('CORS')) {
            throw new Error('CORS error - server configuration issue');
        } else {
            throw new Error(`Connection failed: ${error.message}`);
        }
    }
}

// Initialize Socket.IO connection for real-time updates
function initializeSocketConnection() {
    try {
        const socket = io(getSocketUrl());

        socket.on('connect', () => {
            console.log('🔌 Admin users connected to server for real-time updates');
        });

        socket.on('disconnect', () => {
            console.log('🔌 Admin users disconnected from server');
        });

        // Listen for user updates
        socket.on('user:created', (data) => {
            console.log('👤 Admin users: User created:', data);
            loadUsers(); // Refresh users table
            showAlert('New user created', 'success');
        });

        socket.on('user:updated', (data) => {
            console.log('👤 Admin users: User updated:', data);
            loadUsers(); // Refresh users table
            showAlert('User updated', 'info');
        });

        socket.on('user:deleted', (data) => {
            console.log('👤 Admin users: User deleted:', data);
            loadUsers(); // Refresh users table
            showAlert('User deleted', 'warning');
        });

        // Listen for task updates
        socket.on('task:created', (data) => {
            console.log('📋 Admin users: Task created:', data);
            loadAllTasks(); // Refresh tasks table
        });

        socket.on('task:updated', (data) => {
            console.log('📋 Admin users: Task updated:', data);
            loadAllTasks(); // Refresh tasks table
        });

        socket.on('task:deleted', (data) => {
            console.log('📋 Admin users: Task deleted:', data);
            loadAllTasks(); // Refresh tasks table
        });

        // Store socket globally for use in other functions
        window.socket = socket;

    } catch (error) {
        console.error('❌ Error initializing Socket.IO in admin users:', error);
    }
}

// Load all users
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        console.log('🔍 Loading users - Token available:', !!token);
        console.log('🔍 Current user:', user);

        if (!token) {
            console.log('❌ No token found - redirecting to login');
            showAlert('Please login to access user management', 'error');
            window.location.href = 'index.html';
            return;
        }

        // Check if user is admin
        if (!user || user.role !== 'admin') {
            console.log('❌ User is not admin - redirecting to dashboard');
            showAlert('Admin privileges required to access user management', 'error');
            window.location.href = 'dashboard.html';
            return;
        }

        const apiUrl = getApiUrl();
        const fullUrl = apiUrl + '/admin/users';

        console.log('🔍 Loading users from:', fullUrl);
        console.log('🔍 Token preview:', token.substring(0, 20) + '...');
        console.log('🔍 Current page URL:', window.location.href);
        console.log('🔍 API base URL:', apiUrl);

        const response = await fetch(fullUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response ok:', response.ok);

        if (!response.ok) {
            if (response.status === 401) {
                console.log('🔍 Unauthorized - token expired or invalid');
                showAlert('Session expired. Please login again.', 'error');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
                return;
            }

            if (response.status === 403) {
                console.log('🔍 Forbidden - admin privileges required');
                showAlert('Admin privileges required. You are not authorized to access user management.', 'error');
                window.location.href = 'dashboard.html';
                return;
            }

            // Get error details from response
            let errorMessage = `Failed to fetch users (Status: ${response.status})`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage += ` - ${errorData.error}`;
                }
            } catch (e) {
                // If we can't parse the error response, use the status text
                errorMessage += ` - ${response.statusText}`;
            }

            console.error('🔍 API Error:', errorMessage);
            throw new Error(errorMessage);
        }

        allUsers = await response.json();
        console.log('🔍 Users loaded successfully:', allUsers.length, 'users');
        console.log('🔍 Users data:', allUsers);

        if (allUsers.length === 0) {
            console.log('⚠️ No users found in database');
            showAlert('No users found in the system', 'info');
        }

        renderUsersTable();

    } catch (error) {
        console.error('Error loading users:', error);

        // Provide more specific error messages
        let errorMessage = 'Failed to load users';
        if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server. Please check if the backend is running on port 5000.';
        } else if (error.message.includes('401')) {
            errorMessage = 'Authentication failed. Please login again.';
        } else if (error.message.includes('403')) {
            errorMessage = 'Access denied. Admin privileges required.';
        } else if (error.message.includes('404')) {
            errorMessage = 'API endpoint not found. Please check server configuration.';
        } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timeout. Server may be slow or unresponsive.';
        }

        console.error('❌ User loading failed:', errorMessage);
        showAlert(errorMessage, 'error');
    }
}

// Render users table
async function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    const filteredUsers = getFilteredUsers();
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const usersToShow = filteredUsers.slice(startIndex, endIndex);

    console.log('🔍 Rendering users table:', { totalUsers: allUsers.length, filteredUsers: filteredUsers.length, usersToShow: usersToShow.length });

    if (usersToShow.length === 0) {
        // Show a message when no users are found
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                ${allUsers.length === 0 ? 'No users found in the system' : 'No users match the current filter'}
            </td>
        `;
        tbody.appendChild(row);
    } else {
        // Load task counts for all users first
        const userTaskCounts = {};
        for (const user of usersToShow) {
            try {
                userTaskCounts[user.id] = await getUserTaskCount(user.id);
            } catch (error) {
                console.error(`Error getting task count for user ${user.id}:`, error);
                userTaskCounts[user.id] = 0;
            }
        }

        // Now render the rows
        for (const user of usersToShow) {
            const row = document.createElement('tr');
            row.dataset.userId = user.id;
            const taskCount = userTaskCounts[user.id] || 0;

            row.innerHTML = `
                <td>${user.staff_id}</td>
                <td>${user.email || 'N/A'}</td>
                <td><span class="role-badge ${user.role}">${(user.role || 'staff').toUpperCase()}</span></td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <button class="btn small" onclick="startInlineEdit(${user.id})" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn small" onclick="viewUserTasks(${user.id})" title="View ${taskCount} tasks">
                        <i class="fas fa-bars"></i>
                    </button>
                    <button class="btn small warning" onclick="resetPassword(${user.id})" title="Reset Password">
                        <i class="fas fa-key"></i>
                    </button>
                    <button class="btn small danger" onclick="deleteUser(${user.id})" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        }
    }

    updatePagination(filteredUsers.length);
}

// ============== Inline editing for users ==============
function startInlineEdit(userId) {
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    const user = allUsers.find(u => u.id === userId);
    if (!row || !user) return;

    const cells = row.querySelectorAll('td');
    // staff_id, email, role become inputs; created_at stays
    cells[0].innerHTML = `<input type="text" id="editInlineStaffId_${userId}" value="${user.staff_id || ''}" />`;
    cells[1].innerHTML = `<input type="email" id="editInlineEmail_${userId}" value="${user.email || ''}" />`;
    cells[2].innerHTML = `
      <select id="editInlineRole_${userId}">
        <option value="staff" ${user.role === 'staff' ? 'selected' : ''}>STAFF</option>
        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>ADMIN</option>
      </select>`;

    // Actions -> Save + Cancel
    cells[4].innerHTML = `
      <button class="btn small" onclick="saveInlineUser(${userId})" title="Save">
        <i class="fas fa-save"></i>
      </button>
      <button class="btn small secondary" onclick="cancelInlineEdit(${userId})" title="Cancel">
        <i class="fas fa-times"></i>
      </button>
    `;
}

async function saveInlineUser(userId) {
    const staff_id = document.getElementById(`editInlineStaffId_${userId}`)?.value || '';
    const email = document.getElementById(`editInlineEmail_${userId}`)?.value || '';
    const role = document.getElementById(`editInlineRole_${userId}`)?.value || 'staff';

    if (!staff_id.trim()) {
        showAlert('Staff ID is required');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl() + `/admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ staff_id, email, role })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to update user');

        // Update local cache and re-render
        allUsers = allUsers.map(u => u.id === userId ? { ...u, staff_id, email, role } : u);
        renderUsersTable();
        showAlert('User saved', 'success');

        // Emit realtime event for other connected clients
        try {
            if (window.socket) {
                window.socket.emit('user:updated', { id: userId, staff_id, email, role });
            }
        } catch (e) {
            console.log('Socket not available');
        }
    } catch (e) {
        console.error(e);
        showAlert(e.message || 'Update failed', 'error');
    }
}

function cancelInlineEdit(userId) {
    renderUsersTable();
}

// Get user task count
async function getUserTaskCount(userId) {
    try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const response = await fetch(apiUrl + `/tasks/user/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const tasks = await response.json();
            return tasks.length;
        }
        return 0;
    } catch (error) {
        console.error('Error fetching task count:', error);
        return 0;
    }
}

// View user tasks
function viewUserTasks(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    // Filter tasks for this specific user
    const userTasks = allTasks.filter(task => task.assigned_to === userId);

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'userTasksModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2>Tasks for ${user.staff_id}</h2>
                <span class="close" onclick="closeUserTasksModal()">&times;</span>
            </div>
            <div style="margin-bottom: 20px;">
                <p><strong>Total Tasks:</strong> ${userTasks.length}</p>
                <p><strong>Pending:</strong> ${userTasks.filter(t => t.status === 'pending').length} | 
                   <strong>In Progress:</strong> ${userTasks.filter(t => t.status === 'in_progress').length} | 
                   <strong>Completed:</strong> ${userTasks.filter(t => t.status === 'completed').length}</p>
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
                ${userTasks.length === 0 ?
            '<p style="text-align: center; color: #666; padding: 20px;">No tasks assigned to this user.</p>' :
            `<table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 8px; border: 1px solid #ddd;">Title</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Status</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Priority</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Due Date</th>
                                <th style="padding: 8px; border: 1px solid #ddd;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userTasks.map(task => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #ddd;">${task.title}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd;">
                                        <span class="task-status-badge ${task.status}">${toTaskLabel(task.status)}</span>
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #ddd;">
                                        <span class="task-priority-badge ${task.priority || 'medium'}">${toPriorityLabel(task.priority || 'medium')}</span>
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #ddd;">${formatDue(task.due_date) || 'No due date'}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd;">
                                        <button class="btn small" onclick="editTask(${task.id})" title="Edit Task">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn small danger" onclick="deleteTask(${task.id})" title="Delete Task">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`
        }
            </div>
            <div class="form-actions" style="margin-top: 20px;">
                <button class="btn primary" onclick="assignTask(${userId})">Assign New Task</button>
                <button class="btn secondary" onclick="closeUserTasksModal()">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Close user tasks modal
function closeUserTasksModal() {
    const modal = document.getElementById('userTasksModal');
    if (modal) {
        modal.remove();
    }
}

// Sync deadline reminder with newly assigned task
async function syncDeadlineReminderWithNewTask(newTask) {
    try {
        // If the new task has a due date, update the deadline reminder
        if (newTask && newTask.due_date) {
            console.log('🔄 Syncing deadline reminder with new task:', newTask.title);

            // Get current user's tasks to find the nearest deadline
            const token = localStorage.getItem('token');
            const apiUrl = window.appConfig ? getApiUrl() : 'http://localhost:5000/api';
            const response = await fetch(apiUrl + '/tasks/my', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const tasks = await response.json();

                // Find the nearest upcoming deadline
                const now = new Date();
                const candidates = tasks.filter(t => t.due_date && (t.status === 'pending' || t.status === 'in_progress'));

                if (candidates.length > 0) {
                    candidates.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
                    const nextTask = candidates.find(t => new Date(t.due_date) > now) || candidates[0];

                    // Update the deadline reminder if it exists
                    const deadlineInput = document.getElementById('deadlineInput');
                    if (deadlineInput) {
                        const deadlineLocal = toDateTimeLocal(nextTask.due_date);
                        deadlineInput.value = deadlineLocal;
                        localStorage.setItem('userDeadline', deadlineLocal);
                        localStorage.setItem('userDeadlineTaskTitle', nextTask.title || 'Task');
                        localStorage.setItem('userDeadlineTaskId', String(nextTask.id));

                        // Trigger deadline countdown update if function exists
                        if (typeof displayDeadlineCountdown === 'function') {
                            displayDeadlineCountdown(deadlineLocal);
                        }

                        console.log('✅ Deadline reminder updated to:', nextTask.title, 'due (Ghana time):', new Date(nextTask.due_date).toLocaleString("en-US", { timeZone: "Africa/Accra" }));
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error syncing deadline reminder:', error);
    }
}

// Helper function to convert ISO date to datetime-local format
function toDateTimeLocal(iso) {
    try {
        const date = new Date(iso);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return '';
    }
}

// View user details
function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'userDetailsModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>User Details - ${user.staff_id}</h2>
                <span class="close" onclick="closeUserDetailsModal()">&times;</span>
            </div>
            <div class="form-group">
                <label><strong>Staff ID:</strong></label>
                <p>${user.staff_id}</p>
            </div>
            <div class="form-group">
                <label><strong>Email:</strong></label>
                <p>${user.email || 'N/A'}</p>
            </div>
            <div class="form-group">
                <label><strong>Role:</strong></label>
                <p><span class="role-badge ${user.role}">${(user.role || 'staff').toUpperCase()}</span></p>
            </div>
            <div class="form-group">
                <label><strong>Created Date:</strong></label>
                <p>${formatDate(user.created_at)}</p>
            </div>
            <div class="form-group">
                <label><strong>Last Login:</strong></label>
                <p>${formatDate(user.last_login) || 'Never'}</p>
            </div>
            <div class="form-actions">
                <button class="btn primary" onclick="editUser(${userId})">Edit User</button>
                <button class="btn secondary" onclick="closeUserDetailsModal()">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Close user details modal
function closeUserDetailsModal() {
    const modal = document.getElementById('userDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Assign task to user
function assignTask(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'taskAssignmentModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Assign Task to ${user.staff_id}</h2>
                <span class="close" onclick="closeTaskAssignmentModal()">&times;</span>
            </div>
            <form id="taskAssignmentForm" onsubmit="handleTaskAssignment(event, ${userId})">
                <div class="form-group">
                    <label for="taskTitle">Task Title *</label>
                    <input type="text" id="taskTitle" required>
                </div>
                <div class="form-group">
                    <label for="taskDescription">Description</label>
                    <textarea id="taskDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="taskPriority">Priority</label>
                                         <select id="taskPriority">
                         <option value="low">Low</option>
                         <option value="medium" selected>Medium</option>
                         <option value="high">High</option>
                     </select>
                </div>
                <div class="form-group">
                    <label for="taskDueDate">Due Date</label>
                    <input type="datetime-local" id="taskDueDate">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn primary">Assign Task</button>
                    <button type="button" class="btn danger" onclick="closeTaskAssignmentModal()" style="background-color: #e74c3c; color: white;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Handle task assignment
async function handleTaskAssignment(event, userId) {
    event.preventDefault();

    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        assigned_to: userId,
        assigned_by: JSON.parse(localStorage.getItem('user')).id,
        priority: document.getElementById('taskPriority').value,
        due_date: document.getElementById('taskDueDate').value || null,
        status: 'pending'
    };

    try {
        const token = localStorage.getItem('token');
        const apiUrl = window.appConfig ? getApiUrl() : 'http://localhost:5000/api';
        const response = await fetch(apiUrl + '/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('Task assigned successfully!', 'success');
            closeTaskAssignmentModal();
            loadUsers(); // Refresh the table

            // Sync deadline reminder with the newly assigned task
            syncDeadlineReminderWithNewTask(result.task);

            // Notify user that their deadline reminder has been updated
            if (result.task && result.task.due_date) {
                const dueDate = new Date(result.task.due_date).toLocaleString("en-US", { timeZone: "Africa/Accra" });
                console.log(`📅 Task "${result.task.title}" assigned with deadline (Ghana time): ${dueDate}`);
            }
        } else {
            showAlert(result.error || 'Failed to assign task', 'error');
        }
    } catch (error) {
        console.error('Error assigning task:', error);
        showAlert('Failed to assign task', 'error');
    }
}

// Close task assignment modal
function closeTaskAssignmentModal() {
    const modal = document.getElementById('taskAssignmentModal');
    if (modal) {
        modal.remove();
    }
}

// Get filtered users
function getFilteredUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;

    return allUsers.filter(user => {
        const matchesSearch = user.staff_id.toLowerCase().includes(searchTerm) ||
            (user.email && user.email.toLowerCase().includes(searchTerm));
        const matchesRole = !roleFilter || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });
}

// Search users
function searchUsers() {
    currentPage = 1;
    renderUsersTable();
}

// Filter users by role
function filterUsers() {
    currentPage = 1;
    renderUsersTable();
}

// Pagination
function changePage(direction) {
    const totalPages = Math.ceil(getFilteredUsers().length / usersPerPage);
    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    renderUsersTable();
}

function formatDate(iso) {
    try {
        if (!iso) return 'N/A';
        const date = new Date(iso);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'Africa/Accra'
        });
    } catch (error) {
        console.error('Date formatting error:', error, 'for date:', iso);
        return 'N/A';
    }
}

// ================= Tasks (Admin overview) =================
async function loadAllTasks() {
    try {
        const token = localStorage.getItem('token');
        const apiUrl = window.appConfig ? getApiUrl() : 'http://localhost:5000/api';
        const resp = await fetch(apiUrl + '/tasks/admin/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) return;
        allTasks = await resp.json();
        updateTaskStats();
        populateTaskUserFilter();
        renderTasksTable();
    } catch (e) {
        console.error('Failed to load tasks', e);
        showAlert('Failed to load tasks', 'error');
    }
}

function updateTaskStats() {
    const total = allTasks.length;
    const pending = allTasks.filter(t => t.status === 'pending').length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const hidden = allTasks.filter(t => t.hidden_from_user === 1).length;
    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setText('totalTasks', total);
    setText('pendingTasks', pending);
    setText('inProgressTasks', inProgress);
    setText('completedTasks', completed);

    // Update hidden tasks count if element exists
    const hiddenElement = document.getElementById('hiddenTasks');
    if (hiddenElement) {
        hiddenElement.textContent = hidden;
    }
}

function populateTaskUserFilter() {
    const sel = document.getElementById('taskUserFilter');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">All Users</option>' + allUsers.map(u => `<option value="${u.id}">${u.staff_id}</option>`).join('');
    sel.value = current;
}

function getFilteredTasks() {
    const q = (document.getElementById('taskSearchInput')?.value || '').toLowerCase();
    const status = document.getElementById('taskStatusFilter')?.value || '';
    const userId = document.getElementById('taskUserFilter')?.value || '';
    return allTasks.filter(t => {
        const matchesText = [t.title, t.description].filter(Boolean).some(s => s.toLowerCase().includes(q));
        const matchesStatus = !status || t.status === status;
        const matchesUser = !userId || String(t.assigned_to) === String(userId);
        return matchesText && matchesStatus && matchesUser;
    });
}

function renderTasksTable() {
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const tasks = getFilteredTasks();

    // Apply pagination
    const startIndex = (currentTaskPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const tasksToShow = tasks.slice(startIndex, endIndex);

    // Update pagination info
    updateTaskPaginationInfo(tasks.length);

    tasksToShow.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = t.hidden_from_user === 1 ? 'hidden-task' : '';
        tr.innerHTML = `
          <td>${t.title}</td>
          <td>${t.description || ''}</td>
          <td>${lookupStaffId(t.assigned_to)}</td>
          <td><span class="task-priority-badge ${t.priority || 'medium'}">${toPriorityLabel(t.priority || 'medium')}</span></td>
          <td><span class="task-status-badge ${t.status}">${toTaskLabel(t.status)}</span></td>
          <td>${formatDue(t.due_date)}</td>
          <td>
            <span class="hidden-indicator ${t.hidden_from_user === 1 ? 'hidden' : ''}" title="${t.hidden_from_user === 1 ? 'Hidden from user' : 'Visible to user'}">
              <i class="fas ${t.hidden_from_user === 1 ? 'fa-eye-slash' : 'fa-eye'}"></i>
            </span>
          </td>
          <td class="task-actions">
            <button class="btn small" onclick="editTask(${t.id})" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn small warning" onclick="markTask(${t.id}, 'in_progress')" title="Mark In Progress"><i class="fas fa-hourglass-half"></i></button>
            <button class="btn small" onclick="markTask(${t.id}, 'completed')" title="Complete"><i class="fas fa-check"></i></button>
            <button class="btn small danger" onclick="deleteTask(${t.id})" title="Delete"><i class="fas fa-trash"></i></button>
          </td>`;
        tbody.appendChild(tr);
    });
}

// Task pagination functions
function updateTaskPaginationInfo(totalTasks) {
    const totalPages = Math.ceil(totalTasks / tasksPerPage);
    const pageInfo = document.getElementById('taskPageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentTaskPage} of ${totalPages}`;
    }

    // Update button states
    const prevBtn = document.getElementById('taskPrevPage');
    const nextBtn = document.getElementById('taskNextPage');

    if (prevBtn) prevBtn.disabled = currentTaskPage <= 1;
    if (nextBtn) nextBtn.disabled = currentTaskPage >= totalPages;
}

function changeTaskPage(direction) {
    const totalTasks = getFilteredTasks().length;
    const totalPages = Math.ceil(totalTasks / tasksPerPage);

    if (direction === -1 && currentTaskPage > 1) {
        currentTaskPage--;
    } else if (direction === 1 && currentTaskPage <= totalPages) {
        currentTaskPage++;
    }

    renderTasksTable();
}

function toTaskLabel(s) {
    return (s || '').replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function toPriorityLabel(p) {
    return (p || 'medium').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDue(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString(); } catch { return ''; }
}

function lookupStaffId(id) {
    const u = allUsers.find(u => String(u.id) === String(id));
    return u ? u.staff_id : id;
}

// Task filters handlers
function searchTasks() {
    currentTaskPage = 1; // Reset to first page when searching
    renderTasksTable();
}
function filterTasks() {
    currentTaskPage = 1; // Reset to first page when filtering
    renderTasksTable();
}

// Quick task actions
async function markTask(id, status) {
    try {
        const token = localStorage.getItem('token');
        const apiUrl = window.appConfig ? getApiUrl() : 'http://localhost:5000/api';
        await fetch(apiUrl + `/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status })
        });
        await loadAllTasks();
    } catch (e) {
        console.error(e);
        showAlert('Failed to update task status', 'error');
    }
}

// Edit task function
async function editTask(id) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'editTaskModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Task</h2>
                <span class="close" onclick="closeEditTaskModal()">&times;</span>
            </div>
            <form id="editTaskForm" onsubmit="handleEditTask(event, ${id})">
                <div class="form-group">
                    <label for="editTaskTitle">Task Title *</label>
                    <input type="text" id="editTaskTitle" value="${task.title}" required>
                </div>
                <div class="form-group">
                    <label for="editTaskDescription">Description</label>
                    <textarea id="editTaskDescription" rows="3">${task.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="editTaskPriority">Priority</label>
                                         <select id="editTaskPriority">
                         <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                         <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                         <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                     </select>
                </div>
                <div class="form-group">
                    <label for="editTaskStatus">Status</label>
                    <select id="editTaskStatus">
                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${task.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editTaskDueDate">Due Date</label>
                    <input type="datetime-local" id="editTaskDueDate" value="${task.due_date ? task.due_date.slice(0, 16) : ''}">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn primary">Update Task</button>
                    <button type="button" class="btn danger" onclick="closeEditTaskModal()" style="background-color: #e74c3c; color: white;">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// Handle task editing
async function handleEditTask(event, taskId) {
    event.preventDefault();

    const taskData = {
        title: document.getElementById('editTaskTitle').value,
        description: document.getElementById('editTaskDescription').value,
        priority: document.getElementById('editTaskPriority').value,
        status: document.getElementById('editTaskStatus').value,
        due_date: document.getElementById('editTaskDueDate').value || null
    };

    try {
        const token = localStorage.getItem('token');
        const apiUrl = window.appConfig ? getApiUrl() : 'http://localhost:5000/api';
        const response = await fetch(apiUrl + `/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('Task updated successfully!', 'success');
            closeEditTaskModal();
            loadAllTasks(); // Refresh the tasks table
        } else {
            showAlert(result.error || 'Failed to update task', 'error');
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showAlert('Failed to update task', 'error');
    }
}

// Close edit task modal
function closeEditTaskModal() {
    const modal = document.getElementById('editTaskModal');
    if (modal) {
        modal.remove();
    }
}

async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    try {
        const token = localStorage.getItem('token');
        const apiUrl = window.appConfig ? getApiUrl() : 'http://localhost:5000/api';
        await fetch(apiUrl + `/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        await loadAllTasks();
    } catch (e) {
        console.error(e);
        showAlert('Failed to delete task', 'error');
    }
}

function updatePagination(totalUsers) {
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Add user modal
function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'flex';
}

function closeAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
    document.getElementById('addUserForm').reset();
}

// Add new user
async function addUser(event) {
    event.preventDefault();

    const userData = {
        staff_id: document.getElementById('staffId').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };

    const autoLogin = document.getElementById('autoLogin').checked;
    const endpoint = autoLogin ? '/api/admin/users/create-and-login' : '/api/admin/users';

    try {
        const token = localStorage.getItem('token');
        const apiUrl = window.appConfig ? getApiUrl() : 'http://localhost:5000/api';
        const response = await fetch(apiUrl + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok) {
            if (autoLogin) {
                // Store admin credentials for later return
                const adminToken = localStorage.getItem('token');
                const adminUser = localStorage.getItem('user');
                localStorage.setItem('adminToken', adminToken);
                localStorage.setItem('adminUser', adminUser);

                // Login as new user
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));

                showAlert(`User created successfully! You are now logged in as ${result.user.staff_id} (${result.user.role}).`, 'success');

                // Show return to admin button
                checkReturnToAdminButton();

                // Redirect to dashboard as new user
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            } else {
                showAlert('User added successfully', 'success');
                closeAddUserModal();

                // Add the new user to the table immediately
                if (result && result.id) {
                    // Create a user object with the response data
                    const newUser = {
                        id: result.id,
                        staff_id: result.staff_id,
                        email: result.email,
                        role: result.role,
                        created_at: new Date().toISOString()
                    };

                    // Add to the beginning of the users array
                    allUsers.unshift(newUser);

                    // Reset to first page and refresh the table
                    currentPage = 1;
                    renderUsersTable();

                    // Emit realtime event for other connected clients
                    try {
                        if (window.socket) {
                            window.socket.emit('user:created', newUser);
                        }
                    } catch (e) {
                        console.log('Socket not available');
                    }
                } else {
                    // Fallback to reload if response shape is unexpected
                    loadUsers();
                }
            }
        } else {
            showAlert(result.error || 'Failed to add user', 'error');
        }
    } catch (error) {
        console.error('Error adding user:', error);
        showAlert('Failed to add user', 'error');
    }
}

// Function to return to admin account
function returnToAdmin() {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');

    if (adminToken && adminUser) {
        localStorage.setItem('token', adminToken);
        localStorage.setItem('user', adminUser);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');

        // Hide the return to admin button
        const returnBtn = document.getElementById('returnToAdminBtn');
        if (returnBtn) returnBtn.style.display = 'none';

        window.location.href = 'admin-users.html';
    }
}

// Check if we should show the return to admin button
function checkReturnToAdminButton() {
    const returnBtn = document.getElementById('returnToAdminBtn');
    if (returnBtn) {
        const hasAdminCredentials = localStorage.getItem('adminToken') && localStorage.getItem('adminUser');
        returnBtn.style.display = hasAdminCredentials ? 'inline-block' : 'none';
    }
}

// Edit user modal
function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editStaffId').value = user.staff_id;
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editRole').value = user.role;

    document.getElementById('editUserModal').style.display = 'flex';
}

function showEditUserModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showAlert('User not found', 'error');
        return;
    }

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editStaffId').value = user.staff_id;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editRole').value = user.role;

    document.getElementById('editUserModal').style.display = 'flex';
}

function closeEditUserModal() {
    document.getElementById('editUserModal').style.display = 'none';
}

// Update user
async function updateUser(event) {
    event.preventDefault();

    const userId = document.getElementById('editUserId').value;
    const userData = {
        staff_id: document.getElementById('editStaffId').value,
        email: document.getElementById('editEmail').value,
        role: document.getElementById('editRole').value
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl() + `/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('User updated successfully', 'success');
            closeEditUserModal();

            // Update local cache and re-render immediately
            allUsers = allUsers.map(u => u.id === parseInt(userId) ? { ...u, ...userData } : u);
            renderUsersTable();

            // Emit realtime event for other connected clients
            try {
                if (window.socket) {
                    window.socket.emit('user:updated', { id: parseInt(userId), ...userData });
                }
            } catch (e) {
                console.log('Socket not available');
            }
        } else {
            showAlert(result.error || 'Failed to update user', 'error');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        showAlert('Failed to update user', 'error');
    }
}

// Reset password modal
function resetPassword(userId) {
    document.getElementById('resetUserId').value = userId;
    document.getElementById('resetPasswordModal').style.display = 'flex';
}

function closeResetPasswordModal() {
    document.getElementById('resetPasswordModal').style.display = 'none';
    document.getElementById('resetPasswordForm').reset();
}

// Reset user password
async function resetUserPassword(event) {
    event.preventDefault();

    const userId = document.getElementById('resetUserId').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl() + `/admin/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newPassword })
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('Password reset successfully', 'success');
            closeResetPasswordModal();
        } else {
            showAlert(result.error || 'Failed to reset password', 'error');
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        showAlert('Failed to reset password', 'error');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl() + `/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('User deleted successfully', 'success');

            // Remove user from local cache and re-render immediately
            allUsers = allUsers.filter(u => u.id !== userId);
            renderUsersTable();

            // Emit realtime event for other connected clients
            try {
                if (window.socket) {
                    window.socket.emit('user:deleted', { id: userId });
                }
            } catch (e) {
                console.log('Socket not available');
            }
        } else {
            showAlert(result.error || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Failed to delete user', 'error');
    }
}





// Show alert
function showAlert(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
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
        background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 300px;
        word-wrap: break-word;
    `;

    notification.textContent = message;

    // Add slideIn animation
    const style = document.createElement('style');
    style.textContent = `
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

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Close modals when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}