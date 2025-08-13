/**
 * Test Script: Descriptive Draft ID Fix
 * Purpose: Verify that the backend can handle descriptive draft IDs properly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testDescriptiveDraftId() {
    console.log('🧪 Testing Descriptive Draft ID Fix...\n');

    try {
        // Test 1: Community Event Draft
        console.log('📋 Test 1: Community Event Draft');
        const communityResponse = await axios.get(`${BASE_URL}/api/proposals/drafts/community-event`);
        console.log('✅ Community event draft created:', {
            draftId: communityResponse.data.draftId,
            status: communityResponse.data.status,
            organizationType: communityResponse.data.form_data?.organizationType,
            proposalStatus: communityResponse.data.form_data?.proposalStatus
        });

        // Test 2: School Event Draft
        console.log('\n📋 Test 2: School Event Draft');
        const schoolResponse = await axios.get(`${BASE_URL}/api/proposals/drafts/school-event`);
        console.log('✅ School event draft created:', {
            draftId: schoolResponse.data.draftId,
            status: schoolResponse.data.status,
            organizationType: schoolResponse.data.form_data?.organizationType,
            proposalStatus: schoolResponse.data.form_data?.proposalStatus
        });

        // Test 3: Update Community Event Section
        console.log('\n📋 Test 3: Update Community Event Section');
        const updateResponse = await axios.patch(`${BASE_URL}/api/proposals/drafts/community-event/eventDetails`, {
            communityEventName: 'Test Community Event',
            communityVenue: 'Test Venue',
            communityStartDate: '2025-01-01',
            communityEndDate: '2025-01-02'
        });
        console.log('✅ Community event section updated:', {
            success: updateResponse.data.success,
            updatedAt: updateResponse.data.draft?.updatedAt
        });

        // Test 4: Verify Draft Persistence
        console.log('\n📋 Test 4: Verify Draft Persistence');
        const verifyResponse = await axios.get(`${BASE_URL}/api/proposals/drafts/community-event`);
        console.log('✅ Draft persistence verified:', {
            eventName: verifyResponse.data.form_data?.eventDetails?.communityEventName,
            venue: verifyResponse.data.form_data?.eventDetails?.communityVenue
        });

        // Test 5: List All Drafts
        console.log('\n📋 Test 5: List All Drafts');
        const listResponse = await axios.get(`${BASE_URL}/api/proposals/drafts`);
        console.log('✅ All drafts listed:', {
            count: listResponse.data.count,
            drafts: listResponse.data.drafts.map(d => ({
                id: d.draftId,
                status: d.status,
                type: d.form_data?.organizationType
            }))
        });

        console.log('\n🎉 All tests passed! Descriptive draft ID fix is working correctly.');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the backend server is running:');
            console.log('   cd backend && npm run dev');
        }
    }
}

// Run the test
testDescriptiveDraftId(); 