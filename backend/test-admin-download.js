/**
 * Simple Admin Download Route Test
 * Tests the actual download functionality
 */

const request = require('supertest');
const app = require('./server');

console.log('🧪 Testing Admin Download Routes');
console.log('================================\n');

const testAdminDownload = async () => {
    try {
        console.log('📋 Test 1: Check if admin routes are accessible');

        // Test the admin proposals list route first
        const listResponse = await request(app)
            .get('/api/admin/proposals')
            .expect(401); // Should require authentication

        console.log('✅ Admin proposals route exists (401 = requires auth)');

        // Test the download route
        console.log('\n📋 Test 2: Testing download route');
        console.log('Testing: GET /api/admin/proposals/52/download/projectProposal');

        const downloadResponse = await request(app)
            .get('/api/admin/proposals/52/download/projectProposal');

        console.log(`📊 Download route response: ${downloadResponse.status}`);
        console.log(`📊 Response body:`, downloadResponse.body);

        if (downloadResponse.status === 404) {
            console.log('✅ Route exists but proposal not found (expected)');
        } else if (downloadResponse.status === 401) {
            console.log('✅ Route exists but requires authentication (expected)');
        } else {
            console.log('❌ Unexpected response');
        }

    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }
};

const testRouteRegistration = () => {
    console.log('\n📋 Test 3: Route Registration Analysis');
    console.log('--------------------------------------');

    // Check if the app has the router
    if (app._router) {
        console.log('✅ Express router exists');

        // Count middleware layers
        const middlewareCount = app._router.stack.length;
        console.log(`📊 Total middleware layers: ${middlewareCount}`);

        // Look for admin-related middleware
        let adminMiddlewareFound = false;
        app._router.stack.forEach((middleware, index) => {
            if (middleware.name === 'router' && middleware.regexp.source.includes('admin')) {
                console.log(`✅ Found admin router at index ${index}`);
                console.log(`   Regexp: ${middleware.regexp.source}`);
                adminMiddlewareFound = true;
            }
        });

        if (!adminMiddlewareFound) {
            console.log('❌ No admin router found in middleware stack');
        }

    } else {
        console.log('❌ No Express router found');
    }
};

// Run tests
testAdminDownload()
    .then(() => {
        testRouteRegistration();
        console.log('\n🎯 Testing Complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
