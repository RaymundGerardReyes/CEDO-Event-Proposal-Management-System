// backend/test-google-config.js
require('dotenv').config();

console.log('🔍 Google OAuth Configuration Test');
console.log('====================================');

// Check environment variables
const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_ID_BACKEND',
    'JWT_SECRET'
];

console.log('\n📋 Environment Variables:');
requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅ SET' : '❌ MISSING';
    const maskedValue = value ? `${value.substring(0, 10)}...` : 'undefined';
    console.log(`  ${varName}: ${status} (${maskedValue})`);
});

// Check if Google Client IDs match
const clientId = process.env.GOOGLE_CLIENT_ID;
const backendClientId = process.env.GOOGLE_CLIENT_ID_BACKEND;

if (clientId && backendClientId) {
    if (clientId === backendClientId) {
        console.log('\n✅ Google Client IDs match');
    } else {
        console.log('\n⚠️  WARNING: Google Client IDs do not match!');
        console.log(`  Frontend: ${clientId.substring(0, 20)}...`);
        console.log(`  Backend:  ${backendClientId.substring(0, 20)}...`);
    }
} else {
    console.log('\n❌ Missing Google Client ID configuration');
}

// Test Google Auth Library
try {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(clientId);
    console.log('\n✅ Google Auth Library initialized successfully');
} catch (error) {
    console.log('\n❌ Failed to initialize Google Auth Library:', error.message);
}

console.log('\n🕐 Current server time:', new Date().toISOString());
console.log('====================================\n'); 