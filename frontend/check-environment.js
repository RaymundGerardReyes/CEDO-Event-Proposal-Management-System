#!/usr/bin/env node

/**
 * Environment Check Script
 * Verifies that all required environment variables and configurations are set
 */

console.log('🔍 Environment Configuration Check\n');

// Check Node.js version
console.log('Node.js version:', process.version);

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL || 'not set (defaulting to http://localhost:5000)');

// Check if .env.local exists
const fs = require('fs');
const path = require('path');

const envFiles = ['.env.local', '.env', '.env.development'];
console.log('\n📄 Environment Files:');

envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    console.log(`${file}: ${exists ? '✅ exists' : '❌ not found'}`);

    if (exists) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
            console.log(`  └─ ${lines.length} variables defined`);
        } catch (error) {
            console.log(`  └─ ❌ Error reading file: ${error.message}`);
        }
    }
});

// Check Next.js configuration
console.log('\n⚙️ Next.js Configuration:');
try {
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
        console.log('next.config.js: ✅ exists');
    } else {
        console.log('next.config.js: ❌ not found');
    }
} catch (error) {
    console.log('next.config.js: ❌ error checking:', error.message);
}

// Check package.json scripts
console.log('\n📦 Package.json Scripts:');
try {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const scripts = packageJson.scripts || {};

        console.log('Available scripts:');
        Object.keys(scripts).forEach(script => {
            console.log(`  ${script}: ${scripts[script]}`);
        });
    }
} catch (error) {
    console.log('❌ Error reading package.json:', error.message);
}

// Recommend actions
console.log('\n🔧 Recommendations:');

if (!process.env.NEXT_PUBLIC_BACKEND_URL) {
    console.log('⚠️ NEXT_PUBLIC_BACKEND_URL not set. Create .env.local with:');
    console.log('   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000');
}

console.log('\n📋 To fix connection issues:');
console.log('1. Ensure backend is running: cd backend && npm start');
console.log('2. Ensure frontend is running: cd frontend && npm run dev');
console.log('3. Check MongoDB is connected in backend logs');
console.log('4. Test backend directly: curl http://localhost:5000/health');
console.log('5. Run the connection test: node test-admin-api-connection.js');

console.log('\n✅ Environment check complete!'); 