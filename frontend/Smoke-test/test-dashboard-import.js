/**
 * Test script to verify dashboard API imports work correctly
 * Run with: node test-dashboard-import.js
 */

console.log('🧪 Testing Dashboard API Import...\n');

try {
    // Test if we can import the dashboard API
    const dashboardAPI = require('../src/lib/dashboard-api.js');

    console.log('✅ Dashboard API module imported successfully');
    console.log('📋 Available functions:', Object.keys(dashboardAPI));

    // Check if the expected functions exist
    const expectedFunctions = [
        'fetchDashboardStats',
        'fetchRecentEvents',
        'getDashboardStatsWithFallback'
    ];

    expectedFunctions.forEach(funcName => {
        if (typeof dashboardAPI[funcName] === 'function') {
            console.log(`✅ ${funcName} function exists`);
        } else {
            console.log(`❌ ${funcName} function missing`);
        }
    });

} catch (error) {
    console.error('❌ Failed to import dashboard API:', error.message);
    console.error('Stack trace:', error.stack);
}

console.log('\n🏁 Dashboard API import test completed'); 