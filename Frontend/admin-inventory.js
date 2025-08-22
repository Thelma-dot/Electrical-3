// Admin Inventory Management JavaScript

let currentPage = 1;
let itemsPerPage = 10;
let allInventory = [];
let filteredInventory = [];
let editingItemId = null;

// Load inventory data
async function loadInventory() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/inventory', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            allInventory = await response.json();
            filteredInventory = [...allInventory];
            updateInventoryTable();
            updateInventoryStats();
        } else {
            console.error('Failed to load inventory');
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
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
function updateInventoryStats() {
    const stats = {
        total: allInventory.length,
        ups: allInventory.filter(item => item.productType === 'UPS').length,
        avr: allInventory.filter(item => item.productType === 'AVR').length,
        available: allInventory.filter(item => item.status === 'Available').length,
        inUse: allInventory.filter(item => item.status === 'In Use').length,
        maintenance: allInventory.filter(item => item.status === 'Maintenance').length
    };
    
    document.getElementById('totalItems').textContent = stats.total;
    document.getElementById('upsCount').textContent = stats.ups;
    document.getElementById('avrCount').textContent = stats.avr;
    document.getElementById('availableCount').textContent = stats.available;
    document.getElementById('inUseCount').textContent = stats.inUse;
    document.getElementById('maintenanceCount').textContent = stats.maintenance;
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

// Show add inventory modal
function showAddInventoryModal() {
    editingItemId = null;
    document.getElementById('modalTitle').textContent = 'Add New Inventory Item';
    document.getElementById('inventoryForm').reset();
    setCurrentDate();
    document.getElementById('inventoryModal').style.display = 'block';
}

// Show edit inventory modal
function editItem(itemId) {
    const item = allInventory.find(i => i._id === itemId);
    if (!item) return;
    
    editingItemId = itemId;
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

// Save inventory item
async function saveInventoryItem() {
    const formData = {
        productType: document.getElementById('productType').value,
        status: document.getElementById('status').value,
        size: document.getElementById('size').value,
        serialNumber: document.getElementById('serialNumber').value,
        dateAdded: document.getElementById('dateAdded').value,
        location: document.getElementById('location').value,
        issuedBy: document.getElementById('issuedBy').value,
        notes: document.getElementById('notes').value
    };
    
    try {
        const url = editingItemId 
            ? `http://localhost:5000/api/admin/inventory/${editingItemId}`
            : 'http://localhost:5000/api/admin/inventory';
        
        const method = editingItemId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            closeInventoryModal();
            loadInventory();
            showNotification(editingItemId ? 'Item updated successfully!' : 'Item added successfully!', 'success');
        } else {
            showNotification('Failed to save item', 'error');
        }
    } catch (error) {
        console.error('Error saving item:', error);
        showNotification('Error saving item', 'error');
    }
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
function closeInventoryModal() {
    document.getElementById('inventoryModal').style.display = 'none';
    editingItemId = null;
}

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

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateAdded').value = today;
}

// Export inventory
function exportInventory() {
    const csvContent = generateCSV(filteredInventory);
    downloadCSV(csvContent, 'inventory_export.csv');
}

function generateCSV(data) {
    const headers = ['Product Type', 'Status', 'Size', 'Serial Number', 'Date Added', 'Location', 'Issued By', 'Last Updated', 'Notes'];
    const rows = data.map(item => [
        item.productType || '',
        item.status || '',
        item.size || '',
        item.serialNumber || '',
        formatDate(item.dateAdded),
        item.location || '',
        item.issuedBy || '',
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

// Refresh inventory
function refreshInventory() {
    loadInventory();
    showNotification('Inventory refreshed!', 'success');
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
    loadInventory();
    setCurrentDate();
});
