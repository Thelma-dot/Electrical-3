// Frontend/inventory-fixed.js - Fixed inventory display and management

// Global variables
let currentInventoryId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    showLoading(); // Show loading state first

    // Clean up old update records
    cleanupOldUpdateRecords();

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
        showLoading(); // Show loading state
        loadInventory(); // Load all inventory if search is empty
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showError('Please log in to search inventory');
            return;
        }

        const response = await fetch(`http://localhost:5000/api/inventory/search?query=${encodeURIComponent(query)}&page=${page}&limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showError('Authentication failed. Please log in again.');
                window.location.href = './index.html';
                return;
            } else if (response.status === 400) {
                const errorData = await response.json().catch(() => ({}));
                showError(errorData.error || 'Invalid search request');
                return;
            }
            throw new Error(`Search failed: ${response.status}`);
        }

        const result = await response.json();

        // Handle new pagination structure
        if (result.data && Array.isArray(result.data)) {
            showResults(result.data);
        } else if (Array.isArray(result)) {
            // Fallback for old format
            showResults(result);
        } else {
            throw new Error('Invalid response format from server');
        }
    } catch (err) {
        console.error('Search error:', err);
        if (err.message.includes('Invalid response format')) {
            showError('Server returned invalid data format. Please try again.');
        } else {
            showError('Search failed. Please try again.');
        }
    }
}

function showResults(items) {
    const inventoryBody = document.getElementById('inventoryBody');
    if (!inventoryBody) return;

    inventoryBody.innerHTML = '';

    if (!items || items.length === 0) {
        inventoryBody.innerHTML = '<tr><td colspan="8" class="loading">No results found. Try a different search term.</td></tr>';
        return;
    }

    items.forEach(item => {
        const row = document.createElement('tr');
        row.setAttribute('data-inventory-id', item.id);
        row.innerHTML = `
            <td class="editable-cell" data-field="product_type" data-value="${item.product_type || ''}">${item.product_type || 'N/A'}</td>
            <td class="editable-cell" data-field="status" data-value="${item.status || ''}">${item.status || 'N/A'}</td>
            <td class="editable-cell" data-field="size" data-value="${item.size || ''}">${item.size || 'N/A'}</td>
            <td class="editable-cell" data-field="serial_number" data-value="${item.serial_number || ''}">${item.serial_number || 'N/A'}</td>
            <td class="editable-cell" data-field="date" data-value="${item.date || ''}">${item.date || 'N/A'}</td>
            <td class="editable-cell" data-field="location" data-value="${item.location || ''}">${item.location || 'N/A'}</td>
            <td class="editable-cell" data-field="issued_by" data-value="${item.issued_by || ''}">${item.issued_by || 'N/A'}</td>
            <td>
                <button class="edit-button" onclick="toggleEditMode('${item.id}', this)">Edit</button>
                <button class="delete-button" onclick="deleteInventory('${item.id}')">Delete</button>
                <button class="cancel-button" onclick="cancelEdit('${item.id}', this)" style="display: none;">Cancel</button>
            </td>
        `;
        inventoryBody.appendChild(row);
    });

    document.getElementById('inventoryTable').classList.remove('hidden');
}

// Form validation
function validateInventoryForm() {
    const type = document.getElementById('type').value;
    const status = document.getElementById('status').value;
    const size = document.getElementById('size').value;
    const serial = document.getElementById('serial').value;
    const date = document.getElementById('date').value;
    const location = document.getElementById('location').value;
    const issued = document.getElementById('issued').value;

    const errors = [];

    // Validate required fields
    if (!type || type.trim() === '') errors.push('Product Type is required');
    if (!status || status.trim() === '') errors.push('Status is required');
    if (!size || size.trim() === '') errors.push('Size is required');
    if (!serial || serial.trim() === '') errors.push('Serial Number is required');
    if (!date || date.trim() === '') errors.push('Date is required');
    if (!location || location.trim() === '') errors.push('Location is required');
    if (!issued || issued.trim() === '') errors.push('Issued By is required');

    // Validate field lengths
    if (serial && serial.trim().length > 100) errors.push('Serial Number is too long (max 100 characters)');
    if (location && location.trim().length > 200) errors.push('Location is too long (max 200 characters)');
    if (issued && issued.trim().length > 100) errors.push('Issued By is too long (max 100 characters)');

    // Validate date format
    if (date) {
        const selectedDate = new Date(date);
        const today = new Date();
        if (isNaN(selectedDate.getTime())) {
            errors.push('Invalid date format');
        } else if (selectedDate > today) {
            errors.push('Date cannot be in the future');
        }
    }

    // Validate serial number format (basic validation)
    if (serial && !/^[A-Za-z0-9\-_]+$/.test(serial.trim())) {
        errors.push('Serial Number contains invalid characters (only letters, numbers, hyphens, and underscores allowed)');
    }

    if (errors.length > 0) {
        alert('Please fix the following errors:\n' + errors.join('\n'));
        return false;
    }

    return true;
}

// Add new inventory
async function addInventory() {
    if (!validateInventoryForm()) {
        return;
    }

    // Show loading state
    const addButton = document.getElementById('addInventoryBtn');
    const originalText = addButton.textContent;
    addButton.innerHTML = '<span class="loading-spinner"></span>Adding...';
    addButton.disabled = true;

    try {
        const type = document.getElementById('type').value;
        const status = document.getElementById('status').value;
        const size = document.getElementById('size').value;
        const serial = document.getElementById('serial').value;
        const date = document.getElementById('date').value;
        const location = document.getElementById('location').value;
        const issued = document.getElementById('issued').value;

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to add inventory');
            window.location.href = './index.html';
            return;
        }

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

        if (!response.ok) {
            if (response.status === 401) {
                alert('Authentication failed. Please log in again.');
                window.location.href = './index.html';
                return;
            }
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to add inventory: ${response.status}`);
        }

        const newItem = await response.json();
        console.log('📦 New inventory item received:', newItem);

        // Check if we have the required data
        if (newItem && newItem.id && newItem.product_type) {
            addInventoryToTable(newItem);
            hideAddModal();

            // Show success message
            showSuccessNotification('✅ Inventory item added successfully!');

            // Clear form
            clearInventoryForm();

            // Real-time updates removed - no fallback needed

        } else {
            console.error('❌ Invalid inventory data received:', newItem);
            console.log('🔄 Reloading inventory to ensure data consistency...');

            // Fallback: reload inventory to show the new item
            loadInventory();
            hideAddModal();

            // Show success message
            showSuccessNotification('✅ Inventory item added successfully!');

            // Clear form
            clearInventoryForm();
        }

    } catch (err) {
        console.error('Add inventory error:', err);
        alert(`Failed to add inventory item: ${err.message}`);
    } finally {
        // Restore button state
        addButton.innerHTML = originalText;
        addButton.disabled = false;
    }
}

