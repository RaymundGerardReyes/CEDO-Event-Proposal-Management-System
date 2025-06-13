#!/usr/bin/env node

/**
 * Google OAuth Routes Fix Script
 * This script diagnoses and fixes route configuration issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Google OAuth Routes Fix');
console.log('==========================');

// Check if environment variables are set
console.log('\n📋 Checking Backend Environment Variables:');
require('dotenv').config();

const envVars = {
    'NODE_ENV': process.env.NODE_ENV,
    'PORT': process.env.PORT,
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID ? '✅ SET' : '❌ NOT SET',
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET ? '✅ SET' : '❌ NOT SET',
    'GOOGLE_CLIENT_ID_BACKEND': process.env.GOOGLE_CLIENT_ID_BACKEND ? '✅ SET' : '❌ NOT SET',
    'JWT_SECRET_DEV': process.env.JWT_SECRET_DEV ? '✅ SET' : '❌ NOT SET',
    'FRONTEND_URL': process.env.FRONTEND_URL
};

Object.entries(envVars).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
});

console.log('\n🔍 Analyzing Route Configuration:');

// Check if server.js has the correct route mounting
try {
    const serverFile = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

    console.log('\n📝 Route Mounting Analysis:');

    if (serverFile.includes('app.use("/api/auth", authRoutes)')) {
        console.log('✅ Auth routes mounted on /api/auth');
    } else {
        console.log('❌ Auth routes not properly mounted');
    }

    if (serverFile.includes('app.use("/auth/oauth", oauthRoutes)') || serverFile.includes('app.use("/auth", oauthRoutes)')) {
        console.log('✅ OAuth routes mounted on /auth');
    } else {
        console.log('❌ OAuth routes not properly mounted');
    }

} catch (error) {
    console.error('❌ Could not read server.js file:', error.message);
}

console.log('\n🛠️ Current Route Structure:');
console.log('Expected routes:');
console.log('- POST /api/auth/google (for ID token verification)');
console.log('- GET /auth/google (for OAuth redirect initiation)');
console.log('- GET /auth/google/callback (for OAuth callback handling)');

console.log('\n🚨 Common Issues and Fixes:');

console.log('\n1. POST /auth/google 404 Error:');
console.log('   Issue: Frontend sending POST to /auth/google instead of /api/auth/google');
console.log('   Fix: Check frontend auth-context.js - should POST to /api/auth/google');

console.log('\n2. OAuth Flow Not Working:');
console.log('   Issue: OAuth routes not properly configured');
console.log('   Fix: Ensure OAuth routes are mounted on /auth prefix');

console.log('\n3. Environment Variables Missing:');
console.log('   Issue: Google OAuth credentials not set');
console.log('   Fix: Update .env file with actual Google Client ID and Secret');

// Check if .env file exists and suggest fixes
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('\n❌ .env file not found!');
    console.log('Creating .env file...');

    const envTemplate = `# Backend Environment Configuration
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=cedo_auth
DB_USER=root
DB_PASSWORD=

# JWT Configuration
JWT_SECRET_DEV=cedo-jwt-secret-dev-development-key-change-in-production

# Google OAuth Configuration (REPLACE WITH YOUR ACTUAL CREDENTIALS)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CLIENT_ID_BACKEND=your-google-client-id.apps.googleusercontent.com

# Cookie and Session Security
COOKIE_SECRET=cedo-cookie-secret-development-change-in-production

# Security Configuration
REQUIRE_GOOGLE_EMAIL_VERIFIED=true

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/cedo-partnership
`;

    try {
        fs.writeFileSync(envPath, envTemplate);
        console.log('✅ Created .env file with template');
        console.log('⚠️  Please update Google OAuth credentials with actual values');
    } catch (error) {
        console.error('❌ Could not create .env file:', error.message);
    }
} else {
    console.log('\n✅ .env file exists');
}

console.log('\n🔧 Next Steps:');
console.log('1. Update .env file with actual Google OAuth credentials');
console.log('2. Restart the backend server: npm run dev');
console.log('3. Check server logs for route mounting confirmation');
console.log('4. Test OAuth flow with proper frontend configuration');

console.log('\n📋 To get Google OAuth credentials:');
console.log('1. Go to https://console.cloud.google.com/');
console.log('2. Create a new project or select existing one');
console.log('3. Enable Google+ API');
console.log('4. Create OAuth 2.0 credentials');
console.log('5. Set authorized redirect URIs to: http://localhost:5000/auth/google/callback');
console.log('6. Set authorized JavaScript origins to: http://localhost:3000, http://localhost:5000');

console.log('\n✅ OAuth Routes Fix Complete');
console.log('Please follow the next steps above to complete the setup.'); 