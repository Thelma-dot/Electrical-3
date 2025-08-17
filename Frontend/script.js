// ====================== Utility Functions ======================
function showAlert(message, type = 'error') {
  alert(message);
}

function isStrongPassword(password) {
  const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

// ====================== Page Initialization ======================
document.addEventListener("DOMContentLoaded", () => {
  // Apply saved settings
  applySavedSettings();
  
  // Initialize page-specific functionality
  initializePageFeatures();
  
  // Load saved reports
  if (document.getElementById('reportTable')) {
    loadSavedReports();
  }
});

function initializePageFeatures() {
  // Dashboard page features
  if (document.getElementById('progressChart')) {
    initCharts();
  }
  
  // Login page features
  if (document.getElementById('LoginForm')) {
    initLoginForm();
  }
  
  // Reset password page features
  if (document.getElementById('resetForm')) {
    initResetForm();
  }
  
  // Inventory page features
  if (document.getElementById('inventoryTable')) {
    initInventoryPage();
  }
  
  // Toolbox page features
  if (document.getElementById('toolboxForm')) {
    initToolboxForm();
  }
  
  // Deadline reminder
  if (document.getElementById('deadlineInput')) {
    initDeadlineReminder();
  }
}

// ====================== Login Page ======================
function initLoginForm() {
  const form = document.getElementById("LoginForm");
  const staffIdInput = document.getElementById('staffID');
  const passwordInput = document.getElementById('password');

  // Only initialize if ALL required elements exist
  if (!form || !staffIdInput || !passwordInput) return;
  
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    login();
  });
}

async function login() {
  const staffIdInput = document.getElementById('staffID');
  const passwordInput = document.getElementById('password');
  
  // Basic validation
  if (!staffIdInput || !passwordInput) {
    showAlert('Login form elements not found');
    return;
  }
  // Get the values
  const staffID = staffIdInput.value;
  const password = passwordInput.value;

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        staffid: staffID, 
        password: password 
      })
    });


    // Handle HTTP errors
    if (!response.ok) {
      const errorData = await response.json();
      showAlert(errorData.error || 'Login failed');
      return;
    }

    const data = await response.json();
    
    // Save user data and token
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    
    // Redirect to dashboard
    window.location.href = 'dashboard.html';
    
  } catch (err) {
    console.error('Login error:', err);
    showAlert('Network error. Please try again.');
  }
}

// ====================== Reset Password Page ======================
function initResetForm() {
  const resetForm = document.getElementById("resetForm");
  if (!resetForm) return;
  
  resetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitNewPassword();
  });
}

async function requestReset() {
  const staffId = document.getElementById('resetStaffId').value;
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/request-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffid: staffId })
    });

    const data = await response.json();
    
    if (response.ok) {
      showAlert('Password reset email sent! Check your inbox.', 'success');
    } else {
      showAlert(data.error || 'Request failed');
    }
  } catch (err) {
    showAlert('Network error. Please try again.');
  }
}

async function submitNewPassword() {
  const staffId = document.getElementById('staffId').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!staffId || !newPassword || !confirmPassword) {
    showAlert('All fields are required');
    return;
  }

  if (newPassword !== confirmPassword) {
    showAlert('Passwords do not match');
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        staffid: staffId,  
        newPassword 
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      showAlert('Password updated successfully!', 'success');
      setTimeout(() => window.location.href = 'index.html', 2000);
    } else {
      showAlert(data.error || 'Password reset failed');
    }
  } catch (err) {
    showAlert('Network error. Please try again.');
  }
}



