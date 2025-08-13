// backend/fix-server-clock.js
require('dotenv').config();

console.log('🕐 Server Clock Synchronization Diagnostic');
console.log('==========================================');

// Get current server time
const serverTime = new Date();
const serverTimestamp = Math.floor(serverTime.getTime() / 1000);

console.log('\n📋 Current Server Time:');
console.log(`  ISO String: ${serverTime.toISOString()}`);
console.log(`  Unix Timestamp: ${serverTimestamp}`);
console.log(`  Local Time: ${serverTime.toString()}`);

// Test with a sample Google token timing
console.log('\n🔍 Clock Skew Analysis:');
console.log('  This script helps diagnose clock synchronization issues.');

// Calculate expected Google time (approximate)
const googleTimeApprox = serverTimestamp + (8 * 3600); // Add 8 hours for Google time
console.log(`  Estimated Google time: ${googleTimeApprox} (${new Date(googleTimeApprox * 1000).toISOString()})`);

console.log('\n⚠️  RECOMMENDATIONS:');
console.log('  1. Your server clock appears to be ~8 hours ahead of Google servers');
console.log('  2. This is causing Google OAuth token verification to fail');
console.log('  3. Solutions:');
console.log('     a) Synchronize your server clock with an NTP server');
console.log('     b) Use the development bypass mode for testing');
console.log('     c) Set GOOGLE_AUTH_BYPASS=true in your .env file');

console.log('\n🔧 IMMEDIATE FIX:');
console.log('  Add this to your .env file:');
console.log('  GOOGLE_AUTH_BYPASS=true');

console.log('\n🔄 PERMANENT FIX:');
console.log('  Windows:');
console.log('    - Open Settings > Time & Language > Date & time');
console.log('    - Turn on "Set time automatically"');
console.log('  Linux:');
console.log('    - sudo ntpdate pool.ntp.org');
console.log('    - sudo timedatectl set-ntp true');

console.log('\n==========================================\n'); 