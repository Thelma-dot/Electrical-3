// Admin Reports Management JavaScript

let allReports = [];
let allUsers = [];
let currentPage = 1;
const reportsPerPage = 10;
let reportToDelete = null;

// Connect to realtime to update admin reports table instantly
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is admin
    if (!isAdmin()) {
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });
        const badge = document.getElementById('liveBadgeAdmin');
        const setLive = (on) => { if (!badge) return; badge.style.background = on ? '#27ae60' : '#e74c3c'; badge.querySelector('.status').textContent = on ? 'LIVE' : 'OFFLINE'; };
        socket.on('connect', () => setLive(true));
        socket.on('disconnect', () => setLive(false));

        // Listen for real-time updates - reload when users save reports
        socket.on('report:created', () => {
            console.log('Report created - reloading admin reports table');
            loadReports();
        });
        socket.on('report:updated', () => {
            console.log('Report updated - reloading admin reports table');
            loadReports();
        });
        socket.on('report:deleted', () => {
            console.log('Report deleted - reloading admin reports table');
            loadReports();
        });

        // Initialize page
        loadReports();
        loadUsers();
    } catch (e) {
        console.error('Socket connection error:', e);
    }
});

// Check if user is admin
function isAdmin() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.role === 'admin';
}

// Load all reports (admin can see all reports)
async function loadReports() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        const response = await fetch('http://localhost:5000/api/admin/reports', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'index.html';
                return;
            }
            throw new Error('Failed to fetch reports');
        }

        allReports = await response.json();
        renderReportsTable();
        updateReportStats();

    } catch (error) {
        console.error('Error loading reports:', error);
        showAlert('Failed to load reports');
    }
}

// Load all users for filtering
async function loadUsers() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            allUsers = await response.json();
            populateUserFilter();
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Populate user filter dropdown
function populateUserFilter() {
    const userFilter = document.getElementById('userFilter');
    if (!userFilter) return;

    const currentValue = userFilter.value;
    userFilter.innerHTML = '<option value="">All Users</option>' +
        allUsers.map(user => `<option value="${user.staff_id}">${user.staff_id}</option>`).join('');
    userFilter.value = currentValue;
}

