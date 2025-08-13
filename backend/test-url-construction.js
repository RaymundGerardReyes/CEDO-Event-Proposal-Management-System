/**
 * Test script for URL construction to prevent duplicate /api/ segments
 * This script tests various URL construction scenarios
 */

const axios = require('axios');

async function testUrlConstruction() {
    console.log('🧪 Testing URL construction to prevent duplicate /api/ segments...');

    const testCases = [
        {
            name: 'Standard localhost',
            baseUrl: 'http://localhost:5000',
            expected: 'http://localhost:5000/api/mongodb-unified/admin/proposals-hybrid'
        },
        {
            name: 'Base URL with trailing /api',
            baseUrl: 'http://localhost:5000/api',
            expected: 'http://localhost:5000/api/mongodb-unified/admin/proposals-hybrid'
        },
        {
            name: 'Base URL with trailing slash',
            baseUrl: 'http://localhost:5000/',
            expected: 'http://localhost:5000/api/mongodb-unified/admin/proposals-hybrid'
        },
        {
            name: 'Production URL example',
            baseUrl: 'https://api.example.com/api',
            expected: 'https://api.example.com/api/mongodb-unified/admin/proposals-hybrid'
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n📋 Testing: ${testCase.name}`);
        console.log(`📍 Input baseUrl: ${testCase.baseUrl}`);

        // Simulate the frontend URL construction logic
        let processedBaseUrl = testCase.baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
        if (processedBaseUrl.endsWith('/api')) {
            processedBaseUrl = processedBaseUrl.replace(/\/api$/, '');
        }

        const constructedUrl = `${processedBaseUrl}/api/mongodb-unified/admin/proposals-hybrid`;
        console.log(`🔧 Processed baseUrl: ${processedBaseUrl}`);
        console.log(`🔗 Constructed URL: ${constructedUrl}`);
        console.log(`✅ Expected: ${testCase.expected}`);
        console.log(`🎯 Match: ${constructedUrl === testCase.expected ? 'PASS' : 'FAIL'}`);

        if (constructedUrl !== testCase.expected) {
            console.log(`❌ URL construction failed!`);
            console.log(`   Expected: ${testCase.expected}`);
            console.log(`   Got:      ${constructedUrl}`);
        }
    }

    // Test actual API call
    console.log('\n🧪 Testing actual API call...');
    try {
        const response = await axios.get('http://localhost:5000/api/mongodb-unified/admin/proposals-hybrid?limit=1', {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true
        });

        console.log('✅ API call successful:', {
            status: response.status,
            statusText: response.statusText,
            hasData: !!response.data,
            success: response.data?.success
        });

    } catch (error) {
        console.error('❌ API call failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message
        });

        if (error.response?.status === 404) {
            console.log('\n🔍 404 Analysis:');
            console.log('- Check if the route is properly mounted');
            console.log('- Check if authentication middleware is working');
            console.log('- Check if the URL has duplicate /api/ segments');
        }
    }
}

// Run the test
testUrlConstruction().catch(console.error); 