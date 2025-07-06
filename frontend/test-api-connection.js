// Test script to verify frontend-backend API connection
const { getApiUrl } = require('./src/utils/api.js');

async function testApiConnection() {
    console.log('🧪 Testing API connection...');

    try {
        // Test the events/approved endpoint
        const url = getApiUrl('/events/approved');
        console.log('📡 Testing URL:', url);

        const response = await fetch(url);
        console.log('📊 Response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ API connection successful!');
            console.log('📋 Found', data.events?.length || 0, 'approved events');
            console.log('📄 Sample event:', data.events?.[0] ? {
                id: data.events[0].id,
                event_name: data.events[0].event_name,
                organization_name: data.events[0].organization_name
            } : 'No events found');
        } else {
            console.error('❌ API request failed with status:', response.status);
        }
    } catch (error) {
        console.error('❌ API connection failed:', error.message);
    }
}

testApiConnection(); 