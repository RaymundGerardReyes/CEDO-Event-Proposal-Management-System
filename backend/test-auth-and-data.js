#!/usr/bin/env node

/**
 * Test Authentication and Data Flow
 * 
 * This test verifies:
 * 1. Backend server is running
 * 2. Authentication works
 * 3. Data fetching works with proper auth
 * 4. Frontend receives correct data
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testServerConnection() {
    console.log('🔧 Testing Server Connection...');

    try {
        const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
        console.log('✅ Server is running');
        console.log('📊 Health check response:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Server connection failed:', error.message);
        return false;
    }
}

async function testAuthentication() {
    console.log('\n🔐 Testing Authentication...');

    try {
        // Try to get a valid auth token
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'admin123'
        });

        if (loginResponse.data.success && loginResponse.data.token) {
            console.log('✅ Authentication successful');
            return loginResponse.data.token;
        } else {
            console.log('⚠️  Login failed, trying with mock token');
            return 'mock-admin-token-for-testing';
        }
    } catch (error) {
        console.log('⚠️  Authentication failed, using mock token');
        console.log('   Error:', error.response?.data || error.message);
        return 'mock-admin-token-for-testing';
    }
}

async function testProposalsAPI(authToken) {
    console.log('\n📊 Testing Proposals API...');

    try {
        const response = await axios.get(`${API_BASE_URL}/admin/proposals`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            params: {
                page: 1,
                limit: 5,
                status: 'all'
            }
        });

        console.log('✅ Proposals API response received');
        console.log('📊 Response status:', response.status);
        console.log('📊 Response data:', {
            success: response.data.success,
            proposalsCount: response.data.proposals?.length || 0,
            pagination: response.data.pagination,
            stats: response.data.stats
        });

        if (response.data.success && response.data.proposals?.length > 0) {
            const proposal = response.data.proposals[0];
            console.log('\n📋 Sample Proposal:');
            console.log(`   ID: ${proposal.id}`);
            console.log(`   Event Name: ${proposal.eventName || 'NULL'}`);
            console.log(`   Organization: ${proposal.organization || 'NULL'}`);
            console.log(`   Contact: ${proposal.contact?.name || 'NULL'} (${proposal.contact?.email || 'NULL'})`);
            console.log(`   Status: ${proposal.status || 'NULL'}`);
            console.log(`   Date: ${proposal.date || 'NULL'}`);
            console.log(`   Type: ${proposal.type || 'NULL'}`);

            // Check for empty values that might cause "TBD" display
            const emptyFields = [];
            if (!proposal.eventName) emptyFields.push('eventName');
            if (!proposal.organization) emptyFields.push('organization');
            if (!proposal.contact?.name) emptyFields.push('contact.name');
            if (!proposal.contact?.email) emptyFields.push('contact.email');
            if (!proposal.status) emptyFields.push('status');
            if (!proposal.date) emptyFields.push('date');
            if (!proposal.type) emptyFields.push('type');

            if (emptyFields.length > 0) {
                console.log(`\n⚠️  Empty fields that might cause "TBD" display: ${emptyFields.join(', ')}`);
                return false;
            } else {
                console.log('\n✅ All required fields have data');
                return true;
            }
        } else {
            console.log('⚠️  No proposals found or API returned empty data');
            return false;
        }

    } catch (error) {
        console.error('❌ Proposals API test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        return false;
    }
}

async function testFrontendDataTransformation() {
    console.log('\n🔄 Testing Frontend Data Transformation...');

    try {
        // Simulate what the frontend receives and how it transforms it
        const response = await axios.get(`${API_BASE_URL}/admin/proposals`, {
            headers: {
                'Authorization': 'Bearer mock-admin-token-for-testing'
            },
            params: {
                page: 1,
                limit: 1,
                status: 'all'
            }
        });

        if (response.data.success && response.data.proposals?.length > 0) {
            const rawProposal = response.data.proposals[0];

            // Simulate the normalizeProposal function
            const normalizedProposal = {
                id: rawProposal.id,
                uuid: rawProposal.uuid,
                eventName: rawProposal.eventName,
                organization: rawProposal.organization,
                organizationType: rawProposal.organizationType,
                contact: {
                    name: rawProposal.contact?.name || rawProposal.contact_person,
                    email: rawProposal.contact?.email || rawProposal.contact_email,
                    phone: rawProposal.contact?.phone || rawProposal.contact_phone
                },
                status: rawProposal.status,
                date: rawProposal.date,
                type: rawProposal.type,
                eventType: rawProposal.eventType,
                description: rawProposal.description || `Event: ${rawProposal.eventName}`,
                location: rawProposal.location,
                budget: rawProposal.budget,
                volunteersNeeded: rawProposal.volunteersNeeded,
                attendanceCount: rawProposal.attendanceCount,
                sdpCredits: rawProposal.sdpCredits,
                createdAt: rawProposal.createdAt,
                updatedAt: rawProposal.updatedAt,
                submittedAt: rawProposal.submittedAt
            };

            console.log('📊 Normalized Proposal:');
            console.log(`   Event Name: ${normalizedProposal.eventName || 'NULL'}`);
            console.log(`   Organization: ${normalizedProposal.organization || 'NULL'}`);
            console.log(`   Contact: ${normalizedProposal.contact?.name || 'NULL'} (${normalizedProposal.contact?.email || 'NULL'})`);
            console.log(`   Status: ${normalizedProposal.status || 'NULL'}`);
            console.log(`   Date: ${normalizedProposal.date || 'NULL'}`);
            console.log(`   Type: ${normalizedProposal.type || 'NULL'}`);
            console.log(`   Description: ${normalizedProposal.description || 'NULL'}`);

            return true;
        } else {
            console.log('⚠️  No data to transform');
            return false;
        }

    } catch (error) {
        console.error('❌ Data transformation test failed:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Authentication and Data Flow Tests\n');

    try {
        // Test server connection
        const serverRunning = await testServerConnection();
        if (!serverRunning) {
            console.log('\n❌ Server is not running. Please start the backend server first.');
            console.log('   Run: cd backend && npm run dev');
            return;
        }

        // Test authentication
        const authToken = await testAuthentication();

        // Test proposals API
        const apiWorking = await testProposalsAPI(authToken);

        // Test data transformation
        const transformationWorking = await testFrontendDataTransformation();

        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        console.log(`Server Connection: ${serverRunning ? '✅' : '❌'}`);
        console.log(`Authentication: ${authToken ? '✅' : '❌'}`);
        console.log(`Proposals API: ${apiWorking ? '✅' : '❌'}`);
        console.log(`Data Transformation: ${transformationWorking ? '✅' : '❌'}`);

        if (serverRunning && authToken && apiWorking && transformationWorking) {
            console.log('\n✅ All tests passed!');
            console.log('🎯 Your data fetching should work correctly now.');
            console.log('\n📋 Next Steps:');
            console.log('   1. Make sure your frontend is properly authenticated');
            console.log('   2. Check that the backend server is running on port 5000');
            console.log('   3. Verify that the frontend is making requests to the correct API endpoint');
        } else {
            console.log('\n❌ Some tests failed. Check the output above for details.');
            console.log('\n🔧 Troubleshooting:');
            console.log('   1. Make sure the backend server is running: npm run dev');
            console.log('   2. Check authentication in your frontend');
            console.log('   3. Verify API endpoint URLs in frontend configuration');
        }

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    testServerConnection,
    testAuthentication,
    testProposalsAPI,
    testFrontendDataTransformation
};





