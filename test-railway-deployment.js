// Test Railway Deployment
const https = require('https');

const RAILWAY_URL = 'https://electrical-3-production.up.railway.app';

console.log('🧪 Testing Railway Deployment...');
console.log(`📍 URL: ${RAILWAY_URL}`);
console.log('='.repeat(50));

// Test health endpoint
function testHealth() {
    return new Promise((resolve, reject) => {
        const req = https.get(`${RAILWAY_URL}/health`, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('✅ Health Check:', response.status);
                    console.log('   Database:', response.database);
                    console.log('   Environment:', response.environment);
                    resolve(response);
                } catch (error) {
                    console.log('❌ Health Check Failed - Invalid JSON');
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Health Check Failed - Connection Error');
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.log('❌ Health Check Failed - Timeout');
            reject(new Error('Timeout'));
        });
    });
}

// Test API endpoint
function testAPI() {
    return new Promise((resolve, reject) => {
        const req = https.get(`${RAILWAY_URL}/api/test`, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('✅ API Test:', response.message);
                    console.log('   Database:', response.database);
                    console.log('   Environment:', response.environment);
                    resolve(response);
                } catch (error) {
                    console.log('❌ API Test Failed - Invalid JSON');
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ API Test Failed - Connection Error');
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.log('❌ API Test Failed - Timeout');
            reject(new Error('Timeout'));
        });
    });
}

// Test frontend
function testFrontend() {
    return new Promise((resolve, reject) => {
        const req = https.get(RAILWAY_URL, (res) => {
            console.log('✅ Frontend Test:', res.statusCode);
            console.log('   Status:', res.statusMessage);
            console.log('   Content-Type:', res.headers['content-type']);
            resolve(res);
        });

        req.on('error', (error) => {
            console.log('❌ Frontend Test Failed - Connection Error');
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.log('❌ Frontend Test Failed - Timeout');
            reject(new Error('Timeout'));
        });
    });
}

// Test CORS
function testCORS() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'electrical-3-production.up.railway.app',
            port: 443,
            path: '/api/test',
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://electrical-3.netlify.app',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        };

        const req = https.request(options, (res) => {
            console.log('✅ CORS Test:', res.statusCode);
            console.log('   Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
            console.log('   Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
            resolve(res);
        });

        req.on('error', (error) => {
            console.log('❌ CORS Test Failed - Connection Error');
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            console.log('❌ CORS Test Failed - Timeout');
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

// Run all tests
async function runTests() {
    try {
        console.log('🚀 Starting tests...\n');

        // Test 1: Health Check
        console.log('1️⃣ Testing Health Endpoint...');
        await testHealth();
        console.log('');

        // Test 2: API Endpoint
        console.log('2️⃣ Testing API Endpoint...');
        await testAPI();
        console.log('');

        // Test 3: Frontend
        console.log('3️⃣ Testing Frontend...');
        await testFrontend();
        console.log('');

        // Test 4: CORS
        console.log('4️⃣ Testing CORS...');
        await testCORS();
        console.log('');

        console.log('🎉 All tests completed successfully!');
        console.log('✅ Your Railway deployment is working correctly');
        console.log('');
        console.log('🔗 Next steps:');
        console.log('   1. Set up database: npm run setup-railway');
        console.log('   2. Test login functionality');
        console.log('   3. Verify all features work');

    } catch (error) {
        console.log('');
        console.log('❌ Some tests failed');
        console.log('🔍 Check Railway logs for more details');
        console.log('📋 Verify environment variables are set correctly');
        console.log('');
        console.log('Error:', error.message);
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests, testHealth, testAPI, testFrontend, testCORS };