// ====================== Dashboard Page ======================
function initCharts() {
  // Bar Chart - Project Progress
  const progressChart = document.getElementById('progressChart');
  if (progressChart) {
    const ctxBar = progressChart.getContext('2d');
    new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: ['Reports', 'Inventory', 'In Progress', 'Completed Task'],
        datasets: [{
          label: 'Progress',
          data: [15, 18, 25, 22],
          backgroundColor: '#3498db'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // Line Chart - Reports
  const lineChart = document.getElementById('lineChart');
  if (lineChart) {
    const ctxLine = lineChart.getContext('2d');
    new Chart(ctxLine, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'sept', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Reports',
          data: [10, 15, 25, 22, 35, 25, 10, 20, 30, 45, 15, 35],
          borderColor: '#2980b9',
          backgroundColor: 'rgba(41, 128, 185, 0.2)',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

// ====================== Generate Report Page ======================
// Function to show the report table
function showReportTable() {
  const reportTable = document.getElementById('reportTable');
  if (reportTable) {
    reportTable.classList.remove('hidden');
  }
}

// Function to generate a new report
function generateReport() {
  const title = document.getElementById('reportTitle').value;
  const jobDescription = document.getElementById('jobDescription').value;
  const location = document.getElementById('location').value;
  const remarks = document.getElementById('remarks').value;
  const reportDate = document.getElementById('reportDate').value;
  const reportTime = document.getElementById('reportTime').value;
  const toolsUsed = document.getElementById('toolsUsed').value;
  const status = document.querySelector('input[name="status"]:checked')?.value;

  if (!title || !jobDescription || !location || !remarks || !reportDate || !reportTime || !toolsUsed || !status) {
    alert('Please fill in all fields before generating the report.');
    return;
  }

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${title}</td>
    <td>${jobDescription}</td>
    <td>${location}</td>
    <td>${remarks}</td>
    <td>${reportDate}</td>
    <td>${reportTime}</td>
    <td>${toolsUsed}</td>
    <td class="status">${status}</td>
    <td>
      <button class="edit-btn" onclick="editReport(this)">Edit</button>
    </td>
  `;

  const tableBody = document.querySelector('#reportTable tbody');
  if (tableBody) {
    tableBody.appendChild(row);
  }
  
  saveReportToLocalStorage({
    title, jobDescription, location, remarks, reportDate, reportTime, toolsUsed, status
  });
  showReportTable();
}

// Save to localStorage
function saveReportToLocalStorage(report) {
  let reports = JSON.parse(localStorage.getItem('reports')) || [];
  reports.push(report);
  localStorage.setItem('reports', JSON.stringify(reports));
}

// Edit/Save toggle
function editReport(button) {
  const row = button.closest('tr');
  if (!row) return;
  
  const cells = row.querySelectorAll('td');

  if (button.textContent === 'Save') {
    const updatedReport = {
      title: row.querySelector('#editTitle').value,
      jobDescription: row.querySelector('#editJobDescription').value,
      location: row.querySelector('#editLocation').value,
      remarks: row.querySelector('#editRemarks').value,
      reportDate: row.querySelector('#editReportDate').value,
      reportTime: row.querySelector('#editReportTime').value,
      toolsUsed: row.querySelector('#editToolsUsed').value,
      status: 'Completed'
    };

    // Update cells with new values
    cells[0].textContent = updatedReport.title;
    cells[1].textContent = updatedReport.jobDescription;
    cells[2].textContent = updatedReport.location;
    cells[3].textContent = updatedReport.remarks;
    cells[4].textContent = updatedReport.reportDate;
    cells[5].textContent = updatedReport.reportTime;
    cells[6].textContent = updatedReport.toolsUsed;
    cells[7].textContent = 'Completed';
    cells[8].innerHTML = `<span class="completed">Completed</span>`;

    updateReportInLocalStorage(updatedReport);
  } else {
    // Replace text with input fields
    cells[0].innerHTML = `<input type="text" id="editTitle" value="${cells[0].textContent}">`;
    cells[1].innerHTML = `<input type="text" id="editJobDescription" value="${cells[1].textContent}">`;
    cells[2].innerHTML = `<input type="text" id="editLocation" value="${cells[2].textContent}">`;
    cells[3].innerHTML = `<input type="text" id="editRemarks" value="${cells[3].textContent}">`;
    cells[4].innerHTML = `<input type="date" id="editReportDate" value="${cells[4].textContent}">`;
    cells[5].innerHTML = `<input type="time" id="editReportTime" value="${cells[5].textContent}">`;
    cells[6].innerHTML = `<input type="text" id="editToolsUsed" value="${cells[6].textContent}">`;

    button.textContent = 'Save';
  }
}

// Update edited report in localStorage
function updateReportInLocalStorage(updatedReport) {
  let reports = JSON.parse(localStorage.getItem('reports')) || [];
  const index = reports.findIndex(report => report.title === updatedReport.title);
  if (index !== -1) {
    reports[index] = updatedReport;
    localStorage.setItem('reports', JSON.stringify(reports));
  }
}

function loadSavedReports() {
  const savedReports = JSON.parse(localStorage.getItem('reports')) || [];
  const tableBody = document.querySelector('#reportTable tbody');
  if (!tableBody) return;
  
  savedReports.forEach(report => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${report.title}</td>
      <td>${report.jobDescription}</td>
      <td>${report.location}</td>
      <td>${report.remarks}</td>
      <td>${report.reportDate}</td>
      <td>${report.reportTime}</td>
      <td>${report.toolsUsed}</td>
      <td class="status">${report.status}</td>
      <td>
        ${report.status === 'Completed'
          ? '<span class="completed">Completed</span>'
          : '<button class="edit-btn" onclick="editReport(this)">Edit</button>'
        }
      </td>
    `;
    tableBody.appendChild(row);
  });
  showReportTable();
}

// ====================== Inventory Page ======================
function initInventoryPage() {
  // Add event listeners for inventory page
  const searchButton = document.getElementById('searchButton');
  if (searchButton) {
    searchButton.addEventListener('click', searchInventory);
  }
}

// Function to show the Add Inventory modal
function showAddModal() {
  const modal = document.getElementById('addModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

// Function to hide the Add Inventory modal
function hideAddModal() {
  const modal = document.getElementById('addModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Function to add inventory to the table
function addInventory() {
  const type = document.getElementById('type').value;
  const status = document.getElementById('status').value;
  const size = document.getElementById('size').value;
  const serial = document.getElementById('serial').value;
  const date = document.getElementById('date').value;
  const location = document.getElementById('location').value;
  const issued = document.getElementById('issued').value;

  const newRow = document.createElement('tr');
  newRow.innerHTML = `
    <td>${type}</td>
    <td>${status}</td>
    <td>${size}</td>
    <td>${serial}</td>
    <td>${date}</td>
    <td>${location}</td>
    <td>${issued}</td>
    <td><button class="edit-button" onclick="editInventory(this)">Edit</button></td>
  `;

  const inventoryBody = document.getElementById('inventoryBody');
  if (inventoryBody) {
    inventoryBody.appendChild(newRow);
  }
  
  const inventoryTable = document.getElementById('inventoryTable');
  if (inventoryTable) {
    inventoryTable.classList.remove('hidden');
  }
  
  hideAddModal();
}

// Function to edit inventory
function editInventory(button) {
  const row = button.closest('tr');
  if (!row) return;
  
  const cells = row.getElementsByTagName('td');
  
  if (button.textContent === "Save") {
    // Save the edited values
    cells[0].textContent = document.getElementById('editType').value;
    cells[1].textContent = document.getElementById('editStatus').value;
    cells[2].textContent = document.getElementById('editSize').value;
    cells[3].textContent = document.getElementById('editSerial').value;
    cells[4].textContent = document.getElementById('editDate').value;
    cells[5].textContent = document.getElementById('editLocation').value;
    cells[6].textContent = document.getElementById('editIssued').value;

    // Replace the Edit/Save button with 'Completed'
    const actionCell = cells[7];
    actionCell.innerHTML = '<span class="completed">Completed</span>';
  } else {
    // Change to save button
    button.textContent = 'Save';
    button.setAttribute('onclick', 'editInventory(this)');
    
    // Edit the row values by adding editable input fields
    cells[0].innerHTML = `<input type="text" id="editType" value="${cells[0].textContent}">`;
    cells[1].innerHTML = `<input type="text" id="editStatus" value="${cells[1].textContent}">`;
    cells[2].innerHTML = `<input type="text" id="editSize" value="${cells[2].textContent}">`;
    cells[3].innerHTML = `<input type="text" id="editSerial" value="${cells[3].textContent}">`;
    cells[4].innerHTML = `<input type="text" id="editDate" value="${cells[4].textContent}">`;
    cells[5].innerHTML = `<input type="text" id="editLocation" value="${cells[5].textContent}">`;
    cells[6].innerHTML = `<input type="text" id="editIssued" value="${cells[6].textContent}">`;
  }
}

function searchInventory() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const rows = document.querySelectorAll('#inventoryBody tr');
  let found = false;

  rows.forEach(row => {
    const cells = row.getElementsByTagName('td');
    const matches = Array.from(cells).some(cell => 
      cell.textContent.toLowerCase().includes(query)
    );
    
    if (matches) {
      row.style.display = '';
      found = true;
    } else {
      row.style.display = 'none';
    }
  });

  const noResultsMessage = document.getElementById('noResultsMessage');
  if (!found) {
    if (!noResultsMessage) {
      const message = document.createElement('div');
      message.id = 'noResultsMessage';
      message.textContent = 'No results found';
      message.style.color = 'red';
      message.style.textAlign = 'center';
      document.querySelector('.main-content')?.appendChild(message);
    }
  } else if (noResultsMessage) {
    noResultsMessage.remove();
  }
}

// Export to Excel (Dummy function)
function exportToExcel() {
  alert("Exporting to Excel...");
}

// ====================== Settings ======================
// Toggle dark mode and save preference
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');

  if (document.body.classList.contains('dark-mode')) {
    localStorage.setItem('dark-mode', 'enabled');
  } else {
    localStorage.setItem('dark-mode', 'disabled');
  }
}

// Load settings from localStorage
function applySavedSettings() {
  const isDark = localStorage.getItem('dark-mode') === 'enabled';
  if (isDark) {
    document.body.classList.add('dark-mode');
  }
}

// ====================== Deadline Reminder ======================
function initDeadlineReminder() {
  const savedDeadline = localStorage.getItem("userDeadline");
  if (savedDeadline) {
    const input = document.getElementById("deadlineInput");
    if (input) input.value = savedDeadline;
    displayDeadlineCountdown(savedDeadline);
  }
}

// Save deadline to localStorage
function saveDeadline() {
  const input = document.getElementById("deadlineInput");
  if (!input) return;
  
  const deadline = input.value;

  if (!deadline) {
    alert("Please select a valid date and time.");
    return;
  }

  localStorage.setItem("userDeadline", deadline);
  displayDeadlineCountdown(deadline);
}

// Display countdown
function displayDeadlineCountdown(deadline) {
  const display = document.getElementById("deadlineDisplay");
  const beep = document.getElementById("beepSound");
  if (!display || !beep) return;

  function updateCountdown() {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate - now;

    if (timeDiff <= 0) {
      display.textContent = "🚨 Deadline reached!";
      beep.play();
      clearInterval(countdownInterval);
      return;
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDiff / 1000) % 60);

    display.textContent = `⏳ Time Left: ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  updateCountdown();
  const countdownInterval = setInterval(updateCountdown, 1000);
}

// ====================== Toolbox Page ======================
function initToolboxForm() {
  const form = document.getElementById('toolboxForm');
  if (!form) return;
  
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    generateToolboxPDF();
  });
}

function generateToolboxPDF() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    alert("PDF library not loaded!");
    return;
  }

  const doc = new jsPDF();

  // Collect values
  const formData = {
    WorkActivity: document.getElementById('workActivity').value,
    Date: document.getElementById('date').value,
    WorkLocation: document.getElementById('workLocation').value,
    NameCompany: document.getElementById('name/company').value,
    Sign: document.getElementById('ppe').value,
    PPENo: document.getElementById('ppe').value,
    ToolsUsed: document.getElementById('toolsUsed').value,
    Hazards: document.getElementById('hazards').value,
    Circulars: document.getElementById('circulars').value,
    RiskAssessment: document.getElementById('riskAssessment').value,
    Permit: document.getElementById('permit').value,
    Remarks: document.getElementById('remarks').value,
    PreparedBy: document.getElementById('preparedBy').value,
    VerifiedBy: document.getElementById('verifiedBy').value,
  };

  // Add to PDF
  let y = 10;
  doc.setFontSize(12);
  doc.text("Toolbox Form Submission", 10, y);
  y += 10;

  for (let key in formData) {
    doc.text(`${key.replace(/([A-Z])/g, ' $1')}: ${formData[key]}`, 10, y);
    y += 10;
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  }

  // Save the PDF
  doc.save('Toolbox_Form.pdf');
  alert("✅ PDF downloaded successfully!");
}





 function logout() { 
  // Clear user data
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  
  // Redirect to login page
  window.location.href = 'index.html';
}