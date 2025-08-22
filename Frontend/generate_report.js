// Global variables
let selectedTools = [];
let currentReportId = null;

// Pagination variables
let currentPage = 1;
let itemsPerPage = 10;
let allReports = [];
let filteredReports = [];

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    setCurrentDateTime();
    loadExistingReports();
    setupEventListeners();

    // Add search input event listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            // Debounce search to avoid too many calls
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                searchReports();
            }, 300);
        });
    }
});

function setupEventListeners() {
    // Handle tool selection
    document.getElementById('toolsUsed').addEventListener('change', function () {
        const tool = this.value.trim();
        if (tool && !selectedTools.includes(tool)) {
            selectedTools.push(tool);
            updateSelectedToolsDisplay();
            this.value = '';
        }
    });
}

function setCurrentDateTime() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    document.getElementById('reportDate').value = today;
    document.getElementById('reportTime').value = time;
}

function updateSelectedToolsDisplay() {
    const container = document.getElementById('selectedToolsList');
    if (!container) return;

    container.innerHTML = '';

    selectedTools.forEach((tool, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${tool} 
            <button type="button" onclick="removeTool(${index})" class="remove-tool">×</button>
        `;
        container.appendChild(li);
    });
}

function removeTool(index) {
    selectedTools.splice(index, 1);
    updateSelectedToolsDisplay();
}

async function generateReport() {
    const title = document.getElementById('reportTitle').value.trim();
    const jobDescription = document.getElementById('jobDescription').value.trim();
    const location = document.getElementById('location').value.trim();
    const remarks = document.getElementById('remarks').value.trim();
    const date = document.getElementById('reportDate').value;
    const time = document.getElementById('reportTime').value;
    const status = document.querySelector('input[name="status"]:checked')?.value;

    if (!title || !jobDescription || !location || !date || !status) {
        alert('Please fill in all required fields');
        return;
    }

    if (selectedTools.length === 0) {
        alert('Please select at least one tool');
        return;
    }

    const reportData = {
        title,
        jobDescription,
        location,
        remarks,
        remarks,
        date,
        time,
        toolsUsed: selectedTools.join(', '),
        status
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/reports', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reportData)
        });

        if (!response.ok) {
            throw new Error('Failed to create report');
        }

        const newReport = await response.json();

        // Add to table
        addReportToTable(newReport);

        // Show success message
        alert('✅ Report generated successfully!');

        // Clear form
        clearForm();

        // Show the report preview
        showReportPreview(newReport);

        // Reset to first page to show the new report
        currentPage = 1;

    } catch (error) {
        console.error('Error generating report:', error);
        alert('Failed to generate report. Please try again.');
    }
}

async function updateReport() {
    if (!currentReportId) {
        alert('No report selected for update');
        return;
    }

    const title = document.getElementById('reportTitle').value.trim();
    const jobDescription = document.getElementById('jobDescription').value.trim();
    const location = document.getElementById('location').value.trim();
    const remarks = document.getElementById('remarks').value.trim();
    const date = document.getElementById('reportDate').value;
    const time = document.getElementById('reportTime').value;
    const status = document.querySelector('input[name="status"]:checked')?.value;

    if (!title || !jobDescription || !location || !date || !status) {
        alert('Please fill in all required fields');
        return;
    }

    if (selectedTools.length === 0) {
        alert('Please select at least one tool');
        return;
    }

    const reportData = {
        title,
        jobDescription,
        location,
        remarks,
        date,
        time,
        toolsUsed: selectedTools.join(', '),
        status
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/reports/${currentReportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reportData)
        });

        if (!response.ok) {
            throw new Error('Failed to update report');
        }

        const updatedReport = await response.json();

        // Update the report in the arrays
        const index = allReports.findIndex(r => r.id == currentReportId);
        if (index !== -1) {
            allReports[index] = updatedReport;
        }
        
        const filteredIndex = filteredReports.findIndex(r => r.id == currentReportId);
        if (filteredIndex !== -1) {
            filteredReports[filteredIndex] = updatedReport;
        }

        // Show success message
        alert('✅ Report updated successfully!');

        // Reset form and button
        clearForm();
        resetGenerateButton();

        // Update display
        displayReportsForCurrentPage();

        // Reset current report ID
        currentReportId = null;

    } catch (error) {
        console.error('Error updating report:', error);
        alert('Failed to update report. Please try again.');
    }
}

function addReportToTable(report) {
    // Add to allReports array
    allReports.unshift(report); // Add new report at the beginning
    filteredReports = [...allReports]; // Update filtered reports

    // Show table and update display
    const table = document.getElementById('reportTable');
    if (table) {
        table.classList.remove('hidden');
    }

    // Reset to first page and display
    currentPage = 1;
    displayReportsForCurrentPage();
}

function showReportPreview(report) {
    const preview = document.getElementById('generatedReport');
    if (!preview) return;

    document.getElementById('displayTitle').textContent = report.title;
    document.getElementById('displayJobDescription').textContent = report.job_description;
    document.getElementById('displayLocation').textContent = report.location;
    document.getElementById('displayRemarks').textContent = report.remarks || '-';
    document.getElementById('displayDate').textContent = report.date;
    document.getElementById('displayTime').textContent = report.time;
    document.getElementById('displayToolsUsed').textContent = report.tools_used;
    document.getElementById('displayStatus').textContent = report.status;

    preview.classList.remove('hidden');
}

function clearForm() {
    document.getElementById('reportTitle').value = '';
    document.getElementById('jobDescription').value = '';
    document.getElementById('location').value = '';
    document.getElementById('remarks').value = '';
    selectedTools = [];
    updateSelectedToolsDisplay();
    document.querySelectorAll('input[name="status"]').forEach(radio => radio.checked = false);
    setCurrentDateTime();
    
    // Reset button if we're in edit mode
    if (currentReportId) {
        resetGenerateButton();
        currentReportId = null;
    }
}

function resetGenerateButton() {
    const generateBtn = document.querySelector('.generate-btn');
    if (generateBtn) {
        generateBtn.textContent = 'Generate Report';
        generateBtn.onclick = generateReport;
    }
    
    // Hide cancel button
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'none';
    }
}

function cancelEdit() {
    if (confirm('Are you sure you want to cancel editing? All changes will be lost.')) {
        clearForm();
        resetGenerateButton();
        currentReportId = null;
    }
}

async function loadExistingReports() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/reports', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            allReports = await response.json();
            filteredReports = [...allReports];

            if (allReports.length > 0) {
                const table = document.getElementById('reportTable');
                if (table) {
                    table.classList.remove('hidden');
                }
                displayReportsForCurrentPage();
            }
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

async function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/reports/${reportId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Remove from arrays
            allReports = allReports.filter(report => report.id != reportId);
            filteredReports = filteredReports.filter(report => report.id != reportId);

            // Update display
            if (allReports.length === 0) {
                document.getElementById('reportTable').classList.add('hidden');
                document.getElementById('paginationControls').classList.add('hidden');
            } else {
                // Adjust current page if necessary
                const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
                if (currentPage > totalPages) {
                    currentPage = totalPages;
                }
                displayReportsForCurrentPage();
            }

            alert('Report deleted successfully');
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        alert('Failed to delete report');
    }
}

async function editReport(reportId) {
    const report = allReports.find(r => r.id === reportId);
    if (!report) return;

    // Populate the form with existing data
    document.getElementById('reportTitle').value = report.title || '';
    document.getElementById('jobDescription').value = report.job_description || report.jobDescription || '';
    document.getElementById('location').value = report.location || '';
    document.getElementById('remarks').value = report.remarks || '';
    document.getElementById('reportDate').value = report.report_date || report.reportDate || report.date || '';
    document.getElementById('reportTime').value = report.report_time || report.reportTime || report.time || '';

    // Set status radio button
    const status = report.status || '';
    if (status.toLowerCase().includes('progress')) {
        document.getElementById('statusInProgress').checked = true;
    } else if (status.toLowerCase().includes('completed')) {
        document.getElementById('statusCompleted').checked = true;
    }

    // Set selected tools
    const toolsUsed = report.tools_used || report.toolsUsed || '';
    if (toolsUsed) {
        selectedTools = toolsUsed.split(',').map(tool => tool.trim()).filter(tool => tool);
        updateSelectedToolsDisplay();
    }

    // Set current report ID for update
    currentReportId = reportId;

        // Change button text and functionality
    const generateBtn = document.querySelector('.generate-btn');
    generateBtn.textContent = 'Update Report';
    generateBtn.onclick = updateReport;
    
    // Show cancel button
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.style.display = 'inline-block';
    }
    
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Show success message
    alert('📝 Form populated with report data. Make your changes and click "Update Report" to save.');
}

// Pagination functions
function displayReportsForCurrentPage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const reportsToShow = filteredReports.slice(startIndex, endIndex);

    const tbody = document.getElementById('reportTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    reportsToShow.forEach(report => {
        const row = document.createElement('tr');
        row.setAttribute('data-report-id', report.id);
        row.innerHTML = `
            <td>${report.title}</td>
            <td>${report.job_description}</td>
            <td>${report.location}</td>
            <td>${report.remarks || '-'}</td>
            <td>${report.date}</td>
            <td>${report.time}</td>
            <td>${report.tools_used}</td>
            <td>${report.status}</td>
            <td>
                <button onclick="editReport('${report.id}')" class="edit-btn">Edit</button>
                <button onclick="deleteReport('${report.id}')" class="delete-btn">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePaginationControls();
}

function updatePaginationControls() {
    const totalReports = filteredReports.length;
    const totalPages = Math.ceil(totalReports / itemsPerPage);

    // Update pagination info
    const startItem = totalReports === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalReports);
    document.getElementById('paginationInfo').textContent = `Showing ${startItem}-${endItem} of ${totalReports} reports`;

    // Update page numbers
    const pageNumbersContainer = document.getElementById('pageNumbers');
    pageNumbersContainer.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.onclick = () => goToPage(i);
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageNumbersContainer.appendChild(pageButton);
    }

    // Update navigation buttons
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;

    // Show/hide pagination controls
    const paginationControls = document.getElementById('paginationControls');
    if (totalReports > 0) {
        paginationControls.classList.remove('hidden');
    } else {
        paginationControls.classList.add('hidden');
    }
}

function goToPage(page) {
    currentPage = page;
    displayReportsForCurrentPage();
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayReportsForCurrentPage();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayReportsForCurrentPage();
    }
}

function changeItemsPerPage() {
    itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    currentPage = 1; // Reset to first page
    displayReportsForCurrentPage();
}

// Search functionality
function searchReports() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();

    if (searchTerm === '') {
        filteredReports = [...allReports];
    } else {
        filteredReports = allReports.filter(report =>
            (report.title || '').toLowerCase().includes(searchTerm) ||
            (report.job_description || '').toLowerCase().includes(searchTerm) ||
            (report.location || '').toLowerCase().includes(searchTerm) ||
            (report.status || '').toLowerCase().includes(searchTerm) ||
            (report.tools_used || '').toLowerCase().includes(searchTerm) ||
            (report.remarks || '').toLowerCase().includes(searchTerm)
        );
    }

    // Reset to first page and display results
    currentPage = 1;
    displayReportsForCurrentPage();
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    filteredReports = [...allReports];
    currentPage = 1;
    displayReportsForCurrentPage();
}


