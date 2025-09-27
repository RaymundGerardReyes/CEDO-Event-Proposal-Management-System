/**
 * Update Proposal Status
 * Updates a proposal status to test the approved state
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJoZWFkX2FkbWluIiwicmVtZW1iZXJNZSI6ZmFsc2UsImlhdCI6MTc1ODY5MjY1MywiZXhwIjoxNzU4Nzc5MDUzfQ.lcG7DQOwcJsKkmJL5ZVPGCe-KCS9VBrRemqz0TqaZco';
const TEST_UUID = 'test-proposal-1758692743816';

async function updateProposalStatus() {
    try {
        console.log('🔄 Updating Proposal Status...');
        console.log('📍 Base URL:', BASE_URL);
        console.log('🔑 UUID:', TEST_UUID);

        // Update proposal status to approved
        const response = await axios.patch(`${BASE_URL}/api/admin/proposals/14/status`, {
            status: 'approved',
            adminComments: 'Test approval for API testing'
        }, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Proposal status updated successfully!');
        console.log('📊 Response Status:', response.status);
        console.log('📋 Response Data:', response.data);

    } catch (error) {
        console.error('❌ Failed to update proposal status:');

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
updateProposalStatus();



