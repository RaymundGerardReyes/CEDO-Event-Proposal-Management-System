/**
 * Get Authentication Token
 * Logs in and retrieves a JWT token for testing
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function getAuthToken() {
    try {
        console.log('🔑 Getting Authentication Token...');
        console.log('📍 Base URL:', BASE_URL);

        // Login with admin credentials
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });

        console.log('✅ Login successful!');
        console.log('📊 Response Status:', loginResponse.status);
        console.log('📋 User Data:', loginResponse.data.user);
        console.log('🔑 Token:', loginResponse.data.token);

        return loginResponse.data.token;

    } catch (error) {
        console.error('❌ Login Failed:');

        if (error.response) {
            console.error('- Status:', error.response.status);
            console.error('- Data:', error.response.data);
        } else if (error.request) {
            console.error('- Network Error:', error.message);
        } else {
            console.error('- Error:', error.message);
        }
        return null;
    }
}

// Run the function and export the token
getAuthToken().then(token => {
    if (token) {
        console.log('\n🎯 Use this token for testing:');
        console.log(`const AUTH_TOKEN = '${token}';`);
    }
});


