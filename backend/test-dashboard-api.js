/**
 * Test script for Dashboard API endpoints
 * Run with: node test-dashboard-api.js
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

// Test data - you'll need to replace with a valid token
const TEST_TOKEN = 'your-test-token-here';

async function testDashboardAPI() {
    console.log('🧪 Testing Dashboard API endpoints...\n');

    try {
        // Test 1: Dashboard Stats endpoint
        console.log('📊 Test 1: Testing /api/dashboard/stats');
        const statsResponse = await fetch(`${BASE_URL}/api/dashboard/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_TOKEN}`,
            },
        });

        console.log(`Status: ${statsResponse.status}`);
        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('✅ Stats endpoint working:', {
                success: statsData.success,
                hasStats: !!statsData.stats,
                sdpCredits: statsData.stats?.sdpCredits,
                events: statsData.stats?.events,
                progress: statsData.stats?.progress
            });
        } else {
            const errorText = await statsResponse.text();
            console.log('❌ Stats endpoint error:', errorText);
        }

        console.log('\n📋 Test 2: Testing /api/dashboard/recent-events');
        const eventsResponse = await fetch(`${BASE_URL}/api/dashboard/recent-events?limit=5`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_TOKEN}`,
            },
        });

        console.log(`Status: ${eventsResponse.status}`);
        if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            console.log('✅ Recent events endpoint working:', {
                success: eventsData.success,
                eventsCount: eventsData.events?.length || 0,
                total: eventsData.total
            });
        } else {
            const errorText = await eventsResponse.text();
            console.log('❌ Recent events endpoint error:', errorText);
        }

        // Test 3: Health check
        console.log('\n🏥 Test 3: Testing health endpoint');
        const healthResponse = await fetch(`${BASE_URL}/health`);
        console.log(`Health Status: ${healthResponse.status}`);
        if (healthResponse.ok) {
            console.log('✅ Backend server is running');
        } else {
            console.log('❌ Backend server not responding');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testDashboardAPI().then(() => {
    console.log('\n🏁 Dashboard API test completed');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
}); 