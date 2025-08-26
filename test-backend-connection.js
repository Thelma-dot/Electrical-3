// Test Backend Connection
const backendUrl = 'https://electrical-management-system.onrender.com';

console.log('🧪 Testing Backend Connection...\n');

// Test 1: Health Check
async function testHealthCheck() {
    try {
        const response = await fetch(`${backendUrl}/health`);
        const data = await response.json();
        console.log('✅ Health Check:', data);
    } catch (error) {
        console.log('❌ Health Check Failed:', error.message);
    }
}

// Test 2: Test Endpoint
async function testEndpoint() {
    try {
        const response = await fetch(`${backendUrl}/api/test`);
        const data = await response.json();
        console.log('✅ Test Endpoint:', data);
    } catch (error) {
        console.log('❌ Test Endpoint Failed:', error.message);
    }
}

// Test 3: Auth Endpoint (should return 404 for GET)
async function testAuthEndpoint() {
    try {
        const response = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'GET'
        });
        console.log('✅ Auth Endpoint Status:', response.status);
    } catch (error) {
        console.log('❌ Auth Endpoint Failed:', error.message);
    }
}

// Test 4: CORS Preflight
async function testCORS() {
    try {
        const response = await fetch(`${backendUrl}/api/test`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://electrical-3.netlify.app'
            }
        });
        console.log('✅ CORS Preflight Status:', response.status);
        console.log('✅ CORS Headers:', {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods')
        });
    } catch (error) {
        console.log('❌ CORS Test Failed:', error.message);
    }
}

// Run all tests
async function runTests() {
    await testHealthCheck();
    await testEndpoint();
    await testAuthEndpoint();
    await testCORS();

    console.log('\n🎯 Test Results Summary:');
    console.log('If you see ✅ marks, your backend is working!');
    console.log('If you see ❌ marks, there might be an issue.');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    runTests();
} else {
    // Browser environment
    runTests();
}
