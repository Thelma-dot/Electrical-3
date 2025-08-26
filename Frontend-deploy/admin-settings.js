// Admin Settings JavaScript

// Default settings
const defaultSettings = {
    system: {
        maxUsers: 100,
        sessionTimeout: 1440,
        passwordPolicy: 'medium'
    },
    security: {
        bcryptRounds: 10,
        rateLimit: 'medium',
        jwtSecret: 'your_jwt_secret_key_here'
    },
    notifications: {
        emailNotifications: true,
        realTimeUpdates: true,
        auditLogging: true
    },
    backup: {
        autoBackup: true,
        backupRetention: 30,
        maintenanceMode: false
    },
    appearance: {
        theme: 'light',
        language: 'en',
        timezone: 'UTC'
    }
};

// Current settings
let currentSettings = {};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
    checkDatabaseStatus();
});

// Setup event listeners
function setupEventListeners() {
    // Theme change handler
    document.getElementById('theme').addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    // Maintenance mode handler
    document.getElementById('maintenanceMode').addEventListener('change', (e) => {
        if (e.target.checked) {
            showMaintenanceModeWarning();
        }
    });

    // Real-time updates handler
    document.getElementById('realTimeUpdates').addEventListener('change', (e) => {
        if (!e.target.checked) {
            showRealTimeWarning();
        }
    });
}

// Load settings from localStorage or use defaults
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('adminSettings');
        if (savedSettings) {
            currentSettings = { ...defaultSettings, ...JSON.parse(savedSettings) };
        } else {
            currentSettings = { ...defaultSettings };
        }
        populateSettingsForm();
    } catch (error) {
        console.error('Error loading settings:', error);
        currentSettings = { ...defaultSettings };
        populateSettingsForm();
    }
}

// Populate the settings form with current values
function populateSettingsForm() {
    // System Configuration
    document.getElementById('maxUsers').value = currentSettings.system.maxUsers;
    document.getElementById('sessionTimeout').value = currentSettings.system.sessionTimeout;
    document.getElementById('passwordPolicy').value = currentSettings.system.passwordPolicy;

    // Security Settings
    document.getElementById('bcryptRounds').value = currentSettings.security.bcryptRounds;
    document.getElementById('rateLimit').value = currentSettings.security.rateLimit;
    document.getElementById('jwtSecret').value = currentSettings.security.jwtSecret;

    // Notification Settings
    document.getElementById('emailNotifications').checked = currentSettings.notifications.emailNotifications;
    document.getElementById('realTimeUpdates').checked = currentSettings.notifications.realTimeUpdates;
    document.getElementById('auditLogging').checked = currentSettings.notifications.auditLogging;

    // Backup & Maintenance
    document.getElementById('autoBackup').checked = currentSettings.backup.autoBackup;
    document.getElementById('backupRetention').value = currentSettings.backup.backupRetention;
    document.getElementById('maintenanceMode').checked = currentSettings.backup.maintenanceMode;

    // Appearance Settings
    document.getElementById('theme').value = currentSettings.appearance.theme;
    document.getElementById('language').value = currentSettings.appearance.language;
    document.getElementById('timezone').value = currentSettings.appearance.timezone;

    // Apply current theme
    applyTheme(currentSettings.appearance.theme);
}

// Save settings
function saveSettings() {
    try {
        // Collect all settings from the form
        const newSettings = {
            system: {
                maxUsers: parseInt(document.getElementById('maxUsers').value),
                sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
                passwordPolicy: document.getElementById('passwordPolicy').value
            },
            security: {
                bcryptRounds: parseInt(document.getElementById('bcryptRounds').value),
                rateLimit: document.getElementById('rateLimit').value,
                jwtSecret: document.getElementById('jwtSecret').value
            },
            notifications: {
                emailNotifications: document.getElementById('emailNotifications').checked,
                realTimeUpdates: document.getElementById('realTimeUpdates').checked,
                auditLogging: document.getElementById('auditLogging').checked
            },
            backup: {
                autoBackup: document.getElementById('autoBackup').checked,
                backupRetention: parseInt(document.getElementById('backupRetention').value),
                maintenanceMode: document.getElementById('maintenanceMode').checked
            },
            appearance: {
                theme: document.getElementById('theme').value,
                language: document.getElementById('language').value,
                timezone: document.getElementById('timezone').value
            }
        };

        // Validate settings
        if (!validateSettings(newSettings)) {
            return;
        }

        // Save to localStorage
        localStorage.setItem('adminSettings', JSON.stringify(newSettings));
        currentSettings = newSettings;

        // Show success notification
        showNotification('Settings saved successfully!', 'success');

        // Apply theme immediately
        applyTheme(newSettings.appearance.theme);

        // Log settings change for audit
        if (newSettings.notifications.auditLogging) {
            logSettingsChange(newSettings);
        }

    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error saving settings', 'error');
    }
}