function addInventoryToTable(item) {
    console.log('🔧 Adding inventory item to table:', item);

    const inventoryBody = document.getElementById('inventoryBody');
    if (!inventoryBody) {
        console.error('❌ Inventory body not found');
        return;
    }

    // Check if all required fields exist
    const requiredFields = ['id', 'product_type', 'status', 'size', 'serial_number', 'date', 'location', 'issued_by'];
    const missingFields = requiredFields.filter(field => !item[field]);

    if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        console.error('❌ Item data:', item);
        return;
    }

    const newRow = document.createElement('tr');
    newRow.setAttribute('data-inventory-id', item.id);
    newRow.className = 'new-inventory-row'; // Add class for highlighting
    newRow.innerHTML = `
        <td class="editable-cell" data-field="product_type" data-value="${item.product_type}">${item.product_type}</td>
        <td class="editable-cell" data-field="status" data-value="${item.status}">${item.status}</td>
        <td class="editable-cell" data-field="size" data-value="${item.size}">${item.size}</td>
        <td class="editable-cell" data-field="serial_number" data-value="${item.serial_number}">${item.serial_number}</td>
        <td class="editable-cell" data-field="date" data-value="${item.date}">${item.date}</td>
        <td class="editable-cell" data-field="location" data-value="${item.location}">${item.location}</td>
        <td class="editable-cell" data-field="issued_by" data-value="${item.issued_by}">${item.issued_by}</td>
        <td>
            <button class="edit-button" onclick="toggleEditMode('${item.id}', this)">Edit</button>
            <button class="delete-button" onclick="deleteInventory('${item.id}')">Delete</button>
            <button class="cancel-button" onclick="cancelEdit('${item.id}', this)" style="display: none;">Cancel</button>
        </td>
    `;

    inventoryBody.prepend(newRow);
    document.getElementById('inventoryTable').classList.remove('hidden');

    // Flash the table to indicate update
    const table = document.getElementById('inventoryTable');
    table.classList.add('inventory-table-updated');
    setTimeout(() => {
        table.classList.remove('inventory-table-updated');
    }, 600);

    // Remove highlight class after animation
    setTimeout(() => {
        newRow.classList.remove('new-inventory-row');
    }, 2000);

    console.log('✅ Inventory item added to table successfully');
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

