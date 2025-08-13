// Test JWT token generation and validation
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Test user data
const testUser = {
    id: 10,
    email: 'test@example.com',
    role: 'student',
    approved: true,
    is_approved: true
};

console.log('🔐 Testing JWT token generation and validation...');
console.log('🔐 Test user:', testUser);

// Get JWT secret
const JWT_SECRET = process.env.JWT_SECRET_DEV || process.env.JWT_SECRET;
console.log('🔐 JWT Secret (first 8 chars):', JWT_SECRET ? JWT_SECRET.substring(0, 8) + '...' : 'NOT SET');

if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET not configured!');
    process.exit(1);
}

// Generate token using sessionManager format
const tokenPayload = {
    id: testUser.id,
    email: testUser.email,
    role: testUser.role,
    approved: testUser.approved
};

console.log('🔐 Token payload:', tokenPayload);

const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
console.log('🔐 Generated token (first 50 chars):', token.substring(0, 50) + '...');

// Output the full token for testing
console.log('\n🔐 FULL TOKEN FOR TESTING:');
console.log(token);

// Verify token
try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('\n✅ Token verified successfully');
    console.log('🔐 Decoded payload:', decoded);

    // Test user ID extraction (same as middleware)
    const userId = decoded.userId || decoded.id || (decoded.user && decoded.user.id);
    console.log('🔐 Extracted user ID:', userId);
    console.log('🔐 User ID type:', typeof userId);
    console.log('🔐 Is valid number:', !isNaN(Number(userId)));

    if (userId && !isNaN(Number(userId))) {
        console.log('✅ User ID validation passed');
    } else {
        console.log('❌ User ID validation failed');
    }

} catch (error) {
    console.error('❌ Token verification failed:', error.message);
}

console.log('\n🔐 Testing with different payload structures...');

// Test with userId format
const tokenWithUserId = jwt.sign({ userId: testUser.id, email: testUser.email, role: testUser.role }, JWT_SECRET, { expiresIn: '1h' });
const decodedWithUserId = jwt.verify(tokenWithUserId, JWT_SECRET);
console.log('🔐 Token with userId format:', {
    hasUserId: !!decodedWithUserId.userId,
    hasId: !!decodedWithUserId.id,
    extractedId: decodedWithUserId.userId || decodedWithUserId.id
});

// Test with nested user format
const tokenWithNestedUser = jwt.sign({ user: { id: testUser.id, email: testUser.email, role: testUser.role } }, JWT_SECRET, { expiresIn: '1h' });
const decodedWithNestedUser = jwt.verify(tokenWithNestedUser, JWT_SECRET);
console.log('🔐 Token with nested user format:', {
    hasUserId: !!decodedWithNestedUser.userId,
    hasId: !!decodedWithNestedUser.id,
    hasUser: !!decodedWithNestedUser.user,
    extractedId: decodedWithNestedUser.userId || decodedWithNestedUser.id || (decodedWithNestedUser.user && decodedWithNestedUser.user.id)
});

console.log('\n✅ JWT token test completed'); 