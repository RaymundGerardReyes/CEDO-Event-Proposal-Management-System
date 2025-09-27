/**
 * Test Approved Events API
 * Tests the GET /api/events/approved endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJoZWFkX2FkbWluIiwicmVtZW1iZXJNZSI6ZmFsc2UsImlhdCI6MTc1ODY5MjY1MywiZXhwIjoxNzU4Nzc5MDUzfQ.lcG7DQOwcJsKkmJL5ZVPGCe-KCS9VBrRemqz0TqaZco';

async function testApprovedEventsAPI() {
    try {
        console.log('🧪 Testing Approved Events API...');
        console.log('📍 Base URL:', BASE_URL);

        // Test 1: Get all approved events
        console.log('\n📝 Test 1: Getting all approved events...');
        const allEventsResponse = await axios.get(`${BASE_URL}/api/events/approved`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ All Events Response:');
        console.log('📊 Response Status:', allEventsResponse.status);
        console.log('📋 Response Data:', JSON.stringify(allEventsResponse.data, null, 2));

        // Test 2: Get approved events for specific user
        console.log('\n📝 Test 2: Getting approved events for specific user...');
        const userEmail = 'admin@example.com';
        const userEventsResponse = await axios.get(`${BASE_URL}/api/events/approved?email=${encodeURIComponent(userEmail)}`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ User Events Response:');
        console.log('📊 Response Status:', userEventsResponse.status);
        console.log('📋 Response Data:', JSON.stringify(userEventsResponse.data, null, 2));

        // Validate response structure
        if (allEventsResponse.data.success && Array.isArray(allEventsResponse.data.events)) {
            console.log('\n🎯 Validation Results:');
            console.log('- Total Events:', allEventsResponse.data.count);
            console.log('- Events Array Length:', allEventsResponse.data.events.length);

            if (allEventsResponse.data.events.length > 0) {
                const firstEvent = allEventsResponse.data.events[0];
                console.log('\n📋 First Event Details:');
                console.log('- ID:', firstEvent.id);
                console.log('- Event Name:', firstEvent.event_name);
                console.log('- Organization:', firstEvent.organization_name);
                console.log('- Status:', firstEvent.proposal_status);
                console.log('- Report Status:', firstEvent.report_status);
                console.log('- Venue:', firstEvent.event_venue);
                console.log('- Start Date:', firstEvent.event_start_date);
                console.log('- Contact Person:', firstEvent.contact_name);
                console.log('- Contact Email:', firstEvent.contact_email);
            }

            console.log('\n✅ SUCCESS: Approved Events API is working correctly!');
        } else {
            console.log('\n❌ ERROR: Invalid response structure!');
            console.log('Expected: { success: true, events: [], count: number }');
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
testApprovedEventsAPI();



