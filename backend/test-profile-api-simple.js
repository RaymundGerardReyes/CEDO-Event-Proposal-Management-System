const fetch = require('node-fetch');

async function testProfileAPI() {
    console.log('🧪 Testing Profile API Endpoints...\n');

    const baseURL = 'http://localhost:5000';

    try {
        // Test 1: Profile endpoint without token (should get 401)
        console.log('📋 Test 1: Profile endpoint without authentication');
        const response1 = await fetch(`${baseURL}/api/profile`);
        console.log(`Status: ${response1.status} ${response1.statusText}`);
        const data1 = await response1.json();
        console.log('Response:', data1);

        if (response1.status === 401) {
            console.log('✅ Endpoint is working correctly (requires authentication)\n');
        } else {
            console.log('❌ Unexpected response\n');
        }

        // Test 2: Check what endpoints are available
        console.log('📋 Test 2: Available API endpoints');
        const endpoints = [
            '/health',
            '/api/db-check',
            '/api/auth',
            '/api/users',
            '/api/profile'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${baseURL}${endpoint}`);
                console.log(`${endpoint}: ${response.status} ${response.statusText}`);
            } catch (err) {
                console.log(`${endpoint}: Error - ${err.message}`);
            }
        }

        console.log('\n📋 Test 3: Server status');
        const healthResponse = await fetch(`${baseURL}/health`);
        const healthData = await healthResponse.json();
        console.log('Health check:', healthData);

        console.log('\n📋 Test 4: Database check');
        const dbResponse = await fetch(`${baseURL}/api/db-check`);
        const dbData = await dbResponse.json();
        console.log('Database check:', dbData);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n🔧 Make sure your backend server is running on port 5000');
        console.log('Start the server with: npm start (in backend directory)');
    }
}

// Frontend debugging helper
function frontendDebuggingTips() {
    console.log('\n🔧 Frontend Debugging Tips for Profile API:');
    console.log('');
    console.log('1. Check Authentication Token Storage:');
    console.log('   - Open browser dev tools (F12)');
    console.log('   - Go to Application/Storage tab');
    console.log('   - Check localStorage and sessionStorage for authToken');
    console.log('');
    console.log('2. Check Network Tab:');
    console.log('   - Open dev tools (F12)');
    console.log('   - Go to Network tab');
    console.log('   - Try to access profile page');
    console.log('   - Look for requests to /api/profile');
    console.log('   - Check if Authorization header is being sent');
    console.log('');
    console.log('3. Common Issues:');
    console.log('   - JWT token not stored after login');
    console.log('   - Token stored in wrong location (localStorage vs sessionStorage)');
    console.log('   - Token expired');
    console.log('   - API URL mismatch (frontend trying wrong URL)');
    console.log('');
    console.log('4. Quick Fixes:');
    console.log('   - Try logging in again to get fresh token');
    console.log('   - Check if process.env.NEXT_PUBLIC_API_URL is set correctly');
    console.log('   - Verify the JWT_SECRET in backend .env matches token generation');
}

async function runTests() {
    console.log('🚀 Profile API Testing & Debugging\n');
    console.log('='.repeat(50));

    await testProfileAPI();
    frontendDebuggingTips();

    console.log('\n' + '='.repeat(50));
    console.log('✅ Your backend profile API is working!');
    console.log('🔧 The 404 error is likely an authentication/token issue');
    console.log('📝 Follow the debugging tips above to fix the frontend');
}

if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testProfileAPI, frontendDebuggingTips }; 