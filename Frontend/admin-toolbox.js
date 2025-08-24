// Admin Toolbox Management JavaScript

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

// Global variables
let allTools = [];
let filteredTools = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentToolId = null;
let socket = null; // Socket.IO connection

// Load toolbox data on page load
document.addEventListener('DOMContentLoaded', function () {
    loadToolbox();
    setActiveNavLink();
    initializeSocketConnection(); // Initialize Socket.IO connection
});

// Initialize Socket.IO connection for real-time updates
function initializeSocketConnection() {
    try {
        socket = io('http://localhost:5000');

        socket.on('connect', () => {
            console.log('🔌 Admin toolbox connected to server for real-time updates');
            // Notify server that admin toolbox page is connected
            socket.emit('admin:connected', { type: 'toolbox', timestamp: new Date().toISOString() });
        });

        socket.on('disconnect', () => {
            console.log('🔌 Admin toolbox disconnected from server');
        });

        // Listen for toolbox updates
        socket.on('admin:toolbox:created', (data) => {
            console.log('🛠️ Admin toolbox: Form created:', data);
            handleToolboxUpdate('created', data);
        });

        socket.on('admin:toolbox:updated', (data) => {
            console.log('🛠️ Admin toolbox: Form updated:', data);
            handleToolboxUpdate('updated', data);
        });

        socket.on('admin:toolbox:deleted', (data) => {
            console.log('🛠️ Admin toolbox: Form deleted:', data);
            handleToolboxUpdate('deleted', data);
        });

        console.log('✅ Socket.IO connection initialized for admin toolbox');
    } catch (error) {
        console.error('❌ Error initializing Socket.IO in admin toolbox:', error);
    }
}

// Handle toolbox updates
function handleToolboxUpdate(type, data) {
    console.log(`🛠️ Handling toolbox ${type} update:`, data);

    // Flash the stats to show update
    flashStats();

    // Reload toolbox data
    setTimeout(() => {
        loadToolbox();
    }, 500);
}

// Real-time flash effects
function flashStats() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.style.animation = 'flash 0.6s ease';
        setTimeout(() => {
            card.style.animation = '';
        }, 600);
    });
}

function flashToolboxTable() {
    const table = document.getElementById('toolboxTable');
    if (table) {
        table.style.animation = 'flash 0.6s ease';
        setTimeout(() => {
            table.style.animation = '';
        }, 600);
    }
}

// Load toolbox data
async function loadToolbox() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            return;
        }

        const response = await fetch('http://localhost:5000/api/toolbox/admin/all', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            allTools = await response.json();
            filteredTools = [...allTools];
            updateStats();
            displayTools();
        } else if (response.status === 401) {
            console.error('Authentication expired');
            window.location.href = './index.html';
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error loading toolbox data:', error);
        showMessage('Error loading toolbox data. Please try again.', 'error');
    }
}

// Update statistics
function updateStats() {
    const totalTools = allTools.length;
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const todayCount = allTools.filter(tool => tool.date === today).length;
    const weekCount = allTools.filter(tool => new Date(tool.date) >= thisWeek).length;
    const monthCount = allTools.filter(tool => new Date(tool.date) >= thisMonth).length;

    // Get unique locations and activities
    const locations = [...new Set(allTools.map(tool => tool.work_location || tool.workLocation))].filter(Boolean);
    const activities = [...new Set(allTools.map(tool => tool.work_activity || tool.workActivity))].filter(Boolean);

    document.getElementById('totalTools').textContent = totalTools;
    document.getElementById('availableTools').textContent = todayCount;
    document.getElementById('inUseTools').textContent = weekCount;
    document.getElementById('maintenanceTools').textContent = monthCount;
    document.getElementById('overdueTools').textContent = locations.length;
    document.getElementById('totalCategories').textContent = activities.length;
}

