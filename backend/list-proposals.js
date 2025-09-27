/**
 * List Proposals
 * Lists all proposals in the database to find valid UUIDs for testing
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJoZWFkX2FkbWluIiwicmVtZW1iZXJNZSI6ZmFsc2UsImlhdCI6MTc1ODY5MjY1MywiZXhwIjoxNzU4Nzc5MDUzfQ.lcG7DQOwcJsKkmJL5ZVPGCe-KCS9VBrRemqz0TqaZco';

async function listProposals() {
    try {
        console.log('📋 Listing All Proposals...');
        console.log('📍 Base URL:', BASE_URL);

        // Get all proposals (admin endpoint)
        const response = await axios.get(`${BASE_URL}/api/admin/proposals`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Proposals retrieved successfully!');
        console.log('📊 Response Status:', response.status);
        console.log('📋 Total Proposals:', response.data.data?.length || 0);

        if (response.data.data && response.data.data.length > 0) {
            console.log('\n📝 Available Proposals:');
            response.data.data.forEach((proposal, index) => {
                console.log(`\n${index + 1}. Proposal Details:`);
                console.log(`   - UUID: ${proposal.uuid}`);
                console.log(`   - Status: ${proposal.proposal_status}`);
                console.log(`   - Organization: ${proposal.organization_name}`);
                console.log(`   - Event: ${proposal.event_name}`);
                console.log(`   - User ID: ${proposal.user_id}`);
                console.log(`   - Created: ${new Date(proposal.created_at).toLocaleString()}`);
            });

            // Use the first proposal's UUID for testing
            const firstProposal = response.data.data[0];
            console.log(`\n🎯 Use this UUID for testing:`);
            console.log(`const TEST_UUID = '${firstProposal.uuid}';`);
        } else {
            console.log('\n⚠️ No proposals found in the database.');
            console.log('💡 You may need to create a proposal first through the frontend.');
        }

    } catch (error) {
        console.error('❌ Failed to list proposals:');

        if (error.response) {
            console.error('- Status:', error.response.status);
            console.error('- Data:', error.response.data);
        } else if (error.request) {
            console.error('- Network Error:', error.message);
        } else {
            console.error('- Error:', error.message);
        }
    }
}

// Run the function
listProposals();



