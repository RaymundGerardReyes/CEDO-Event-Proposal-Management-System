// Test event type API call from frontend
// Using ES module syntax for frontend compatibility

async function testEventTypeAPI() {
    console.log('🧪 Testing event type API call from frontend...');

    // Simulate the token extraction from the frontend
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJzdHVkZW50IiwiYXBwcm92ZWQiOnRydWUsImlhdCI6MTczMTQ5NzI5MCwiZXhwIjoxNzMxNTgzNjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

    console.log('🔐 Using test token (first 50 chars):', token.substring(0, 50) + '...');

    const API_URL = 'http://localhost:5000';
    const testDraftId = 'test-draft-123';
    const testEventType = 'community-based';

    try {
        console.log('📡 Making request to:', `${API_URL}/api/proposals/drafts/${testDraftId}/event-type`);

        const response = await fetch(`${API_URL}/api/proposals/drafts/${testDraftId}/event-type`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ eventType: testEventType })
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📡 Response body:', responseText);

        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ Event type saved successfully:', data);
        } else {
            console.log('❌ Event type save failed');
            if (response.status === 401) {
                console.log('🔐 Authentication failed - check token validity');
            } else if (response.status === 404) {
                console.log('📄 Draft not found - check draft ID');
            }
        }

    } catch (error) {
        console.error('❌ Error making request:', error.message);
    }
}

// Run the test
testEventTypeAPI(); 