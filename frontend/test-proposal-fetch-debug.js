#!/usr/bin/env node

/**
 * Debug Proposal Fetch
 * 
 * This test simulates the frontend data fetching to see what's happening
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testFrontendDataFetch() {
    console.log('🔧 Testing Frontend Data Fetch...');

    try {
        // Simulate the frontend API call
        console.log('📡 Making API request to:', `${API_BASE_URL}/admin/proposals`);

        const response = await axios.get(`${API_BASE_URL}/admin/proposals`, {
            params: {
                page: 1,
                limit: 10,
                status: 'all'
            },
            headers: {
                'Authorization': 'Bearer mock-admin-token-for-testing'
            }
        });

        console.log('✅ API response received');
        console.log('📊 Response status:', response.status);
        console.log('📊 Response data structure:', {
            success: response.data.success,
            proposalsCount: response.data.proposals?.length || 0,
            pagination: response.data.pagination,
            stats: response.data.stats
        });

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

            // Check for empty or null values that might cause "TBD" display
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
                console.log('\n✅ All required fields have data');
            }

            // Test the normalizeProposal function
            console.log('\n🔄 Testing Data Normalization...');
            const normalizedProposal = {
                id: proposal.id,
                uuid: proposal.uuid,
                eventName: proposal.eventName,
                organization: proposal.organization,
                organizationType: proposal.organization_type,
                contact: {
                    name: proposal.contact_person || proposal.contact?.name,
                    email: proposal.contact_email || proposal.contact?.email,
                    phone: proposal.contact_phone || proposal.contact?.phone
                },
                status: proposal.proposal_status || proposal.status,
                date: proposal.event_start_date || proposal.date,
                type: proposal.organization_type || proposal.type,
                eventType: proposal.event_type || proposal.eventType,
                description: proposal.objectives || proposal.description || `Event: ${proposal.eventName}`,
                location: proposal.event_venue || proposal.location,
                budget: proposal.budget,
                volunteersNeeded: proposal.volunteers_needed,
                attendanceCount: proposal.attendance_count,
                sdpCredits: proposal.sdp_credits,
                createdAt: proposal.created_at,
                updatedAt: proposal.updated_at,
                submittedAt: proposal.submitted_at
            };

            console.log('📊 Normalized Proposal:');
            console.log(`   Event Name: ${normalizedProposal.eventName || 'NULL'}`);
            console.log(`   Organization: ${normalizedProposal.organization || 'NULL'}`);
            console.log(`   Contact: ${normalizedProposal.contact?.name || 'NULL'} (${normalizedProposal.contact?.email || 'NULL'})`);
            console.log(`   Status: ${normalizedProposal.status || 'NULL'}`);
            console.log(`   Date: ${normalizedProposal.date || 'NULL'}`);
            console.log(`   Type: ${normalizedProposal.type || 'NULL'}`);
            console.log(`   Description: ${normalizedProposal.description || 'NULL'}`);

        } else {
            console.log('⚠️  No proposals found in API response');
        }

    } catch (error) {
        console.error('❌ Frontend data fetch test failed:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
    }
}

// Run the test
if (require.main === module) {
    testFrontendDataFetch().catch(console.error);
}

module.exports = { testFrontendDataFetch };





