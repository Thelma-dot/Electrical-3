// Admin Dashboard JavaScript

// Global chart instances
let userRolesChartInstance = null;
let userTrendChartInstance = null;
let adminBarChartInstance = null;
let adminRevenueChartInstance = null;
let socket = null;
let previousAdminData = {
    reports: 0,
    inventory: 0,
    inProgress: 0,
    completed: 0,
    totalUsers: 0
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    if (!isAdmin()) {
        window.location.href = 'dashboard.html';
        return;
    }

    loadDashboardData();
    initializeSocketConnection();

    // Periodically refresh as backup
    setInterval(loadDashboardData, 30000);
});

// Check if user is admin
function isAdmin() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role === 'admin') return true;
    try {
        const token = localStorage.getItem('token');
        if (!token) return false;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role === 'admin';
    } catch {
        return false;
    }
}



// Load dashboard statistics
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // Show loading state
        showLoadingState();

        // Fetch users data (admin-only API)
        console.log('Fetching users data...');
        const response = await fetch('http://localhost:5000/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'index.html';
                return;
            }
            throw new Error('Failed to fetch users');
        }

        const users = await response.json();
        console.log('Users data received:', users);

        // Update statistics
        updateStatistics(users);

        // Load recent users
        loadRecentUsers(users);

        // Load charts
        try {
            loadCharts(users);
        } catch (chartError) {
            console.error('Error loading user charts:', chartError);
        }

        // Load admin dashboard charts
        try {
            await loadAdminCharts();
        } catch (adminChartError) {
            console.error('Error loading admin charts:', adminChartError);
        }

        // Load login statistics
        try {
            await loadLoginStats();
        } catch (loginStatsError) {
            console.error('Error loading login stats:', loginStatsError);
        }

        // Hide loading state
        hideLoadingState();

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Failed to load dashboard data. Please check your connection and try again.');

        // Set default values if data loading fails
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('adminUsers').textContent = '0';
        document.getElementById('staffUsers').textContent = '0';
        document.getElementById('todayLogins').textContent = '0';
    }
}

// Update statistics cards
function updateStatistics(users) {
    const totalUsers = users.length;
    const adminUsers = users.filter(user => user.role === 'admin').length;
    const staffUsers = users.filter(user => user.role === 'staff').length;

    // Update the statistics directly
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('adminUsers').textContent = adminUsers;
    document.getElementById('staffUsers').textContent = staffUsers;

    // Today's logins will be updated from admin dashboard data
    // This is handled in updateAdminCharts function

    // Add simple status indicators
    updateCardStatuses(totalUsers, adminUsers, staffUsers, 0); // Will be updated later
}

// Update card status indicators
function updateCardStatuses(totalUsers, adminUsers, staffUsers, todayLogins) {
    const cards = document.querySelectorAll('.overview-card');

    // Remove existing status classes
    cards.forEach(card => {
        card.classList.remove('status-active', 'status-warning', 'status-error');
    });

    // Add simple status indicators
    if (totalUsers > 0) {
        cards[0].classList.add('status-active'); // Total Users
    }

    if (adminUsers > 0 && adminUsers <= totalUsers * 0.3) {
        cards[1].classList.add('status-active'); // Admin Users - good ratio
    } else if (adminUsers > totalUsers * 0.3) {
        cards[1].classList.add('status-warning'); // Too many admins
    }

    if (staffUsers > 0) {
        cards[2].classList.add('status-active'); // Staff Users
    }

    if (todayLogins > 0) {
        cards[3].classList.add('status-active'); // Today's Logins
    } else if (todayLogins === 0 && totalUsers > 0) {
        cards[3].classList.add('status-warning'); // No logins today
    }
}

// Load recent users
function loadRecentUsers(users) {
    const recentUsers = users
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    const tbody = document.getElementById('recentUsersTable');
    tbody.innerHTML = '';

    recentUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.staff_id}</td>
            <td>${user.email || 'N/A'}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn small" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn small danger" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Load charts
