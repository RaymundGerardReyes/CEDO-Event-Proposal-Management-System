/**
 * Simple Backend Connection Test
 * Tests if the backend server is running and accessible
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testBackendConnection() {
    try {
        console.log('🧪 Testing Backend Connection...');
        console.log('📍 Base URL:', BASE_URL);

        // Test basic server health
        const response = await axios.get(`${BASE_URL}/api/health`, {
            timeout: 5000
        });

        console.log('✅ Backend Server is running!');
        console.log('📊 Response Status:', response.status);
        console.log('📋 Response Data:', response.data);

    } catch (error) {
        console.error('❌ Backend Connection Failed:');

        if (error.response) {
            console.error('- Status:', error.response.status);
            console.error('- Data:', error.response.data);
        } else if (error.request) {
            console.error('- Network Error: Backend server is not running or not accessible');
            console.error('- Make sure to run: npm start in the backend directory');
        } else {
            console.error('- Error:', error.message);
        }
    }
}

// Run the test
testBackendConnection();
