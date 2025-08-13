#!/usr/bin/env node

/**
 * Live API Test for Proposal ID 4
 * Tests the actual API endpoint that the frontend uses
 */

require('dotenv').config();

async function testProposal4API() {
    console.log('🧪 LIVE API TEST FOR PROPOSAL ID 4');
    console.log('='.repeat(50));

    const API_URL = 'http://localhost:5000/api/mongodb-unified/admin/proposals-hybrid?limit=10&page=1';

    try {
        console.log('📡 Making API request to:', API_URL);

        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Note: In real app, this would need a valid auth token
            },
            credentials: 'include',
        });

        console.log('📊 Response status:', response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return;
        }

        const data = await response.json();

        console.log('\n✅ API Response received');
        console.log('Success:', data.success);
        console.log('Proposals count:', data.proposals?.length || 0);

        // Find proposal ID 4
        const proposal4 = data.proposals?.find(p => p.id == 4 || p.id == '4');

        if (proposal4) {
            console.log('\n🎯 PROPOSAL ID 4 FOUND IN API RESPONSE:');
            console.log('='.repeat(40));
            console.log('ID:', proposal4.id);
            console.log('Event Name:', proposal4.event_name || proposal4.eventName);
            console.log('Organization:', proposal4.organization_name || proposal4.organizationName);
            console.log('📋 proposal_status:', proposal4.proposal_status);
            console.log('📋 status:', proposal4.status);
            console.log('Created:', proposal4.created_at || proposal4.createdAt);
            console.log('Updated:', proposal4.updated_at || proposal4.updatedAt);

            // Check all status-related fields
            console.log('\n🔍 ALL STATUS FIELDS:');
            console.log('proposal_status:', proposal4.proposal_status);
            console.log('status:', proposal4.status);
            console.log('report_status:', proposal4.report_status);
            console.log('event_status:', proposal4.event_status);

            if (proposal4.proposal_status === 'approved') {
                console.log('\n✅ SUCCESS: API correctly returns approved status');
            } else {
                console.log('\n❌ ISSUE: API returns status:', proposal4.proposal_status, 'instead of approved');
            }
        } else {
            console.log('\n❌ CRITICAL: Proposal ID 4 not found in API response');
            console.log('Available proposals:', data.proposals?.map(p => ({
                id: p.id,
                name: p.event_name || p.eventName
            })));
        }

    } catch (error) {
        console.error('💥 API Test failed:', error.message);
    }
}

// Handle the case where fetch is not available in older Node.js versions
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

if (require.main === module) {
    testProposal4API()
        .then(() => {
            console.log('\n🎉 Live API test complete!');
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testProposal4API };