// Display tools in the table
function displayTools() {
    const tbody = document.getElementById('toolboxTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (filteredTools.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #666;">
                    No toolbox forms found.
                </td>
            </tr>
        `;
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTools = filteredTools.slice(startIndex, endIndex);

    pageTools.forEach(tool => {
        const row = document.createElement('tr');

        // Handle both snake_case and camelCase field names
        const workActivity = tool.work_activity || tool.workActivity || 'N/A';
        const date = tool.date || 'N/A';
        const workLocation = tool.work_location || tool.workLocation || 'N/A';
        const nameCompany = tool.name_company || tool.nameCompany || 'N/A';
        const toolsUsed = tool.tools_used || tool.toolsUsed || 'N/A';
        const preparedBy = tool.prepared_by || tool.preparedBy || 'N/A';
        const verifiedBy = tool.verified_by || tool.verifiedBy || 'N/A';
        const createdAt = tool.created_at || tool.createdAt || 'N/A';

        // Get user information
        const userName = tool.user_name || tool.userName || 'N/A';

        row.innerHTML = `
            <td>${workActivity}</td>
            <td>${formatDate(date)}</td>
            <td>${workLocation}</td>
            <td>${nameCompany}</td>
            <td>${truncateText(toolsUsed, 30)}</td>
            <td>${preparedBy}</td>
            <td>${verifiedBy}</td>
            <td>${userName}</td>
            <td>${formatDate(createdAt)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewToolDetails(${tool.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="editTool(${tool.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTool(${tool.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });

    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

// Change page
function changePage(direction) {
    const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayTools();
    }
}

// Search tools
function searchTools() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (!searchTerm) {
        filteredTools = [...allTools];
    } else {
        filteredTools = allTools.filter(tool => {
            const workActivity = (tool.work_activity || tool.workActivity || '').toLowerCase();
            const workLocation = (tool.work_location || tool.workLocation || '').toLowerCase();
            const nameCompany = (tool.name_company || tool.nameCompany || '').toLowerCase();
            const toolsUsed = (tool.tools_used || tool.toolsUsed || '').toLowerCase();
            const preparedBy = (tool.prepared_by || tool.preparedBy || '').toLowerCase();
            const userName = (tool.user_name || tool.userName || '').toLowerCase();

            return workActivity.includes(searchTerm) ||
                workLocation.includes(searchTerm) ||
                nameCompany.includes(searchTerm) ||
                toolsUsed.includes(searchTerm) ||
                preparedBy.includes(searchTerm) ||
                userName.includes(searchTerm);
        });
    }

    currentPage = 1;
    displayTools();
}

// Filter tools
function filterTools() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const userFilter = document.getElementById('userFilter').value;

    filteredTools = allTools.filter(tool => {
        let matches = true;

        if (categoryFilter && tool.category !== categoryFilter) {
            matches = false;
        }

        if (statusFilter && tool.status !== statusFilter) {
            matches = false;
        }

        if (userFilter && tool.user_name !== userFilter) {
            matches = false;
        }

        return matches;
    });

    currentPage = 1;
    displayTools();
}

// View tool details
function viewToolDetails(toolId) {
    const tool = allTools.find(t => t.id == toolId);
    if (!tool) {
        alert('Tool not found');
        return;
    }

    // Create a simple modal or use alert for now
    const details = `
Work Activity: ${tool.work_activity || tool.workActivity || 'N/A'}
Date: ${tool.date || 'N/A'}
Work Location: ${tool.work_location || tool.workLocation || 'N/A'}
Company: ${tool.name_company || tool.nameCompany || 'N/A'}
Tools Used: ${tool.tools_used || tool.toolsUsed || 'N/A'}
Prepared By: ${tool.prepared_by || tool.preparedBy || 'N/A'}
Created At: ${formatDate(tool.created_at || tool.createdAt)}
    `;

    alert(details);
}

// Edit tool
function editTool(toolId) {
    // Redirect to toolbox form with edit mode
    window.location.href = `./tool_box.html?edit=${toolId}`;
}

// Delete tool
function deleteTool(toolId) {
    const tool = allTools.find(t => t.id == toolId);
    if (!tool) {
        alert('Tool not found');
        return;
    }

    if (confirm(`Are you sure you want to delete the toolbox form for "${tool.work_activity || tool.workActivity}"?`)) {
        // Implement delete functionality
        console.log('Deleting tool:', toolId);
        // You can add the actual delete API call here
    }
}

// Export toolbox data
function exportToolbox() {
    // Implement export functionality
    console.log('Exporting toolbox data...');
    // You can add CSV/Excel export functionality here
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (error) {
        return dateString;
    }
}

function truncateText(text, maxLength) {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function showMessage(message, type = 'info') {
    // Implement message display functionality
    console.log(`${type.toUpperCase()}: ${message}`);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './index.html';
}

