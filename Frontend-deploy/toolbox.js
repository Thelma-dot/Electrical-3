// Global variables
let currentToolboxId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    setCurrentDate();
    setupEventListeners();
    loadExistingToolboxes();
});

function setupEventListeners() {
    // Handle form submission
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', handleToolboxSubmission);
    }
}

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = today;
    }
}

async function handleToolboxSubmission(e) {
    e.preventDefault();

    const formData = {
        workActivity: document.getElementById('workActivity').value.trim(),
        date: document.getElementById('date').value,
        workLocation: document.getElementById('workLocation').value.trim(),
        nameCompany: document.getElementById('name/company').value.trim(),
        sign: document.getElementById('sign').value.trim(),
        ppeNo: document.getElementById('ppe').value.trim(),
        toolsUsed: document.getElementById('toolsUsed').value.trim(),
        hazards: document.getElementById('hazards').value.trim(),
        circulars: document.getElementById('circulars').value.trim(),
        riskAssessment: document.getElementById('riskAssessment').value.trim(),
        permit: document.getElementById('permit').value.trim(),
        remarks: document.getElementById('remarks').value.trim(),
        preparedBy: document.getElementById('preparedBy').value.trim(),
        verifiedBy: document.getElementById('verifiedBy').value.trim()
    };

    // Validate required fields
    const requiredFields = ['workActivity', 'date', 'workLocation', 'nameCompany', 'ppeNo', 'toolsUsed', 'hazards', 'preparedBy', 'verifiedBy'];
    for (const field of requiredFields) {
        if (!formData[field]) {
            alert(`Please fill in the required field: ${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}`);
            return;
        }
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/toolbox', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to submit toolbox form');
        }

        const result = await response.json();

        // Show success message
        alert("✅ Toolbox form submitted successfully!");

        // Add to table if it exists
        if (result.id) {
            addToolboxToTable(result);
        }

        // Clear form
        clearForm();

        // Try to get PDF if available
        try {
            const pdfResponse = await fetch(`http://localhost:5000/api/toolbox/${result.id}/pdf`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (pdfResponse.ok) {
                const blob = await pdfResponse.blob();
                const url = window.URL.createObjectURL(blob);

                // Create download link
                const a = document.createElement('a');
                a.href = url;
                a.download = `Toolbox_Form_${new Date().toISOString().slice(0, 10)}.pdf`;
                document.body.appendChild(a);
                a.click();

                // Clean up
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                alert("✅ PDF downloaded successfully!");
            }
        } catch (pdfError) {
            console.log('PDF download not available:', pdfError);
        }

    } catch (err) {
        console.error('Form submission error:', err);
        alert("Failed to submit toolbox form. Please try again.");
    }
}

