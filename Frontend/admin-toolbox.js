// Admin Toolbox Management JavaScript

let currentPage = 1;
let itemsPerPage = 10;
let allTools = [];
let filteredTools = [];
let editingToolId = null;
let socket = null;

// Initialize Socket.IO connection for real-time updates
function initializeSocketConnection() {
    try {
        socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });
        
        // Update live badge
        const liveBadge = document.getElementById('liveBadgeAdmin');
        if (liveBadge) {
            const statusSpan = liveBadge.querySelector('.status');
            if (statusSpan) {
                statusSpan.textContent = 'LIVE';
                liveBadge.style.background = '#27ae60';
            }
        }

        // Listen for real-time toolbox events
        socket.on('connect', () => {
            console.log('🔌 Connected to real-time toolbox updates');
            if (liveBadge) {
                const statusSpan = liveBadge.querySelector('.status');
                if (statusSpan) {
                    statusSpan.textContent = 'LIVE';
                    liveBadge.style.background = '#27ae60';
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('🔌 Disconnected from real-time toolbox updates');
            if (liveBadge) {
                const statusSpan = liveBadge.querySelector('.status');
                if (statusSpan) {
                    statusSpan.textContent = 'OFFLINE';
                    liveBadge.style.background = '#e74c3c';
                }
            }
        });

        // Toolbox created event
        socket.on('tool:created', (data) => {
            console.log('🛠️ Toolbox created - updating admin panel');
            flashStats();
            loadToolbox(); // Reload data
        });

        // Toolbox updated event
        socket.on('tool:updated', (data) => {
            console.log('🛠️ Toolbox updated - updating admin panel');
            flashStats();
            loadToolbox(); // Reload data
        });

        // Toolbox deleted event
        socket.on('tool:deleted', (data) => {
            console.log('🛠️ Toolbox deleted - updating admin panel');
            flashStats();
            loadToolbox(); // Reload data
        });

    } catch (e) {
        console.warn('Real-time updates unavailable', e);
    }
}

// Flash effect for stats when real-time updates occur
function flashStats() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.style.animation = 'flash 600ms ease';
        setTimeout(() => {
            card.style.animation = '';
        }, 600);
    });
}

// Load toolbox data
async function loadToolbox() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/toolbox', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            allTools = await response.json();
            filteredTools = [...allTools];
            updateToolboxTable();
            updateToolboxStats();
        } else {
            console.error('Failed to load toolbox');
            allTools = [];
            filteredTools = [];
            updateToolboxTable();
            updateToolboxStats();
        }
    } catch (error) {
        console.error('Error loading toolbox:', error);
        allTools = [];
        filteredTools = [];
        updateToolboxTable();
        updateToolboxStats();
    }
}

// Update toolbox table
function updateToolboxTable() {
    const tbody = document.getElementById('toolboxTableBody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTools = filteredTools.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    if (pageTools.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;">No toolbox forms found</td></tr>';
        updatePagination();
        return;
    }

    pageTools.forEach(tool => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tool.work_activity || tool.workActivity || 'N/A'}</td>
            <td>${tool.date || 'N/A'}</td>
            <td>${tool.work_location || tool.workLocation || 'N/A'}</td>
            <td>${tool.name_company || tool.nameCompany || 'N/A'}</td>
            <td>${tool.tools_used || tool.toolsUsed || 'N/A'}</td>
            <td>${tool.prepared_by || tool.preparedBy || 'N/A'}</td>
            <td>${tool.verified_by || tool.verifiedBy || 'N/A'}</td>
            <td>${tool.staffId || tool.staffName || 'N/A'}</td>
            <td>${formatDate(tool.created_at || tool.createdAt)}</td>
            <td>
                <button class="btn btn-sm primary" onclick="viewToolDetails('${tool.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm secondary" onclick="editTool('${tool.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm danger" onclick="deleteTool('${tool.id}', '${tool.work_activity || tool.workActivity || 'Unknown'}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePagination();
}

