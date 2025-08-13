console.log('🔍 Debugging JWT Secret Configuration');
console.log('='.repeat(50));

console.log('JWT_SECRET_DEV:', process.env.JWT_SECRET_DEV || 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET || 'NOT SET');

// Simulate the auth middleware logic
const jwtSecret = process.env.JWT_SECRET_DEV || process.env.JWT_SECRET;
console.log('Final JWT_SECRET being used:', jwtSecret);

// Test token generation and verification
const jwt = require('jsonwebtoken');

try {
    const testUser = { userId: 2 };
    const token = jwt.sign(testUser, jwtSecret, { expiresIn: '1h' });
    console.log('✅ Token generated successfully');
    console.log('Token:', token);

    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ Token verified successfully');
    console.log('Decoded:', decoded);
} catch (error) {
    console.error('❌ Token error:', error.message);
} 