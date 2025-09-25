/**
 * Debug script to test API connectivity
 */

const testApiConnection = async () => {
    console.log('🧪 Testing API connection...');

    try {
        // Test 1: Direct backend call
        console.log('\n📡 Test 1: Direct backend call');
        const backendUrl = 'http://localhost:5000';
        const apiUrl = `${backendUrl}/api/admin/proposals?limit=5`;

        console.log('📍 URL:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', errorText);
            return;
        }

        const data = await response.json();
        console.log('✅ Response data:', {
            success: data.success,
            proposalCount: data.proposals?.length || 0,
            sampleProposal: data.proposals?.[0] || null
        });

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }

    try {
        // Test 2: Frontend API route
        console.log('\n📡 Test 2: Frontend API route');
        const frontendUrl = 'http://localhost:3000';
        const frontendApiUrl = `${frontendUrl}/api/test-proposals`;

        console.log('📍 URL:', frontendApiUrl);

        const response = await fetch(frontendApiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('📊 Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', errorText);
            return;
        }

        const data = await response.json();
        console.log('✅ Response data:', data);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

// Run the test
testApiConnection().catch(console.error); 