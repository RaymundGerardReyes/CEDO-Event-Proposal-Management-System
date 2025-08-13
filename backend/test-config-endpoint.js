/**
 * Test script to verify config endpoint functionality
 */

const axios = require('axios');

async function testConfigEndpoint() {
    console.log('🧪 Testing config endpoint...');

    try {
        const startTime = Date.now();
        const response = await axios.get('http://localhost:5000/api/config', {
            timeout: 10000 // 10 second timeout
        });
        const duration = Date.now() - startTime;

        console.log('✅ Config endpoint test successful!');
        console.log(`📊 Response time: ${duration}ms`);
        console.log('📋 Response data:', response.data);

        // Test caching by making another request
        console.log('\n🧪 Testing config caching...');
        const startTime2 = Date.now();
        const response2 = await axios.get('http://localhost:5000/api/config', {
            timeout: 10000
        });
        const duration2 = Date.now() - startTime2;

        console.log('✅ Second request successful!');
        console.log(`📊 Second response time: ${duration2}ms`);
        console.log('📋 Second response data:', response2.data);

        if (duration2 < duration) {
            console.log('🎉 Caching appears to be working (second request faster)');
        }

    } catch (error) {
        console.error('❌ Config endpoint test failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Make sure the backend server is running on port 5000');
        }
        process.exit(1);
    }
}

// Run the test
testConfigEndpoint(); 