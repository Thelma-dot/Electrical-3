// Utility script to update hardcoded localhost URLs
// This script helps replace all hardcoded URLs with configuration-based ones

// Function to get API URL from configuration
function getApiUrl(endpoint) {
    if (window.appConfig && window.appConfig.getApiUrl) {
        return window.appConfig.getApiUrl(endpoint);
    }
    // Fallback to Vercel URL if config not loaded
    return `https://electrical-3-iar3gsbul-thelma-dots-projects.vercel.app/api${endpoint}`;
}

// Function to get Socket URL from configuration
function getSocketUrl() {
    if (window.appConfig && window.appConfig.getSocketUrl) {
        return window.appConfig.getSocketUrl();
    }
    // Fallback to Vercel URL if config not loaded
    return 'https://electrical-3-iar3gsbul-thelma-dots-projects.vercel.app';
}

// Export these functions globally for use in other scripts
window.getApiUrl = getApiUrl;
window.getSocketUrl = getSocketUrl;

console.log('🔧 URL utility functions loaded');
console.log('📡 API URL example:', getApiUrl('/auth/login'));
console.log('🔌 Socket URL example:', getSocketUrl());
