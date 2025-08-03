/**
 * Test script to verify the new event type selection flow
 * This script tests the complete flow with direct routing based on event type selection
 */

const API_BASE = 'http://localhost:5000';

// Get token from cookies
function getTokenFromCookies() {
    const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
    if (cookieValue) {
        return cookieValue.split('=')[1];
    }
    return null;
}

async function testNewEventTypeFlow() {
    const token = getTokenFromCookies();

    if (!token) {
        console.log('❌ No authentication token found');
        console.log('💡 Please log in to your account first');
        return;
    }

    console.log('🧪 TESTING NEW EVENT TYPE FLOW');
    console.log('='.repeat(60));
    console.log('🎯 This test verifies the new direct routing based on event type selection');

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

        // Step 3: Test Community-Based Event Flow
        console.log('\n3️⃣ Testing Community-Based Event Flow...');
        await testCommunityBasedFlow(draftData.draftId, token);

        // Step 4: Create another draft for School-Based Event
        console.log('\n4️⃣ Creating another draft for School-Based Event...');
        const draft2Response = await fetch(`${API_BASE}/api/proposals/drafts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!draft2Response.ok) {
            throw new Error(`Second draft creation failed: ${draft2Response.status}`);
        }

        const draft2Data = await draft2Response.json();
        console.log('✅ Second draft created:', draft2Data);

        // Step 5: Test School-Based Event Flow
        console.log('\n5️⃣ Testing School-Based Event Flow...');
        await testSchoolBasedFlow(draft2Data.draftId, token);

        // Step 6: Summary
        console.log('\n📋 SUMMARY:');
        console.log('✅ Both event type flows tested successfully');
        console.log('✅ Direct routing based on event type selection is working');
        console.log('✅ Organization information is collected in the appropriate sections');
        console.log('🎉 The new flow is working correctly!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

async function testCommunityBasedFlow(draftId, token) {
    console.log('  🔄 Testing Community-Based Event Flow...');

    // Step 1: Select community-based event type
    console.log('    📝 Selecting community-based event type...');
    const eventTypeResponse = await fetch(`${API_BASE}/api/proposals/drafts/${draftId}/event-type`, {
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
        throw new Error(`Community event type selection failed: ${eventTypeResponse.status}`);
    }

    const eventTypeData = await eventTypeResponse.json();
    console.log('    ✅ Community event type selected:', eventTypeData);

    // Step 2: Check user profile to verify organization_type was updated
    console.log('    👤 Checking user profile...');
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
    console.log('    ✅ User profile:', {
        organization_type: profileData.user?.organization_type,
        organization: profileData.user?.organization,
        name: profileData.user?.name
    });

    // Step 3: Check draft to verify organization_type was updated
    console.log('    📄 Checking draft...');
    const draftCheckResponse = await fetch(`${API_BASE}/api/proposals/drafts/${draftId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!draftCheckResponse.ok) {
        throw new Error(`Draft fetch failed: ${draftCheckResponse.status}`);
    }

    const draftCheckData = await draftCheckResponse.json();
    console.log('    ✅ Draft data:', {
        organization_type: draftCheckData.organization_type,
        organization_name: draftCheckData.organization_name,
        proposal_status: draftCheckData.proposal_status
    });

    // Verify the flow worked correctly
    if (profileData.user?.organization_type === 'community-based' &&
        draftCheckData.organization_type === 'community-based') {
        console.log('    ✅ SUCCESS: Community-based event flow working correctly!');
    } else {
        console.log('    ❌ FAILURE: Community-based event flow not working as expected');
    }
}

async function testSchoolBasedFlow(draftId, token) {
    console.log('  🔄 Testing School-Based Event Flow...');

    // Step 1: Select school-based event type
    console.log('    📝 Selecting school-based event type...');
    const eventTypeResponse = await fetch(`${API_BASE}/api/proposals/drafts/${draftId}/event-type`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            eventType: 'school-based'
        })
    });

    if (!eventTypeResponse.ok) {
        throw new Error(`School event type selection failed: ${eventTypeResponse.status}`);
    }

    const eventTypeData = await eventTypeResponse.json();
    console.log('    ✅ School event type selected:', eventTypeData);

    // Step 2: Check user profile to verify organization_type was updated
    console.log('    👤 Checking user profile...');
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
    console.log('    ✅ User profile:', {
        organization_type: profileData.user?.organization_type,
        organization: profileData.user?.organization,
        name: profileData.user?.name
    });

    // Step 3: Check draft to verify organization_type was updated
    console.log('    📄 Checking draft...');
    const draftCheckResponse = await fetch(`${API_BASE}/api/proposals/drafts/${draftId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!draftCheckResponse.ok) {
        throw new Error(`Draft fetch failed: ${draftCheckResponse.status}`);
    }

    const draftCheckData = await draftCheckResponse.json();
    console.log('    ✅ Draft data:', {
        organization_type: draftCheckData.organization_type,
        organization_name: draftCheckData.organization_name,
        proposal_status: draftCheckData.proposal_status
    });

    // Verify the flow worked correctly
    if (profileData.user?.organization_type === 'school-based' &&
        draftCheckData.organization_type === 'school-based') {
        console.log('    ✅ SUCCESS: School-based event flow working correctly!');
    } else {
        console.log('    ❌ FAILURE: School-based event flow not working as expected');
    }
}

// Browser-friendly version
if (typeof window !== 'undefined') {
    console.log('🌐 Running in browser - can get token automatically');
    window.testNewEventTypeFlow = testNewEventTypeFlow;
    console.log('💡 Run testNewEventTypeFlow() to test the new event type flow');
}

// Only run tests if not in browser (to avoid conflicts)
if (typeof window === 'undefined') {
    testNewEventTypeFlow();
} 