#!/usr/bin/env node

/**
 * Test script to verify backend config endpoint is working
 * Run with: node scripts/test-config-endpoint.js
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:5000';

async function testConfigEndpoint() {
    console.log('🔍 Testing backend config endpoint...');
    console.log(`📍 Backend URL: ${BACKEND_URL}`);

    const cleanUrl = BACKEND_URL.endsWith('/api')
        ? BACKEND_URL.replace(/\/api$/, '')
        : BACKEND_URL;
    const configUrl = `${cleanUrl}/api/config`;

    console.log(`🔗 Config URL: ${configUrl}`);

    try {
        const response = await fetch(configUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors'
        });

        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
        console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Config data received:');
            console.log(JSON.stringify(data, null, 2));

            // Validate required fields
            if (data.recaptchaSiteKey) {
                console.log('✅ reCAPTCHA site key found');
            } else {
                console.log('⚠️  reCAPTCHA site key missing');
            }

            if (data.backendUrl) {
                console.log('✅ Backend URL found');
            } else {
                console.log('⚠️  Backend URL missing');
            }

        } else {
            const errorText = await response.text();
            console.log('❌ Error response:');
            console.log(errorText);
        }

    } catch (error) {
        console.error('❌ Request failed:');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);

        if (error.message.includes('Failed to fetch')) {
            console.log('\n🔧 Troubleshooting suggestions:');
            console.log('1. Check if backend server is running: cd backend && npm start');
            console.log('2. Verify the backend URL is correct');
            console.log('3. Check if the port is not blocked by firewall');
            console.log('4. Ensure CORS is properly configured');
        }
    }
}

// Test backend health first
async function testBackendHealth() {
    console.log('\n🏥 Testing backend health...');

    const cleanUrl = BACKEND_URL.endsWith('/api')
        ? BACKEND_URL.replace(/\/api$/, '')
        : BACKEND_URL;
    const healthUrl = cleanUrl.endsWith('/') ? cleanUrl : `${cleanUrl}/`;

    try {
        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend is healthy:');
            console.log(JSON.stringify(data, null, 2));
            return true;
        } else {
            console.log(`❌ Backend health check failed: ${response.status} ${response.statusText}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Backend health check failed:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting backend configuration tests...\n');

    const isHealthy = await testBackendHealth();

    if (isHealthy) {
        await testConfigEndpoint();
    } else {
        console.log('\n❌ Backend is not healthy, skipping config test');
        console.log('Please start the backend server first:');
        console.log('cd backend && npm start');
    }

    console.log('\n🏁 Tests completed');
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testConfigEndpoint, testBackendHealth };