// Render reports table
function renderReportsTable() {
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = '';

    const filteredReports = getFilteredReports();
    const startIndex = (currentPage - 1) * reportsPerPage;
    const endIndex = startIndex + reportsPerPage;
    const reportsToShow = filteredReports.slice(startIndex, endIndex);

    for (const report of reportsToShow) {
        const user = allUsers.find(u => u.id === report.user_id);
        const row = document.createElement('tr');
        row.dataset.reportId = report.id;
        row.innerHTML = `
            <td>${report.title || 'N/A'}</td>
            <td>${report.job_description || 'N/A'}</td>
            <td>${report.location || 'N/A'}</td>
            <td>${user ? user.staff_id : 'Unknown'}</td>
            <td><span class="status-badge ${report.status?.toLowerCase().replace(' ', '-')}">${report.status || 'Pending'}</span></td>
            <td>${formatDate(report.report_date || report.created_at)}</td>
            <td>${report.tools_used || 'N/A'}</td>
            <td>
                <button class="btn small" onclick="viewReportDetails(${report.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn small warning" onclick="editReportStatus(${report.id})" title="Edit Status">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn small danger" onclick="deleteReport(${report.id}, '${report.title || 'Untitled'}')" title="Delete Report">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    }

    updatePagination(filteredReports.length);
}

// Get filtered reports
function getFilteredReports() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const userFilter = document.getElementById('userFilter')?.value || '';

    return allReports.filter(report => {
        const matchesSearch = (
            (report.title && report.title.toLowerCase().includes(searchTerm)) ||
            (report.location && report.location.toLowerCase().includes(searchTerm)) ||
            (report.job_description && report.job_description.toLowerCase().includes(searchTerm))
        );

        const matchesStatus = !statusFilter || report.status === statusFilter;

        const user = allUsers.find(u => u.id === report.user_id);
        const matchesUser = !userFilter || (user && user.staff_id === userFilter);

        return matchesSearch && matchesStatus && matchesUser;
    });
}

// Search reports
function searchReports() {
    currentPage = 1;
    renderReportsTable();
}

// Filter reports
function filterReports() {
    currentPage = 1;
    renderReportsTable();
}

// Update report statistics
function updateReportStats() {
    const total = allReports.length;
    const pending = allReports.filter(r => r.status === 'Pending').length;
    const inProgress = allReports.filter(r => r.status === 'In Progress').length;
    const completed = allReports.filter(r => r.status === 'Completed').length;

    document.getElementById('totalReports').textContent = total;
    document.getElementById('pendingReports').textContent = pending;
    document.getElementById('inProgressReports').textContent = inProgress;
    document.getElementById('completedReports').textContent = completed;
}

// View report details
async function viewReportDetails(reportId) {
    try {
        const report = allReports.find(r => r.id === reportId);
        if (!report) return;

        const user = allUsers.find(u => u.id === report.user_id);
        const modal = document.getElementById('reportDetailsModal');
        const content = document.getElementById('reportDetailsContent');

        // Store report data for printing
        window.currentReportForPrint = { report, user };

        content.innerHTML = `
            <div class="report-details">
                <div class="detail-row">
                    <strong>Title:</strong> ${report.title || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Job Description:</strong> ${report.job_description || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Location:</strong> ${report.location || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>User:</strong> ${user ? user.staff_id : 'Unknown'}
                </div>
                <div class="detail-row">
                    <strong>Status:</strong> <span class="status-badge ${report.status?.toLowerCase().replace(' ', '-')}">${report.status || 'Pending'}</span>
                </div>
                <div class="detail-row">
                    <strong>Date:</strong> ${formatDate(report.report_date || report.created_at)}
                </div>
                <div class="detail-row">
                    <strong>Time:</strong> ${report.report_time || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Tools Used:</strong> ${report.tools_used || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Remarks:</strong> ${report.remarks || 'N/A'}
                </div>
                <div class="detail-row">
                    <strong>Created:</strong> ${formatDate(report.created_at)}
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error viewing report details:', error);
        showAlert('Failed to load report details');
    }
}

// Print report details
function printReportDetails() {
    if (!window.currentReportForPrint) {
        showAlert('No report data available for printing');
        return;
    }

    const { report, user } = window.currentReportForPrint;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Report - ${report.title || 'Untitled'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .report-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                .report-subtitle { font-size: 16px; color: #666; }
                .detail-section { margin-bottom: 20px; }
                .detail-row { margin: 10px 0; }
                .detail-label { font-weight: bold; display: inline-block; width: 150px; }
                .detail-value { display: inline-block; }
                .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                .status-pending { background: #f39c12; color: white; }
                .status-in-progress { background: #3498db; color: white; }
                .status-completed { background: #27ae60; color: white; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="report-header">
                <div class="report-title">${report.title || 'Untitled Report'}</div>
                <div class="report-subtitle">Electrical Management System</div>
            </div>
            
            <div class="detail-section">
                <div class="detail-row">
                    <span class="detail-label">Title:</span>
                    <span class="detail-value">${report.title || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Job Description:</span>
                    <span class="detail-value">${report.job_description || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${report.location || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">User:</span>
                    <span class="detail-value">${user ? user.staff_id : 'Unknown'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">
                        <span class="status-badge status-${(report.status || 'pending').toLowerCase().replace(' ', '-')}">
                            ${report.status || 'Pending'}
                        </span>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${formatDate(report.report_date || report.created_at)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${report.report_time || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tools Used:</span>
                    <span class="detail-value">${report.tools_used || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Remarks:</span>
                    <span class="detail-value">${report.remarks || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">${formatDate(report.created_at)}</span>
                </div>
            </div>
            
            <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function () {
        printWindow.print();
        printWindow.close();
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
        if (printWindow && !printWindow.closed) {
            printWindow.print();
            printWindow.close();
        }
    }, 1000);
}

// Edit report status
async function editReportStatus(reportId) {
    const report = allReports.find(r => r.id === reportId);
    if (!report) return;

    const newStatus = prompt('Enter new status (Pending/In Progress/Completed):', report.status || 'Pending');
    if (!newStatus || !['Pending', 'In Progress', 'Completed'].includes(newStatus)) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/reports/${reportId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showAlert('Report status updated successfully', 'success');
            loadReports(); // Refresh the table
        } else {
            const result = await response.json();
            showAlert(result.error || 'Failed to update report status');
        }
    } catch (error) {
        console.error('Error updating report status:', error);
        showAlert('Failed to update report status');
    }
}

// Delete report
function deleteReport(reportId, reportTitle) {
    reportToDelete = { id: reportId, title: reportTitle };
    document.getElementById('deleteReportTitle').textContent = reportTitle;
    document.getElementById('deleteModal').style.display = 'flex';
}

// Confirm delete report
async function confirmDeleteReport() {
    if (!reportToDelete) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/reports/${reportToDelete.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showAlert('Report deleted successfully', 'success');
            closeDeleteModal();
            loadReports(); // Refresh the table
        } else {
            const result = await response.json();
            showAlert(result.error || 'Failed to delete report');
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        showAlert('Failed to delete report');
    }
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    reportToDelete = null;
}

// Close report details modal
function closeReportDetailsModal() {
    document.getElementById('reportDetailsModal').style.display = 'none';
}

// Export reports
function exportReports() {
    const filteredReports = getFilteredReports();
    const csvContent = generateCSV(filteredReports);
    downloadCSV(csvContent, 'reports_export.csv');
}

// Generate CSV content
function generateCSV(reports) {
    const headers = ['Title', 'Job Description', 'Location', 'User', 'Status', 'Date', 'Tools Used', 'Remarks'];
    const rows = reports.map(report => {
        const user = allUsers.find(u => u.id === report.user_id);
        return [
            report.title || '',
            report.job_description || '',
            report.location || '',
            user ? user.staff_id : '',
            report.status || '',
            formatDate(report.report_date || report.created_at),
            report.tools_used || '',
            report.remarks || ''
        ];
    });

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

// Download CSV file
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Pagination
function changePage(direction) {
    const totalPages = Math.ceil(getFilteredReports().length / reportsPerPage);
    currentPage += direction;

    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    renderReportsTable();
}

function updatePagination(totalReports) {
    const totalPages = Math.ceil(totalReports / reportsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Utility functions
function formatDate(iso) {
    try {
        if (!iso) return 'N/A';
        return new Date(iso).toLocaleDateString();
    } catch {
        return 'N/A';
    }
}

function showAlert(message, type = 'error') {
    alert(message);
}

// Close modals when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}
