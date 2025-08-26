// Frontend Configuration for Electrical Management System
const config = {
  // API Base URLs for different environments
  development: {
    apiBaseUrl: 'http://localhost:5000/api',
    socketUrl: 'http://localhost:5000'
  },
  production: {
    apiBaseUrl: 'https://electrical-3-iar3gsbul-thelma-dots-projects.vercel.app/api',
    socketUrl: 'https://electrical-3-iar3gsbul-thelma-dots-projects.vercel.app'
  },
  vercel: {
    apiBaseUrl: 'https://electrical-3-iar3gsbul-thelma-dots-projects.vercel.app/api',
    socketUrl: 'https://electrical-3-iar3gsbul-thelma-dots-projects.vercel.app'
  }
};

// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isVercel = window.location.hostname.includes('vercel.app');

// Get current configuration
function getCurrentConfig() {
  if (isVercel) {
    return config.vercel;
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
  isVercel,
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
