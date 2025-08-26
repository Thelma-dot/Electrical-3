// Frontend Configuration for Electrical Management System
const config = {
  // API Base URLs for different environments
  development: {
    apiBaseUrl: 'http://localhost:5000/api',
    socketUrl: 'http://localhost:5000'
  },
  production: {
    apiBaseUrl: 'https://electrical-management-system.onrender.com/api',
    socketUrl: 'https://electrical-management-system.onrender.com'
  },
  render: {
    apiBaseUrl: 'https://electrical-management-system.onrender.com/api',
    socketUrl: 'https://electrical-management-system.onrender.com'
  }
};

// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isRender = window.location.hostname.includes('onrender.com');

// Get current configuration
function getCurrentConfig() {
  if (isRender) {
    return config.render;
  } else if (isDevelopment) {
    return config.development;
  } else {
    return config.production;
  }
}

// Export configuration
window.appConfig = {
  ...getCurrentConfig(),
  isDevelopment,
  isRender,
  getApiUrl: (endpoint) => {
    const config = getCurrentConfig();
    return `${config.apiBaseUrl}${endpoint}`;
  },
  getSocketUrl: () => {
    const config = getCurrentConfig();
    return config.socketUrl;
  }
};

console.log('🚀 App Configuration Loaded:', window.appConfig);
