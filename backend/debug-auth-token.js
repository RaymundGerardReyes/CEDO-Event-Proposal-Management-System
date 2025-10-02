/**
 * Debug Auth Token
 * Purpose: Debug authentication token format and user ID extraction
 * Key approaches: JWT token analysis, user ID verification
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

async function debugAuthToken() {
    try {
        console.log('🔍 Debugging Authentication Token...\n');

        // Check JWT_SECRET
        const jwtSecret = process.env.JWT_SECRET;
        console.log('🔑 JWT_SECRET:', jwtSecret ? 'SET' : 'NOT SET');

        if (!jwtSecret) {
            console.log('❌ JWT_SECRET not found in environment variables');
            return;
        }

        // Test creating a token for user ID 2 (admin)
        console.log('\n📋 Test 1: Creating test token for user ID 2');
        const testToken = jwt.sign(
            { id: 2, email: 'manager@cedo.gov.ph', role: 'manager' },
            jwtSecret,
            { expiresIn: '24h' }
        );

        console.log('✅ Test token created');
        console.log(`   Token (first 50 chars): ${testToken.substring(0, 50)}...`);

        // Test decoding the token
        console.log('\n📋 Test 2: Decoding test token');
        try {
            const decoded = jwt.verify(testToken, jwtSecret);
            console.log('✅ Token decoded successfully');
            console.log(`   User ID: ${decoded.id}`);
            console.log(`   Email: ${decoded.email}`);
            console.log(`   Role: ${decoded.role}`);
        } catch (decodeError) {
            console.log('❌ Failed to decode token');
            console.log(`   Error: ${decodeError.message}`);
        }

        // Test with different user IDs
        console.log('\n📋 Test 3: Testing with different user IDs');
        const testUsers = [
            { id: 1, email: 'admin@cedo.gov.ph', role: 'head_admin' },
            { id: 2, email: 'manager@cedo.gov.ph', role: 'manager' },
            { id: 3, email: 'reviewer@cedo.gov.ph', role: 'reviewer' }
        ];

        testUsers.forEach(user => {
            const userToken = jwt.sign(user, jwtSecret, { expiresIn: '24h' });
            const decoded = jwt.verify(userToken, jwtSecret);
            console.log(`   User ID ${user.id}: Token created and decoded successfully`);
        });

        console.log('\n🎉 Auth token debugging completed!');
        console.log('💡 If the frontend shows empty notifications:');
        console.log('   1. Check if the authentication token is valid');
        console.log('   2. Check if the user ID in the token matches the recipient_id in notifications');
        console.log('   3. Check if the token is being sent correctly in the Authorization header');

    } catch (error) {
        console.error('❌ Auth token debugging failed:', error);
    }
}

// Run the debug
debugAuthToken();
