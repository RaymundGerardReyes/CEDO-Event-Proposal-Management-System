/**
 * Test Script for Proposal Status API
 * Tests the new GET /api/proposals/:uuid/status endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_UUID = 'test-proposal-1758692743816';

// Valid JWT token for testing
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJoZWFkX2FkbWluIiwicmVtZW1iZXJNZSI6ZmFsc2UsImlhdCI6MTc1ODY5MjY1MywiZXhwIjoxNzU4Nzc5MDUzfQ.lcG7DQOwcJsKkmJL5ZVPGCe-KCS9VBrRemqz0TqaZco';

async function testProposalStatusAPI() {
    try {
        console.log('🧪 Testing Proposal Status API...');
        console.log('📍 Base URL:', BASE_URL);
        console.log('🔑 UUID:', TEST_UUID);

        // Test the status endpoint
        const response = await axios.get(`${BASE_URL}/api/proposals/${TEST_UUID}/status`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ API Response Status:', response.status);
        console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

        // Validate response structure
        if (response.data.success && response.data.data) {
            const proposalData = response.data.data;
            console.log('\n📋 Proposal Details:');
            console.log('- UUID:', proposalData.uuid);
            console.log('- Status:', proposalData.proposal_status);
            console.log('- Display:', proposalData.status_display);
            console.log('- Can Proceed to Reports:', proposalData.can_proceed_to_reports);
            console.log('- Organization:', proposalData.organization_name);
            console.log('- Event:', proposalData.event_name);

            if (proposalData.submitted_at) {
                console.log('- Submitted:', new Date(proposalData.submitted_at).toLocaleString());
            }
            if (proposalData.approved_at) {
                console.log('- Approved:', new Date(proposalData.approved_at).toLocaleString());
            }
        }

    } catch (error) {
        console.error('❌ API Test Failed:');

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

// Run the test
testProposalStatusAPI();
