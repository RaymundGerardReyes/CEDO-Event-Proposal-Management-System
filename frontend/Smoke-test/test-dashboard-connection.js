/**
 * Test Dashboard API Connection
 * This script tests the connection between frontend and backend for dashboard data
 */

const backendUrl = 'http://localhost:5000';

async function testStatsEndpoint() {
    console.log('🧪 Testing /api/admin/stats endpoint...');

    try {
        const response = await fetch(`${backendUrl}/api/admin/stats`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        console.log('📡 Stats Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Stats API Error:', response.status, response.statusText, errorText);
            return false;
        }

        const data = await response.json();
        console.log('📊 Stats API Response:', data);
        return true;
    } catch (error) {
        console.error('❌ Stats API Connection Error:', error);
        return false;
    }
}

async function testProposalsEndpoint() {
    console.log('🧪 Testing /api/mongodb-unified/admin/proposals-hybrid endpoint...');

    try {
        const response = await fetch(`${backendUrl}/api/mongodb-unified/admin/proposals-hybrid?limit=2`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        console.log('📡 Proposals Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Proposals API Error:', response.status, response.statusText, errorText);
            return false;
        }

        const data = await response.json();
        console.log('📊 Proposals API Response:', {
            success: data.success,
            proposalCount: data.proposals?.length || 0,
            sampleProposal: data.proposals?.[0] || null
        });
        return true;
    } catch (error) {
        console.error('❌ Proposals API Connection Error:', error);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Dashboard API Connection Tests...');
    console.log('🔗 Backend URL:', backendUrl);

    const statsResult = await testStatsEndpoint();
    const proposalsResult = await testProposalsEndpoint();

    console.log('\n📋 Test Results:');
    console.log('✅ Stats Endpoint:', statsResult ? 'PASSED' : 'FAILED');
    console.log('✅ Proposals Endpoint:', proposalsResult ? 'PASSED' : 'FAILED');

    if (statsResult && proposalsResult) {
        console.log('\n🎉 All tests passed! Frontend can connect to backend.');
    } else {
        console.log('\n❌ Some tests failed. Check the errors above.');
    }
}

// Run tests if this script is executed directly
if (typeof window !== 'undefined') {
    // Browser environment
    runTests();
} else {
    // Node.js environment
    const fetch = require('node-fetch');
    runTests();
} 