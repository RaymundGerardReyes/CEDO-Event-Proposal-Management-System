#!/usr/bin/env node

/**
 * Google OAuth Configuration Test Script
 * This script helps debug Google OAuth environment variable configuration
 */

require('dotenv').config();

console.log('='.repeat(60));
console.log('  GOOGLE OAUTH CONFIGURATION TEST');
console.log('='.repeat(60));
console.log();

// Check environment variables
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientIdBackend = process.env.GOOGLE_CLIENT_ID_BACKEND;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const jwtSecret = process.env.JWT_SECRET_DEV || process.env.JWT_SECRET;
const frontendUrl = process.env.FRONTEND_URL;

console.log('Environment Variables:');
console.log('-'.repeat(40));
console.log(`NODE_ENV:                  ${process.env.NODE_ENV || 'undefined'}`);
console.log(`PORT:                      ${process.env.PORT || 'undefined'}`);
console.log(`GOOGLE_CLIENT_ID:          ${googleClientId ? `${googleClientId.substring(0, 10)}...` : '❌ MISSING'}`);
console.log(`GOOGLE_CLIENT_ID_BACKEND:  ${googleClientIdBackend ? `${googleClientIdBackend.substring(0, 10)}...` : '❌ MISSING'}`);
console.log(`GOOGLE_CLIENT_SECRET:      ${googleClientSecret ? `${googleClientSecret.substring(0, 10)}...` : '❌ MISSING'}`);
console.log(`JWT_SECRET:                ${jwtSecret ? `${jwtSecret.substring(0, 10)}...` : '❌ MISSING'}`);
console.log(`FRONTEND_URL:              ${frontendUrl || '❌ MISSING'}`);
console.log();

// Critical checks
console.log('Critical Configuration Checks:');
console.log('-'.repeat(40));

let hasErrors = false;

// Check 1: GOOGLE_CLIENT_ID exists
if (!googleClientId) {
    console.log('❌ GOOGLE_CLIENT_ID is missing');
    hasErrors = true;
} else {
    console.log('✅ GOOGLE_CLIENT_ID is set');
}

// Check 2: Both Google Client IDs match
if (googleClientId && googleClientIdBackend) {
    if (googleClientId === googleClientIdBackend) {
        console.log('✅ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID_BACKEND match');
    } else {
        console.log('❌ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID_BACKEND do NOT match');
        console.log(`   Frontend uses: ${googleClientId.substring(0, 15)}...`);
        console.log(`   Backend uses:  ${googleClientIdBackend.substring(0, 15)}...`);
        hasErrors = true;
    }
} else {
    console.log('⚠️  Cannot compare Google Client IDs - one or both are missing');
    hasErrors = true;
}

// Check 3: Google Client Secret exists
if (!googleClientSecret) {
    console.log('❌ GOOGLE_CLIENT_SECRET is missing');
    hasErrors = true;
} else {
    console.log('✅ GOOGLE_CLIENT_SECRET is set');
}

// Check 4: JWT Secret exists
if (!jwtSecret) {
    console.log('❌ JWT_SECRET is missing');
    hasErrors = true;
} else {
    console.log('✅ JWT_SECRET is set');
}

console.log();

// Test Google Auth Library initialization
console.log('Google Auth Library Test:');
console.log('-'.repeat(40));

try {
    const { OAuth2Client } = require('google-auth-library');

    if (googleClientId) {
        const client = new OAuth2Client(googleClientId);
        console.log('✅ Google OAuth2Client initialized successfully');

        // Test a dummy token verification (will fail but shouldn't crash)
        client.verifyIdToken({
            idToken: 'dummy_token',
            audience: googleClientId
        }).catch(() => {
            console.log('✅ Token verification method is working (expected to fail with dummy token)');
        });

    } else {
        console.log('❌ Cannot initialize Google OAuth2Client - GOOGLE_CLIENT_ID missing');
        hasErrors = true;
    }
} catch (error) {
    console.log('❌ Error initializing Google Auth Library:', error.message);
    hasErrors = true;
}

console.log();

// Database connection test
console.log('Database Configuration Test:');
console.log('-'.repeat(40));

const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST;
const dbPort = process.env.DB_PORT || process.env.MYSQL_PORT;
const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE;
const dbUser = process.env.DB_USER || process.env.MYSQL_USER;
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;

console.log(`DB_HOST:     ${dbHost || '❌ MISSING'}`);
console.log(`DB_PORT:     ${dbPort || '❌ MISSING'}`);
console.log(`DB_NAME:     ${dbName || '❌ MISSING'}`);
console.log(`DB_USER:     ${dbUser || '❌ MISSING'}`);
console.log(`DB_PASSWORD: ${dbPassword ? '***SET***' : '❌ MISSING'}`);

if (!dbHost || !dbPort || !dbName || !dbUser || !dbPassword) {
    console.log('⚠️  Database configuration incomplete');
}

console.log();

// Summary
console.log('Summary:');
console.log('='.repeat(60));

if (hasErrors) {
    console.log('❌ CONFIGURATION ERRORS DETECTED');
    console.log();
    console.log('To fix these issues:');
    console.log('1. Run: backend/setup-google-auth.bat');
    console.log('2. Edit the .env file with your actual values');
    console.log('3. Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID_BACKEND are identical');
    console.log('4. Get Google OAuth credentials from: https://console.cloud.google.com/');
    console.log();
    process.exit(1);
} else {
    console.log('✅ CONFIGURATION LOOKS GOOD');
    console.log();
    console.log('Your Google OAuth setup appears to be configured correctly.');
    console.log('If you\'re still experiencing issues, check:');
    console.log('1. Frontend environment variables (NEXT_PUBLIC_GOOGLE_CLIENT_ID)');
    console.log('2. Google Cloud Console authorized origins and redirect URIs');
    console.log('3. Network connectivity and CORS settings');
    console.log();
} 