// Retry mechanism for network operations
async function retryOperation(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);

            if (attempt === maxRetries) {
                throw error;
            }

            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Enhanced loadInventory with retry
async function loadInventory() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            showError('Please log in to view inventory');
            return;
        }

        await retryOperation(async () => {
            const response = await fetch('http://localhost:5000/api/inventory?page=1&limit=50', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();

                // Handle new pagination structure
                if (result.data && Array.isArray(result.data)) {
                    displayInventory(result.data);
                } else if (Array.isArray(result)) {
                    // Fallback for old format
                    displayInventory(result);
                } else {
                    throw new Error('Invalid response format from server');
                }
            } else if (response.status === 401) {
                showError('Authentication failed. Please log in again.');
                // Redirect to login page
                window.location.href = './index.html';
            } else if (response.status === 500) {
                throw new Error('Server error. Please try again later.');
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        });

    } catch (error) {
        console.error('Error loading inventory:', error);
        if (error.message.includes('Server error')) {
            showError('Server error. Please try again later.');
        } else if (error.message.includes('Invalid response format')) {
            showError('Server returned invalid data format. Please try again.');
        } else {
            handleNetworkError(error, 'loading inventory');
        }
    }
}

// Show error message
function showError(message) {
    const inventoryBody = document.getElementById('inventoryBody');
    if (inventoryBody) {
        inventoryBody.innerHTML = `<tr><td colspan="8" class="error-message">${message}</td></tr>`;
    }
}

// Show loading message
function showLoading() {
    const inventoryBody = document.getElementById('inventoryBody');
    if (inventoryBody) {
        inventoryBody.innerHTML = '<tr><td colspan="8" class="loading">Loading inventory...</td></tr>';
    }
}

function displayInventory(inventory) {
    const inventoryBody = document.getElementById('inventoryBody');
    if (!inventoryBody) return;

    inventoryBody.innerHTML = '';

    if (!inventory || inventory.length === 0) {
        inventoryBody.innerHTML = '<tr><td colspan="8" class="loading">No inventory items found. Click "Add New Inventory" to get started.</td></tr>';
        return;
    }

    inventory.forEach(item => {
        const row = document.createElement('tr');
        row.setAttribute('data-inventory-id', item.id);
        row.innerHTML = `
            <td class="editable-cell" data-field="product_type" data-value="${item.product_type || ''}">${item.product_type || 'N/A'}</td>
            <td class="editable-cell" data-field="status" data-value="${item.status || ''}">${item.status || 'N/A'}</td>
            <td class="editable-cell" data-field="size" data-value="${item.size || ''}">${item.size || 'N/A'}</td>
            <td class="editable-cell" data-field="serial_number" data-value="${item.serial_number || ''}">${item.serial_number || 'N/A'}</td>
            <td class="editable-cell" data-field="date" data-value="${item.date || ''}">${item.date || 'N/A'}</td>
            <td class="editable-cell" data-field="location" data-value="${item.location || ''}">${item.location || 'N/A'}</td>
            <td class="editable-cell" data-field="issued_by" data-value="${item.issued_by || ''}">${item.issued_by || 'N/A'}</td>
            <td>
                <button class="edit-button" onclick="toggleEditMode('${item.id}', this)">Edit</button>
                <button class="delete-button" onclick="deleteInventory('${item.id}')">Delete</button>
                <button class="cancel-button" onclick="cancelEdit('${item.id}', this)" style="display: none;">Cancel</button>
            </td>
        `;
        inventoryBody.appendChild(row);
    });

    document.getElementById('inventoryTable').classList.remove('hidden');

    // Check for recently updated items and restore their state
    checkRecentlyUpdatedItems();
}

