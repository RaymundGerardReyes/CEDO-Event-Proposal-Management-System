#!/usr/bin/env node

/**
 * CEDO Google Auth - Authentication Diagnostic Tool
 * This script will help identify and fix authentication issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CEDO Google Auth - Authentication Diagnostic');
console.log('==============================================\n');

// Check environment files
console.log('📋 Step 1: Environment Files Check');
console.log('-----------------------------------');

const backendEnvPath = path.join(__dirname, 'backend', '.env');
const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');

if (fs.existsSync(backendEnvPath)) {
    console.log('✅ Backend .env file exists');
    const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');

    // Check critical variables
    const criticalVars = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'JWT_SECRET',
        'MYSQL_HOST',
        'MYSQL_USER',
        'MYSQL_PASSWORD'
    ];

    criticalVars.forEach(varName => {
        if (backendEnv.includes(varName + '=')) {
            const value = backendEnv.match(new RegExp(varName + '=([^\\n]+)'))?.[1];
            if (value && !value.includes('your-') && !value.includes('placeholder')) {
                console.log(`✅ ${varName}: SET`);
            } else {
                console.log(`⚠️  ${varName}: NEEDS CONFIGURATION`);
            }
        } else {
            console.log(`❌ ${varName}: MISSING`);
        }
    });
} else {
    console.log('❌ Backend .env file missing');
}

if (fs.existsSync(frontendEnvPath)) {
    console.log('✅ Frontend .env.local file exists');
    const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');

    if (frontendEnv.includes('GOOGLE_CLIENT_ID=')) {
        const value = frontendEnv.match(/GOOGLE_CLIENT_ID=([^\n]+)/)?.[1];
        if (value && !value.includes('your-') && !value.includes('placeholder')) {
            console.log('✅ Frontend GOOGLE_CLIENT_ID: SET');
        } else {
            console.log('⚠️  Frontend GOOGLE_CLIENT_ID: NEEDS CONFIGURATION');
        }
    } else {
        console.log('❌ Frontend GOOGLE_CLIENT_ID: MISSING');
    }
} else {
    console.log('❌ Frontend .env.local file missing');
}

// Check package.json files
console.log('\n📦 Step 2: Dependencies Check');
console.log('-------------------------------');

const backendPackagePath = path.join(__dirname, 'backend', 'package.json');
const frontendPackagePath = path.join(__dirname, 'frontend', 'package.json');

if (fs.existsSync(backendPackagePath)) {
    console.log('✅ Backend package.json exists');
    const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
    if (backendPackage.dependencies) {
        const criticalDeps = ['express', 'mysql2', 'google-auth-library', 'passport'];
        criticalDeps.forEach(dep => {
            if (backendPackage.dependencies[dep]) {
                console.log(`✅ Backend ${dep}: ${backendPackage.dependencies[dep]}`);
            } else {
                console.log(`❌ Backend ${dep}: MISSING`);
            }
        });
    }
} else {
    console.log('❌ Backend package.json missing');
}

if (fs.existsSync(frontendPackagePath)) {
    console.log('✅ Frontend package.json exists');
    const frontendPackage = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
    if (frontendPackage.dependencies) {
        const criticalDeps = ['next', 'react', 'axios'];
        criticalDeps.forEach(dep => {
            if (frontendPackage.dependencies[dep]) {
                console.log(`✅ Frontend ${dep}: ${frontendPackage.dependencies[dep]}`);
            } else {
                console.log(`❌ Frontend ${dep}: MISSING`);
            }
        });
    }
} else {
    console.log('❌ Frontend package.json missing');
}

// Check for critical files
console.log('\n🔧 Step 3: Critical Files Check');
console.log('--------------------------------');

const criticalFiles = [
    'backend/server.js',
    'backend/routes/auth.js',
    'backend/config/oauth.js',
    'backend/utils/googleAuth.js',
    'frontend/src/contexts/auth-context.js',
    'frontend/src/components/auth/GoogleOAuthButton.jsx'
];

criticalFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}: EXISTS`);
    } else {
        console.log(`❌ ${file}: MISSING`);
    }
});

// Provide recommendations
console.log('\n🎯 Step 4: Recommendations');
console.log('----------------------------');

console.log('1. 🔑 Google OAuth Setup:');
console.log('   - Go to https://console.cloud.google.com/');
console.log('   - Create OAuth 2.0 credentials');
console.log('   - Add credentials to both .env files');
console.log('   - Authorized origins: http://localhost:3000');
console.log('   - Redirect URIs: http://localhost:5000/auth/google/callback');

console.log('\n2. 🗄️ Database Setup:');
console.log('   - Run: cd backend && npm run init-databases');
console.log('   - Ensure MySQL and MongoDB are running');
console.log('   - Check database credentials in .env');

console.log('\n3. 🚀 Start Services:');
console.log('   - Backend: cd backend && npm run dev');
console.log('   - Frontend: cd frontend && npm run dev');

console.log('\n4. 🧪 Test Authentication:');
console.log('   - Email/Password: Should work after database setup');
console.log('   - Google OAuth: Will work after adding credentials');
console.log('   - Check backend logs for detailed error messages');

console.log('\n📖 For detailed setup instructions, see SETUP_GUIDE.md');
console.log('🔧 For quick setup, run: bash QUICK_SETUP.sh');

console.log('\n✅ Diagnostic complete!'); 