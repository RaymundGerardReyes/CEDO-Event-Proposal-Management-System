/**
 * Test Denied Status
 * Tests the proposal status API with "denied" status
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJoZWFkX2FkbWluIiwicmVtZW1iZXJNZSI6ZmFsc2UsImlhdCI6MTc1ODY5MjY1MywiZXhwIjoxNzU4Nzc5MDUzfQ.lcG7DQOwcJsKkmJL5ZVPGCe-KCS9VBrRemqz0TqaZco';
const TEST_UUID = 'test-proposal-1758692743816';

async function testDeniedStatus() {
    try {
        console.log('🚫 Testing Denied Status...');
        console.log('📍 Base URL:', BASE_URL);
        console.log('🔑 UUID:', TEST_UUID);

        // First, update the proposal status to "denied"
        console.log('\n📝 Step 1: Updating proposal status to "denied"...');
        const updateResponse = await axios.patch(`${BASE_URL}/api/admin/proposals/14/status`, {
            status: 'denied',
            adminComments: 'Proposal needs significant revisions. Please review the event objectives and budget allocation.'
        }, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Proposal status updated to denied!');
        console.log('📊 Update Response:', updateResponse.data);

        // Wait a moment for the update to propagate
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Now test the status endpoint
        console.log('\n📋 Step 2: Testing status endpoint...');
        const statusResponse = await axios.get(`${BASE_URL}/api/proposals/${TEST_UUID}/status`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Status API Response:');
        console.log('📊 Response Status:', statusResponse.status);
        console.log('📋 Response Data:', JSON.stringify(statusResponse.data, null, 2));

        // Validate the response
        if (statusResponse.data.success && statusResponse.data.data) {
            const proposalData = statusResponse.data.data;
            console.log('\n🎯 Validation Results:');
            console.log('- UUID:', proposalData.uuid);
            console.log('- Status:', proposalData.proposal_status);
            console.log('- Display:', proposalData.status_display);
            console.log('- Can Proceed to Reports:', proposalData.can_proceed_to_reports);
            console.log('- Admin Comments:', proposalData.admin_comments);
            console.log('- Reviewed At:', proposalData.reviewed_at);

            // Verify the status mapping
            if (proposalData.proposal_status === 'denied' && proposalData.status_display === 'Not Approved') {
                console.log('\n✅ SUCCESS: Status mapping is working correctly!');
                console.log('✅ "denied" status maps to "Not Approved" display text');
            } else {
                console.log('\n❌ ERROR: Status mapping is incorrect!');
                console.log('Expected: proposal_status="denied", status_display="Not Approved"');
                console.log('Actual: proposal_status="' + proposalData.proposal_status + '", status_display="' + proposalData.status_display + '"');
            }
        }

    } catch (error) {
        console.error('❌ Test Failed:');

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
testDeniedStatus();