function addToolboxToTable(toolbox) {
    // Check if table exists, if not create one
    let table = document.getElementById('toolboxTable');
    let tbody = document.getElementById('toolboxTableBody');

    if (!table) {
        // Create table structure with admin-style headers
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        tableContainer.innerHTML = `
            <div class="page-header" style="margin: 30px 0 20px 0;">
                <h2 style="color: #2c3e50; margin: 0;">My Toolbox Forms</h2>
            </div>
            <table id="toolboxTable" class="data-table">
                <thead>
                    <tr>
                        <th>Work Activity</th>
                        <th>Date</th>
                        <th>Work Location</th>
                        <th>Name/Company</th>
                        <th>Tools Used</th>
                        <th>Prepared By</th>
                        <th>Verified By</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="toolboxTableBody"></tbody>
            </table>
        `;

        // Insert after the form
        const form = document.querySelector('form');
        if (form) {
            form.parentNode.insertBefore(tableContainer, form.nextSibling);
        }

        // Add search and filter section
        if (!document.getElementById('toolboxSearchFilter')) {
            const searchFilterContainer = document.createElement('div');
            searchFilterContainer.id = 'toolboxSearchFilter';
            searchFilterContainer.className = 'search-filter';
            searchFilterContainer.style.margin = '20px 0';
            searchFilterContainer.innerHTML = `
                <div class="search-box" style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                    <div style="position: relative; flex: 1; min-width: 250px;">
                        <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #666;"></i>
                        <input type="text" id="toolboxSearchInput" 
                               placeholder="Search by work activity, location, company, or tools..." 
                               style="width: 100%; padding: 10px 10px 10px 35px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;"
                               onkeyup="searchMyToolboxes()">
                    </div>
                    <div class="filter-box">
                        <select id="toolboxStatusFilter" onchange="filterMyToolboxes()" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                            <option value="">All Status</option>
                            <option value="submitted">Submitted</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
            `;
            
            // Insert before the table
            const tableContainer = document.querySelector('.table-container');
            if (tableContainer) {
                tableContainer.parentNode.insertBefore(searchFilterContainer, tableContainer);
            }
        }
        
        // Add statistics section
        if (!document.getElementById('toolboxStats')) {
            const statsContainer = document.createElement('div');
            statsContainer.id = 'toolboxStats';
            statsContainer.className = 'stats-section';
            statsContainer.style.margin = '20px 0';
            statsContainer.innerHTML = `
                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
                        <h4 style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Total Forms</h4>
                        <p id="totalMyToolboxes" style="color: #2c3e50; font-size: 24px; font-weight: 600; margin: 0;">0</p>
                    </div>
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
                        <h4 style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Submitted</h4>
                        <p id="submittedMyToolboxes" style="color: #3498db; font-size: 24px; font-weight: 600; margin: 0;">0</p>
                    </div>
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
                        <h4 style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Completed</h4>
                        <p id="completedMyToolboxes" style="color: #27ae60; font-size: 24px; font-weight: 600; margin: 0;">0</p>
                    </div>
                </div>
            `;
            
            // Insert before the search filter
            const searchFilter = document.getElementById('toolboxSearchFilter');
            if (searchFilter) {
                searchFilter.parentNode.insertBefore(statsContainer, searchFilter);
            }
        }

        table = document.getElementById('toolboxTable');
        tbody = document.getElementById('toolboxTableBody');
    }

    const row = document.createElement('tr');
    row.setAttribute('data-toolbox-id', toolbox.id);

    // Determine action buttons based on status
    let actionButtons;
    if (toolbox.status === 'completed') {
        actionButtons = '<span class="completed-status">✅ Completed</span>';
    } else {
        actionButtons = `
            <div class="action-buttons">
                <button onclick="viewToolbox('${toolbox.id}')" class="btn btn-sm btn-primary">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="editToolbox('${toolbox.id}')" class="btn btn-sm btn-warning">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteToolbox('${toolbox.id}')" class="btn btn-sm btn-danger">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            return dateString;
        }
    };

    // Truncate text for better display
    const truncateText = (text, maxLength) => {
        if (!text) return 'N/A';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    row.innerHTML = `
        <td>${toolbox.work_activity || 'N/A'}</td>
        <td>${formatDate(toolbox.date)}</td>
        <td>${toolbox.work_location || 'N/A'}</td>
        <td>${toolbox.name_company || 'N/A'}</td>
        <td>${truncateText(toolbox.tools_used, 30)}</td>
        <td>${toolbox.prepared_by || 'N/A'}</td>
        <td>${toolbox.verified_by || 'N/A'}</td>
        <td>
            <span class="toolbox-status-badge ${toolbox.status === 'completed' ? 'toolbox-status-completed' : 'toolbox-status-submitted'}">
                ${toolbox.status === 'completed' ? '✅ Completed' : '📝 Submitted'}
            </span>
        </td>
        <td>${formatDate(toolbox.created_at)}</td>
        <td>${actionButtons}</td>
    `;

    tbody.appendChild(row);
    table.classList.remove('hidden');
    
    // Update statistics after adding toolbox
    updateMyToolboxStats();
}

function clearForm() {
    const form = document.querySelector('form');
    if (form) {
        form.reset();
        setCurrentDate();
    }
}

async function loadExistingToolboxes() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/toolbox', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const toolboxes = await response.json();
            toolboxes.forEach(toolbox => addToolboxToTable(toolbox));
            
            // Update statistics after loading all toolboxes
            updateMyToolboxStats();
        }
    } catch (error) {
        console.error('Error loading toolboxes:', error);
    }
}

async function viewToolbox(toolboxId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/toolbox/${toolboxId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const toolbox = await response.json();
            showToolboxDetails(toolbox);
        }
    } catch (error) {
        console.error('Error loading toolbox details:', error);
        alert('Failed to load toolbox details');
    }
}

function showToolboxDetails(toolbox) {
    let statusMessage = '';
    if (toolbox.status === 'completed') {
        statusMessage = '<p style="color: #27ae60; font-weight: 600; text-align: center; padding: 10px; background: #d5f4e6; border-radius: 6px; margin: 10px 0;">✅ This toolbox form has been completed and finalized.</p>';
    }

    const details = `
        <h3>Toolbox Form Details</h3>
        ${statusMessage}
        <p><strong>Work Activity:</strong> ${toolbox.work_activity}</p>
        <p><strong>Date:</strong> ${toolbox.date}</p>
        <p><strong>Work Location:</strong> ${toolbox.work_location}</p>
        <p><strong>Name/Company:</strong> ${toolbox.name_company}</p>
        <p><strong>Sign:</strong> ${toolbox.sign}</p>
        <p><strong>PPE No:</strong> ${toolbox.ppe_no}</p>
        <p><strong>Tools Used:</strong> ${toolbox.tools_used}</p>
        <p><strong>Hazards:</strong> ${toolbox.hazards}</p>
        <p><strong>Circulars:</strong> ${toolbox.circulars || 'None'}</p>
        <p><strong>Risk Assessment:</strong> ${toolbox.risk_assessment || 'None'}</p>
        <p><strong>Permit:</strong> ${toolbox.permit || 'None'}</p>
        <p><strong>Remarks:</strong> ${toolbox.remarks || 'None'}</p>
        <p><strong>Prepared By:</strong> ${toolbox.prepared_by}</p>
        <p><strong>Verified By:</strong> ${toolbox.verified_by}</p>
        <p><strong>Status:</strong> <span style="color: ${toolbox.status === 'completed' ? '#27ae60' : '#3498db'}; font-weight: 600;">${toolbox.status === 'completed' ? '✅ Completed' : '📝 Submitted'}</span></p>
    `;

    alert(details);
}

async function editToolbox(toolboxId) {
    currentToolboxId = toolboxId;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/toolbox/${toolboxId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const toolbox = await response.json();

            // Check if toolbox is already completed
            if (toolbox.status === 'completed') {
                alert('❌ This toolbox form is already completed and cannot be edited.');
                return;
            }

            populateEditForm(toolbox);
            showEditMode();
        }
    } catch (error) {
        console.error('Error loading toolbox for editing:', error);
        alert('Failed to load toolbox for editing');
    }
}

function populateEditForm(toolbox) {
    document.getElementById('workActivity').value = toolbox.work_activity;
    document.getElementById('date').value = toolbox.date;
    document.getElementById('workLocation').value = toolbox.work_location;
    document.getElementById('name/company').value = toolbox.name_company;
    document.getElementById('sign').value = toolbox.sign;
    document.getElementById('ppe').value = toolbox.ppe_no;
    document.getElementById('toolsUsed').value = toolbox.tools_used;
    document.getElementById('hazards').value = toolbox.hazards;
    document.getElementById('circulars').value = toolbox.circulars || '';
    document.getElementById('riskAssessment').value = toolbox.risk_assessment || '';
    document.getElementById('permit').value = toolbox.permit || '';
    document.getElementById('remarks').value = toolbox.remarks || '';
    document.getElementById('preparedBy').value = toolbox.prepared_by;
    document.getElementById('verifiedBy').value = toolbox.verified_by;
}

function showEditMode() {
    const form = document.querySelector('form');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (submitBtn) {
        submitBtn.textContent = 'Update & Mark as Completed';
        submitBtn.onclick = updateToolbox;
    }

    // Add cancel button
    if (!document.getElementById('cancelEditBtn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.textContent = 'Cancel Edit';
        cancelBtn.onclick = cancelEdit;
        cancelBtn.style.marginLeft = '10px';

        submitBtn.parentNode.appendChild(cancelBtn);
    }

    // Add warning message
    if (!document.getElementById('editWarning')) {
        const warningDiv = document.createElement('div');
        warningDiv.id = 'editWarning';
        warningDiv.innerHTML = '<p style="color: #e74c3c; margin-top: 10px; font-weight: 600;">⚠️ Note: Updating this toolbox form will mark it as completed and it cannot be edited again.</p>';
        warningDiv.style.backgroundColor = '#fdf2f2';
        warningDiv.style.padding = '10px';
        warningDiv.style.borderRadius = '6px';
        warningDiv.style.border = '1px solid #f5c6cb';

        const form = document.querySelector('form');
        form.appendChild(warningDiv);
    }
}

function cancelEdit() {
    currentToolboxId = null;
    const form = document.querySelector('form');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (submitBtn) {
        submitBtn.textContent = 'Submit';
        submitBtn.onclick = null;
    }

    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.remove();
    }

    // Remove warning message
    const warningDiv = document.getElementById('editWarning');
    if (warningDiv) {
        warningDiv.remove();
    }

    clearForm();
}

async function updateToolbox() {
    if (!currentToolboxId) return;

    const formData = {
        workActivity: document.getElementById('workActivity').value.trim(),
        date: document.getElementById('date').value,
        workLocation: document.getElementById('workLocation').value.trim(),
        nameCompany: document.getElementById('name/company').value.trim(),
        sign: document.getElementById('sign').value.trim(),
        ppeNo: document.getElementById('ppe').value.trim(),
        toolsUsed: document.getElementById('toolsUsed').value.trim(),
        hazards: document.getElementById('hazards').value.trim(),
        circulars: document.getElementById('circulars').value.trim(),
        riskAssessment: document.getElementById('riskAssessment').value.trim(),
        permit: document.getElementById('permit').value.trim(),
        remarks: document.getElementById('remarks').value.trim(),
        preparedBy: document.getElementById('preparedBy').value.trim(),
        verifiedBy: document.getElementById('verifiedBy').value.trim(),
        status: 'completed' // Set status to completed when updating
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/toolbox/${currentToolboxId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('✅ Toolbox updated successfully!');

            // Update the table row to show completed status
            updateToolboxRow(currentToolboxId, formData);

            cancelEdit();
        } else {
            throw new Error('Failed to update toolbox');
        }
    } catch (error) {
        console.error('Error updating toolbox:', error);
        alert('Failed to update toolbox');
    }
}

function updateToolboxRow(toolboxId, toolboxData) {
    const row = document.querySelector(`tr[data-toolbox-id="${toolboxId}"]`);
    if (row) {
        // Update the status cell
        const statusCell = row.cells[6]; // Status is the 7th column (index 6)
        statusCell.innerHTML = '<span class="toolbox-status-badge toolbox-status-completed">✅ Completed</span>';
        
        // Update the actions cell to show completed status
        const actionsCell = row.cells[9]; // Actions is the 10th column (index 9)
        actionsCell.innerHTML = '<span class="completed-status">✅ Completed</span>';
        
        // Update statistics after status change
        updateMyToolboxStats();
    }
}

async function deleteToolbox(toolboxId) {
    if (!confirm('Are you sure you want to delete this toolbox form?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/toolbox/${toolboxId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const toolbox = await response.json();

            // Check if toolbox is already completed
            if (toolbox.status === 'completed') {
                alert('❌ This toolbox form is already completed and cannot be deleted.');
                return;
            }

            // If not completed, proceed with deletion
            const deleteResponse = await fetch(`http://localhost:5000/api/toolbox/${toolboxId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (deleteResponse.ok) {
                alert('✅ Toolbox deleted successfully!');
                loadExistingToolboxes(); // Reload the table
            } else {
                throw new Error('Failed to delete toolbox');
            }
        } else {
            throw new Error('Failed to fetch toolbox details');
        }
    } catch (error) {
        console.error('Error deleting toolbox:', error);
        alert('Failed to delete toolbox');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = './index.html';
}

