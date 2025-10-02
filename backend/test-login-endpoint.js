#!/usr/bin/env node

/**
 * Test Login Endpoint
 * 
 * This script tests the login endpoint to see what's happening
 */

const axios = require('axios');

async function testLoginEndpoint() {
    console.log('🔧 Testing Login Endpoint...');

    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Login response received');
        console.log('📊 Status:', response.status);
        console.log('📊 Data:', JSON.stringify(response.data, null, 2));

        return response.data;

    } catch (error) {
        console.error('❌ Login test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

async function testWithExistingUser() {
    console.log('\n🔧 Testing with Existing User...');

    try {
        // Try with an existing user from the database
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'manager@cedo.gov.ph',
            password: 'password123'  // Try common password
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Login with existing user successful');
        console.log('📊 Status:', response.status);
        console.log('📊 Data:', JSON.stringify(response.data, null, 2));

        return response.data;

    } catch (error) {
        console.error('❌ Login with existing user failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

async function runTest() {
    console.log('🚀 Starting Login Endpoint Test\n');

    try {
        const adminResult = await testLoginEndpoint();
        const existingResult = await testWithExistingUser();

        if (adminResult && adminResult.success) {
            console.log('\n✅ Admin login is working!');
            console.log('📊 Token:', adminResult.token?.substring(0, 20) + '...');
        } else if (existingResult && existingResult.success) {
            console.log('\n✅ Existing user login is working!');
            console.log('📊 Token:', existingResult.token?.substring(0, 20) + '...');
        } else {
            console.log('\n❌ No login method is working. Please check your backend authentication setup.');
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    runTest().catch(console.error);
}

module.exports = {
    runTest,
    testLoginEndpoint,
    testWithExistingUser
};





