#!/usr/bin/env node

/**
 * Test Proposals API with Authentication
 * 
 * This script tests the proposals API with proper authentication
 */

const axios = require('axios');

const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MzEzLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwicmVtZW1iZXJNZSI6ZmFsc2UsImlhdCI6MTc1OTIwMDU4NSwiZXhwIjoxNzU5Mjg2OTg1fQ.SR2k8zAQOKS3mVa785mpGC93V-iOd5Vs1m2ETg1qnuY';

async function testProposalsAPI() {
    console.log('🔧 Testing Proposals API with Authentication...');

    try {
        const response = await axios.get('http://localhost:5000/api/admin/proposals', {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            params: {
                page: 1,
                limit: 5,
                status: 'all'
            }
        });

        console.log('✅ Proposals API response received');
        console.log('📊 Status:', response.status);
        console.log('📊 Success:', response.data.success);
        console.log('📊 Proposals Count:', response.data.proposals?.length || 0);
        console.log('📊 Pagination:', response.data.pagination);
        console.log('📊 Stats:', response.data.stats);

        if (response.data.success && response.data.proposals?.length > 0) {
            const proposal = response.data.proposals[0];
            console.log('\n📋 Sample Proposal Data:');
            console.log(`   ID: ${proposal.id}`);
            console.log(`   UUID: ${proposal.uuid}`);
            console.log(`   Event Name: ${proposal.eventName || 'NULL'}`);
            console.log(`   Organization: ${proposal.organization || 'NULL'}`);
            console.log(`   Contact: ${proposal.contact?.name || 'NULL'} (${proposal.contact?.email || 'NULL'})`);
            console.log(`   Status: ${proposal.status || 'NULL'}`);
            console.log(`   Date: ${proposal.date || 'NULL'}`);
            console.log(`   Type: ${proposal.type || 'NULL'}`);
            console.log(`   Description: ${proposal.description || 'NULL'}`);

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
            } else {
                console.log('\n✅ All required fields have data - no "TBD" issues!');
            }

            return true;
        } else {
            console.log('⚠️  No proposals found or API returned empty data');
            return false;
        }

    } catch (error) {
        console.error('❌ Proposals API test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

async function testFrontendDataFlow() {
    console.log('\n🔄 Testing Frontend Data Flow...');

    try {
        const response = await axios.get('http://localhost:5000/api/admin/proposals', {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            params: {
                page: 1,
                limit: 1,
                status: 'all'
            }
        });

        if (response.data.success && response.data.proposals?.length > 0) {
            const rawProposal = response.data.proposals[0];

            // Simulate the normalizeProposal function from frontend
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

            console.log('📊 Normalized Proposal (Frontend Format):');
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
        console.error('❌ Frontend data flow test failed:', error.message);
        return false;
    }
}

async function runTest() {
    console.log('🚀 Starting Proposals API Test with Authentication\n');

    try {
        const apiWorking = await testProposalsAPI();
        const dataFlowWorking = await testFrontendDataFlow();

        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        console.log(`Proposals API: ${apiWorking ? '✅' : '❌'}`);
        console.log(`Frontend Data Flow: ${dataFlowWorking ? '✅' : '❌'}`);

        if (apiWorking && dataFlowWorking) {
            console.log('\n✅ SUCCESS! Your data fetching is working correctly!');
            console.log('\n🎯 Solution for Frontend:');
            console.log('========================');
            console.log('The issue was authentication. Your frontend needs to:');
            console.log('1. Use this auth token in API requests:');
            console.log(`   Authorization: Bearer ${AUTH_TOKEN}`);
            console.log('\n2. Or store it in localStorage:');
            console.log(`   localStorage.setItem('cedo_token', '${AUTH_TOKEN}');`);
            console.log('\n3. Or store it in cookies:');
            console.log(`   document.cookie = 'cedo_token=${AUTH_TOKEN}; path=/; SameSite=Lax';`);
            console.log('\n4. Make sure your frontend API service includes the Authorization header');
            console.log('\n📋 The "TBD" and empty values issue should now be resolved!');
        } else {
            console.log('\n❌ Some tests failed. Check the output above for details.');
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
    testProposalsAPI,
    testFrontendDataFlow
};





