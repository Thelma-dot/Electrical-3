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
        socket = io(window.appConfig.getSocketUrl());

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

    // Show notification
    showNotification(`Inventory item ${type} successfully!`, 'success');

    // Flash the stats to show update
    flashStats();

    // Reload inventory data immediately
    loadInventory();

    // Also update stats specifically
    updateInventoryStats();
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
        const token = localStorage.getItem('token');
        console.log('🔑 Token exists:', !!token);

        const response = await fetch(window.appConfig.getApiUrl('/admin/inventory'), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
            allInventory = await response.json();
            console.log('📦 Loaded inventory items:', allInventory.length);
            console.log('🔍 Sample inventory item:', allInventory[0]);
            console.log('🔍 All inventory IDs:', allInventory.map(item => ({ id: item.id, type: typeof item.id, productType: item.productType })));
            filteredInventory = [...allInventory];
            updateInventoryTable();

            // Update stats immediately after loading inventory
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
            <td>${item.staffId || 'N/A'}</td>
            <td>${formatDate(item.lastUpdated)}</td>
                         <td class="action-buttons">
                 <button class="btn btn-sm primary" onclick="viewItemDetails('${item.id}')">
                     <i class="fas fa-eye"></i>
                 </button>
                 <button class="btn btn-sm secondary" onclick="editItem('${item.id}')">
                     <i class="fas fa-edit"></i>
                 </button>
                 <button class="btn btn-sm danger" onclick="deleteItem('${item.id}', '${item.productType} - ${item.serialNumber}')">
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

        const response = await fetch(window.appConfig.getApiUrl('/admin/inventory/stats'), {
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
            // Fallback: calculate stats from loaded inventory data
            calculateAndDisplayLocalStats();
        }
    } catch (error) {
        console.error('❌ Error updating inventory stats:', error);
        // Fallback: calculate stats from loaded inventory data
        calculateAndDisplayLocalStats();
    }
}

// Calculate stats locally from loaded inventory data
function calculateAndDisplayLocalStats() {
    if (!allInventory || allInventory.length === 0) {
        console.log('⚠️ No inventory data available for local stats calculation');
        return;
    }

    console.log('🔄 Calculating local inventory stats...');

    const stats = {
        totalInventory: allInventory.length,
        upsCount: allInventory.filter(item => item.productType === 'UPS').length,
        avrCount: allInventory.filter(item => item.productType === 'AVR').length,
        newCount: allInventory.filter(item => item.status === 'New').length,
        replacedCount: allInventory.filter(item => item.status === 'Replaced').length
    };

    console.log('📊 Local stats calculated:', stats);
    displayInventoryStats(stats);
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
    console.log('🔧 Edit item called with ID:', itemId);
    console.log('🔍 Current allInventory array:', allInventory);
    console.log('🔍 Looking for item with ID:', itemId);
    console.log('🔍 Available IDs:', allInventory.map(i => ({ id: i.id, _id: i._id, productType: i.productType })));

    // Try multiple ID fields
    let item = allInventory.find(i => i.id === itemId);
    if (!item) {
        item = allInventory.find(i => i._id === itemId);
    }
    if (!item) {
        item = allInventory.find(i => String(i.id) === String(itemId));
    }
    if (!item) {
        item = allInventory.find(i => String(i._id) === String(itemId));
    }

    if (!item) {
        console.error('❌ Item not found with ID:', itemId);
        console.error('❌ Available items:', allInventory);
        showNotification('Item not found. Please refresh the page.', 'error');
        return;
    }

    console.log('📦 Found item for editing:', item);
    editingInventoryId = itemId;

    const modalTitle = document.getElementById('editModalTitle');
    if (modalTitle) {
        modalTitle.textContent = `Edit Inventory Item - ${item.productType} ${item.serialNumber}`;
    }

    // Populate form fields
    const formFields = {
        'editProductType': item.productType || '',
        'editStatus': item.status || '',
        'editSize': item.size || '',
        'editSerialNumber': item.serialNumber || '',
        'editDateAdded': item.dateAdded ? item.dateAdded.split('T')[0] : '',
        'editLocation': item.location || '',
        'editIssuedBy': item.issuedBy || '',
        'editNotes': item.notes || ''
    };

    // Set each form field value
    Object.entries(formFields).forEach(([fieldId, value]) => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = value;
            console.log(`✅ Set ${fieldId} to:`, value);
        } else {
            console.error(`❌ Form field not found: ${fieldId}`);
        }
    });

    const modal = document.getElementById('editInventoryModal');
    if (modal) {
        modal.style.display = 'block';
        console.log('✅ Edit modal displayed');
    } else {
        console.error('❌ Edit modal not found');
    }
}

