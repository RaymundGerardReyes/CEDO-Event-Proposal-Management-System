// Test draft API call from frontend
const fetch = require('node-fetch');

async function testDraftAPI() {
    console.log('🧪 Testing draft API call from frontend...');

    // Simulate the token extraction from the frontend
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJzdHVkZW50IiwiYXBwcm92ZWQiOnRydWUsImlhdCI6MTczMTQ5NzI5MCwiZXhwIjoxNzMxNTgzNjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

    console.log('🔐 Using test token (first 50 chars):', token.substring(0, 50) + '...');

    const API_URL = 'http://localhost:5000';

    try {
        console.log('📡 Making request to:', `${API_URL}/api/proposals/drafts`);

        const response = await fetch(`${API_URL}/api/proposals/drafts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📡 Response body:', responseText);

        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('✅ Draft created successfully:', data);
        } else {
            console.log('❌ Draft creation failed');
        }

    } catch (error) {
        console.error('❌ Error making request:', error.message);
    }
}

// Run the test
testDraftAPI(); 