function loadCharts(users) {
    try {
        // Check if users data is valid
        if (!users || !Array.isArray(users)) {
            console.warn('Invalid users data for charts:', users);
            return;
        }

        // User roles distribution chart
        const rolesCtx = document.getElementById('userRolesChart');
        if (rolesCtx) {
            // Destroy existing chart if it exists
            if (userRolesChartInstance) {
                userRolesChartInstance.destroy();
            }

            const adminCount = users.filter(u => u.role === 'admin').length;
            const staffCount = users.filter(u => u.role === 'staff').length;

            userRolesChartInstance = new Chart(rolesCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Admin', 'Staff'],
                    datasets: [{
                        data: [adminCount, staffCount],
                        backgroundColor: ['#e74c3c', '#3498db'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // User registration trend chart
        const trendCtx = document.getElementById('userTrendChart');
        if (trendCtx) {
            // Destroy existing chart if it exists
            if (userTrendChartInstance) {
                userTrendChartInstance.destroy();
            }

            // Group users by month
            const monthlyData = {};
            users.forEach(user => {
                const month = new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short'
                });
                monthlyData[month] = (monthlyData[month] || 0) + 1;
            });

            const labels = Object.keys(monthlyData).sort();
            const data = labels.map(month => monthlyData[month]);

            userTrendChartInstance = new Chart(trendCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'New Users',
                        data: data,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading charts:', error);
        // Hide chart containers if there's an error
        const chartCards = document.querySelectorAll('.chart-card');
        chartCards.forEach(card => {
            card.innerHTML = '<h3>Chart Loading Error</h3><p>Unable to load chart data. Please refresh the page.</p>';
        });
    }
}

// Load login statistics
async function loadLoginStats() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        console.log('Fetching login statistics...');
        const response = await fetch('http://localhost:5000/api/admin/login-stats', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'index.html';
                return;
            }
            throw new Error('Failed to fetch login statistics');
        }

        const loginStats = await response.json();
        console.log('Login stats received:', loginStats);

        // Update failed logins display
        const failedLoginsElement = document.getElementById('todayFailedLogins');
        if (failedLoginsElement && loginStats.todayFailedLogins > 0) {
            failedLoginsElement.textContent = `${loginStats.todayFailedLogins} failed`;
            failedLoginsElement.style.display = 'block';
        } else if (failedLoginsElement) {
            failedLoginsElement.style.display = 'none';
        }

        // Update login statistics display
        const successfulLoginsElement = document.getElementById('successfulLogins');
        const failedLoginsDisplayElement = document.getElementById('failedLogins');
        const adminLoginsElement = document.getElementById('adminLogins');
        const staffLoginsElement = document.getElementById('staffLogins');

        if (successfulLoginsElement) {
            successfulLoginsElement.textContent = loginStats.todayLogins || 0;
        }
        if (failedLoginsDisplayElement) {
            failedLoginsDisplayElement.textContent = loginStats.todayFailedLogins || 0;
        }

        // Update login type breakdown
        if (loginStats.todayLoginsByType && Array.isArray(loginStats.todayLoginsByType)) {
            const adminLogins = loginStats.todayLoginsByType.find(item => item.login_type === 'admin')?.count || 0;
            const staffLogins = loginStats.todayLoginsByType.find(item => item.login_type === 'staff')?.count || 0;

            if (adminLoginsElement) {
                adminLoginsElement.textContent = adminLogins;
            }
            if (staffLoginsElement) {
                staffLoginsElement.textContent = staffLogins;
            }
        }

    } catch (error) {
        console.error('Error loading login statistics:', error);
    }
}

// Load admin dashboard charts
async function loadAdminCharts() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // Fetch admin dashboard data (reports, inventory, tasks)
        console.log('Fetching admin dashboard data...');
        const response = await fetch('http://localhost:5000/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'index.html';
                return;
            }
            throw new Error('Failed to fetch admin dashboard data');
        }

        const data = await response.json();
        console.log('Admin dashboard data received:', data);

        // Update previousAdminData with fetched data
        previousAdminData = {
            reports: data.reports,
            inventory: data.inventory,
            inProgress: data.inProgress,
            completed: data.completed,
            totalUsers: data.totalUsers // Assuming totalUsers is also returned
        };

        // Update charts
        updateAdminCharts(data);

    } catch (error) {
        console.error('Error loading admin charts:', error);
        // Hide chart containers if there's an error
        const chartCards = document.querySelectorAll('.chart-card');
        chartCards.forEach(card => {
            card.innerHTML = '<h3>Chart Loading Error</h3><p>Unable to load chart data. Please refresh the page.</p>';
        });
    }
}