// View item details
async function viewItemDetails(itemId) {
    console.log('👁️ View item details called with ID:', itemId);
    console.log('🔍 Current allInventory array:', allInventory);
    console.log('🔍 Looking for item with ID:', itemId);
    console.log('🔍 Available IDs:', allInventory.map(i => ({ id: i.id, _id: i._id, productType: i.productType })));

    // Try multiple ID fields (same logic as editItem)
    let item = allInventory.find(i => i.id === itemId);
    if (!item) {
        item = allInventory.find(i => i._id === itemId);
    }
    if (!item) {
        item = allInventory.find(i => String(i.id) === String(itemId));
    }
    if (!item) {
        item = allInventory.find(i => String(i._id) === String(itemId));
    }

    if (!item) {
        console.error('❌ Item not found with ID:', itemId);
        console.error('❌ Available items:', allInventory);
        showNotification('Item not found. Please refresh the page.', 'error');
        return;
    }

    console.log('📦 Found item for viewing:', item);

    // Set current item ID for edit functionality
    window.currentItemId = itemId;

    const content = document.getElementById('itemDetailsContent');
    if (content) {
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
                    <strong>Staff ID:</strong> ${item.staffId || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Last Updated:</strong> ${formatDate(item.lastUpdated)}
                </div>
                <div class="detail-row">
                    <strong>Notes:</strong> ${item.notes || 'No notes'}
                </div>
            </div>
        `;
        console.log('✅ Item details content populated');
    } else {
        console.error('❌ Item details content element not found');
    }

    const modal = document.getElementById('itemDetailsModal');
    if (modal) {
        modal.style.display = 'block';
        console.log('✅ View modal displayed');
    } else {
        console.error('❌ View modal not found');
    }
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
        const response = await fetch(`${window.appConfig.getApiUrl()}/admin/inventory/${window.deleteItemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
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

function closeEditModal() {
    document.getElementById('editInventoryModal').style.display = 'none';
    editingInventoryId = null;
}

// Print item details
function printItemDetails() {
    const printWindow = window.open('', '_blank');
    const item = allInventory.find(i => i.id === window.currentItemId) ||
        allInventory.find(i => i._id === window.currentItemId) ||
        allInventory.find(i => String(i.id) === String(window.currentItemId)) ||
        allInventory.find(i => String(i._id) === String(window.currentItemId));

    if (!item) {
        showNotification('Item not found for printing', 'error');
        return;
    }

    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inventory Item - ${item.productType} ${item.serialNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .detail-row { margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
                .label { font-weight: bold; color: #333; }
                .value { margin-left: 10px; }
                .status-badge { 
                    background: #3498db; 
                    color: white; 
                    padding: 2px 8px; 
                    border-radius: 12px; 
                    font-size: 12px; 
                }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Inventory Item Details</h1>
                <h2>${item.productType} - ${item.serialNumber}</h2>
                <p>Printed on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            
            <div class="detail-row">
                <span class="label">Product Type:</span>
                <span class="value">${item.productType || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value"><span class="status-badge">${item.status || 'N/A'}</span></span>
            </div>
            <div class="detail-row">
                <span class="label">Size:</span>
                <span class="value">${item.size || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Serial Number:</span>
                <span class="value">${item.serialNumber || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Date Added:</span>
                <span class="value">${formatDate(item.dateAdded)}</span>
            </div>
            <div class="detail-row">
                <span class="label">Location:</span>
                <span class="value">${item.location || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Issued By:</span>
                <span class="value">${item.issuedBy || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Staff ID:</span>
                <span class="value">${item.staffId || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Last Updated:</span>
                <span class="value">${formatDate(item.lastUpdated)}</span>
            </div>
            <div class="detail-row">
                <span class="label">Notes:</span>
                <span class="value">${item.notes || 'No notes'}</span>
            </div>
        </body>
        </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function () {
        printWindow.print();
        printWindow.close();
    };
}

// Edit current item from details modal
function editCurrentItem() {
    closeItemDetailsModal();
    if (window.currentItemId) {
        editItem(window.currentItemId);
    }
}

// Save inventory changes
async function saveInventoryChanges() {
    if (!editingInventoryId) {
        showNotification('No item selected for editing', 'error');
        return;
    }

    try {
        const formData = {
            productType: document.getElementById('editProductType').value,
            status: document.getElementById('editStatus').value,
            size: document.getElementById('editSize').value,
            serialNumber: document.getElementById('editSerialNumber').value,
            date: document.getElementById('editDateAdded').value,
            location: document.getElementById('editLocation').value,
            issuedBy: document.getElementById('editIssuedBy').value,
            notes: document.getElementById('editNotes').value
        };

        console.log('🔄 Saving inventory changes:', formData);
        console.log('🔑 Editing inventory ID:', editingInventoryId);
        console.log('🔑 Token exists:', !!localStorage.getItem('token'));

        const response = await fetch(`${window.appConfig.getApiUrl()}/admin/inventory/${editingInventoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Update successful:', result);
            showNotification('Inventory item updated successfully!', 'success');
            closeEditModal();
            loadInventory(); // Refresh the inventory data
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            console.error('❌ Update failed:', errorData);
            showNotification(`Failed to update: ${errorData.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        console.error('❌ Error saving inventory changes:', error);
        showNotification(`Error saving changes: ${error.message}`, 'error');
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
    const headers = ['Product Type', 'Status', 'Size', 'Serial Number', 'Date Added', 'Location', 'Issued By', 'Staff ID', 'Last Updated', 'Notes'];
    const rows = data.map(item => [
        item.productType || '',
        item.status || '',
        item.size || '',
        item.serialNumber || '',
        formatDate(item.dateAdded),
        item.location || '',
        item.issuedBy || '',
        item.staffId || '',
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
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-family: Arial, sans-serif;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Show notification with animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}



// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize real-time functionality
    initializeEventListeners();
    setActiveNavLink();

    // Load initial inventory data
    loadInventory();
});
