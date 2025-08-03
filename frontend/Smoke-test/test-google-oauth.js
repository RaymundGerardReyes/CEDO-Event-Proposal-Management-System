// Test script to verify Google OAuth configuration
console.log('🔍 Testing Google OAuth Configuration...');

// Check environment variables
console.log('Environment Variables:');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test backend connectivity
async function testBackendConnectivity() {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        console.log('🌐 Testing backend connectivity to:', backendUrl);

        const response = await fetch(`${backendUrl}/api/health`);
        const data = await response.json();

        console.log('✅ Backend health check response:', data);

        // Test Google auth endpoint
        const googleResponse = await fetch(`${backendUrl}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: 'test-token' })
        });

        const googleData = await googleResponse.json();
        console.log('✅ Google auth endpoint response:', googleData);

    } catch (error) {
        console.error('❌ Backend connectivity test failed:', error);
    }
}

// Run the test
testBackendConnectivity(); 