// Toggle edit mode for inline editing
function toggleEditMode(inventoryId, button) {
    console.log('toggleEditMode called with ID:', inventoryId);
    const row = button.closest('tr');
    const isEditing = row.classList.contains('editing');

    console.log('Row editing state:', isEditing);

    if (isEditing) {
        // Save changes
        console.log('Saving changes...');
        saveInventoryChanges(inventoryId, row, button);
    } else {
        // Enter edit mode
        console.log('Entering edit mode...');
        enterEditMode(inventoryId, row, button);
    }
}

// Enter edit mode - make cells editable
function enterEditMode(inventoryId, row, button) {
    console.log('enterEditMode called for inventory ID:', inventoryId);

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to be logged in to edit inventory items. Please log in first.');
        return;
    }

    console.log('User is authenticated, proceeding with edit mode');

    // Add editing class to row
    row.classList.add('editing');
    console.log('Added editing class to row');

    // Change button to Save
    button.textContent = 'Save';
    button.classList.remove('edit-button');
    button.classList.add('save-button');
    console.log('Changed button to Save');

    // Show cancel button
    const cancelButton = row.querySelector('.cancel-button');
    if (cancelButton) {
        cancelButton.style.display = 'inline-block';
        console.log('Cancel button displayed');
    } else {
        console.warn('Cancel button not found in row');
    }

    // Make cells editable
    const editableCells = row.querySelectorAll('.editable-cell');
    editableCells.forEach(cell => {
        const field = cell.getAttribute('data-field');
        const currentValue = cell.getAttribute('data-value');

        if (field === 'product_type' || field === 'status' || field === 'size') {
            // Create select dropdown for these fields
            const select = document.createElement('select');
            select.className = 'edit-field';

            if (field === 'product_type') {
                select.innerHTML = `
                    <option value="UPS" ${currentValue === 'UPS' ? 'selected' : ''}>UPS</option>
                    <option value="AVR" ${currentValue === 'AVR' ? 'selected' : ''}>AVR</option>
                `;
            } else if (field === 'status') {
                select.innerHTML = `
                    <option value="New" ${currentValue === 'New' ? 'selected' : ''}>New</option>
                    <option value="Replaced" ${currentValue === 'Replaced' ? 'selected' : ''}>Replaced</option>
                `;
            } else if (field === 'size') {
                select.innerHTML = `
                    <option value="1.5kva" ${currentValue === '1.5kva' ? 'selected' : ''}>1.5kva</option>
                    <option value="3kva" ${currentValue === '3kva' ? 'selected' : ''}>3kva</option>
                    <option value="6kva" ${currentValue === '6kva' ? 'selected' : ''}>6kva</option>
                    <option value="10kva" ${currentValue === '10kva' ? 'selected' : ''}>10kva</option>
                    <option value="20kva" ${currentValue === '20kva' ? 'selected' : ''}>20kva</option>
                    <option value="30kva" ${currentValue === '30kva' ? 'selected' : ''}>30kva</option>
                    <option value="40kva" ${currentValue === '40kva' ? 'selected' : ''}>40kva</option>
                    <option value="60kva" ${currentValue === '60kva' ? 'selected' : ''}>60kva</option>
                `;
            }

            cell.innerHTML = '';
            cell.appendChild(select);
        } else if (field === 'date') {
            // Create date input
            const dateInput = document.createElement('input');
            dateInput.type = 'date';
            dateInput.className = 'edit-field';
            dateInput.value = currentValue;
            cell.innerHTML = '';
            cell.appendChild(dateInput);
        } else {
            // Create text input for other fields
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.className = 'edit-field';
            textInput.value = currentValue;
            cell.innerHTML = '';
            cell.appendChild(textInput);
        }
    });

    // Store original values for cancel functionality
    row.setAttribute('data-original-values', JSON.stringify({
        product_type: row.querySelector('[data-field="product_type"]').getAttribute('data-value'),
        status: row.querySelector('[data-field="status"]').getAttribute('data-value'),
        size: row.querySelector('[data-field="size"]').getAttribute('data-value'),
        serial_number: row.querySelector('[data-field="serial_number"]').getAttribute('data-value'),
        date: row.querySelector('[data-field="date"]').getAttribute('data-value'),
        location: row.querySelector('[data-field="location"]').getAttribute('data-value'),
        issued_by: row.querySelector('[data-field="issued_by"]').getAttribute('data-value')
    }));
}

