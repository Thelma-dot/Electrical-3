// Test CORS configuration
const fetch = require('node-fetch');

async function testCORS() {
    const testUrl = 'https://electrical-management-system.onrender.com/api/test';

    console.log('🧪 Testing CORS configuration...');
    console.log('📍 Testing URL:', testUrl);

    try {
        // Test with null origin (simulating file:// protocol)
        const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
                'Origin': 'null',
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Response Status:', response.status);
        console.log('✅ Response Headers:');
        console.log('  - Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
        console.log('  - Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'));
        console.log('  - Access-Control-Allow-Headers:', response.headers.get('access-control-allow-headers'));
        console.log('  - Access-Control-Allow-Credentials:', response.headers.get('access-control-allow-credentials'));

        const data = await response.json();
        console.log('✅ Response Data:', data);

    } catch (error) {
        console.error('❌ CORS Test Failed:', error.message);
    }
}

// Test OPTIONS preflight request
async function testPreflight() {
    const testUrl = 'https://electrical-management-system.onrender.com/api/auth/login';

    console.log('\n🧪 Testing OPTIONS preflight request...');
    console.log('📍 Testing URL:', testUrl);

    try {
        const response = await fetch(testUrl, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'null',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });

        console.log('✅ Preflight Response Status:', response.status);
        console.log('✅ Preflight Response Headers:');
        console.log('  - Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'));
        console.log('  - Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'));
        console.log('  - Access-Control-Allow-Headers:', response.headers.get('access-control-allow-headers'));
        console.log('  - Access-Control-Allow-Credentials:', response.headers.get('access-control-allow-credentials'));

    } catch (error) {
        console.error('❌ Preflight Test Failed:', error.message);
    }
}

// Run tests
if (require.main === module) {
    testCORS().then(() => testPreflight());
}

module.exports = { testCORS, testPreflight };
