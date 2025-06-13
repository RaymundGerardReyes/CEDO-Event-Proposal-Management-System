#!/usr/bin/env node

/**
 * Google OAuth Diagnostic Script
 * This script checks the current configuration and identifies issues
 */

console.log('🔧 Google OAuth Diagnostic Tool');
console.log('================================');

// Check environment variables
console.log('\n📋 Frontend Environment Variables:');
console.log(`NEXT_PUBLIC_API_URL: ${process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}`);
console.log(`NEXT_PUBLIC_BACKEND_URL: ${process.env.NEXT_PUBLIC_BACKEND_URL || 'NOT SET'}`);
console.log(`NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'NOT SET'}`);

console.log('\n🔍 Issues Found:');

const issues = [];
const fixes = [];

if (!process.env.NEXT_PUBLIC_API_URL) {
    issues.push('❌ NEXT_PUBLIC_API_URL is not set');
    fixes.push('Add NEXT_PUBLIC_API_URL=http://localhost:5000 to .env.local');
}

if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
    issues.push('❌ NEXT_PUBLIC_BACKEND_URL is not set');
    fixes.push('Add NEXT_PUBLIC_BACKEND_URL=http://localhost:5000 to .env.local');
}

if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.includes('your-google-client-id')) {
    issues.push('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is not properly configured');
    fixes.push('Replace with your actual Google Client ID from Google Cloud Console');
}

if (issues.length === 0) {
    console.log('✅ All environment variables are set correctly');
} else {
    issues.forEach(issue => console.log(issue));
}

console.log('\n🛠️ Fixes Needed:');
if (fixes.length === 0) {
    console.log('✅ No immediate fixes needed for environment variables');
} else {
    fixes.forEach((fix, index) => console.log(`${index + 1}. ${fix}`));
}

console.log('\n🚨 Common Issues and Solutions:');
console.log('\n1. "POST /auth/google 404" Error:');
console.log('   - This happens when frontend tries to POST to /auth/google');
console.log('   - But the backend expects either:');
console.log('     a) GET /auth/google (OAuth redirect flow)');
console.log('     b) POST /api/auth/google (ID token flow)');
console.log('   - Check which authentication method your sign-in component uses');

console.log('\n2. "Sign In Failed: Authentication service unavailable":');
console.log('   - Check if backend server is running on port 5000');
console.log('   - Verify NEXT_PUBLIC_API_URL points to correct backend');
console.log('   - Check browser network tab for actual URLs being called');

console.log('\n3. "Google Sign-In was force reset by user":');
console.log('   - Clear browser localStorage and sessionStorage');
console.log('   - Reload the page completely');
console.log('   - Check Google Client ID configuration');

console.log('\n🔧 Next Steps:');
console.log('1. Fix environment variables above');
console.log('2. Restart your development server');
console.log('3. Open browser dev tools and check:');
console.log('   - Network tab for actual API calls');
console.log('   - Console for JavaScript errors');
console.log('   - Application tab > Local Storage for tokens');
console.log('4. Try Google Sign-In again');

console.log('\n📞 Still having issues?');
console.log('Check these files:');
console.log('- frontend/.env.local (environment variables)');
console.log('- backend/.env (OAuth configuration)');
console.log('- Google Cloud Console OAuth settings'); 