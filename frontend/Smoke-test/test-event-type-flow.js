/**
 * Test script to verify event type selection flow
 * This script tests the complete flow from draft creation to event type selection
 */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// 🔐 INSTRUCTIONS: Get your token from the browser
// 1. Open your browser and go to http://localhost:3000
// 2. Log in to your account
// 3. Open Developer Tools (F12)
// 4. Go to Application/Storage tab → Cookies
// 5. Look for the cookie named 'cedo_token'
// 6. Copy the token value and replace 'YOUR_TOKEN_HERE' below

const AUTH_TOKEN = 'YOUR_TOKEN_HERE'; // Replace with your actual token

// Helper function to get token from cookies (same as the app does)
function getTokenFromCookies() {
    if (typeof document !== 'undefined') {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
            return cookieValue.split('=')[1];
        }
    }
    return null;
}

async function testEventTypeFlow() {
    console.log('🧪 Testing Event Type Selection Flow...\n');
    console.log('🔐 Using API Base:', API_BASE);
    console.log('🔐 Token provided:', AUTH_TOKEN === 'YOUR_TOKEN_HERE' ? 'NO' : 'YES');

    if (AUTH_TOKEN === 'YOUR_TOKEN_HERE') {
        console.log('\n❌ ERROR: Please replace "YOUR_TOKEN_HERE" with your actual authentication token');
        console.log('📋 Instructions:');
        console.log('1. Open http://localhost:3000 in your browser');
        console.log('2. Log in to your account');
        console.log('3. Open Developer Tools (F12)');
        console.log('4. Go to Application/Storage tab → Cookies');
        console.log('5. Look for the cookie named "cedo_token"');
        console.log('6. Copy the token value and replace "YOUR_TOKEN_HERE" in this script');
        console.log('\n💡 Alternative: Run this script in the browser console to get the token automatically');
        console.log('   Copy and paste the debug script from frontend/debug-auth.js');
        return;
    }

    try {
        // Step 1: Test authentication first
        console.log('🔐 Testing authentication...');
        const authResponse = await fetch(`${API_BASE}/api/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        if (!authResponse.ok) {
            throw new Error(`Authentication failed: ${authResponse.status} - ${authResponse.statusText}`);
        }

        const authData = await authResponse.json();
        console.log('✅ Authentication successful:', {
            userId: authData.user?.id,
            email: authData.user?.email,
            organization_type: authData.user?.organization_type
        });

        // Step 2: Create a draft
        console.log('\n1️⃣ Creating draft...');
        const draftResponse = await fetch(`${API_BASE}/api/proposals/drafts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });

        if (!draftResponse.ok) {
            const errorText = await draftResponse.text();
            throw new Error(`Draft creation failed: ${draftResponse.status} - ${errorText}`);
        }

        const draftData = await draftResponse.json();
        console.log('✅ Draft created:', draftData);

        // Step 3: Select event type (community-based)
        console.log('\n2️⃣ Selecting event type (community-based)...');
        const eventTypeResponse = await fetch(`${API_BASE}/api/proposals/drafts/${draftData.draftId}/event-type`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AUTH_TOKEN}`
            },
            body: JSON.stringify({
                eventType: 'community-based'
            })
        });

        if (!eventTypeResponse.ok) {
            const errorText = await eventTypeResponse.text();
            throw new Error(`Event type selection failed: ${eventTypeResponse.status} - ${errorText}`);
        }

        const eventTypeData = await eventTypeResponse.json();
        console.log('✅ Event type selected:', eventTypeData);

        // Step 4: Check user profile to see if organization_type was updated
        console.log('\n3️⃣ Checking user profile...');
        const profileResponse = await fetch(`${API_BASE}/api/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });

        if (!profileResponse.ok) {
            const errorText = await profileResponse.text();
            throw new Error(`Profile fetch failed: ${profileResponse.status} - ${errorText}`);
        }

        const profileData = await profileResponse.json();
        console.log('✅ User profile:', {
            organization_type: profileData.user?.organization_type,
            organization: profileData.user?.organization,
            name: profileData.user?.name
        });

        // Step 5: Check draft to see if organization_type was updated
        console.log('\n4️⃣ Checking draft...');
        const draftCheckResponse = await fetch(`${API_BASE}/api/proposals/drafts/${draftData.draftId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`
            }
        });

        if (!draftCheckResponse.ok) {
            const errorText = await draftCheckResponse.text();
            throw new Error(`Draft fetch failed: ${draftCheckResponse.status} - ${errorText}`);
        }

        const draftCheckData = await draftCheckResponse.json();
        console.log('✅ Draft data:', {
            organization_type: draftCheckData.organization_type,
            organization_name: draftCheckData.organization_name,
            proposal_status: draftCheckData.proposal_status
        });

        // Summary
        console.log('\n📊 SUMMARY:');
        console.log(`- Draft created with ID: ${draftData.draftId}`);
        console.log(`- Event type selected: ${eventTypeData.eventType}`);
        console.log(`- User organization_type: ${profileData.user?.organization_type}`);
        console.log(`- Draft organization_type: ${draftCheckData.organization_type}`);

        if (profileData.user?.organization_type === 'community-based' &&
            draftCheckData.organization_type === 'community-based') {
            console.log('✅ SUCCESS: Both user and draft organization_type updated correctly!');
        } else {
            console.log('❌ FAILURE: Organization type not updated correctly');
            console.log('Expected: community-based, Got:', {
                user: profileData.user?.organization_type,
                draft: draftCheckData.organization_type
            });
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);

        if (error.message.includes('401')) {
            console.log('\n💡 TROUBLESHOOTING:');
            console.log('1. Make sure you have a valid authentication token');
            console.log('2. Check if the backend server is running on port 5000');
            console.log('3. Verify the token hasn\'t expired');
            console.log('4. Try logging in again to get a fresh token');
        }
    }
}

// Alternative: Test with a simple health check first
async function testHealthCheck() {
    console.log('🏥 Testing backend health...');
    try {
        const healthResponse = await fetch(`${API_BASE}/api/health`);
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Backend is healthy:', healthData);
        } else {
            console.log('❌ Backend health check failed');
        }
    } catch (error) {
        console.log('❌ Cannot connect to backend:', error.message);
    }
}

// Browser-friendly version that can get token automatically
if (typeof window !== 'undefined') {
    console.log('🌐 Running in browser - can get token automatically');
    window.runEventTypeTest = async function () {
        const token = getTokenFromCookies();
        if (token) {
            console.log('🔐 Found token in cookies, running test...');
            // Update the AUTH_TOKEN for this run
            const originalToken = AUTH_TOKEN;
            AUTH_TOKEN = token;
            await testEventTypeFlow();
            AUTH_TOKEN = originalToken;
        } else {
            console.log('❌ No token found in cookies. Please log in first.');
        }
    };
    console.log('💡 Run runEventTypeTest() to test with automatic token detection');
}

// Run health check first, then the main test
async function runTests() {
    await testHealthCheck();
    console.log('\n' + '='.repeat(50) + '\n');
    await testEventTypeFlow();
}

// Only run tests if not in browser (to avoid conflicts)
if (typeof window === 'undefined') {
    runTests();
} 