// Update toolbox statistics
function updateToolboxStats() {
    const stats = {
        total: allTools.length,
        today: allTools.filter(tool => {
            if (tool.date) {
                const toolDate = new Date(tool.date);
                const today = new Date();
                return toolDate.toDateString() === today.toDateString();
            }
            return false;
        }).length,
        thisWeek: allTools.filter(tool => {
            if (tool.date) {
                const toolDate = new Date(tool.date);
                const today = new Date();
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                return toolDate >= weekAgo;
            }
            return false;
        }).length,
        thisMonth: allTools.filter(tool => {
            if (tool.date) {
                const toolDate = new Date(tool.date);
                const today = new Date();
                return toolDate.getMonth() === today.getMonth() && toolDate.getFullYear() === today.getFullYear();
            }
            return false;
        }).length,
        locations: new Set(allTools.map(tool => tool.workLocation).filter(Boolean)).size,
        activities: new Set(allTools.map(tool => tool.workActivity).filter(Boolean)).size
    };

    document.getElementById('totalTools').textContent = stats.total;
    document.getElementById('availableTools').textContent = stats.today;
    document.getElementById('inUseTools').textContent = stats.thisWeek;
    document.getElementById('maintenanceTools').textContent = stats.thisMonth;
    document.getElementById('overdueTools').textContent = stats.locations;
    document.getElementById('totalCategories').textContent = stats.activities;
}

// Search tools
function searchTools() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredTools = allTools.filter(tool =>
        (tool.workActivity && tool.workActivity.toLowerCase().includes(searchTerm)) ||
        (tool.workLocation && tool.workLocation.toLowerCase().includes(searchTerm)) ||
        (tool.nameCompany && tool.nameCompany.toLowerCase().includes(searchTerm)) ||
        (tool.toolsUsed && tool.toolsUsed.toLowerCase().includes(searchTerm)) ||
        (tool.preparedBy && tool.preparedBy.toLowerCase().includes(searchTerm)) ||
        (tool.verifiedBy && tool.verifiedBy.toLowerCase().includes(searchTerm))
    );
    currentPage = 1;
    updateToolboxTable();
}

// Filter tools
function filterTools() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const userFilter = document.getElementById('userFilter').value;

    filteredTools = allTools.filter(tool => {
        const categoryMatch = !categoryFilter || tool.category === categoryFilter;
        const statusMatch = !statusFilter || tool.status === statusFilter;
        const userMatch = !userFilter || tool.assignedTo === userFilter;

        return categoryMatch && statusMatch && userMatch;
    });

    currentPage = 1;
    updateToolboxTable();
}

