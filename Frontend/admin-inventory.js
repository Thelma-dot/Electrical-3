// Admin Inventory Management JavaScript

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

let currentPage = 1;
let itemsPerPage = 10;
let allInventory = [];
let filteredInventory = [];
let editingInventoryId = null;
let socket = null; // Socket.IO connection

// Initialize Socket.IO connection for real-time updates
function initializeSocketConnection() {
    try {
        socket = io('http://localhost:5000');

        socket.on('connect', () => {
            console.log('🔌 Admin inventory connected to server for real-time updates');
            // Notify server that admin inventory page is connected
            socket.emit('admin:connected', { type: 'inventory', timestamp: new Date().toISOString() });
        });

        socket.on('disconnect', () => {
            console.log('🔌 Admin inventory disconnected from server');
        });

        // Listen for inventory updates
        socket.on('admin:inventory:created', (data) => {
            console.log('📦 Admin inventory: Item created:', data);
            handleInventoryUpdate('created', data);
        });

        socket.on('admin:inventory:updated', (data) => {
            console.log('📦 Admin inventory: Item updated:', data);
            handleInventoryUpdate('updated', data);
        });

        socket.on('admin:inventory:deleted', (data) => {
            console.log('📦 Admin inventory: Item deleted:', data);
            handleInventoryUpdate('deleted', data);
        });

    } catch (error) {
        console.error('❌ Error initializing Socket.IO in admin inventory:', error);
    }
}

// Real-time inventory update handler
function handleInventoryUpdate(type, data) {
    console.log(`📦 Handling inventory ${type} update:`, data);

    // Flash the stats to show update
    flashStats();

    // Reload inventory data
    setTimeout(() => {
        loadInventory();
    }, 500);
}

// Real-time event listeners
function initializeEventListeners() {
    // Initialize Socket.IO connection
    initializeSocketConnection();

    // Other event listeners can be added here
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

function flashInventoryTable() {
    const table = document.getElementById('inventoryTable');
    if (table) {
        table.style.animation = 'flash 0.6s ease';
        setTimeout(() => {
            table.style.animation = '';
        }, 600);
    }
}

// Load inventory data
async function loadInventory() {
    console.log('🔄 Loading inventory data...');

    // Show loading indicator
    const tableBody = document.getElementById('inventoryTableBody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;"><div style="color: #3498db;">🔄 Loading inventory...</div></td></tr>';
    }

    try {
        const adminToken = localStorage.getItem('adminToken');
        console.log('🔑 Admin token exists:', !!adminToken);

        const response = await fetch('http://localhost:5000/api/admin/inventory', {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
            allInventory = await response.json();
            console.log('📦 Loaded inventory items:', allInventory.length);
            filteredInventory = [...allInventory];
            updateInventoryTable();
            updateInventoryStats();

            // Update last refresh timestamp
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            console.log(`✅ Inventory refreshed at ${timeString}`);
        } else {
            const errorText = await response.text();
            console.error('❌ Failed to load inventory:', response.status, errorText);

            // Show error in table
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;"><div style="color: #e74c3c;">❌ Failed to load inventory</div></td></tr>';
            }
        }
    } catch (error) {
        console.error('❌ Error loading inventory:', error);

        // Show error in table
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 20px;"><div style="color: #e74c3c;">❌ Error loading inventory</div></td></tr>';
        }
    }
}

// Update inventory table
function updateInventoryTable() {
    const tbody = document.getElementById('inventoryTableBody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filteredInventory.slice(startIndex, endIndex);

    tbody.innerHTML = '';

    pageItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.productType || 'N/A'}</td>
            <td><span class="status-badge ${getStatusClass(item.status)}">${item.status || 'N/A'}</span></td>
            <td>${item.size || 'N/A'}</td>
            <td>${item.serialNumber || 'N/A'}</td>
            <td>${formatDate(item.dateAdded)}</td>
            <td>${item.location || 'N/A'}</td>
            <td>${item.issuedBy || 'N/A'}</td>
            <td>${item.staffName || item.staffId || 'N/A'}</td>
            <td>${formatDate(item.lastUpdated)}</td>
            <td>
                <button class="btn btn-sm primary" onclick="viewItemDetails('${item._id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm secondary" onclick="editItem('${item._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm danger" onclick="deleteItem('${item._id}', '${item.productType} - ${item.serialNumber}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePagination();
}

