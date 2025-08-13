/**
 * Test script for proposals-hybrid endpoint
 * This script tests the /api/mongodb-unified/admin/proposals-hybrid endpoint
 */

const axios = require('axios');

async function testProposalsHybrid() {
    const baseURL = 'http://localhost:5000';
    const endpoint = '/api/mongodb-unified/admin/proposals-hybrid';

    console.log('🧪 Testing proposals-hybrid endpoint...');
    console.log(`📍 URL: ${baseURL}${endpoint}`);

    try {
        // Test 1: Basic GET request
        console.log('\n📋 Test 1: Basic GET request');
        const response = await axios.get(`${baseURL}${endpoint}?limit=10`, {
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true
        });

        console.log('✅ Response received:', {
            status: response.status,
            statusText: response.statusText,
            dataKeys: Object.keys(response.data || {}),
            success: response.data?.success,
            proposalCount: response.data?.proposals?.length || 0
        });

        if (response.data?.proposals) {
            console.log('📊 Sample proposal:', response.data.proposals[0] || 'No proposals found');
        }

    } catch (error) {
        console.error('❌ Test failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            data: error.response?.data
        });

        if (error.response?.status === 404) {
            console.log('\n🔍 404 Error Analysis:');
            console.log('- Check if the route is properly mounted in server.js');
            console.log('- Check if the route file is properly exported');
            console.log('- Check if authentication middleware is working');
        }
    }
}

// Run the test
testProposalsHybrid().catch(console.error); 