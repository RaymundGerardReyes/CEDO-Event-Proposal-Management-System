#!/usr/bin/env node

/**
 * Fix API URL in Frontend Environment
 * This script updates the API_URL to include the /api path
 */

const fs = require('fs');
const path = require('path');

const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');

if (!fs.existsSync(frontendEnvPath)) {
    console.error('❌ Frontend .env.local file not found');
    process.exit(1);
}

console.log('📝 Fixing API URL in frontend environment file...');

let envContent = fs.readFileSync(frontendEnvPath, 'utf8');

// Update API_URL to include /api
envContent = envContent.replace(
    /API_URL=http:\/\/localhost:5000/,
    'API_URL=http://localhost:5000/api'
);

fs.writeFileSync(frontendEnvPath, envContent);

console.log('✅ Frontend API_URL updated successfully!');
console.log('🔗 API URL is now: http://localhost:5000/api');
console.log('📋 Next step: Restart your frontend development server'); 