// Search and filter functions for user toolbox table
function searchMyToolboxes() {
    const searchTerm = document.getElementById('toolboxSearchInput').value.toLowerCase();
    const statusFilter = document.getElementById('toolboxStatusFilter').value;

    const rows = document.querySelectorAll('#toolboxTableBody tr');

    rows.forEach(row => {
        const workActivity = row.cells[0].textContent.toLowerCase();
        const workLocation = row.cells[2].textContent.toLowerCase();
        const nameCompany = row.cells[3].textContent.toLowerCase();
        const toolsUsed = row.cells[4].textContent.toLowerCase();
        const status = row.cells[7].textContent.toLowerCase();

        let matchesSearch = true;
        let matchesStatus = true;

        // Check search term
        if (searchTerm) {
            matchesSearch = workActivity.includes(searchTerm) ||
                workLocation.includes(searchTerm) ||
                nameCompany.includes(searchTerm) ||
                toolsUsed.includes(searchTerm);
        }

        // Check status filter
        if (statusFilter) {
            matchesStatus = status.includes(statusFilter);
        }

        // Show/hide row based on filters
        if (matchesSearch && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterMyToolboxes() {
    searchMyToolboxes(); // This will apply both search and filter
}

// Update user toolbox statistics
function updateMyToolboxStats() {
    const totalElement = document.getElementById('totalMyToolboxes');
    const submittedElement = document.getElementById('submittedMyToolboxes');
    const completedElement = document.getElementById('completedMyToolboxes');
    
    if (totalElement && submittedElement && completedElement) {
        const rows = document.querySelectorAll('#toolboxTableBody tr');
        const total = rows.length;
        const completed = Array.from(rows).filter(row => 
            row.cells[7] && row.cells[7].textContent.includes('Completed')
        ).length;
        const submitted = total - completed;
        
        totalElement.textContent = total;
        submittedElement.textContent = submitted;
        completedElement.textContent = completed;
    }
}
