// Admin Toolbox Management - Based on User Toolbox Structure
let allToolboxes = [];
let filteredToolboxes = [];
let currentPage = 1;
const itemsPerPage = 10;
let socket = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    loadToolboxData();
    setupSearchAndFilter();
    initializeSocketConnection();
});

// Initialize Socket.IO connection for real-time updates
function initializeSocketConnection() {
    try {
        console.log('🔌 Attempting to connect to Socket.IO server...');
        socket = io(window.appConfig.getSocketUrl());

        socket.on('connect', () => {
            console.log('🔌 Admin toolbox connected to server for real-time updates');
            console.log('🔌 Socket ID:', socket.id);
            console.log('🔌 Socket URL:', window.appConfig.getSocketUrl());
        });

        socket.on('disconnect', () => {
            console.log('🔌 Admin toolbox disconnected from server');
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket.IO connection error:', error);
        });

        // Listen for toolbox events
        socket.on('toolbox:created', (data) => {
            console.log('🛠️ New toolbox created:', data);
            showMessage('🔄 New toolbox form submitted! Refreshing data...', 'success');
            loadToolboxData();
        });

        socket.on('toolbox:updated', (data) => {
            console.log('🛠️ Toolbox updated:', data);
            showMessage('🔄 Toolbox form updated! Refreshing data...', 'success');
            loadToolboxData();
        });

        socket.on('toolbox:deleted', (data) => {
            console.log('🛠️ Toolbox deleted:', data);
            showMessage('🔄 Toolbox form deleted! Refreshing data...', 'info');
            loadToolboxData();
        });

        // Listen for admin-specific toolbox events
        socket.on('admin:toolbox:created', (data) => {
            console.log('🛠️ Admin: New toolbox created:', data);
            showMessage('🔄 New toolbox form submitted! Refreshing data...', 'success');
            loadToolboxData();
        });

        socket.on('admin:toolbox:updated', (data) => {
            console.log('🛠️ Admin: Toolbox updated:', data);
            showMessage('🔄 Toolbox form updated! Refreshing data...', 'success');
            loadToolboxData();
        });

        socket.on('admin:toolbox:deleted', (data) => {
            console.log('🛠️ Admin: Toolbox deleted:', data);
            showMessage('🔄 Toolbox form deleted! Refreshing data...', 'info');
            loadToolboxData();
        });

        // Test toolbox event
        socket.on('test:toolbox:event', (data) => {
            console.log('🧪 Test toolbox event received:', data);
            showMessage('🧪 Test toolbox event received! Socket.IO is working.', 'success');
        });

    } catch (error) {
        console.error('❌ Error initializing Socket.IO in admin toolbox:', error);
    }
}

