// Frontend/inventory-fixed.js - Fixed inventory display and management

// Global variables
let currentInventoryId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadInventory();
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchInventory, 300));
    }

    // Search button
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', searchInventory);
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function searchInventory() {
    const query = document.getElementById('searchInput').value.trim();
    const page = 1; // Start from first page
  
    if (!query || query.length < 2) {
        loadInventory(); // Load all inventory if search is empty
        return;
    }
  
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/inventory/search?query=${query}&page=${page}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Search failed');
        
        const { data } = await response.json();
        showResults(data);
    } catch (err) {
        console.error('Search error:', err);
        showResults([]);
    }
}

function showResults(items) {
    const inventoryBody = document.getElementById('inventoryBody');
    if (!inventoryBody) return;
    
    inventoryBody.innerHTML = '';
    
    if (items.length === 0) {
        inventoryBody.innerHTML = '<tr><td colspan="8">No results found</td></tr>';
        return;
    }
    
    items.forEach(item => {
        const row = document.createElement('tr');
        row.setAttribute('data-inventory-id', item.id);
        row.innerHTML = `
            <td>${item.product_type}</td>
            <td>${item.status}</td>
            <td>${item.size}</td>
            <td>${item.serial_number}</td>
            <td>${item.date}</td>
            <td>${item.location}</td>
            <td>${item.issued_by}</td>
            <td>
                <button class="edit-button" onclick="editInventory('${item.id}', this)">Edit</button>
                <button class="delete-button" onclick="deleteInventory('${item.id}')">Delete</button>
            </td>
        `;
        inventoryBody.appendChild(row);
    });
}

// Add new inventory
async function addInventory() {
    const type = document.getElementById('type').value;
    const status = document.getElementById('status').value;
    const size = document.getElementById('size').value;
    const serial = document.getElementById('serial').value;
    const date = document.getElementById('date').value;
    const location = document.getElementById('location').value;
    const issued = document.getElementById('issued').value;

    if (!type || !status || !size || !serial || !date || !location || !issued) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productType: type,
                status,
                size,
                serialNumber: serial,
                date,
                location,
                issuedBy: issued
            })
        });
        
        if (!response.ok) throw new Error('Failed to add inventory');
        
        const newItem = await response.json();
        addInventoryToTable(newItem);
        hideAddModal();
        
        // Show success message
        alert('✅ Inventory item added successfully!');
        
        // Clear form
        clearInventoryForm();
        
    } catch (err) {
        console.error('Add inventory error:', err);
        alert('Failed to add inventory item');
    }
}

function addInventoryToTable(item) {
    const inventoryBody = document.getElementById('inventoryBody');
    if (!inventoryBody) return;
    
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-inventory-id', item.id);
    newRow.innerHTML = `
        <td>${item.product_type}</td>
        <td>${item.status}</td>
        <td>${item.size}</td>
        <td>${item.serial_number}</td>
        <td>${item.date}</td>
        <td>${item.location}</td>
        <td>${item.issued_by}</td>
        <td>
            <button class="edit-button" onclick="editInventory('${item.id}', this)">Edit</button>
            <button class="delete-button" onclick="deleteInventory('${item.id}')">Delete</button>
        </td>
    `;

    inventoryBody.prepend(newRow);
    document.getElementById('inventoryTable').classList.remove('hidden');
}

function clearInventoryForm() {
    document.getElementById('type').value = 'UPS';
    document.getElementById('status').value = 'New';
    document.getElementById('size').value = '1.5kva';
    document.getElementById('serial').value = '';
    document.getElementById('date').value = '';
    document.getElementById('location').value = '';
    document.getElementById('issued').value = '';
}

// Modal functions
function showAddModal() {
    const modal = document.getElementById('addModal');
    if (modal) {
        modal.style.display = 'block';
        setCurrentDate();
    }
}

function hideAddModal() {
    const modal = document.getElementById('addModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = today;
    }
}

// Load all inventory
async function loadInventory() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/inventory', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const inventory = await response.json();
            displayInventory(inventory);
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

