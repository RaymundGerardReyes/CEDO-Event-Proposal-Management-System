const axios = require('axios');

console.log('🧪 Testing Frontend-Backend Connection');
console.log('=====================================\n');

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
    const endpoints = [
        { name: 'Health Check', url: '/health', method: 'GET' },
        { name: 'Config', url: '/api/config', method: 'GET' },
        { name: 'Database Check', url: '/api/db-check', method: 'GET' },
        { name: 'Tables Check', url: '/api/tables-check', method: 'GET' },
        { name: 'Auth Status', url: '/api/auth/status', method: 'GET' }
    ];

    console.log('🔍 Testing Backend Endpoints:\n');

    for (const endpoint of endpoints) {
        try {
            console.log(`📋 Testing: ${endpoint.name}`);
            console.log(`   URL: ${BASE_URL}${endpoint.url}`);

            const response = await axios({
                method: endpoint.method,
                url: `${BASE_URL}${endpoint.url}`,
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📄 Response: ${JSON.stringify(response.data, null, 2)}`);
            console.log('');
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`   📄 Status: ${error.response.status}`);
                console.log(`   📄 Data: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            console.log('');
        }
    }
}

async function testCORS() {
    console.log('🔍 Testing CORS Configuration:\n');

    try {
        // Test with frontend origin
        const response = await axios({
            method: 'GET',
            url: `${BASE_URL}/api/config`,
            headers: {
                'Origin': 'http://localhost:3000',
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ CORS test successful');
        console.log(`   Status: ${response.status}`);
        console.log(`   CORS Headers: ${JSON.stringify(response.headers, null, 2)}`);
    } catch (error) {
        console.log('❌ CORS test failed');
        console.log(`   Error: ${error.message}`);
    }
}

async function testFrontendSimulation() {
    console.log('\n🔍 Simulating Frontend Configuration Fetch:\n');

    try {
        // Simulate what the frontend does when loading config
        const configResponse = await axios.get(`${BASE_URL}/api/config`);

        console.log('✅ Frontend config fetch simulation successful');
        console.log(`   Config Data: ${JSON.stringify(configResponse.data, null, 2)}`);

        // Check if required config values are present
        const config = configResponse.data;
        const requiredKeys = ['recaptchaSiteKey'];

        for (const key of requiredKeys) {
            if (config[key]) {
                console.log(`   ✅ ${key}: ${config[key] ? 'SET' : 'MISSING'}`);
            } else {
                console.log(`   ❌ ${key}: MISSING`);
            }
        }

    } catch (error) {
        console.log('❌ Frontend config fetch simulation failed');
        console.log(`   Error: ${error.message}`);
        console.log(`   This is likely the same error your frontend is experiencing`);
    }
}

async function runTests() {
    try {
        await testEndpoints();
        await testCORS();
        await testFrontendSimulation();

        console.log('🎉 All tests completed!');
        console.log('\n💡 If any tests failed, check:');
        console.log('1. Backend server is running on port 5000');
        console.log('2. CORS configuration in server.js');
        console.log('3. Environment variables in .env file');
        console.log('4. Frontend is configured to use http://localhost:5000');

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
}

runTests(); 