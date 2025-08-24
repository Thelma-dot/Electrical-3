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

  // Toolbox page features - REMOVED to prevent conflicts with tool_box.html
  // The toolbox form is now handled directly in tool_box.html

  // Deadline reminder
  if (document.getElementById('deadlineInput')) {
    initDeadlineReminder();
  }

  // My tasks on dashboard
  if (document.getElementById('myTasksTable')) {
    loadMyTasks();
    const refreshBtn = document.getElementById('myTasksRefreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadMyTasks);
    const statusFilter = document.getElementById('myTaskStatusFilter');
    if (statusFilter) statusFilter.addEventListener('change', loadMyTasks);
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

// ====================== Tasks (User) ======================
async function loadMyTasks() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    const resp = await fetch('http://localhost:5000/api/tasks/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const tbody = document.querySelector('#myTasksTable tbody');
    const empty = document.getElementById('myTasksEmpty');
    if (!resp.ok) {
      if (empty) empty.style.display = 'block';
      return;
    }
    const tasks = await resp.json();
    const statusFilter = document.getElementById('myTaskStatusFilter');
    const filtered = statusFilter && statusFilter.value
      ? tasks.filter(t => t.status === statusFilter.value)
      : tasks;
    if (!tasks.length) {
      if (empty) empty.style.display = 'block';
      return;
    }
    if (tbody) {
      tbody.innerHTML = '';
      filtered.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${t.title}</td>
          <td>${renderTaskPriority(t)}</td>
          <td>${renderTaskStatus(t)}</td>
          <td>${renderTaskDueDate(t)}</td>
        `;
        tbody.appendChild(tr);
      });
    }
    // Auto-sync deadline reminder with the nearest upcoming task
    syncDeadlineWithTasks(tasks);
  } catch (e) {
    console.warn('Failed to load tasks', e);
  }
}

function renderTaskStatus(task) {
  const id = task.id;
  const current = task.status;
  const options = ['pending', 'in_progress', 'completed', 'cancelled']
    .map(v => `<option value="${v}" ${v === current ? 'selected' : ''}>${toLabel(v)}</option>`)
    .join('');
  return `<select data-task-id="${id}" onchange="onTaskStatusChange(event)">${options}</select>`;
}

window.onTaskStatusChange = async function (e) {
  const select = e.target;
  const taskId = select.getAttribute('data-task-id');
  const status = select.value;
  try {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
  } catch { }
}

function toLabel(v) {
  return v.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function renderTaskPriority(task) {
  const id = task.id;
  const current = task.priority || 'medium';
  const options = ['low', 'medium', 'high']
    .map(v => `<option value="${v}" ${v === current ? 'selected' : ''}>${toLabel(v)}</option>`)
    .join('');
  return `<select data-task-id="${id}" onchange="onTaskPriorityChange(event)">${options}</select>`;
}

function renderTaskDueDate(task) {
  const id = task.id;
  const value = task.due_date ? toDateTimeLocal(task.due_date) : '';
  return `<input type="datetime-local" data-task-id="${id}" value="${value}" onchange="onTaskDueChange(event)" />`;
}

function toDateTimeLocal(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return '';
  }
}

window.onTaskPriorityChange = async function (e) {
  const select = e.target;
  const taskId = select.getAttribute('data-task-id');
  const priority = select.value;
  try {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ priority })
    });
  } catch { }
}

window.onTaskDueChange = async function (e) {
  const input = e.target;
  const taskId = input.getAttribute('data-task-id');
  const due_date = input.value ? new Date(input.value).toISOString() : null;
  try {
    const token = localStorage.getItem('token');
    await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ due_date })
    });
    // After updating due date, refresh tasks and reminder
    loadMyTasks();
  } catch { }
}

// Sync the dashboard deadline reminder with the nearest upcoming task due date
function syncDeadlineWithTasks(tasks) {
  if (!Array.isArray(tasks) || !tasks.length) return;
  const now = new Date();
  const candidates = tasks.filter(t => t.due_date && (t.status === 'pending' || t.status === 'in_progress'));
  if (!candidates.length) return;
  candidates.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const next = candidates.find(t => new Date(t.due_date) > now) || candidates[0];
  const input = document.getElementById('deadlineInput');
  if (!input) return;
  const deadlineLocal = toDateTimeLocal(next.due_date);
  input.value = deadlineLocal;
  localStorage.setItem('userDeadline', deadlineLocal);
  localStorage.setItem('userDeadlineTaskTitle', next.title || 'Task');
  localStorage.setItem('userDeadlineTaskId', String(next.id));
  displayDeadlineCountdown(deadlineLocal);
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

    // Store user data in the format expected by the greeting system
    const userData = {
      staffId: data.user.staffid || data.user.staffId,
      fullName: data.user.fullName || data.user.name || `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim(),
      email: data.user.email,
      phone: data.user.phone,
      role: data.user.role,
      createdAt: data.user.createdAt || data.user.created_at,
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem('userData', JSON.stringify(userData));

    // Redirect based on role
    const userRole = (data.user && data.user.role) || (JSON.parse(atob(data.token.split('.')[1] || 'e30='))?.role);
    if (userRole === 'admin') {
      window.location.href = 'admin-dashboard.html';
    } else {
      window.location.href = 'dashboard.html';
    }

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
  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded, skipping chart initialization');
    return;
  }

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

// ====================== Task Deadline Reminder ======================
function initDeadlineReminder() {
  // Initialize deadline reminders for assigned tasks
  updateTaskDeadlineReminders();

  // Set up periodic updates
  setInterval(updateTaskDeadlineReminders, 30000); // Update every 30 seconds
}

// Update deadline reminders based on assigned tasks
async function updateTaskDeadlineReminders() {
  try {
    const response = await fetch('http://localhost:5000/api/tasks/my', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.ok) {
      const tasks = await response.json();
      displayTaskDeadlineReminders(tasks);
    } else {
      console.error('Failed to load tasks for deadline reminders');
    }
  } catch (error) {
    console.error('Error loading tasks for deadline reminders:', error);
  }
}

// Display deadline reminders for tasks
function displayTaskDeadlineReminders(tasks) {
  const upcomingDeadlines = document.getElementById('upcomingDeadlines');
  const noDeadlines = document.getElementById('noDeadlines');
  const deadlineReminders = document.getElementById('deadlineReminders');

  if (!upcomingDeadlines || !noDeadlines || !deadlineReminders) return;

  // Filter tasks with due dates and sort by due date
  const tasksWithDeadlines = tasks
    .filter(task => task.due_date && task.status !== 'completed' && task.status !== 'cancelled')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  if (tasksWithDeadlines.length === 0) {
    upcomingDeadlines.style.display = 'none';
    noDeadlines.style.display = 'block';
    deadlineReminders.innerHTML = '';
    return;
  }

  upcomingDeadlines.style.display = 'none';
  noDeadlines.style.display = 'none';

  // Display upcoming deadlines
  const upcomingHtml = `
    <h3>📅 Upcoming Deadlines (${tasksWithDeadlines.length})</h3>
    <div class="deadline-list">
      ${tasksWithDeadlines.map(task => createDeadlineItem(task)).join('')}
    </div>
  `;

  upcomingDeadlines.innerHTML = upcomingHtml;
  upcomingDeadlines.style.display = 'block';

  // Start countdown timers for each deadline
  startDeadlineCountdowns(tasksWithDeadlines);
}

// Create individual deadline item
function createDeadlineItem(task) {
  const dueDate = new Date(task.due_date);
  const now = new Date();
  const timeDiff = dueDate - now;
  const isOverdue = timeDiff < 0;

  const priorityClass = `priority-${task.priority || 'medium'}`;
  const statusClass = isOverdue ? 'overdue' : 'upcoming';

  return `
    <div class="deadline-item ${statusClass}" data-task-id="${task.id}">
      <div class="deadline-header">
        <span class="task-title">${escapeHtml(task.title)}</span>
        <span class="priority-badge ${priorityClass}">${capitalizeFirst(task.priority || 'medium')}</span>
      </div>
      <div class="deadline-time">
        <span class="due-date">Due: ${formatDate(task.due_date)}</span>
        <span class="countdown" id="countdown-${task.id}">
          ${isOverdue ? '🚨 OVERDUE!' : 'Loading...'}
        </span>
        ${isOverdue ? `<button onclick="resetTaskAlarm(${task.id})" style="margin-left: 10px; padding: 4px 8px; background: #e74c3c; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">🔊 Reset Alarm</button>` : ''}
      </div>
    </div>
  `;
}

// Start countdown timers for all deadlines
function startDeadlineCountdowns(tasks) {
  tasks.forEach(task => {
    if (task.due_date) {
      startSingleCountdown(task.id, task.due_date);
    }
  });
}

// Start countdown for a single deadline
function startSingleCountdown(taskId, dueDate) {
  const countdownElement = document.getElementById(`countdown-${taskId}`);
  if (!countdownElement) return;

  // Track if alarm has already been played for this task using localStorage
  const alarmKey = `alarm_played_${taskId}`;
  const alarmPlayed = localStorage.getItem(alarmKey) === 'true';

  function updateCountdown() {
    const now = new Date();
    const deadlineDate = new Date(dueDate);
    const timeDiff = deadlineDate - now;

    if (timeDiff <= 0) {
      countdownElement.innerHTML = '🚨 OVERDUE!';
      countdownElement.classList.add('overdue');

      // Play sound only once when deadline is first reached
      if (!alarmPlayed) {
        const beep = document.getElementById('beepSound');
        if (beep) {
          beep.play().catch(e => console.log('Audio play failed:', e));
          // Mark this task's alarm as played in localStorage
          localStorage.setItem(alarmKey, 'true');
        }
      }

      clearInterval(countdownInterval);
      return;
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDiff / 1000) % 60);

    // Add warning colors for urgent deadlines
    let timeClass = '';
    if (days === 0 && hours < 24) {
      timeClass = 'urgent';
    } else if (days === 0 && hours < 48) {
      timeClass = 'warning';
    }

    countdownElement.innerHTML = `<span class="${timeClass}">⏳ ${days}d ${hours}h ${minutes}m ${seconds}s</span>`;
  }

  updateCountdown();
  const countdownInterval = setInterval(updateCountdown, 1000);
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Reset alarm state for a specific task (useful when task is completed or user wants to reset)
function resetTaskAlarm(taskId) {
  const alarmKey = `alarm_played_${taskId}`;
  localStorage.removeItem(alarmKey);
}

// Reset all task alarms (useful for testing or clearing all alarm states)
function resetAllTaskAlarms() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('alarm_played_')) {
      localStorage.removeItem(key);
    }
  });
  console.log('All task alarms have been reset');
}

// Test the alarm sound (useful for testing audio functionality)
function testAlarmSound() {
  const beep = document.getElementById('beepSound');
  if (beep) {
    beep.play().catch(e => console.log('Audio play failed:', e));
    console.log('Test alarm sound played');
  } else {
    console.log('Alarm sound element not found');
  }
}

function capitalizeFirst(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ====================== Toolbox Page ======================
// REMOVED: initToolboxForm and generateToolboxPDF functions
// These were causing conflicts with tool_box.html
// The toolbox form is now handled directly in tool_box.html





function logout() {
  // Clear user data
  localStorage.removeItem('user');
  localStorage.removeItem('token');

  // Redirect to login page
  window.location.href = 'index.html';
}

// ====================== Role-based Redirects ======================
document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('login-form');
  const errorMessage = document.getElementById('error-message');

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            sessionStorage.setItem('role', data.role);
            if (data.role === 'admin') {
              window.location.href = 'toolbox-dashboard.html';
            } else {
              window.location.href = 'user-dashboard.html';
            }
          } else {
            errorMessage.textContent = 'Invalid credentials';
          }
        })
        .catch(() => {
          errorMessage.textContent = 'Unable to connect to server';
        });
    });
  }
});