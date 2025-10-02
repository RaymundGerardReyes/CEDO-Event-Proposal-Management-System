/**
 * Create Test Auth Token
 * Purpose: Create a valid JWT token for testing notifications
 * Key approaches: JWT token generation, user verification
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

async function createTestAuthToken() {
    try {
        console.log('🔍 Creating Test Auth Token...\n');

        // Check JWT_SECRET
        const jwtSecret = process.env.JWT_SECRET;
        console.log('🔑 JWT_SECRET:', jwtSecret ? 'SET' : 'NOT SET');

        if (!jwtSecret) {
            console.log('❌ JWT_SECRET not found in environment variables');
            return;
        }

        // Create a test token for user ID 2 (CEDO System Manager)
        console.log('📋 Creating test token for User ID 2 (CEDO System Manager)...');
        const testToken = jwt.sign(
            {
                id: 2,
                email: 'manager@cedo.gov.ph',
                role: 'manager',
                name: 'CEDO System Manager'
            },
            jwtSecret,
            { expiresIn: '24h' }
        );

        console.log('✅ Test token created successfully!');
        console.log(`   Token: ${testToken}`);
        console.log(`   Token (first 50 chars): ${testToken.substring(0, 50)}...`);

        // Test decoding the token
        console.log('\n📋 Testing token decoding...');
        try {
            const decoded = jwt.verify(testToken, jwtSecret);
            console.log('✅ Token decoded successfully');
            console.log(`   User ID: ${decoded.id}`);
            console.log(`   Email: ${decoded.email}`);
            console.log(`   Role: ${decoded.role}`);
            console.log(`   Name: ${decoded.name}`);
        } catch (decodeError) {
            console.log('❌ Failed to decode token');
            console.log(`   Error: ${decodeError.message}`);
        }

        console.log('\n💡 To use this token in your browser:');
        console.log('   1. Open browser developer tools (F12)');
        console.log('   2. Go to Console tab');
        console.log('   3. Run: document.cookie = "cedo_token=" + "' + testToken + '";');
        console.log('   4. Refresh the notifications page');
        console.log('\n   Or manually set the cookie:');
        console.log(`   cedo_token=${testToken}`);

        console.log('\n🎉 Test token creation completed!');

    } catch (error) {
        console.error('❌ Test token creation failed:', error);
    }
}

// Run the script
createTestAuthToken();
