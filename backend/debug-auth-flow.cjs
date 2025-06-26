#!/usr/bin/env node

/**
 * Comprehensive Google Authentication Flow Debugger
 * This script simulates and tests the entire Google OAuth flow
 */

// Use CommonJS require since this is a Node.js script
const dotenv = require('dotenv');
const { verifyGoogleToken } = require('./utils/googleAuth');

// Load environment variables
dotenv.config();

// Main async function to handle async operations
async function main() {
    console.log('='.repeat(70));
    console.log('  GOOGLE AUTHENTICATION FLOW DEBUGGER');
    console.log('='.repeat(70));
    console.log();

    // Configuration check
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_ID_BACKEND = process.env.GOOGLE_CLIENT_ID_BACKEND;

    console.log('🔧 Configuration Check:');
    console.log('-'.repeat(50));
    console.log(`GOOGLE_CLIENT_ID:         ${GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 15)}...` : '❌ MISSING'}`);
    console.log(`GOOGLE_CLIENT_ID_BACKEND: ${GOOGLE_CLIENT_ID_BACKEND ? `${GOOGLE_CLIENT_ID_BACKEND.substring(0, 15)}...` : '❌ MISSING'}`);

    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID_BACKEND) {
        if (GOOGLE_CLIENT_ID === GOOGLE_CLIENT_ID_BACKEND) {
            console.log('✅ Google Client IDs match - Configuration correct');
        } else {
            console.log('❌ Google Client IDs DO NOT match - This will cause token verification failures');
            console.log(`   Expected: ${GOOGLE_CLIENT_ID}`);
            console.log(`   Backend:  ${GOOGLE_CLIENT_ID_BACKEND}`);
        }
    } else {
        console.log('⚠️  Cannot verify Client ID match - Missing environment variables');
    }

    console.log();

    // Test Google Auth Library
    console.log('🔍 Google Auth Library Test:');
    console.log('-'.repeat(50));

    try {
        const { OAuth2Client } = require('google-auth-library');

        if (GOOGLE_CLIENT_ID) {
            const client = new OAuth2Client(GOOGLE_CLIENT_ID);
            console.log('✅ Google OAuth2Client initialized successfully');

            // Test with invalid token (should fail gracefully)
            console.log('🧪 Testing token verification with invalid token...');

            try {
                await client.verifyIdToken({
                    idToken: 'invalid.token.test',
                    audience: GOOGLE_CLIENT_ID
                });
                console.log('❌ Unexpected: Invalid token was accepted');
            } catch (error) {
                if (error.message.includes('Wrong number of segments')) {
                    console.log('✅ Token verification correctly rejects malformed tokens');
                } else {
                    console.log(`✅ Token verification working (error: ${error.message.substring(0, 50)}...)`);
                }
            }

        } else {
            console.log('❌ Cannot test Google Auth Library - GOOGLE_CLIENT_ID missing');
        }
    } catch (error) {
        console.log('❌ Error with Google Auth Library:', error.message);
    }

    console.log();

    // Test the authentication route logic simulation
    console.log('🔄 Authentication Route Logic Test:');
    console.log('-'.repeat(50));

    // Simulate the backend route logic
    const simulateAuthRoute = async (idToken) => {
        console.log('📥 Simulating /auth/google route...');

        // Step 1: Check for token
        if (!idToken) {
            return { status: 400, error: 'No ID token provided' };
        }
        console.log('✅ Step 1: ID token received');

        // Step 2: Check environment variable
        const googleClientIdForVerification = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID_BACKEND;
        if (!googleClientIdForVerification) {
            return { status: 500, error: 'GOOGLE_CLIENT_ID not configured' };
        }
        console.log('✅ Step 2: Environment variable check passed');

        // Step 3: Try token verification
        try {
            console.log('🔍 Step 3: Attempting token verification...');
            const payload = await verifyGoogleToken(idToken);
            console.log('✅ Step 3: Token verification successful');
            return { status: 200, user: { email: payload.email, name: payload.name } };
        } catch (error) {
            console.log(`❌ Step 3: Token verification failed - ${error.message}`);
            return { status: 401, error: error.message };
        }
    };

    // Test with a malformed token
    console.log('Testing with malformed token:');
    simulateAuthRoute('malformed.token.test').then(result => {
        console.log(`   Result: ${result.status} - ${result.error || 'Success'}`);
        console.log();

        // Instructions for real testing
        console.log('🧪 Real Token Testing Instructions:');
        console.log('-'.repeat(50));
        console.log('To test with a real Google ID token:');
        console.log('1. Go to: https://developers.google.com/oauthplayground/');
        console.log('2. Select "Google OAuth2 API v2" > "userinfo.email" and "userinfo.profile"');
        console.log('3. Click "Authorize APIs"');
        console.log('4. Sign in with Google');
        console.log('5. Click "Exchange authorization code for tokens"');
        console.log('6. Copy the "id_token" value');
        console.log('7. Run: node debug-auth-flow.js --token="YOUR_ID_TOKEN_HERE"');
        console.log();

        // Check command line arguments for real token
        const args = process.argv.slice(2);
        const tokenArg = args.find(arg => arg.startsWith('--token='));

        if (tokenArg) {
            const realToken = tokenArg.split('=')[1].replace(/"/g, '');
            console.log('🔍 Testing with provided token...');
            return simulateAuthRoute(realToken);
        } else {
            console.log('💡 No real token provided for testing');
            console.log();
            testNetworkConfiguration();
        }
    }).then(result => {
        if (result) {
            console.log(`   Real token test result: ${result.status} - ${result.error || 'Success'}`);
            if (result.user) {
                console.log(`   User: ${result.user.email} (${result.user.name})`);
            }
        }
        console.log();
        testNetworkConfiguration();
    });

    // Test network configuration
    function testNetworkConfiguration() {
        console.log('🌐 Network Configuration Test:');
        console.log('-'.repeat(50));

        const backendUrl = process.env.BASE_URL || 'http://localhost:5000';
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

        console.log(`Backend URL:  ${backendUrl}`);
        console.log(`Frontend URL: ${frontendUrl}`);

        // CORS check simulation
        console.log();
        console.log('🔒 CORS Configuration Check:');
        console.log('   Ensure these URLs are configured in Google Cloud Console:');
        console.log(`   - JavaScript origins: ${frontendUrl}`);
        console.log(`   - Redirect URIs: ${backendUrl}/auth/google/callback`);

        console.log();
        console.log('📝 Next Steps for Debugging:');
        console.log('-'.repeat(50));
        console.log('1. Start your backend: npm run dev');
        console.log('2. Start your frontend: npm run dev');
        console.log('3. Open browser DevTools > Network tab');
        console.log('4. Try Google Sign-In and check:');
        console.log('   - POST request to /auth/google');
        console.log('   - Request payload contains token');
        console.log('   - Response status and content');
        console.log('5. Check backend console for detailed logs');

        console.log();
        console.log('🐛 Common Issues and Solutions:');
        console.log('-'.repeat(50));
        console.log('❌ "Invalid audience" error:');
        console.log('   → Frontend and backend using different Client IDs');
        console.log('   → Check NEXT_PUBLIC_GOOGLE_CLIENT_ID vs GOOGLE_CLIENT_ID');
        console.log();
        console.log('❌ "No token or user data received":');
        console.log('   → Backend auth route throwing unhandled error');
        console.log('   → Check backend logs for the actual error');
        console.log();
        console.log('❌ CORS errors:');
        console.log('   → Check frontend URL in CORS configuration');
        console.log('   → Verify Google Cloud Console authorized origins');
        console.log();
        console.log('❌ "Account not found":');
        console.log('   → User not in database');
        console.log('   → Run: node scripts/create-admin.js');
    }
}

// Run the main function
main().catch(error => {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
});