// Save inventory changes
async function saveInventoryChanges(inventoryId, row, button) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('You need to be logged in to save changes. Please log in again.');
            window.location.href = './index.html';
            return;
        }

        // Collect updated values
        const updatedData = {};
        const editableCells = row.querySelectorAll('.editable-cell');

        editableCells.forEach(cell => {
            const field = cell.getAttribute('data-field');
            let value;

            if (field === 'product_type' || field === 'status' || field === 'size') {
                const select = cell.querySelector('select');
                if (!select) {
                    throw new Error(`Select element not found for field: ${field}`);
                }
                value = select.value;
            } else if (field === 'date') {
                const dateInput = cell.querySelector('input[type="date"]');
                if (!dateInput) {
                    throw new Error(`Date input not found for field: ${field}`);
                }
                value = dateInput.value;
            } else {
                const textInput = cell.querySelector('input[type="text"]');
                if (!textInput) {
                    throw new Error(`Text input not found for field: ${field}`);
                }
                value = textInput.value;
            }

            if (!value || value.trim() === '') {
                throw new Error(`Field ${field} cannot be empty`);
            }

            updatedData[field] = value.trim();
        });

        // Send update request to backend
        const response = await fetch(`http://localhost:5000/api/inventory/${inventoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                productType: updatedData.product_type,
                status: updatedData.status,
                size: updatedData.size,
                serialNumber: updatedData.serial_number,
                date: updatedData.date,
                location: updatedData.location,
                issuedBy: updatedData.issued_by
            })
        });

        if (response.ok) {
            // Update the data attributes and display
            editableCells.forEach(cell => {
                const field = cell.getAttribute('data-field');
                const value = updatedData[field];

                // Update data attribute
                cell.setAttribute('data-value', value);

                // Update display
                cell.innerHTML = value;
            });

            // Exit edit mode
            exitEditMode(row, button);

            // Hide edit and delete buttons after successful save
            const editButton = row.querySelector('.edit-button');
            const deleteButton = row.querySelector('.delete-button');

            if (editButton) {
                editButton.style.display = 'none';
            }
            if (deleteButton) {
                deleteButton.style.display = 'none';
            }

            // Add a "Completed" indicator
            const actionCell = row.querySelector('td:last-child');
            if (actionCell) {
                const updatedIndicator = document.createElement('span');
                updatedIndicator.className = 'updated-indicator';
                updatedIndicator.textContent = '✓ Completed';
                actionCell.appendChild(updatedIndicator);
            }

            // Add updated class to the row for CSS styling
            row.classList.add('updated');



            // Store the update timestamp in localStorage for persistence
            const updateKey = `inventory_updated_${inventoryId}`;
            localStorage.setItem(updateKey, Date.now().toString());

            // Show success message
            alert('✅ Inventory item updated successfully!');

            // Reload inventory to ensure data consistency
            loadInventory();

            // Emit update event
            // emitInventoryUpdate('updated', { id: inventoryId, ...updatedData }); // REMOVED

        } else if (response.status === 401) {
            alert('Authentication failed. Please log in again.');
            window.location.href = './index.html';
        } else if (response.status === 404) {
            alert('Inventory item not found. It may have been deleted.');
            loadInventory(); // Reload to refresh the table
        } else {
            const errorText = await response.text();
            console.error('Update failed:', response.status, errorText);
            alert('Failed to update inventory item. Please try again.');
        }

    } catch (error) {
        console.error('Error saving inventory changes:', error);
        if (error.message.includes('not found')) {
            alert(`Error: ${error.message}`);
        } else if (error.message.includes('cannot be empty')) {
            alert(`Error: ${error.message}`);
        } else {
            alert('Network error. Please check your connection and try again.');
        }
    }
}

// Exit edit mode - restore original display
function exitEditMode(row, button) {
    // Remove editing class
    row.classList.remove('editing');

    // Change button back to Edit
    button.textContent = 'Edit';
    button.classList.remove('save-button');
    button.classList.add('edit-button');

    // Hide cancel button
    const cancelButton = row.querySelector('.cancel-button');
    if (cancelButton) {
        cancelButton.style.display = 'none';
    }

    // Restore original values
    const originalValues = JSON.parse(row.getAttribute('data-original-values') || '{}');
    const editableCells = row.querySelectorAll('.editable-cell');

    editableCells.forEach(cell => {
        const field = cell.getAttribute('data-field');
        const value = originalValues[field] || cell.getAttribute('data-value');

        // Update data attribute
        cell.setAttribute('data-value', value);

        // Update display
        cell.innerHTML = value;
    });
}

// Cancel edit mode
function cancelEdit(inventoryId, button) {
    const row = button.closest('tr');
    exitEditMode(row, row.querySelector('.edit-button'));
}



// These functions are no longer needed with inline editing
// Keeping them for backward compatibility if needed elsewhere

// This function is no longer needed with inline editing
// The updateInventory function has been replaced by saveInventoryChanges

// Delete inventory
async function deleteInventory(inventoryId) {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to delete inventory');
            window.location.href = './index.html';
            return;
        }

        const response = await fetch(`http://localhost:5000/api/inventory/${inventoryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('✅ Inventory item deleted successfully!');
            loadInventory(); // Reload the table

            // Emit update event
            // emitInventoryUpdate('deleted', { id: inventoryId }); // REMOVED

        } else if (response.status === 401) {
            alert('Authentication failed. Please log in again.');
            window.location.href = './index.html';
        } else if (response.status === 404) {
            alert('Inventory item not found. It may have been deleted already.');
            loadInventory(); // Reload to refresh the table
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to delete inventory: ${response.status}`);
        }
    } catch (error) {
        console.error('Error deleting inventory:', error);
        alert(`Failed to delete inventory item: ${error.message}`);
    }
}

// Export to Excel
function exportToExcel() {
    // Implementation for Excel export
    alert('Export functionality will be implemented here');
}

// Network error handler
function handleNetworkError(error, operation = 'operation') {
    console.error(`Network error during ${operation}:`, error);

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showError('Network error: Unable to connect to server. Please check your internet connection.');
    } else if (error.name === 'AbortError') {
        showError('Request was cancelled. Please try again.');
    } else {
        showError(`Network error: ${error.message || 'Unknown error occurred'}`);
    }
}

// Global error handler
window.addEventListener('error', function (event) {
    console.error('Global error:', event.error);
    showError('An unexpected error occurred. Please refresh the page.');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function (event) {
    console.error('Unhandled promise rejection:', event.reason);
    showError('An unexpected error occurred. Please refresh the page.');
    event.preventDefault();
});

// Real-time update emitter - REMOVED
// function emitInventoryUpdate(type, data) {
//     console.log(`📡 Emitting inventory update: ${type}`, data);
//     console.log('📊 Event details:', { type, data, timestamp: new Date().toISOString() });

//     // Emit custom event for other components to listen to
//     const event = new CustomEvent('inventoryUpdate', {
//         detail: {
//             type: type, // 'created', 'updated', 'deleted'
//             data: data,
//             timestamp: new Date().toISOString()
//         }
//     });
//     window.dispatchEvent(event);
//     console.log('✅ Custom event dispatched');

//     // Store update in localStorage for cross-tab communication
//     try {
//         const updateData = {
//             type: type,
//             data: data,
//             timestamp: new Date().toISOString(),
//             userId: getCurrentUserId()
//         };
//         localStorage.setItem('inventoryUpdate', JSON.stringify(updateData));
//         console.log('✅ LocalStorage update stored');

//         // Trigger storage event for other tabs
//         setTimeout(() => {
//             localStorage.removeItem('inventoryUpdate');
//         }, 100);
//     } catch (error) {
//         console.error('Error storing inventory update:', error);
//     }

//     // Enhanced Socket.IO emission with retry mechanism
//     emitToSocketIO(type, data);

//     // Broadcast to all open windows/tabs
//     broadcastToOtherTabs(type, data);

//     // Notify parent window if this is in an iframe
//     notifyParentWindow(type, data);
// }

// Socket.IO emission function - REMOVED
// function emitToSocketIO(type, data) {
//     // All Socket.IO functionality removed
// }

// Broadcast to other tabs/windows function - REMOVED
// function broadcastToOtherTabs(type, data) {
//     // All cross-tab communication removed
// }

// Notify parent window function - REMOVED
// function notifyParentWindow(type, data) {
//     // All parent window notification removed
// }

// Wait for socket function - REMOVED
// function waitForSocketAndEmit(type, data) {
//     // All socket waiting functionality removed
// }

// Check socket status function - REMOVED
// function checkSocketStatus() {
//     // All socket status checking removed
// }

// Get current user ID from token
function getCurrentUserId() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId;
        }
    } catch (error) {
        console.error('Error parsing token:', error);
    }
    return null;
}

// Show notification
function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.inventory-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `inventory-notification inventory-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);

    return notification;
}

