/**
 * Authentication Debug Script
 * Purpose: Test backend connectivity and authentication endpoints
 * Usage: node scripts/debug-auth.js
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000';

async function testBackendConnectivity() {
    console.log('🔍 Testing backend connectivity...');
    console.log('📍 API Base URL:', API_BASE_URL);

    try {
        // Test health endpoint
        const healthResponse = await axios.get(`${API_BASE_URL}/health`);
        console.log('✅ Health check successful:', healthResponse.status);

        // Test auth endpoint structure
        const authResponse = await axios.get(`${API_BASE_URL}/api/auth`);
        console.log('✅ Auth endpoint accessible:', authResponse.status);

        return true;
    } catch (error) {
        console.error('❌ Backend connectivity test failed:', {
            status: error.response?.status,
            message: error.message,
            url: error.config?.url
        });
        return false;
    }
}

async function testAuthEndpoints() {
    console.log('\n🔐 Testing authentication endpoints...');

    const endpoints = [
        '/health',
        '/api/auth',
        '/auth'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${API_BASE_URL}${endpoint}`);
            console.log(`✅ ${endpoint}: ${response.status}`);
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.response?.status || 'Network Error'}`);
        }
    }
}

async function main() {
    console.log('🚀 Starting authentication debug script...\n');

    const isConnected = await testBackendConnectivity();
    if (!isConnected) {
        console.log('\n❌ Backend is not reachable. Please check:');
        console.log('1. Backend server is running (npm run dev in backend directory)');
        console.log('2. Port 5000 is not blocked');
        console.log('3. CORS is properly configured');
        return;
    }

    await testAuthEndpoints();

    console.log('\n✅ Debug script completed');
}

main().catch(console.error); 