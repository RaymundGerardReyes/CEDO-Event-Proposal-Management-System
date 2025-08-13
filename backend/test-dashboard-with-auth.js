const jwt = require('jsonwebtoken');
const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-development-jwt-secret-key';

// Create a test user token
const testUser = {
    id: 10,
    email: 'test@example.com',
    role: 'student'
};

const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });

async function testDashboardEndpoints() {
    console.log('🧪 Testing Dashboard API Endpoints with Authentication');
    console.log('='.repeat(50));

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    try {
        // Test dashboard stats endpoint
        console.log('📊 Testing /api/dashboard/stats...');
        const statsResponse = await axios.get(`${BASE_URL}/api/dashboard/stats`, {
            headers: headers
        });

        console.log(`Status: ${statsResponse.status}`);
        console.log('✅ Dashboard stats endpoint working!');
        console.log('Response:', JSON.stringify(statsResponse.data, null, 2));

        console.log('\n' + '='.repeat(50));

        // Test recent events endpoint
        console.log('📅 Testing /api/dashboard/recent-events...');
        const eventsResponse = await axios.get(`${BASE_URL}/api/dashboard/recent-events`, {
            headers: headers
        });

        console.log(`Status: ${eventsResponse.status}`);
        console.log('✅ Recent events endpoint working!');
        console.log('Response:', JSON.stringify(eventsResponse.data, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    }
}

// Run the test
testDashboardEndpoints(); 