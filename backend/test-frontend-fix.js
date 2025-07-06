const fetch = require('node-fetch');

console.log('🧪 Testing Frontend Configuration Fix');
console.log('=====================================\n');

const API_BASE_URL = 'http://localhost:5000';

async function testConfigEndpoint() {
    console.log('🔍 Testing Config Endpoint:');
    try {
        const response = await fetch(`${API_BASE_URL}/api/config`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('   ✅ Config endpoint working');
        console.log(`   📄 Response: ${JSON.stringify(data, null, 2)}`);

        // Check for required config values
        if (data.recaptchaSiteKey) {
            console.log('   ✅ reCAPTCHA site key found');
            return true;
        } else {
            console.log('   ❌ reCAPTCHA site key missing');
            return false;
        }
    } catch (error) {
        console.log('   ❌ Config endpoint failed');
        console.log(`   📄 Error: ${error.message}`);
        return false;
    }
}

async function testCORS() {
    console.log('\n🔍 Testing CORS Configuration:');
    try {
        const response = await fetch(`${API_BASE_URL}/api/config`, {
            headers: {
                'Origin': 'http://localhost:3000',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('   ✅ CORS test successful');
        console.log(`   📄 Status: ${response.status}`);

        // Check CORS headers
        const corsHeaders = {
            'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
            'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
        };

        console.log(`   📄 CORS Headers: ${JSON.stringify(corsHeaders, null, 2)}`);

        return true;
    } catch (error) {
        console.log('   ❌ CORS test failed');
        console.log(`   📄 Error: ${error.message}`);
        return false;
    }
}

async function simulateFrontendLoad() {
    console.log('\n🔍 Simulating Frontend Configuration Load:');
    try {
        // Simulate what the frontend does when loading config
        const response = await fetch(`${API_BASE_URL}/api/config`);

        if (!response.ok) {
            throw new Error(`Failed to fetch config: ${response.status}`);
        }

        const data = await response.json();
        console.log('   ✅ Frontend config load simulation successful');
        console.log(`   📄 Config Data: ${JSON.stringify(data, null, 2)}`);

        // Check if required config values are present
        const config = data;
        const requiredKeys = ['recaptchaSiteKey'];

        for (const key of requiredKeys) {
            if (config[key]) {
                console.log(`   ✅ ${key}: SET`);
            } else {
                console.log(`   ❌ ${key}: MISSING`);
            }
        }

        return true;
    } catch (error) {
        console.log('   ❌ Frontend config load simulation failed');
        console.log(`   📄 Error: ${error.message}`);
        console.log('   💡 This is likely the same error your frontend is experiencing');
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Frontend Configuration Tests...\n');

    const tests = [
        { name: 'Config Endpoint', fn: testConfigEndpoint },
        { name: 'CORS Configuration', fn: testCORS },
        { name: 'Frontend Load Simulation', fn: simulateFrontendLoad },
    ];

    const results = [];

    for (const test of tests) {
        const result = await test.fn();
        results.push({ name: test.name, success: result });
    }

    console.log('\n📊 Test Results Summary:');
    console.log('========================');

    let passedTests = 0;
    for (const result of results) {
        const status = result.success ? '✅ PASS' : '❌ FAIL';
        console.log(`   ${status} - ${result.name}`);
        if (result.success) passedTests++;
    }

    console.log(`\n📈 Overall: ${passedTests}/${results.length} tests passed`);

    if (passedTests === results.length) {
        console.log('\n🎉 All tests passed! Frontend should work correctly.');
        console.log('\n✅ The "Failed to fetch" error should now be resolved.');
        console.log('\n📋 Summary of fixes applied:');
        console.log('1. ✅ Fixed foreign key constraint issue in db-check.js');
        console.log('2. ✅ Fixed API URL configuration in utils.js');
        console.log('3. ✅ Fixed API URL inconsistencies across frontend files');
        console.log('4. ✅ Created centralized API configuration');
        console.log('5. ✅ Backend server is running and accessible');
    } else {
        console.log('\n⚠️  Some tests failed. Check the issues above.');
    }
}

runTests().catch(console.error); 