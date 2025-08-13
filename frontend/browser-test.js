/**
 * Browser Console Test Script
 * Copy and paste this entire script into your browser console to test the event type selection fix
 */

console.log('🧪 BROWSER TEST: Event Type Selection Fix');
console.log('='.repeat(50));

// Get token from cookies (same as the app does)
function getTokenFromCookies() {
    const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
    if (cookieValue) {
        return cookieValue.split('=')[1];
    }
    return null;
}

// Test the event type selection flow
async function testEventTypeSelection() {
    const API_BASE = 'http://localhost:5000';
    const token = getTokenFromCookies();

    if (!token) {
        console.log('❌ No authentication token found in cookies');
        console.log('💡 Please log in to your account first');
        return;
    }

    console.log('🔐 Found authentication token');

    try {
        // Step 1: Test authentication
        console.log('\n1️⃣ Testing authentication...');
        const authResponse = await fetch(`${API_BASE}/api/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!authResponse.ok) {
            throw new Error(`Authentication failed: ${authResponse.status}`);
        }

        const authData = await authResponse.json();
        console.log('✅ Authentication successful:', {
            userId: authData.user?.id,
            email: authData.user?.email,
            organization_type: authData.user?.organization_type
        });

        // Step 2: Create a draft
        console.log('\n2️⃣ Creating draft...');
        const draftResponse = await fetch(`${API_BASE}/api/proposals/drafts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!draftResponse.ok) {
            throw new Error(`Draft creation failed: ${draftResponse.status}`);
        }

        const draftData = await draftResponse.json();
        console.log('✅ Draft created:', draftData);

        // Step 3: Select community-based event type
        console.log('\n3️⃣ Selecting community-based event type...');
        const eventTypeResponse = await fetch(`${API_BASE}/api/proposals/drafts/${draftData.draftId}/event-type`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                eventType: 'community-based'
            })
        });

        if (!eventTypeResponse.ok) {
            throw new Error(`Event type selection failed: ${eventTypeResponse.status}`);
        }

        const eventTypeData = await eventTypeResponse.json();
        console.log('✅ Event type selected:', eventTypeData);

        // Step 4: Check user profile
        console.log('\n4️⃣ Checking user profile...');
        const profileResponse = await fetch(`${API_BASE}/api/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!profileResponse.ok) {
            throw new Error(`Profile fetch failed: ${profileResponse.status}`);
        }

        const profileData = await profileResponse.json();
        console.log('✅ User profile:', {
            organization_type: profileData.user?.organization_type,
            organization: profileData.user?.organization,
            name: profileData.user?.name
        });

        // Step 5: Check draft
        console.log('\n5️⃣ Checking draft...');
        const draftCheckResponse = await fetch(`${API_BASE}/api/proposals/drafts/${draftData.draftId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!draftCheckResponse.ok) {
            throw new Error(`Draft fetch failed: ${draftCheckResponse.status}`);
        }

        const draftCheckData = await draftCheckResponse.json();
        console.log('✅ Draft data:', {
            organization_type: draftCheckData.organization_type,
            organization_name: draftCheckData.organization_name,
            proposal_status: draftCheckData.proposal_status
        });

        // Summary
        console.log('\n📊 TEST RESULTS:');
        console.log(`- User organization_type: ${profileData.user?.organization_type}`);
        console.log(`- Draft organization_type: ${draftCheckData.organization_type}`);

        if (profileData.user?.organization_type === 'community-based' &&
            draftCheckData.organization_type === 'community-based') {
            console.log('✅ SUCCESS: Fix is working! Both user and draft updated correctly.');
            console.log('🎉 The organization_type issue has been resolved!');
        } else {
            console.log('❌ FAILURE: Fix not working as expected');
            console.log('Expected: community-based');
            console.log('Got:', {
                user: profileData.user?.organization_type,
                draft: draftCheckData.organization_type
            });
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Make the function available globally
window.testEventTypeSelection = testEventTypeSelection;

console.log('💡 Run testEventTypeSelection() to test the fix');
console.log('🔗 Make sure you\'re logged in and the backend is running on port 5000'); 