// Load toolbox data from API
async function loadToolboxData() {
    try {
        console.log('🔄 Loading toolbox data for admin...');

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No authentication token found');
            showMessage('❌ Authentication required. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = './index.html';
            }, 2000);
            return;
        }

        const apiUrl = window.appConfig.getApiUrl('/admin/toolbox/all');
        console.log('🔍 Making API call to:', apiUrl);
        console.log('🔍 Token available:', !!token);
        console.log('🔍 Token length:', token ? token.length : 0);

        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('⏰ Request timed out after 5 seconds');
            controller.abort();
        }, 5000); // 5 second timeout

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📡 API Response status:', response.status);
        console.log('📡 API Response ok:', response.ok);
        console.log('📡 API Response headers:', response.headers);

        if (response.ok) {
            allToolboxes = await response.json();
            console.log('📋 Loaded toolbox data:', allToolboxes);
            console.log('📊 Number of toolboxes loaded:', allToolboxes.length);

            // Sort toolboxes by most recent first
            allToolboxes.sort((a, b) => {
                const dateA = a.updated_at || a.updatedAt || a.created_at || a.createdAt || '1970-01-01';
                const dateB = b.updated_at || b.updatedAt || b.created_at || b.createdAt || '1970-01-01';
                return new Date(dateB) - new Date(dateA);
            });

            filteredToolboxes = [...allToolboxes];
            updateToolboxTable();
            updatePagination();
            updateStats();
            populateUserFilter();

            console.log('✅ Toolbox data loaded and displayed successfully');
        } else if (response.status === 401) {
            console.error('❌ Authentication expired');
            showMessage('❌ Authentication expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = './index.html';
            }, 2000);
        } else if (response.status === 403) {
            console.error('❌ Admin privileges required');
            showMessage('❌ Admin privileges required. Please log in as an admin user.', 'error');
            setTimeout(() => {
                window.location.href = './index.html';
            }, 2000);
        } else {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            showMessage(`❌ Error loading toolbox data: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error loading toolbox data:', error);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        if (error.name === 'AbortError') {
            showMessage('❌ Request timed out. Please check your connection and try again.', 'error');
        } else {
            showMessage('❌ Error loading toolbox data. Please try again.', 'error');
        }
    }
}

// Setup search and filter functionality
function setupSearchAndFilter() {
    const searchInput = document.getElementById('searchToolbox');
    const statusFilter = document.getElementById('statusFilter');
    const userFilter = document.getElementById('userFilter');

    if (searchInput) searchInput.addEventListener('input', searchToolboxes);
    if (statusFilter) statusFilter.addEventListener('change', filterToolboxes);
    if (userFilter) userFilter.addEventListener('change', filterToolboxes);
}

// Filter toolboxes based on search, status, and user
function filterToolboxes() {
    const searchTerm = document.getElementById('searchToolbox').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const userFilter = document.getElementById('userFilter').value;

    filteredToolboxes = allToolboxes.filter(toolbox => {
        // Handle both snake_case and camelCase field names
        const workActivity = toolbox.work_activity || toolbox.workActivity || '';
        const workLocation = toolbox.work_location || toolbox.workLocation || '';
        const nameCompany = toolbox.name_company || toolbox.nameCompany || '';
        const toolsUsed = toolbox.tools_used || toolbox.toolsUsed || '';
        const preparedBy = toolbox.prepared_by || toolbox.preparedBy || '';
        const verifiedBy = toolbox.verified_by || toolbox.verifiedBy || '';
        const userName = toolbox.user_name || toolbox.userName || '';

        const matchesSearch =
            (workActivity && workActivity.toLowerCase().includes(searchTerm)) ||
            (workLocation && workLocation.toLowerCase().includes(searchTerm)) ||
            (nameCompany && nameCompany.toLowerCase().includes(searchTerm)) ||
            (toolsUsed && toolsUsed.toLowerCase().includes(searchTerm)) ||
            (preparedBy && preparedBy.toLowerCase().includes(searchTerm)) ||
            (verifiedBy && verifiedBy.toLowerCase().includes(searchTerm)) ||
            (userName && userName.toLowerCase().includes(searchTerm));

        const matchesStatus = !statusFilter || toolbox.status === statusFilter;
        const matchesUser = !userFilter || toolbox.user_id == userFilter;

        return matchesSearch && matchesStatus && matchesUser;
    });

    // Sort filtered toolboxes by most recent first
    filteredToolboxes.sort((a, b) => {
        const dateA = a.updated_at || a.updatedAt || a.created_at || a.createdAt || '1970-01-01';
        const dateB = b.updated_at || b.updatedAt || b.created_at || b.createdAt || '1970-01-01';
        return new Date(dateB) - new Date(dateA);
    });

    currentPage = 1;
    updateToolboxTable();
    updatePagination();
    updateStats();
}

// Update toolbox table display
function updateToolboxTable() {
    const tbody = document.getElementById('toolboxTableBody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredToolboxes.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    if (pageItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="table-empty">
                    <div>📋 No toolbox forms found</div>
                </td>
            </tr>
        `;
        return;
    }

    pageItems.forEach(toolbox => {
        // Handle both snake_case and camelCase field names
        const workActivity = toolbox.work_activity || toolbox.workActivity || 'N/A';
        const workLocation = toolbox.work_location || toolbox.workLocation || 'N/A';
        const nameCompany = toolbox.name_company || toolbox.nameCompany || 'N/A';
        const toolsUsed = toolbox.tools_used || toolbox.toolsUsed || 'N/A';
        const preparedBy = toolbox.prepared_by || toolbox.preparedBy || 'N/A';
        const verifiedBy = toolbox.verified_by || toolbox.verifiedBy || 'N/A';
        const userName = toolbox.user_name || toolbox.userName || 'N/A';
        const toolboxId = toolbox.id || toolbox._id || toolbox.toolboxId;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="truncate-text" title="${workActivity}">
                    ${workActivity}
                </div>
            </td>
            <td>${formatDate(toolbox.date)}</td>
            <td>
                <div class="truncate-text" title="${workLocation}">
                    ${workLocation}
                </div>
            </td>
            <td>
                <div class="truncate-text" title="${nameCompany}">
                    ${nameCompany}
                </div>
            </td>
            <td>
                <div class="truncate-text" title="${toolsUsed}">
                    ${toolsUsed}
                </div>
            </td>
            <td>
                <div class="truncate-text" title="${preparedBy}">
                    ${preparedBy}
                </div>
            </td>
            <td>
                <div class="truncate-text" title="${verifiedBy}">
                    ${verifiedBy}
                </div>
            </td>
            <td>
                <span class="status-badge ${(toolbox.status || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-')}">
                    ${toolbox.status || 'Pending'}
                </span>
            </td>
            <td>
                <div class="truncate-text" title="${userName}">
                    ${userName}
                </div>
            </td>
            <td>${formatDate(toolbox.created_at)}</td>
            <td>
                ${getActionButtons(toolbox)}
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Get action buttons based on toolbox status
function getActionButtons(toolbox) {
    const toolboxId = toolbox.id || toolbox._id || toolbox.toolboxId;
    const status = toolbox.status || 'pending';

    if (status === 'completed') {
        return `
            <div class="action-buttons">
                <button onclick="viewToolbox('${toolboxId}')" class="btn primary btn-sm">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        `;
    } else {
        return `
            <div class="action-buttons">
                <button onclick="viewToolbox('${toolboxId}')" class="btn primary btn-sm">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="editToolbox('${toolboxId}')" class="btn secondary btn-sm">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="markAsCompleted('${toolboxId}')" class="btn success btn-sm">
                    <i class="fas fa-check"></i> Complete
                </button>
                <button onclick="confirmDeleteToolbox('${toolboxId}')" class="btn danger btn-sm">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (error) {
        return dateString;
    }
}

// View toolbox details
async function viewToolbox(toolboxId) {
    try {
        const toolbox = allToolboxes.find(t => (t.id || t._id || t.toolboxId) == toolboxId);
        if (!toolbox) {
            showMessage('❌ Toolbox not found', 'error');
            return;
        }

        // Create modal HTML
        const modalHTML = `
            <div id="toolboxViewModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000;">
                <div class="modal-content" style="background-color: white; margin: 5% auto; padding: 20px; border-radius: 8px; width: 80%; max-width: 800px; max-height: 80vh; overflow-y: auto;">
                    <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ecf0f1; padding-bottom: 15px; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: #2c3e50;">Toolbox Details</h2>
                        <button onclick="closeToolboxViewModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #7f8c8d;">&times;</button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px;">
                            <div class="detail-item">
                                <label style="font-weight: 600; color: #34495e; margin-bottom: 5px; font-size: 14px;">Work Activity:</label>
                                <span style="color: #2c3e50; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 14px;">${toolbox.work_activity || toolbox.workActivity || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label style="font-weight: 600; color: #34495e; margin-bottom: 5px; font-size: 14px;">Date:</label>
                                <span style="color: #2c3e50; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 14px;">${formatDate(toolbox.date)}</span>
                            </div>
                            <div class="detail-item">
                                <label style="font-weight: 600; color: #34495e; margin-bottom: 5px; font-size: 14px;">Work Location:</label>
                                <span style="color: #2c3e50; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 14px;">${toolbox.work_location || toolbox.workLocation || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label style="font-weight: 600; color: #34495e; margin-bottom: 5px; font-size: 14px;">Name/Company:</label>
                                <span style="color: #2c3e50; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 14px;">${toolbox.name_company || toolbox.nameCompany || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label style="font-weight: 600; color: #34495e; margin-bottom: 5px; font-size: 14px;">Tools Used:</label>
                                <span style="color: #2c3e50; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 14px;">${toolbox.tools_used || toolbox.toolsUsed || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label style="font-weight: 600; color: #34495e; margin-bottom: 5px; font-size: 14px;">Prepared By:</label>
                                <span style="color: #2c3e50; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 14px;">${toolbox.prepared_by || toolbox.preparedBy || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label style="font-weight: 600; color: #34495e; margin-bottom: 5px; font-size: 14px;">Verified By:</label>
                                <span style="color: #2c3e50; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 14px;">${toolbox.verified_by || toolbox.verifiedBy || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label style="font-weight: 600; color: #34495e; margin-bottom: 5px; font-size: 14px;">Hazards:</label>
                                <span style="color: #2c3e50; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 14px;">${toolbox.hazards || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label style="font-weight: 600; color: #34495e; margin-bottom: 5px; font-size: 14px;">Status:</label>
                                <span style="color: #2c3e50; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 14px;">${toolbox.status || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <label style="font-weight: 600; color: #34495e; margin-bottom: 5px; font-size: 14px;">User:</label>
                                <span style="color: #2c3e50; padding: 8px 12px; background: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef; font-size: 14px;">${toolbox.user_name || toolbox.userName || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer" style="display: flex; gap: 15px; justify-content: center; margin-top: 20px; border-top: 2px solid #ecf0f1; padding-top: 20px;">
                        <button onclick="closeToolboxViewModal()" class="btn-secondary" style="background: #2c3e50; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                            ❌ Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        document.getElementById('toolboxViewModal').style.display = 'block';
    } catch (error) {
        console.error('❌ Error viewing toolbox:', error);
        showMessage('❌ Error viewing toolbox', 'error');
    }
}

// Close toolbox view modal
function closeToolboxViewModal() {
    const modal = document.getElementById('toolboxViewModal');
    if (modal) {
        modal.remove();
    }
}

// Edit toolbox (placeholder - redirect to edit page)
function editToolbox(toolboxId) {
    showMessage('Edit functionality will be implemented', 'info');
}

// Mark toolbox as completed
async function markAsCompleted(toolboxId) {
    if (!confirm('Are you sure you want to mark this toolbox form as completed?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('❌ Authentication required', 'error');
            return;
        }

        const response = await fetch(window.appConfig.getApiUrl(`/admin/toolbox/${toolboxId}`), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'completed' })
        });

        if (response.ok) {
            // Update local data
            const toolbox = allToolboxes.find(t => (t.id || t._id || t.toolboxId) == toolboxId);
            if (toolbox) {
                toolbox.status = 'completed';
            }

            // Refresh table
            filterToolboxes();
            showMessage('✅ Toolbox form marked as completed!', 'success');
        } else {
            throw new Error('Failed to mark toolbox as completed');
        }
    } catch (error) {
        console.error('Error marking toolbox as completed:', error);
        showMessage('❌ Failed to mark toolbox as completed', 'error');
    }
}

// Delete toolbox
async function deleteToolbox(toolboxId) {
    if (!confirm('Are you sure you want to delete this toolbox form?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showMessage('❌ Authentication required', 'error');
            return;
        }

        const response = await fetch(window.appConfig.getApiUrl(`/admin/toolbox/${toolboxId}`), {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Remove from local data
            allToolboxes = allToolboxes.filter(t => (t.id || t._id || t.toolboxId) != toolboxId);
            filteredToolboxes = filteredToolboxes.filter(t => (t.id || t._id || t.toolboxId) != toolboxId);

            // Refresh table
            updateToolboxTable();
            updatePagination();
            updateStats();

            showMessage('✅ Toolbox form deleted successfully!', 'success');
        } else {
            throw new Error('Failed to delete toolbox form');
        }
    } catch (error) {
        console.error('Error deleting toolbox:', error);
        showMessage('❌ Failed to delete toolbox form', 'error');
    }
}

// Update statistics
function updateStats() {
    const total = filteredToolboxes.length;
    const completed = filteredToolboxes.filter(t => t.status === 'completed').length;
    const submitted = filteredToolboxes.filter(t => t.status === 'submitted').length;
    const pending = filteredToolboxes.filter(t => t.status === 'pending' || !t.status).length;

    document.getElementById('totalToolboxes').textContent = total;
    document.getElementById('submittedToolboxes').textContent = submitted;
    document.getElementById('completedToolboxes').textContent = completed;
    document.getElementById('pendingToolboxes').textContent = pending;
}

// Populate user filter dropdown
function populateUserFilter() {
    const userFilter = document.getElementById('userFilter');
    if (!userFilter) return;

    // Get unique users from toolbox data
    const users = [...new Set(allToolboxes.map(t => ({
        id: t.user_id,
        name: t.user_name || t.userName || 'Unknown User'
    })))];

    // Clear existing options except "All Users"
    userFilter.innerHTML = '<option value="">All Users</option>';

    // Add user options
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        userFilter.appendChild(option);
    });
}

// Pagination functions
function changePage(direction) {
    const maxPage = Math.ceil(filteredToolboxes.length / itemsPerPage);

    if (direction === -1 && currentPage > 1) {
        currentPage--;
    } else if (direction === 1 && currentPage < maxPage) {
        currentPage++;
    }

    updateToolboxTable();
    updatePagination();
}

function updatePagination() {
    const maxPage = Math.ceil(filteredToolboxes.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${maxPage}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === maxPage;
}


// Export toolbox data (placeholder)
function exportToolbox() {
    showMessage('Export functionality will be implemented', 'info');
}

// Show message function
function showMessage(message, type = 'info') {
    const messageArea = document.getElementById('messageArea');
    if (!messageArea) return;

    messageArea.className = `message ${type}`;
    messageArea.textContent = message;
    messageArea.classList.remove('hidden');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageArea.classList.add('hidden');
    }, 5000);
}



// Search function (separate from filter)
function searchToolboxes() {
    filterToolboxes();
}

// Delete confirmation modal functions
let deleteToolboxId = null;

function confirmDeleteToolbox(toolboxId) {
    deleteToolboxId = toolboxId;
    document.getElementById('deleteModal').style.display = 'block';
}

function confirmDelete() {
    if (deleteToolboxId) {
        deleteToolbox(deleteToolboxId);
        closeDeleteModal();
    }
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteToolboxId = null;
}


// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './index.html';
}


// Make functions globally accessible
window.exportToolbox = exportToolbox;
window.viewToolbox = viewToolbox;
window.editToolbox = editToolbox;
window.markAsCompleted = markAsCompleted;
window.deleteToolbox = deleteToolbox;
window.confirmDeleteToolbox = confirmDeleteToolbox;
window.confirmDelete = confirmDelete;
window.closeDeleteModal = closeDeleteModal;
window.closeToolboxViewModal = closeToolboxViewModal;
window.changePage = changePage;
window.searchToolboxes = searchToolboxes;
window.logout = logout;