// Show success notification
function showSuccessNotification(message) {
    return showNotification(message, 'success');
}

// Show error notification
function showErrorNotification(message) {
    return showNotification(message, 'error');
}

// Show info notification
function showInfoNotification(message) {
    return showNotification(message, 'info');
}

// Check for recently updated items and restore their state
function checkRecentlyUpdatedItems() {
    const rows = document.querySelectorAll('#inventoryBody tr[data-inventory-id]');

    rows.forEach(row => {
        const inventoryId = row.getAttribute('data-inventory-id');
        const updateKey = `inventory_updated_${inventoryId}`;
        const updateTimestamp = localStorage.getItem(updateKey);

        if (updateTimestamp) {
            const updateTime = parseInt(updateTimestamp);
            const now = Date.now();
            const timeDiff = now - updateTime;

            // If updated within the last 24 hours, restore the updated state
            if (timeDiff < 24 * 60 * 60 * 1000) {
                // Hide edit and delete buttons
                const editButton = row.querySelector('.edit-button');
                const deleteButton = row.querySelector('.delete-button');

                if (editButton) editButton.style.display = 'none';
                if (deleteButton) deleteButton.style.display = 'none';

                // Add updated class
                row.classList.add('updated');

                // Add updated indicator
                const actionCell = row.querySelector('td:last-child');
                if (actionCell) {
                    const updatedIndicator = document.createElement('span');
                    updatedIndicator.className = 'updated-indicator';
                    updatedIndicator.textContent = '✓ Completed';
                    actionCell.appendChild(updatedIndicator);
                }
            } else {
                // Remove old update records (older than 24 hours)
                localStorage.removeItem(updateKey);
            }
        }
    });
}

// Clean up old update records from localStorage
function cleanupOldUpdateRecords() {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    keys.forEach(key => {
        if (key.startsWith('inventory_updated_')) {
            const timestamp = localStorage.getItem(key);
            if (timestamp) {
                const updateTime = parseInt(timestamp);
                if (now - updateTime > oneDayMs) {
                    localStorage.removeItem(key);
                }
            }
        }
    });
}
