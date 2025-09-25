/**
 * Create Test Proposal
 * Creates a test proposal for testing the status API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJoZWFkX2FkbWluIiwicmVtZW1iZXJNZSI6ZmFsc2UsImlhdCI6MTc1ODY5MjY1MywiZXhwIjoxNzU4Nzc5MDUzfQ.lcG7DQOwcJsKkmJL5ZVPGCe-KCS9VBrRemqz0TqaZco';

async function createTestProposal() {
    try {
        console.log('📝 Creating Test Proposal...');
        console.log('📍 Base URL:', BASE_URL);

        const testUuid = 'test-proposal-' + Date.now();

        // Create a test proposal
        const proposalData = {
            proposal: {
                uuid: testUuid,
                organization_name: 'Test Organization',
                organization_type: 'school-based',
                contact_person: 'Test Contact',
                contact_email: 'test@example.com',
                contact_phone: '1234567890',
                event_name: 'Test Event',
                event_venue: 'Test Venue',
                event_start_date: '2025-02-01',
                event_end_date: '2025-02-02',
                event_start_time: '09:00:00',
                event_end_time: '17:00:00',
                event_mode: 'offline',
                event_type: 'seminar-webinar',
                target_audience: ['all_levels'],
                sdp_credits: 1,
                current_section: 'reporting',
                proposal_status: 'pending',
                user_id: 9 // Admin user ID
            }
        };

        const response = await axios.put(`${BASE_URL}/api/proposals/${testUuid}`, proposalData, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Test proposal created successfully!');
        console.log('📊 Response Status:', response.status);
        console.log('📋 Response Data:', response.data);

        console.log(`\n🎯 Use this UUID for testing:`);
        console.log(`const TEST_UUID = '${testUuid}';`);

        return testUuid;

    } catch (error) {
        console.error('❌ Failed to create test proposal:');

        if (error.response) {
            console.error('- Status:', error.response.status);
            console.error('- Data:', error.response.data);
        } else if (error.request) {
            console.error('- Network Error:', error.message);
        } else {
            console.error('- Error:', error.message);
        }
        return null;
    }
}

// Run the function
createTestProposal();