// Validate settings before saving
function validateSettings(settings) {
    // Validate max users
    if (settings.system.maxUsers < 1 || settings.system.maxUsers > 1000) {
        showNotification('Maximum users must be between 1 and 1000', 'error');
        return false;
    }

    // Validate session timeout
    if (settings.system.sessionTimeout < 15 || settings.system.sessionTimeout > 10080) {
        showNotification('Session timeout must be between 15 minutes and 7 days', 'error');
        return false;
    }

    // Validate BCrypt rounds
    if (settings.security.bcryptRounds < 8 || settings.security.bcryptRounds > 14) {
        showNotification('BCrypt rounds must be between 8 and 14', 'error');
        return false;
    }

    // Validate backup retention
    if (settings.backup.backupRetention < 1 || settings.backup.backupRetention > 365) {
        showNotification('Backup retention must be between 1 and 365 days', 'error');
        return false;
    }

    return true;
}

// Reset settings to defaults
function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
        currentSettings = { ...defaultSettings };
        populateSettingsForm();
        localStorage.removeItem('adminSettings');
        showNotification('Settings reset to defaults', 'info');
    }
}

// Export settings to JSON file
function exportSettings() {
    try {
        const settingsData = {
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            settings: currentSettings
        };

        const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('Settings exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting settings:', error);
        showNotification('Error exporting settings', 'error');
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Apply theme
function applyTheme(theme) {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark');
    
    // Add new theme class
    if (theme === 'auto') {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
        body.classList.add(`theme-${theme}`);
    }
}

// Check database status
async function checkDatabaseStatus() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/health', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        const statusIndicator = document.querySelector('.status-indicator .status-dot');
        const statusText = document.querySelector('.status-indicator span:last-child');

        if (response.ok) {
            statusIndicator.className = 'status-dot online';
            statusText.textContent = 'Connected';
        } else {
            statusIndicator.className = 'status-dot offline';
            statusText.textContent = 'Disconnected';
        }
    } catch (error) {
        console.error('Error checking database status:', error);
        const statusIndicator = document.querySelector('.status-indicator .status-dot');
        const statusText = document.querySelector('.status-indicator span:last-child');
        statusIndicator.className = 'status-dot offline';
        statusText.textContent = 'Error';
    }
}

// Show maintenance mode warning
function showMaintenanceModeWarning() {
    if (confirm('⚠️ WARNING: Enabling maintenance mode will restrict access for all users except administrators. Are you sure you want to continue?')) {
        // Additional confirmation for maintenance mode
        if (confirm('This will immediately log out all non-admin users. Continue?')) {
            // Proceed with maintenance mode
            showNotification('Maintenance mode enabled. Users will be restricted.', 'warning');
        } else {
            // Revert the checkbox
            document.getElementById('maintenanceMode').checked = false;
        }
    } else {
        // Revert the checkbox
        document.getElementById('maintenanceMode').checked = false;
    }
}

// Show real-time updates warning
function showRealTimeWarning() {
    if (confirm('⚠️ WARNING: Disabling real-time updates will prevent live updates in inventory, toolbox, and reports management. This may affect user experience. Continue?')) {
        showNotification('Real-time updates disabled', 'warning');
    } else {
        // Revert the checkbox
        document.getElementById('realTimeUpdates').checked = true;
    }
}

// Log settings change for audit
function logSettingsChange(settings) {
    const auditLog = {
        timestamp: new Date().toISOString(),
        action: 'settings_updated',
        adminId: getCurrentAdminId(),
        changes: settings
    };

    // Store in localStorage for now (in a real app, this would go to a database)
    const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    existingLogs.push(auditLog);
    localStorage.setItem('auditLogs', JSON.stringify(existingLogs.slice(-100))); // Keep last 100 logs
}

// Get current admin ID from token
function getCurrentAdminId() {
    try {
        const token = localStorage.getItem('adminToken');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId || 'unknown';
        }
    } catch (error) {
        console.error('Error parsing admin token:', error);
    }
    return 'unknown';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('settingsNotification');
    const icon = notification.querySelector('i');
    const text = notification.querySelector('span');

    // Set icon and text based on type
    switch (type) {
        case 'success':
            icon.className = 'fas fa-check-circle';
            notification.className = 'settings-notification success';
            break;
        case 'error':
            icon.className = 'fas fa-exclamation-circle';
            notification.className = 'settings-notification error';
            break;
        case 'warning':
            icon.className = 'fas fa-exclamation-triangle';
            notification.className = 'settings-notification warning';
            break;
        default:
            icon.className = 'fas fa-info-circle';
            notification.className = 'settings-notification info';
    }

    text.textContent = message;
    notification.style.display = 'flex';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        window.location.href = './index.html';
    }
}
