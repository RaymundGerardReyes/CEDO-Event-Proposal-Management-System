/**
 * Simple Environment Variables Test
 * Checks if .env file is being loaded correctly
 */

require('dotenv').config();

console.log('🔍 ENVIRONMENT VARIABLES TEST');
console.log('============================\n');

console.log('📋 All EMAIL-related environment variables:');
console.log('-------------------------------------------');

const emailVars = Object.keys(process.env).filter(key =>
    key.includes('EMAIL') || key.includes('SMTP') || key.includes('GMAIL')
);

emailVars.forEach(key => {
    const value = process.env[key];
    if (value && value.length > 0) {
        // Mask sensitive values
        if (key.includes('PASSWORD') || key.includes('SECRET')) {
            console.log(`${key}: ${value.substring(0, 4)}***`);
        } else {
            console.log(`${key}: ${value}`);
        }
    } else {
        console.log(`${key}: NOT SET`);
    }
});

console.log('\n📋 Required variables check:');
console.log('----------------------------');

const requiredVars = ['EMAIL_USER', 'EMAIL_PASSWORD', 'FRONTEND_URL'];
let allPresent = true;

requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value.length > 0) {
        console.log(`✅ ${varName}: SET`);
    } else {
        console.log(`❌ ${varName}: NOT SET`);
        allPresent = false;
    }
});

console.log('\n📋 Summary:');
console.log('-----------');

if (allPresent) {
    console.log('✅ All required environment variables are set');
    console.log('✅ Email service should be able to initialize');
} else {
    console.log('❌ Missing required environment variables');
    console.log('❌ Email service will run in demo mode');
}

console.log('\n📋 Current working directory:', process.cwd());
console.log('📋 .env file location:', require('path').join(process.cwd(), '.env'));

