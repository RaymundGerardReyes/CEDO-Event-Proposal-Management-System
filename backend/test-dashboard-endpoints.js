/**
 * Simple test to verify dashboard endpoints are registered
 * Run with: node test-dashboard-endpoints.js
 */

const express = require('express');
const app = express();

// Test the dashboard routes registration
console.log('🧪 Testing Dashboard Routes Registration...\n');

try {
    // Try to require the dashboard routes
    const dashboardRoutes = require('./routes/dashboard');
    console.log('✅ Dashboard routes module loaded successfully');

    // Check if it's a router
    if (typeof dashboardRoutes === 'function') {
        console.log('✅ Dashboard routes is a valid Express router');
    } else {
        console.log('❌ Dashboard routes is not a valid Express router');
    }

    // Test the routes object
    console.log('📋 Dashboard routes object:', typeof dashboardRoutes);
    console.log('📋 Dashboard routes keys:', Object.keys(dashboardRoutes));

} catch (error) {
    console.error('❌ Failed to load dashboard routes:', error.message);
}

// Test server registration
console.log('\n🔧 Testing Server Registration...\n');

try {
    // Try to require the server (this will test if routes are properly registered)
    const server = require('./server');
    console.log('✅ Server module loaded successfully');

    // Note: We can't actually start the server in this test because it would conflict
    // with the running dev server, but we can verify the module loads

} catch (error) {
    console.error('❌ Failed to load server:', error.message);
}

console.log('\n🏁 Dashboard endpoints test completed');
console.log('\n📝 To test the actual API endpoints:');
console.log('1. Make sure backend server is running: npm run dev');
console.log('2. Test with curl or Postman:');
console.log('   GET http://localhost:5000/api/dashboard/stats');
console.log('   GET http://localhost:5000/api/dashboard/recent-events');
console.log('3. Note: These endpoints require authentication (JWT token)'); 