// Load users for assignment
async function loadUsers() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            const users = await response.json();
            const userSelects = ['assignedTo', 'checkoutUser'];

            userSelects.forEach(selectId => {
                const select = document.getElementById(selectId);
                if (select) {
                    select.innerHTML = '<option value="">Not Assigned</option>';
                    users.forEach(user => {
                        const option = document.createElement('option');
                        option.value = user._id;
                        option.textContent = user.name || user.username;
                        select.appendChild(option);
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Show edit tool modal
function editTool(toolId) {
    const tool = allTools.find(t => t._id === toolId);
    if (!tool) return;

    editingToolId = toolId;
    document.getElementById('modalTitle').textContent = 'Edit Tool';

    // Populate form fields
    document.getElementById('toolName').value = tool.toolName || '';
    document.getElementById('category').value = tool.category || '';
    document.getElementById('description').value = tool.description || '';
    document.getElementById('serialNumber').value = tool.serialNumber || '';
    document.getElementById('location').value = tool.location || '';
    document.getElementById('status').value = tool.status || '';
    document.getElementById('assignedTo').value = tool.assignedTo || '';
    document.getElementById('dueDate').value = tool.dueDate ? tool.dueDate.split('T')[0] : '';
    document.getElementById('notes').value = tool.notes || '';

    document.getElementById('toolModal').style.display = 'flex';
}

// Checkout tool
function checkoutTool(toolId) {
    const tool = allTools.find(t => t._id === toolId);
    if (!tool) return;

    document.getElementById('checkoutModalTitle').textContent = 'Check Out Tool';
    document.getElementById('checkoutForm').reset();
    document.getElementById('checkoutDate').value = new Date().toISOString().split('T')[0];

    // Set default due date to 7 days from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('dueDate').value = nextWeek.toISOString().split('T')[0];

    document.getElementById('checkoutModal').style.display = 'flex';
}

// Process checkout
async function processCheckout() {
    // Implementation for tool checkout
    closeCheckoutModal();
    showAlert('Tool checkout functionality to be implemented', 'info');
}

// View tool details
function viewToolDetails(toolId) {
    const tool = allTools.find(t => t.id === toolId);
    if (!tool) return;

    const content = document.getElementById('toolDetailsContent');
    content.innerHTML = `
        <div class="detail-row">
            <strong>Work Activity:</strong> ${tool.work_activity || tool.workActivity || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Date:</strong> ${tool.date || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Work Location:</strong> ${tool.work_location || tool.workLocation || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Name/Company:</strong> ${tool.name_company || tool.nameCompany || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Sign:</strong> ${tool.sign || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>PPE No:</strong> ${tool.ppe_no || tool.ppeNo || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Tools Used:</strong> ${tool.tools_used || tool.toolsUsed || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Hazards:</strong> ${tool.hazards || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Circulars:</strong> ${tool.circulars || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Risk Assessment:</strong> ${tool.risk_assessment || tool.riskAssessment || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Permit:</strong> ${tool.permit || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Remarks:</strong> ${tool.remarks || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Prepared By:</strong> ${tool.prepared_by || tool.preparedBy || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Verified By:</strong> ${tool.verified_by || tool.verifiedBy || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>User:</strong> ${tool.staffId || tool.staffName || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Created At:</strong> ${formatDate(tool.created_at || tool.createdAt)}
        </div>
    `;

    document.getElementById('toolDetailsModal').style.display = 'flex';
}

// Edit current tool from details modal
function editCurrentTool() {
    closeItemDetailsModal();
    if (editingToolId) {
        editTool(editingToolId);
    }
}

// Delete tool
function deleteTool(toolId, toolName) {
    document.getElementById('deleteToolInfo').textContent = toolName;
    document.getElementById('deleteModal').style.display = 'flex';
}

// Confirm delete tool
async function confirmDeleteTool() {
    try {
        const response = await fetch(`http://localhost:5000/api/admin/toolbox/${editingToolId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            closeDeleteModal();
            loadToolbox();
            showAlert('Tool deleted successfully!', 'success');
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to delete tool', 'error');
        }
    } catch (error) {
        console.error('Error deleting tool:', error);
        showAlert('Error deleting tool', 'error');
    }
}

// Export toolbox
function exportToolbox() {
    const csvContent = generateCSV(filteredTools);
    downloadCSV(csvContent, 'toolbox_export.csv');
}

function generateCSV(data) {
    const headers = ['Work Activity', 'Date', 'Work Location', 'Name/Company', 'Sign', 'PPE No', 'Tools Used', 'Hazards', 'Circulars', 'Risk Assessment', 'Permit', 'Remarks', 'Prepared By', 'Verified By', 'User', 'Created At'];
    const rows = data.map(tool => [
        tool.work_activity || tool.workActivity || '',
        tool.date || '',
        tool.work_location || tool.workLocation || '',
        tool.name_company || tool.nameCompany || '',
        tool.sign || '',
        tool.ppe_no || tool.ppeNo || '',
        tool.tools_used || tool.toolsUsed || '',
        tool.hazards || '',
        tool.circulars || '',
        tool.risk_assessment || tool.riskAssessment || '',
        tool.permit || '',
        tool.remarks || '',
        tool.prepared_by || tool.preparedBy || '',
        tool.verified_by || tool.verifiedBy || '',
        tool.staffId || tool.staffName || '',
        formatDate(tool.created_at || tool.createdAt)
    ]);

    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Close modals
function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

function closeToolDetailsModal() {
    document.getElementById('toolDetailsModal').style.display = 'none';
}

// Pagination functions
function changePage(direction) {
    const totalPages = Math.ceil(filteredTools.length / itemsPerPage);

    if (direction === -1 && currentPage > 1) {
        currentPage--;
    } else if (direction === 1 && currentPage < totalPages) {
        currentPage++;
    }

    updateToolboxTable();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

// Utility functions
function getStatusClass(status) {
    const statusMap = {
        'Available': 'success',
        'In Use': 'warning',
        'Maintenance': 'danger',
        'Out of Service': 'secondary'
    };
    return statusMap[status] || 'secondary';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

function lookupStaffId(userId) {
    // This function should be implemented to look up user names by ID
    return userId || 'Unknown User';
}

function showAlert(message, type = 'info') {
    // Simple alert function - can be enhanced with a proper notification system
    alert(`${type.toUpperCase()}: ${message}`);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Socket.IO is already initialized in the HTML file
    // No additional initialization needed
    initializeSocketConnection(); // Initialize Socket.IO connection
});
