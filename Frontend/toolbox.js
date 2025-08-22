// Global variables
let currentToolboxId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
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
                a.download = `Toolbox_Form_${new Date().toISOString().slice(0,10)}.pdf`;
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
        // Create table structure
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container';
        tableContainer.innerHTML = `
            <table id="toolboxTable" class="data-table">
                <thead>
                    <tr>
                        <th>Work Activity</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Prepared By</th>
                        <th>Verified By</th>
                        <th>Status</th>
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
        
        table = document.getElementById('toolboxTable');
        tbody = document.getElementById('toolboxTableBody');
    }
    
    const row = document.createElement('tr');
    row.setAttribute('data-toolbox-id', toolbox.id);
    row.innerHTML = `
        <td>${toolbox.work_activity}</td>
        <td>${toolbox.date}</td>
        <td>${toolbox.work_location}</td>
        <td>${toolbox.prepared_by}</td>
        <td>${toolbox.verified_by}</td>
        <td>${toolbox.status || 'Submitted'}</td>
        <td>
            <button onclick="viewToolbox('${toolbox.id}')" class="view-btn">View</button>
            <button onclick="editToolbox('${toolbox.id}')" class="edit-btn">Edit</button>
            <button onclick="deleteToolbox('${toolbox.id}')" class="delete-btn">Delete</button>
        </td>
    `;
    
    tbody.appendChild(row);
    table.classList.remove('hidden');
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
    const details = `
        <h3>Toolbox Form Details</h3>
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
        submitBtn.textContent = 'Update Toolbox';
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
        verifiedBy: document.getElementById('verifiedBy').value.trim()
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
            cancelEdit();
            loadExistingToolboxes(); // Reload the table
        } else {
            throw new Error('Failed to update toolbox');
        }
    } catch (error) {
        console.error('Error updating toolbox:', error);
        alert('Failed to update toolbox');
    }
}

async function deleteToolbox(toolboxId) {
    if (!confirm('Are you sure you want to delete this toolbox form?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/toolbox/${toolboxId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('✅ Toolbox deleted successfully!');
            loadExistingToolboxes(); // Reload the table
        } else {
            throw new Error('Failed to delete toolbox');
        }
    } catch (error) {
        console.error('Error deleting toolbox:', error);
        alert('Failed to delete toolbox');
    }
}
