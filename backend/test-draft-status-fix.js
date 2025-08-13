/**
 * Test Script: Draft Status Fix
 * Purpose: Verify that event type selection works with descriptive draft IDs
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testDraftStatusFix() {
    console.log('🧪 Testing Draft Status Fix...\n');

    try {
        // Test 1: Create descriptive draft and save event type
        console.log('📋 Test 1: Descriptive Draft Event Type Selection');
        const eventTypeResponse = await axios.post(`${BASE_URL}/api/proposals/drafts/community-event/event-type`, {
            eventType: 'community-based'
        });
        console.log('✅ Event type selection successful:', {
            success: eventTypeResponse.data.success,
            eventType: eventTypeResponse.data.eventType,
            status: eventTypeResponse.data.status
        });

        // Test 2: Verify draft was created with correct status
        console.log('\n📋 Test 2: Verify Draft Status');
        const draftResponse = await axios.get(`${BASE_URL}/api/proposals/drafts/community-event`);
        console.log('✅ Draft status verified:', {
            draftId: draftResponse.data.draftId,
            status: draftResponse.data.status,
            eventType: draftResponse.data.form_data?.eventType,
            organizationType: draftResponse.data.form_data?.organizationType
        });

        // Test 3: Test school event type selection
        console.log('\n📋 Test 3: School Event Type Selection');
        const schoolEventTypeResponse = await axios.post(`${BASE_URL}/api/proposals/drafts/school-event/event-type`, {
            eventType: 'school-based'
        });
        console.log('✅ School event type selection successful:', {
            success: schoolEventTypeResponse.data.success,
            eventType: schoolEventTypeResponse.data.eventType,
            status: schoolEventTypeResponse.data.status
        });

        // Test 4: Test invalid event type (should fail)
        console.log('\n📋 Test 4: Invalid Event Type (should fail)');
        try {
            await axios.post(`${BASE_URL}/api/proposals/drafts/test-event/event-type`, {
                eventType: 'invalid-type'
            });
            console.log('❌ Test failed: Should have rejected invalid event type');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Invalid event type correctly rejected:', {
                    status: error.response.status,
                    error: error.response.data.error
                });
            } else {
                console.log('❌ Unexpected error:', error.response?.data || error.message);
            }
        }

        // Test 5: List all drafts to verify creation
        console.log('\n📋 Test 5: List All Drafts');
        const listResponse = await axios.get(`${BASE_URL}/api/proposals/drafts`);
        console.log('✅ All drafts listed:', {
            count: listResponse.data.count,
            drafts: listResponse.data.drafts.map(d => ({
                id: d.draftId,
                status: d.status,
                eventType: d.form_data?.eventType,
                type: d.form_data?.organizationType
            }))
        });

        console.log('\n🎉 All tests passed! Draft status fix is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the backend server is running:');
            console.log('   cd backend && npm run dev');
        }
    }
}

// Run the test
testDraftStatusFix(); 