// Update admin charts with data
function updateAdminCharts(data) {
    try {
        // Check if data is valid
        if (!data || typeof data !== 'object') {
            console.warn('Invalid admin chart data:', data);
            return;
        }

        // Update bar chart
        const barCtx = document.getElementById('adminBarChart');
        if (barCtx && data) {
            if (adminBarChartInstance) {
                adminBarChartInstance.destroy();
            }

            adminBarChartInstance = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['Reports', 'Inventory', 'In Progress', 'Completed', 'Total Users'],
                    datasets: [{
                        label: 'Count',
                        data: [data.reports, data.inventory, data.inProgress, data.completed, data.totalUsers],
                        backgroundColor: ['#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Update revenue chart (performance chart)
        const revenueCtx = document.getElementById('adminRevenueChart');
        if (revenueCtx && data) {
            if (adminRevenueChartInstance) {
                adminRevenueChartInstance.destroy();
            }

            // Calculate performance metrics
            const totalTasks = data.inProgress + data.completed;
            const completionRate = totalTasks > 0 ? (data.completed / totalTasks) * 100 : 0;

            adminRevenueChartInstance = new Chart(revenueCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Completed', 'In Progress'],
                    datasets: [{
                        data: [data.completed, data.inProgress],
                        backgroundColor: ['#2ecc71', '#f39c12'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Update performance indicator
            const performanceArrow = document.getElementById('adminPerformanceArrow');
            const performanceText = document.getElementById('adminPerformanceText');

            if (performanceArrow && performanceText) {
                if (completionRate >= 80) {
                    performanceArrow.textContent = '↗️';
                    performanceText.textContent = 'Excellent';
                    performanceText.className = 'performance-text excellent';
                } else if (completionRate >= 60) {
                    performanceArrow.textContent = '➡️';
                    performanceText.textContent = 'Good';
                    performanceText.className = 'performance-text good';
                } else {
                    performanceArrow.textContent = '↘️';
                    performanceText.textContent = 'Needs Improvement';
                    performanceText.className = 'performance-text needs-improvement';
                }
            }

            // Update today's logins counter
            const todayLoginsElement = document.getElementById('todayLogins');
            if (todayLoginsElement && data.todayLogins !== undefined) {
                todayLoginsElement.textContent = data.todayLogins;

                // Update card statuses with the correct today's logins value
                const totalUsers = document.getElementById('totalUsers').textContent;
                const adminUsers = document.getElementById('adminUsers').textContent;
                const staffUsers = document.getElementById('staffUsers').textContent;
                updateCardStatuses(parseInt(totalUsers), parseInt(adminUsers), parseInt(staffUsers), data.todayLogins);
            }
        }
    } catch (error) {
        console.error('Error updating admin charts:', error);
    }
}

// Update admin charts in real-time
async function updateAdminChartsInRealTime() {
    try {
        // Flash the overview cards
        document.querySelectorAll('.overview-card').forEach(card => {
            card.classList.add('live-flash');
            setTimeout(() => card.classList.remove('live-flash'), 600);
        });

        // Update charts
        await loadAdminCharts();
        showAdminChartUpdateIndicators();
    } catch (err) {
        console.error('Real-time update error:', err);
    }
}

// Show chart update indicators
function showAdminChartUpdateIndicators() {
    const barIndicator = document.getElementById('adminBarChartIndicator');
    const revenueIndicator = document.getElementById('adminRevenueChartIndicator');

    if (barIndicator) {
        barIndicator.classList.add('active');
        setTimeout(() => barIndicator.classList.remove('active'), 2000);
    }

    if (revenueIndicator) {
        revenueIndicator.classList.add('active');
        setTimeout(() => revenueIndicator.classList.remove('active'), 2000);
    }
}

// Navigation functions
function editUser(userId) {
    window.location.href = `admin-users.html?edit=${userId}`;
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        // This would be implemented in admin-users.js
        window.location.href = `admin-users.html?delete=${userId}`;
    }
}

// Loading state functions
function showLoadingState() {
    const elements = ['totalUsers', 'adminUsers', 'staffUsers', 'todayLogins'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '...';
        }
    });

    // Show loading in recent users table
    const tbody = document.getElementById('recentUsersTable');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Loading...</td></tr>';
    }
}

function hideLoadingState() {
    // Loading state is handled by updateStatistics function
}

// Initialize socket connection for real-time updates
function initializeSocketConnection() {
    try {
        // Check if socket.io is available
        if (typeof io !== 'undefined') {
            socket = io('http://localhost:5000');

            socket.on('connect', () => {
                console.log('Connected to server for real-time updates');
            });

            socket.on('user:created', () => {
                updateAdminChartsInRealTime();
            });

            socket.on('user:updated', () => {
                updateAdminChartsInRealTime();
            });

            socket.on('user:deleted', () => {
                updateAdminChartsInRealTime();
            });

            socket.on('report:updated', () => {
                updateAdminChartsInRealTime();
            });

            socket.on('report:deleted', () => {
                updateAdminChartsInRealTime();
            });

            socket.on('disconnect', () => {
                console.log('Disconnected from server');
            });
        } else {
            console.log('Socket.io not available, real-time updates disabled');
        }
    } catch (error) {
        console.error('Error initializing socket connection:', error);
    }
}

// Show alert message
function showAlert(message) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-error';
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    alertDiv.textContent = message;

    // Add to page
    document.body.appendChild(alertDiv);

    // Remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}
