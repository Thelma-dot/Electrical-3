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
let eventCounter = 0; // Debug counter for events

// Load toolbox data on page load
document.addEventListener('DOMContentLoaded', function () {
    loadToolbox();
    setActiveNavLink();
    initializeSocketConnection(); // Initialize Socket.IO connection
});

// Initialize Socket.IO connection for real-time updates
function initializeSocketConnection() {
    try {
        console.log('🔌 Attempting to connect to Socket.IO server...');
        socket = io(window.appConfig.getSocketUrl());

        socket.on('connect', () => {
            console.log('🔌 Admin toolbox connected to server for real-time updates');
            console.log('🔌 Socket ID:', socket.id);
            console.log('🔌 Connection status:', socket.connected);
            console.log('🔌 Socket URL:', window.appConfig.getSocketUrl());

            // Show connection status notification
            showConnectionNotification('connected');

            // Notify server that admin is connected
            socket.emit('admin:connected', {
                type: 'toolbox-management',
                timestamp: new Date().toISOString()
            });

            // Test the connection by emitting a test event
            socket.emit('test:connection', {
                message: 'Admin toolbox connection test',
                timestamp: new Date().toISOString()
            });
        });

        socket.on('disconnect', () => {
            console.log('🔌 Admin toolbox disconnected from server');
            showConnectionNotification('disconnected');
        });

        socket.on('reconnect', () => {
            console.log('🔌 Admin toolbox reconnected to server');
            showConnectionNotification('reconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket.IO connection error:', error);
        });

        // Listen for test connection response
        socket.on('test:connection:response', (data) => {
            console.log('🧪 Test connection response received:', data);
        });

        // Listen for toolbox updates
        socket.on('admin:toolbox:created', (data) => {
            console.log('🛠️ Admin toolbox: Form created:', data);
            handleToolboxUpdate('created', data);
        });

        socket.on('admin:toolbox:updated', (data) => {
            eventCounter++;
            console.log(`🛠️ Admin toolbox: Form updated (Event #${eventCounter}):`, data);
            console.log('🔄 Event data received:', JSON.stringify(data, null, 2));
            console.log('🔄 About to call handleToolboxUpdate with type: updated');
            handleToolboxUpdate('updated', data);
        });

        socket.on('admin:toolbox:deleted', (data) => {
            console.log('🛠️ Admin toolbox: Form deleted:', data);
            handleToolboxUpdate('deleted', data);
        });

        // Also listen for general toolbox updates from user actions
        socket.on('toolbox:created', (data) => {
            console.log('🛠️ Admin toolbox: User created form:', data);
            handleToolboxUpdate('created', data);
        });

        socket.on('toolbox:updated', (data) => {
            eventCounter++;
            console.log(`🛠️ Admin toolbox: User updated form (Event #${eventCounter}):`, data);
            console.log('🔄 General toolbox:updated event received:', JSON.stringify(data, null, 2));
            console.log('🔄 Event type:', typeof data);
            console.log('🔄 Event toolboxId:', data.toolboxId);
            handleToolboxUpdate('updated', data);
        });

        socket.on('toolbox:deleted', (data) => {
            console.log('🛠️ Admin toolbox: User deleted form:', data);
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
    eventCounter++;
    console.log(`🛠️ Event #${eventCounter} received:`, { type, data });

    // Show notification
    showToolboxUpdateNotification(type, data);

    // Flash the stats to show update
    flashStats();

    // Reload toolbox data immediately (same pattern as inventory and reports)
    console.log('🔄 Reloading toolbox data for real-time update');
    loadToolbox();
}

// Update a specific toolbox row when its status changes
async function updateToolboxRow(toolboxId) {
    console.log('🔄 Starting row update for toolbox:', toolboxId);
    console.log('🔄 ToolboxId type:', typeof toolboxId);
    console.log('🔄 API URL:', window.appConfig.getApiUrl(`/toolbox/admin/${toolboxId}`));

    try {
        // Fetch the updated toolbox data
        const token = localStorage.getItem('token');
        console.log('🔄 Token available:', !!token);

        const response = await fetch(window.appConfig.getApiUrl(`/toolbox/admin/${toolboxId}`), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('🔄 Fetch response status:', response.status);
        console.log('🔄 Response ok:', response.ok);

        if (response.ok) {
            const updatedToolbox = await response.json();
            console.log('🔄 Updated toolbox data:', updatedToolbox);

            // Find the existing row
            const existingRow = document.querySelector(`tr[data-toolbox-id="${toolboxId}"]`);
            console.log('🔄 Existing row found:', !!existingRow);

            if (existingRow) {
                // Update the row with new data instead of removing it
                updateRowContent(existingRow, updatedToolbox);

                // Flash the updated row to show the change
                flashRow(existingRow);

                // Update the allTools array with the new data
                const toolIndex = allTools.findIndex(tool => tool.id == toolboxId);
                if (toolIndex !== -1) {
                    allTools[toolIndex] = updatedToolbox;
                    console.log('🔄 Updated allTools array');
                }

                // Update statistics
                updateStats();

                console.log('✅ Row updated successfully');
            } else {
                console.log('⚠️ Row not found, reloading entire table');
                // If row not found, reload the entire table
                setTimeout(() => {
                    loadToolbox();
                }, 300);
            }
        } else {
            console.log('❌ Failed to fetch updated toolbox data');
            // If we can't fetch the updated data, reload the entire table
            setTimeout(() => {
                loadToolbox();
            }, 300);
        }
    } catch (error) {
        console.error('❌ Error updating toolbox row:', error);
        // Fallback to reloading the entire table
        setTimeout(() => {
            loadToolbox();
        }, 300);
    }
}

// Update the content of a specific row
function updateRowContent(row, toolbox) {
    // Handle both snake_case and camelCase field names
    const workActivity = toolbox.work_activity || toolbox.workActivity || 'N/A';
    const date = toolbox.date || 'N/A';
    const workLocation = toolbox.work_location || toolbox.workLocation || 'N/A';
    const nameCompany = toolbox.name_company || toolbox.nameCompany || 'N/A';
    const toolsUsed = toolbox.tools_used || toolbox.toolsUsed || 'N/A';
    const preparedBy = toolbox.prepared_by || toolbox.preparedBy || 'N/A';
    const verifiedBy = toolbox.verified_by || toolbox.verifiedBy || 'N/A';

    const status = toolbox.status || 'submitted';

    // Get user information
    const userName = toolbox.user_name || toolbox.userName || 'N/A';

    // Determine action buttons based on status
    let actionButtons;
    if (status === 'completed') {
        actionButtons = '<span class="completed-status">✅ Completed</span>';
    } else {
        actionButtons = `
            <div class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="viewToolDetails(${toolbox.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-warning" onclick="editTool(${toolbox.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTool(${toolbox.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    }

    // Update the row content
    row.innerHTML = `
        <td>${workActivity}</td>
        <td>${formatDate(date)}</td>
        <td>${workLocation}</td>
        <td>${nameCompany}</td>
        <td>${truncateText(toolsUsed, 30)}</td>
        <td>${preparedBy}</td>
        <td>${verifiedBy}</td>
        <td>${userName}</td>
        <td>
            <span class="toolbox-status-badge ${status === 'completed' ? 'toolbox-status-completed' : 'toolbox-status-submitted'}">
                ${status === 'completed' ? '✅ Completed' : '📝 Submitted'}
            </span>
        </td>

        <td>${actionButtons}</td>
    `;
}

// Flash a specific row to highlight the update
function flashRow(row) {
    row.style.animation = 'flash 0.6s ease';
    setTimeout(() => {
        row.style.animation = '';
    }, 600);
}

// Remove a toolbox row from the table when it's deleted
function removeToolboxRow(toolboxId) {
    console.log('🗑️ Removing toolbox row for ID:', toolboxId);

    const row = document.querySelector(`tr[data-toolbox-id="${toolboxId}"]`);
    if (row) {
        // Add fade-out animation before removing
        row.style.transition = 'opacity 0.3s ease';
        row.style.opacity = '0';

        setTimeout(() => {
            row.remove();
            // Update statistics after removal
            updateStats();
            console.log('✅ Toolbox row removed successfully');
        }, 300);
    } else {
        console.log('⚠️ Toolbox row not found, reloading entire table');
        // If row not found, reload the entire table
        setTimeout(() => {
            loadToolbox();
        }, 300);
    }
}

// Show toolbox update notification
function showToolboxUpdateNotification(type, data) {
    const messages = {
        'created': 'New toolbox form created',
        'updated': 'Toolbox form updated and marked as completed',
        'deleted': 'Toolbox form deleted'
    };

    const message = messages[type] || 'Toolbox updated';
    const colors = {
        'created': '#27ae60',
        'updated': '#f39c12',
        'deleted': '#e74c3c'
    };
    const icons = {
        'created': '🆕',
        'updated': '✅',
        'deleted': '🗑️'
    };

    const color = colors[type] || '#27ae60';
    const icon = icons[type] || '🛠️';

    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        border-left: 4px solid rgba(255, 255, 255, 0.3);
    `;

    notification.innerHTML = `${icon} ${message}`;

    // Add to page
    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 4 seconds (longer for updates)
    const displayTime = type === 'updated' ? 4000 : 3000;
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, displayTime);
}

// Show connection status notification
function showConnectionNotification(status) {
    const messages = {
        'connected': '🔌 Connected to real-time updates',
        'disconnected': '⚠️ Disconnected from real-time updates',
        'reconnected': '🔄 Reconnected to real-time updates'
    };

    const colors = {
        'connected': '#27ae60',
        'disconnected': '#e74c3c',
        'reconnected': '#f39c12'
    };

    const message = messages[status] || 'Connection status changed';
    const color = colors[status] || '#3498db';

    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 999;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 250px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        font-weight: 500;
    `;

    notification.innerHTML = message;

    // Add to page
    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 2 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
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
        console.log('🔄 Loading toolbox data for admin...');
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No authentication token found');
            return;
        }

        const apiUrl = window.appConfig.getApiUrl('/toolbox/admin/all');
        console.log('🔍 Making API call to:', apiUrl);
        console.log('🔑 Token available:', !!token);
        console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'No token');

        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 API Response status:', response.status);
        console.log('📡 API Response ok:', response.ok);

        if (response.ok) {
            allTools = await response.json();
            console.log('📋 Loaded toolbox data:', allTools);
            console.log('📊 Number of tools loaded:', allTools.length);

            filteredTools = [...allTools];
            updateStats();
            displayTools();
            populateUserFilter(); // Populate user filter after loading data

            console.log('✅ Toolbox data loaded and displayed successfully');
        } else if (response.status === 401) {
            console.error('❌ Authentication expired');
            window.location.href = './index.html';
        } else {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('❌ Error loading toolbox data:', error);
        showMessage('Error loading toolbox data. Please try again.', 'error');
    }
}

// Update statistics
function updateStats() {
    const totalTools = allTools.length;
    console.log('📊 Updating stats - Total tools:', totalTools);

    // Count by status
    const completedCount = allTools.filter(tool => tool.status === 'completed').length;
    const draftCount = allTools.filter(tool => tool.status === 'draft' || tool.status === 'submitted').length;

    console.log('📊 Stats breakdown:', {
        total: totalTools,
        draft: draftCount,
        completed: completedCount
    });

    const totalElement = document.getElementById('totalTools');
    const draftElement = document.getElementById('draftTools');
    const completedElement = document.getElementById('completedTools');

    if (totalElement) {
        totalElement.textContent = totalTools;
        console.log('✅ Updated total tools display:', totalTools);
    } else {
        console.error('❌ totalTools element not found');
    }

    if (draftElement) {
        draftElement.textContent = draftCount;
        console.log('✅ Updated draft tools display:', draftCount);
    } else {
        console.error('❌ draftTools element not found');
    }

    if (completedElement) {
        completedElement.textContent = completedCount;
        console.log('✅ Updated completed tools display:', completedCount);
    } else {
        console.error('❌ completedTools element not found');
    }
}

// Display tools in the table
function displayTools() {
    console.log('🔄 Displaying tools in table...');
    console.log('📊 Filtered tools count:', filteredTools.length);

    const tbody = document.getElementById('toolboxTableBody');
    if (!tbody) {
        console.error('❌ toolboxTableBody element not found');
        return;
    }

    tbody.innerHTML = '';

    if (filteredTools.length === 0) {
        console.log('📋 No tools to display, showing empty message');
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 40px; color: #666;">
                    No toolbox forms found.
                </td>
            </tr>
        `;
        return;
    }

    console.log('📋 Displaying', filteredTools.length, 'tools in table');

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTools = filteredTools.slice(startIndex, endIndex);

    pageTools.forEach(tool => {
        const row = document.createElement('tr');
        row.setAttribute('data-toolbox-id', tool.id); // Add data attribute for row identification

        // Handle both snake_case and camelCase field names
        const workActivity = tool.work_activity || tool.workActivity || 'N/A';
        const date = tool.date || 'N/A';
        const workLocation = tool.work_location || tool.workLocation || 'N/A';
        const nameCompany = tool.name_company || tool.nameCompany || 'N/A';
        const toolsUsed = tool.tools_used || tool.toolsUsed || 'N/A';
        const preparedBy = tool.prepared_by || tool.preparedBy || 'N/A';
        const verifiedBy = tool.verified_by || tool.verifiedBy || 'N/A';

        const status = tool.status || 'submitted';

        // Get user information
        const userName = tool.user_name || tool.userName || 'N/A';

        // Determine action buttons based on status
        let actionButtons;
        if (status === 'completed') {
            actionButtons = '<span class="completed-status">✅ Completed</span>';
        } else {
            actionButtons = `
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
            `;
        }

        row.innerHTML = `
            <td>${workActivity}</td>
            <td>${formatDate(date)}</td>
            <td>${workLocation}</td>
            <td>${nameCompany}</td>
            <td>${truncateText(toolsUsed, 30)}</td>
            <td>${preparedBy}</td>
            <td>${verifiedBy}</td>
            <td>${userName}</td>
            <td>
                <span class="toolbox-status-badge ${status === 'completed' ? 'toolbox-status-completed' : 'toolbox-status-submitted'}">
                    ${status === 'completed' ? '✅ Completed' : '📝 Submitted'}
                </span>
            </td>
            <td>${actionButtons}</td>
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

        if (userFilter && (tool.user_name || tool.userName) !== userFilter) {
            matches = false;
        }

        return matches;
    });

    currentPage = 1;
    displayTools();
}

// Populate user filter dropdown
function populateUserFilter() {
    const userFilter = document.getElementById('userFilter');
    if (!userFilter) return;

    // Get unique users from all tools
    const users = [...new Set(allTools.map(tool => tool.user_name || tool.userName).filter(Boolean))];

    // Clear existing options except the first one
    userFilter.innerHTML = '<option value="">All Users</option>';

    // Add user options
    users.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        userFilter.appendChild(option);
    });
}

// View tool details
function viewToolDetails(toolId) {
    const tool = allTools.find(t => t.id == toolId);
    if (!tool) {
        alert('Tool not found');
        return;
    }

    // Check if toolbox is completed
    const statusMessage = tool.status === 'completed'
        ? '\n\n✅ This toolbox form has been completed and finalized.'
        : '';

    // Create a simple modal or use alert for now
    const details = `
Work Activity: ${tool.work_activity || tool.workActivity || 'N/A'}
Date: ${tool.date || 'N/A'}
Work Location: ${tool.work_location || tool.workLocation || 'N/A'}
Company: ${tool.name_company || tool.nameCompany || 'N/A'}
Tools Used: ${tool.tools_used || tool.toolsUsed || 'N/A'}
Prepared By: ${tool.prepared_by || tool.preparedBy || 'N/A'}
Verified By: ${tool.verified_by || tool.verifiedBy || 'N/A'}
Status: ${tool.status === 'completed' ? '✅ Completed' : '📝 Submitted'}
${statusMessage}
    `;

    alert(details);
}

// Edit tool
function editTool(toolId) {
    const tool = allTools.find(t => t.id == toolId);
    if (!tool) {
        alert('Tool not found');
        return;
    }

    // Check if toolbox is already completed
    if (tool.status === 'completed') {
        alert('❌ This toolbox form is already completed and cannot be edited.');
        return;
    }

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

    // Check if toolbox is already completed
    if (tool.status === 'completed') {
        alert('❌ This toolbox form is already completed and cannot be deleted.');
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

// Close delete modal
function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) {
        modal.style.display = 'none';
    }
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

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './index.html';
}

// Modal functions
function closeToolDetailsModal() {
    const modal = document.getElementById('toolDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function editCurrentTool() {
    // Implementation for editing current tool
    console.log('Edit current tool functionality');
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function processCheckout() {
    // Implementation for processing checkout
    console.log('Process checkout functionality');
}

function confirmDeleteTool() {
    // Implementation for confirming tool deletion
    console.log('Confirm delete tool functionality');
}

