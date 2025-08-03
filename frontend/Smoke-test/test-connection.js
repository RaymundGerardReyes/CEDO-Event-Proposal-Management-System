/**
 * Test script to verify frontend-backend connection
 */

const testConnection = async () => {
    console.log('🧪 Testing frontend-backend connection...');

    try {
        // Test 1: Direct backend call
        console.log('\n📡 Test 1: Direct backend call');
        const backendUrl = 'http://localhost:5000';
        const apiUrl = `${backendUrl}/api/mongodb-unified/admin/proposals-hybrid?limit=1`;

        console.log('📍 URL:', apiUrl);

        const response = await fetch(apiUrl, {
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
        console.log('✅ Backend response:', {
            success: data.success,
            proposalCount: data.proposals?.length || 0,
            sampleProposal: data.proposals?.[0] ? {
                id: data.proposals[0].id,
                title: data.proposals[0].eventName,
                organization: data.proposals[0].organizationName,
                status: data.proposals[0].status
            } : null
        });

    } catch (error) {
        console.error('❌ Backend test failed:', error.message);
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
        console.log('✅ Frontend response:', data);

    } catch (error) {
        console.error('❌ Frontend test failed:', error.message);
    }

    console.log('\n🎯 Summary:');
    console.log('- Backend (localhost:5000): Should be working');
    console.log('- Frontend (localhost:3000): Check if running');
    console.log('- API Routes: Check if properly configured');
};

// Run the test
testConnection().catch(console.error); 