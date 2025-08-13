const jwt = require('jsonwebtoken');
const axios = require('axios');
const { pool } = require('./config/db');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-development-jwt-secret-key';

async function testDashboardEndpoints() {
    console.log('🧪 Testing Dashboard API Endpoints with Real User');
    console.log('='.repeat(50));
    console.log('🔑 Using JWT_SECRET:', JWT_SECRET);

    try {
        // Get a real user from the database
        console.log('🔍 Fetching real user from database...');
        const [users] = await pool.query(
            "SELECT id, email, role, name FROM users WHERE is_approved = 1 LIMIT 1"
        );

        if (!users.length) {
            console.log('❌ No approved users found in database');
            return;
        }

        const user = users[0];
        console.log('✅ Found user:', {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        });

        // Create a token with the real user ID
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        console.log('🔑 Generated token:', token.substring(0, 50) + '...');

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // Test dashboard stats endpoint
        console.log('\n📊 Testing /api/dashboard/stats...');
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
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Connection refused - make sure the backend server is running on port 5000');
        }
    } finally {
        // Close the database connection
        await pool.end();
    }
}

// Run the test
testDashboardEndpoints(); 