// Update inventory statistics
async function updateInventoryStats() {
    try {
        console.log('🔄 Updating inventory statistics...');

        const response = await fetch('http://localhost:5000/api/admin/inventory/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            console.log('📊 Received inventory stats:', stats);
            displayInventoryStats(stats);
        } else {
            console.error('❌ Failed to fetch updated inventory stats:', response.status);
        }
    } catch (error) {
        console.error('❌ Error updating inventory stats:', error);
    }
}

// Display inventory statistics
function displayInventoryStats(stats) {
    console.log('📊 Displaying inventory stats:', stats);

    // Update total inventory count
    const totalElement = document.getElementById('totalItems');
    if (totalElement) {
        totalElement.textContent = stats.totalInventory || 0;
        console.log(`📦 Updated total items: ${stats.totalInventory}`);
    }

    // Update UPS count
    const upsElement = document.getElementById('upsCount');
    if (upsElement) {
        upsElement.textContent = stats.upsCount || 0;
        console.log(`🔋 Updated UPS count: ${stats.upsCount}`);
    }

    // Update AVR count
    const avrElement = document.getElementById('avrCount');
    if (avrElement) {
        avrElement.textContent = stats.avrCount || 0;
        console.log(`⚡ Updated AVR count: ${stats.avrCount}`);
    }

    // Update available count (new items)
    const availableElement = document.getElementById('availableCount');
    if (availableElement) {
        availableElement.textContent = stats.newCount || 0;
        console.log(`🆕 Updated available count: ${stats.newCount}`);
    }

    // Update in use count (replaced items)
    const inUseElement = document.getElementById('inUseCount');
    if (inUseElement) {
        inUseElement.textContent = stats.replacedCount || 0;
        console.log(`🔧 Updated in use count: ${stats.replacedCount}`);
    }

    // Update maintenance count (if available)
    const maintenanceElement = document.getElementById('maintenanceCount');
    if (maintenanceElement) {
        // Calculate maintenance count as total - (new + replaced)
        const maintenanceCount = (stats.totalInventory || 0) - ((stats.newCount || 0) + (stats.replacedCount || 0));
        maintenanceElement.textContent = Math.max(0, maintenanceCount);
        console.log(`🔨 Updated maintenance count: ${maintenanceCount}`);
    }

    // Flash the stats to indicate update
    flashStats();

    console.log('✅ Inventory statistics updated successfully');
}

// Search inventory
function searchInventory() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredInventory = allInventory.filter(item =>
        (item.productType && item.productType.toLowerCase().includes(searchTerm)) ||
        (item.serialNumber && item.serialNumber.toLowerCase().includes(searchTerm)) ||
        (item.location && item.location.toLowerCase().includes(searchTerm))
    );
    currentPage = 1;
    updateInventoryTable();
}

