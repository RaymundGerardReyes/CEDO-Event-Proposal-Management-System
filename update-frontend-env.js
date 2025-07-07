#!/usr/bin/env node

/**
 * Update Frontend Environment File
 * This script updates the frontend .env.local file with the correct Google OAuth credentials
 */

const fs = require('fs');
const path = require('path');

const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');

if (!fs.existsSync(frontendEnvPath)) {
    console.error('❌ Frontend .env.local file not found');
    process.exit(1);
}

console.log('📝 Updating frontend environment file...');

let envContent = fs.readFileSync(frontendEnvPath, 'utf8');

// Update Google OAuth credentials
envContent = envContent.replace(
    /GOOGLE_CLIENT_ID=your-google-client-id-here/,
);

envContent = envContent.replace(
    /GOOGLE_CLIENT_SECRET=your-google-client-secret-here/,
);

fs.writeFileSync(frontendEnvPath, envContent);

console.log('✅ Frontend environment file updated successfully!');
console.log('🔑 Google OAuth credentials configured');
console.log('📋 Next step: Initialize databases and start services'); 
