/**
 * Frontend Connection Test
 * Tests if the frontend can properly connect to the backend
 */

// Simulate browser environment
global.fetch = require('node-fetch');

// Test the API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

console.log('🧪 Testing Frontend-Backend Connection');
console.log('=====================================\n');

console.log('📋 Configuration:');
console.log(`   API Base URL: ${API_BASE_URL}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('');

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
        } else {
            console.log('   ❌ reCAPTCHA site key missing');
        }
        
        return true;
    } catch (error) {
        console.log('   ❌ Config endpoint failed');
        console.log(`   📄 Error: ${error.message}`);
        return false;
    }
}

async function testHealthEndpoint() {
    console.log('\n🔍 Testing Health Endpoint:');
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('   ✅ Health endpoint working');
        console.log(`   📄 Response: ${JSON.stringify(data, null, 2)}`);
        
        return true;
    } catch (error) {
        console.log('   ❌ Health endpoint failed');
        console.log(`   📄 Error: ${error.message}`);
        return false;
    }
}

async function testDatabaseEndpoint() {
    console.log('\n🔍 Testing Database Endpoint:');
    try {
        const response = await fetch(`${API_BASE_URL}/api/db-check`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('   ✅ Database endpoint working');
        console.log(`   📄 Response: ${JSON.stringify(data, null, 2)}`);
        
        return true;
    } catch (error) {
        console.log('   ❌ Database endpoint failed');
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
            'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
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

async function runAllTests() {
    console.log('🚀 Starting Frontend-Backend Connection Tests...\n');
    
    const tests = [
        { name: 'Config Endpoint', fn: testConfigEndpoint },
        { name: 'Health Endpoint', fn: testHealthEndpoint },
        { name: 'Database Endpoint', fn: testDatabaseEndpoint },
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
    } else {
        console.log('\n⚠️  Some tests failed. Check the issues above.');
        console.log('\n💡 Troubleshooting tips:');
        console.log('1. Ensure backend server is running on port 5000');
        console.log('2. Check CORS configuration in backend/server.js');
        console.log('3. Verify environment variables in .env files');
        console.log('4. Check network connectivity between frontend and backend');
        console.log('5. Ensure no firewall is blocking the connection');
    }
}

// Run the tests
runAllTests().catch(console.error); 