// Filter inventory
function filterInventory() {
    const typeFilter = document.getElementById('typeFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const sizeFilter = document.getElementById('sizeFilter').value;

    filteredInventory = allInventory.filter(item => {
        const typeMatch = !typeFilter || item.productType === typeFilter;
        const statusMatch = !statusFilter || item.status === statusFilter;
        const sizeMatch = !sizeFilter || item.size === sizeFilter;

        return typeMatch && statusMatch && sizeMatch;
    });

    currentPage = 1;
    updateInventoryTable();
}

// Show edit inventory modal
function editItem(itemId) {
    const item = allInventory.find(i => i._id === itemId);
    if (!item) return;

    editingInventoryId = itemId;
    document.getElementById('modalTitle').textContent = 'Edit Inventory Item';

    // Populate form fields
    document.getElementById('productType').value = item.productType || '';
    document.getElementById('status').value = item.status || '';
    document.getElementById('size').value = item.size || '';
    document.getElementById('serialNumber').value = item.serialNumber || '';
    document.getElementById('dateAdded').value = item.dateAdded ? item.dateAdded.split('T')[0] : '';
    document.getElementById('location').value = item.location || '';
    document.getElementById('issuedBy').value = item.issuedBy || '';
    document.getElementById('notes').value = item.notes || '';

    document.getElementById('inventoryModal').style.display = 'block';
}

// View item details
async function viewItemDetails(itemId) {
    const item = allInventory.find(i => i._id === itemId);
    if (!item) return;

    const content = document.getElementById('itemDetailsContent');
    content.innerHTML = `
        <div class="item-details">
            <div class="detail-row">
                <strong>Product Type:</strong> ${item.productType || 'N/A'}
            </div>
            <div class="detail-row">
                <strong>Status:</strong> <span class="status-badge ${getStatusClass(item.status)}">${item.status || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <strong>Size:</strong> ${item.size || 'N/A'}
            </div>
            <div class="detail-row">
                <strong>Serial Number:</strong> ${item.serialNumber || 'N/A'}
            </div>
            <div class="detail-row">
                <strong>Date Added:</strong> ${formatDate(item.dateAdded)}
            </div>
            <div class="detail-row">
                <strong>Location:</strong> ${item.location || 'N/A'}
            </div>
            <div class="detail-row">
                <strong>Issued By:</strong> ${item.issuedBy || 'N/A'}
            </div>
            <div class="detail-row">
                <strong>User:</strong> ${item.staffName || item.staffId || 'N/A'}
            </div>
            <div class="detail-row">
                <strong>Last Updated:</strong> ${formatDate(item.lastUpdated)}
            </div>
            <div class="detail-row">
                <strong>Notes:</strong> ${item.notes || 'No notes'}
            </div>
        </div>
    `;

    document.getElementById('itemDetailsModal').style.display = 'block';
}

// Delete item
function deleteItem(itemId, itemInfo) {
    document.getElementById('deleteItemInfo').textContent = itemInfo;
    document.getElementById('deleteModal').style.display = 'block';
    window.deleteItemId = itemId;
}

// Confirm delete item
async function confirmDeleteItem() {
    if (!window.deleteItemId) return;

    try {
        const response = await fetch(`http://localhost:5000/api/admin/inventory/${window.deleteItemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            closeDeleteModal();
            loadInventory();
            showNotification('Item deleted successfully!', 'success');
        } else {
            showNotification('Failed to delete item', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('Error deleting item', 'error');
    }
}

// Close modals
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    window.deleteItemId = null;
}

function closeItemDetailsModal() {
    document.getElementById('itemDetailsModal').style.display = 'none';
}

// Edit current item from details modal
function editCurrentItem() {
    closeItemDetailsModal();
    if (window.currentItemId) {
        editItem(window.currentItemId);
    }
}

// Pagination functions
function changePage(direction) {
    const maxPage = Math.ceil(filteredInventory.length / itemsPerPage);

    if (direction === -1 && currentPage > 1) {
        currentPage--;
    } else if (direction === 1 && currentPage < maxPage) {
        currentPage++;
    }

    updateInventoryTable();
}

function updatePagination() {
    const maxPage = Math.ceil(filteredInventory.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    pageInfo.textContent = `Page ${currentPage} of ${maxPage}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === maxPage;
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

function getStatusClass(status) {
    const statusClasses = {
        'New': 'status-new',
        'Replaced': 'status-replaced',
        'In Use': 'status-inuse',
        'Maintenance': 'status-maintenance'
    };
    return statusClasses[status] || 'status-default';
}

// Export inventory
function exportInventory() {
    const csvContent = generateCSV(filteredInventory);
    downloadCSV(csvContent, 'inventory_export.csv');
}

function generateCSV(data) {
    const headers = ['Product Type', 'Status', 'Size', 'Serial Number', 'Date Added', 'Location', 'Issued By', 'User', 'Last Updated', 'Notes'];
    const rows = data.map(item => [
        item.productType || '',
        item.status || '',
        item.size || '',
        item.serialNumber || '',
        formatDate(item.dateAdded),
        item.location || '',
        item.issuedBy || '',
        item.staffName || item.staffId || '',
        formatDate(item.lastUpdated),
        item.notes || ''
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

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize real-time functionality
    initializeEventListeners();
    setActiveNavLink();
});