function displayInventory(inventory) {
    const inventoryBody = document.getElementById('inventoryBody');
    if (!inventoryBody) return;
    
    inventoryBody.innerHTML = '';
    
    if (inventory.length === 0) {
        inventoryBody.innerHTML = '<tr><td colspan="8">No inventory items found</td></tr>';
        return;
    }
    
    inventory.forEach(item => {
        const row = document.createElement('tr');
        row.setAttribute('data-inventory-id', item.id);
        row.innerHTML = `
            <td>${item.product_type}</td>
            <td>${item.status}</td>
            <td>${item.size}</td>
            <td>${item.serial_number}</td>
            <td>${item.date}</td>
            <td>${item.location}</td>
            <td>${item.issued_by}</td>
            <td>
                <button class="edit-button" onclick="editInventory('${item.id}', this)">Edit</button>
                <button class="delete-button" onclick="deleteInventory('${item.id}')">Delete</button>
            </td>
        `;
        inventoryBody.appendChild(row);
    });
    
    document.getElementById('inventoryTable').classList.remove('hidden');
}

// Edit inventory
async function editInventory(inventoryId, button) {
    currentInventoryId = inventoryId;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/inventory/${inventoryId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const item = await response.json();
            populateEditForm(item);
            showUpdateForm();
        }
    } catch (error) {
        console.error('Error loading inventory item:', error);
        alert('Failed to load inventory item for editing');
    }
}

function populateEditForm(item) {
    document.getElementById('updateForm').querySelector('#type').value = item.product_type;
    document.getElementById('updateForm').querySelector('#status').value = item.status;
    document.getElementById('updateForm').querySelector('#size').value = item.size;
    document.getElementById('updateForm').querySelector('#serial').value = item.serial_number;
    document.getElementById('updateForm').querySelector('#date').value = item.date;
    document.getElementById('updateForm').querySelector('#location').value = item.location;
    document.getElementById('updateForm').querySelector('#issued').value = item.issued_by;
}

function showUpdateForm() {
    document.getElementById('updateForm').classList.remove('hidden');
}

function hideUpdateForm() {
    document.getElementById('updateForm').classList.add('hidden');
    currentInventoryId = null;
}

// Update inventory
async function updateInventory() {
    if (!currentInventoryId) return;
    
    const type = document.getElementById('updateForm').querySelector('#type').value;
    const status = document.getElementById('updateForm').querySelector('#status').value;
    const size = document.getElementById('updateForm').querySelector('#size').value;
    const serial = document.getElementById('updateForm').querySelector('#serial').value;
    const date = document.getElementById('updateForm').querySelector('#date').value;
    const location = document.getElementById('updateForm').querySelector('#location').value;
    const issued = document.getElementById('updateForm').querySelector('#issued').value;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/inventory/${currentInventoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productType: type,
                status,
                size,
                serialNumber: serial,
                date,
                location,
                issuedBy: issued
            })
        });

        if (response.ok) {
            alert('✅ Inventory item updated successfully!');
            hideUpdateForm();
            loadInventory(); // Reload the table
        } else {
            throw new Error('Failed to update inventory');
        }
    } catch (error) {
        console.error('Error updating inventory:', error);
        alert('Failed to update inventory item');
    }
}

// Delete inventory
async function deleteInventory(inventoryId) {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/inventory/${inventoryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('✅ Inventory item deleted successfully!');
            loadInventory(); // Reload the table
        } else {
            throw new Error('Failed to delete inventory');
        }
    } catch (error) {
        console.error('Error deleting inventory:', error);
        alert('Failed to delete inventory item');
    }
}

// Export to Excel
function exportToExcel() {
    // Implementation for Excel export
    alert('Export functionality will be implemented here');
}

// Auto-refresh inventory every 30 seconds (optional)
let refreshInterval;
function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            loadInventory();
        }
    }, 30000);
}

function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}

// Handle page visibility for auto-refresh
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        stopAutoRefresh();
    } else {
        startAutoRefresh();
    }
});

// Start auto-refresh when page loads
startAutoRefresh();
