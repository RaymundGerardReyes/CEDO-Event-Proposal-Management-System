/**
 * Test script to verify draft API fixes
 * Run with: node test-draft-fix.js
 */

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testDraftAPI() {
    console.log('🧪 Testing Draft API Fixes...\n');

    try {
        // Test 1: Create a new draft
        console.log('1️⃣ Creating new draft...');
        const createResponse = await fetch(`${API_URL}/api/proposals/drafts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!createResponse.ok) {
            throw new Error(`Failed to create draft: ${createResponse.status}`);
        }

        const { draftId } = await createResponse.json();
        console.log(`✅ Draft created with ID: ${draftId}\n`);

        // Test 2: Fetch the draft
        console.log('2️⃣ Fetching draft...');
        const getResponse = await fetch(`${API_URL}/api/proposals/drafts/${draftId}`);

        if (!getResponse.ok) {
            throw new Error(`Failed to fetch draft: ${getResponse.status}`);
        }

        const draft = await getResponse.json();
        console.log('✅ Draft fetched successfully:', draft);
        console.log('');

        // Test 3: Update a section
        console.log('3️⃣ Updating community-event section...');
        const testData = {
            communityEventName: 'Test Community Event',
            communityVenue: 'Test Venue',
            communityStartDate: '2024-01-15',
            communityEndDate: '2024-01-16',
            communityTimeStart: '09:00',
            communityTimeEnd: '17:00',
            communityEventType: 'academic-enhancement',
            communityEventMode: 'online',
            communitySDPCredits: '1',
            communityTargetAudience: ['1st Year', '2nd Year']
        };

        const updateResponse = await fetch(`${API_URL}/api/proposals/drafts/${draftId}/community-event`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            throw new Error(`Failed to update draft: ${updateResponse.status} - ${errorText}`);
        }

        const updateResult = await updateResponse.json();
        console.log('✅ Section updated successfully:', updateResult);
        console.log('');

        // Test 4: Fetch updated draft
        console.log('4️⃣ Fetching updated draft...');
        const updatedResponse = await fetch(`${API_URL}/api/proposals/drafts/${draftId}`);

        if (!updatedResponse.ok) {
            throw new Error(`Failed to fetch updated draft: ${updatedResponse.status}`);
        }

        const updatedDraft = await updatedResponse.json();
        console.log('✅ Updated draft fetched successfully');
        console.log('Section data:', updatedDraft.payload?.communityEvent);
        console.log('');

        // Test 5: Test frontend API functions
        console.log('5️⃣ Testing frontend API compatibility...');

        // Simulate the frontend updateDraft call
        const frontendUpdateResponse = await fetch(`${API_URL}/api/proposals/drafts/${draftId}/community-event`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...testData,
                communityEventName: 'Updated Test Event'
            })
        });

        if (!frontendUpdateResponse.ok) {
            throw new Error(`Frontend API test failed: ${frontendUpdateResponse.status}`);
        }

        console.log('✅ Frontend API compatibility confirmed');
        console.log('');

        console.log('🎉 All tests passed! Draft API is working correctly.');
        console.log('');
        console.log('📋 Summary:');
        console.log('- Draft creation: ✅');
        console.log('- Draft fetching: ✅');
        console.log('- Section updates: ✅');
        console.log('- Frontend compatibility: ✅');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testDraftAPI(); 