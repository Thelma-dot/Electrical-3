// Frontend Configuration for Electrical Management System
const config = {
  // API Base URLs for different environments
  development: {
    apiBaseUrl: 'http://localhost:5000/api',
    socketUrl: 'http://localhost:5000'
  },
  production: {
    apiBaseUrl: 'https://electrical-3-production.up.railway.app/api',
    socketUrl: 'https://electrical-3-production.up.railway.app'
  },
  vercel: {
    apiBaseUrl: 'https://electrical-3-iar3gsbul-thelma-dots-projects.vercel.app/api',
    socketUrl: 'https://electrical-3-iar3gsbul-thelma-dots-projects.vercel.app'
  },
  netlify: {
    apiBaseUrl: 'https://electrical-management-system.onrender.com/api',
    socketUrl: 'https://electrical-management-system.onrender.com'
  },
  render: {
    apiBaseUrl: 'https://electrical-management-system.onrender.com/api',
    socketUrl: 'https://electrical-management-system.onrender.com'
  },
  railway: {
    apiBaseUrl: 'https://electrical-3-production.up.railway.app/api',
    socketUrl: 'https://electrical-3-production.up.railway.app'
  }
};

// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isVercel = window.location.hostname.includes('vercel.app');
const isNetlify = window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com');
const isRender = window.location.hostname.includes('onrender.com');
const isRailway = window.location.hostname.includes('railway.app') || window.location.hostname.includes('up.railway.app');

// Get current configuration
function getCurrentConfig() {
  if (isRailway) {
    return config.railway;
  } else if (isNetlify) {
    return config.netlify;
  } else if (isRender) {
    return config.render;
  } else if (isVercel) {
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
  isNetlify,
  isRender,
  isRailway,
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
console.log('🌐 Current Environment:', {
  isDevelopment,
  isVercel,
  isNetlify,
  isRender,
  isRailway,
  hostname: window.location.hostname
});
