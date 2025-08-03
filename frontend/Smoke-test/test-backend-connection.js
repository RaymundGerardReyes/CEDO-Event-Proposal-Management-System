// File: test-backend-connection.js
// Purpose: Test script to verify backend connectivity and diagnose fetch errors.
// Key approaches: Connection testing, error diagnosis, and health checking.

import { checkBackendHealth, testBackendConnection } from '../src/lib/api-utils.js';
import { getAppConfig, loadConfig } from '../src/lib/utils.js';

console.log('🔍 Testing Backend Connection...\n');

async function runConnectionTests() {
    console.log('📋 Test 1: Basic Config Load');
    try {
        const config = await loadConfig();
        console.log('✅ Config loaded successfully:', config);
    } catch (error) {
        console.log('❌ Config load failed:', error.message);
    }

    console.log('\n📋 Test 2: Health Check');
    try {
        const isHealthy = await checkBackendHealth();
        console.log(isHealthy ? '✅ Backend is healthy' : '❌ Backend health check failed');
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }

    console.log('\n📋 Test 3: Detailed Connection Test');
    try {
        const results = await testBackendConnection();
        console.log('📊 Connection Test Results:');
        console.log('- Config endpoint:', results.config ? '✅ Working' : '❌ Failed');
        console.log('- Health endpoint:', results.health ? '✅ Working' : '❌ Failed');
        if (results.errors.length > 0) {
            console.log('- Errors:', results.errors);
        }
    } catch (error) {
        console.log('❌ Connection test failed:', error.message);
    }

    console.log('\n📋 Test 4: Environment Variables');
    console.log('- NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'Not set');
    console.log('- API_URL:', process.env.API_URL || 'Not set');
    console.log('- BACKEND_URL:', process.env.BACKEND_URL || 'Not set');

    console.log('\n📋 Test 5: Current App Config');
    const currentConfig = getAppConfig();
    console.log('- Current config:', currentConfig);
}

// Run the tests
runConnectionTests().catch(console.error); 