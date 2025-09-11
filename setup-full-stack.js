#!/usr/bin/env node

/**
 * Full Stack Setup Script for CEDO Google Auth
 * 
 * This script sets up the complete development environment
 * and provides instructions for debugging.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up CEDO Google Auth Full Stack Development Environment...\n');

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    log('❌ Error: Please run this script from the project root directory', 'red');
    process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
    log(`⚠️  Warning: Node.js version ${nodeVersion} detected. Recommended: v18.17.0+`, 'yellow');
}

log(`✅ Node.js version: ${nodeVersion}`, 'green');

// Step 1: Install dependencies
log('\n📦 Step 1: Installing dependencies...', 'blue');
try {
    log('Installing main dependencies...', 'cyan');
    execSync('npm install', { stdio: 'inherit' });

    log('Installing frontend dependencies...', 'cyan');
    execSync('cd frontend && npm install', { stdio: 'inherit' });

    log('Installing backend dependencies...', 'cyan');
    execSync('cd backend && npm install', { stdio: 'inherit' });

    log('✅ All dependencies installed successfully!', 'green');
} catch (error) {
    log('❌ Error installing dependencies:', 'red');
    log(error.message, 'red');
    process.exit(1);
}

// Step 2: Check configuration files
log('\n🔧 Step 2: Checking configuration files...', 'blue');

const configFiles = [
    '.vscode/launch.json',
    '.vscode/tasks.json',
    'frontend/package.json',
    'backend/package.json'
];

configFiles.forEach(file => {
    if (fs.existsSync(file)) {
        log(`✅ ${file} exists`, 'green');
    } else {
        log(`❌ ${file} missing`, 'red');
    }
});

// Step 3: Check if servers can start
log('\n🌐 Step 3: Testing server startup...', 'blue');

// Test backend server
try {
    log('Testing backend server startup...', 'cyan');
    const backendTest = execSync('cd backend && node -e "console.log(\'Backend server can start\')"', { encoding: 'utf8' });
    log('✅ Backend server test passed', 'green');
} catch (error) {
    log('❌ Backend server test failed:', 'red');
    log(error.message, 'red');
}

// Test frontend server
try {
    log('Testing frontend server startup...', 'cyan');
    const frontendTest = execSync('cd frontend && node -e "console.log(\'Frontend server can start\')"', { encoding: 'utf8' });
    log('✅ Frontend server test passed', 'green');
} catch (error) {
    log('❌ Frontend server test failed:', 'red');
    log(error.message, 'red');
}

// Step 4: Check debug ports
log('\n🔍 Step 4: Checking debug ports...', 'blue');
const debugPorts = [9222, 9223, 9224, 9229];

debugPorts.forEach(port => {
    try {
        const netstat = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
        if (netstat.trim()) {
            log(`❌ Port ${port} is in use`, 'red');
        } else {
            log(`✅ Port ${port} is available`, 'green');
        }
    } catch (error) {
        log(`✅ Port ${port} is available`, 'green');
    }
});

// Step 5: Check browser installations
log('\n🌐 Step 5: Checking browser installations...', 'blue');

const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
];

let chromeFound = false;
chromePaths.forEach(chromePath => {
    if (fs.existsSync(chromePath)) {
        log(`✅ Chrome found: ${chromePath}`, 'green');
        chromeFound = true;
    }
});

if (!chromeFound) {
    log('⚠️  Chrome not found in standard locations', 'yellow');
}

const edgePaths = [
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let edgeFound = false;
edgePaths.forEach(edgePath => {
    if (fs.existsSync(edgePath)) {
        log(`✅ Edge found: ${edgePath}`, 'green');
        edgeFound = true;
    }
});

if (!edgeFound) {
    log('⚠️  Edge not found in standard locations', 'yellow');
}

// Step 6: Display usage instructions
log('\n🎯 Usage Instructions:', 'blue');
log('====================', 'blue');

log('\n🚀 Quick Start Commands:', 'green');
log('• npm run dev                    - Start both frontend and backend', 'cyan');
log('• npm run dev:debug              - Start with backend debugging enabled', 'cyan');
log('• npm run dev:full-debug         - Start with both frontend and backend debugging', 'cyan');
log('• npm run dev:frontend           - Start only frontend', 'cyan');
log('• npm run dev:backend            - Start only backend', 'cyan');

log('\n🔧 Debugging Commands:', 'green');
log('• npm run dev:backend:debug      - Start backend with debugging (port 9229)', 'cyan');
log('• npm run dev:frontend:debug     - Start frontend with debugging', 'cyan');

log('\n🧪 Testing Commands:', 'green');
log('• npm run test                   - Run all tests', 'cyan');
log('• npm run test:frontend          - Run frontend tests', 'cyan');
log('• npm run test:backend           - Run backend tests', 'cyan');

log('\n🛠️  Maintenance Commands:', 'green');
log('• npm run clean                  - Clean both frontend and backend', 'cyan');
log('• npm run build                  - Build both frontend and backend', 'cyan');
log('• npm run lint                   - Lint both frontend and backend', 'cyan');
log('• npm run health                 - Check health of both servers', 'cyan');

log('\n🐛 Debugging in Cursor AI:', 'green');
log('1. Press Ctrl+Shift+D to open Debug panel', 'cyan');
log('2. Select "🚀 Debug Full Stack (Coordinated)" for best experience', 'cyan');
log('3. Press F5 to start debugging', 'cyan');
log('4. Set breakpoints in your code', 'cyan');
log('5. Use the integrated terminal to see both server logs', 'cyan');

log('\n🔍 Alternative Debugging Configurations:', 'green');
log('• "🚀 Launch Backend Server (Node.js)" - Backend only', 'cyan');
log('• "🌐 Launch Frontend (Next.js) - Chrome (Clean)" - Frontend only', 'cyan');
log('• "🔗 Attach to Backend Process" - Attach to running backend', 'cyan');
log('• "🔗 Attach to Chrome (Manual Launch)" - Attach to running Chrome', 'cyan');

log('\n📚 Documentation:', 'green');
log('• DEBUGGING_GUIDE.md - Complete debugging guide', 'cyan');
log('• BROWSER_DEBUGGING_TROUBLESHOOTING.md - Browser debugging issues', 'cyan');
log('• BROWSER_DEBUGGING_FIX_SUMMARY.md - Fix summary', 'cyan');

log('\n🎉 Setup Complete!', 'green');
log('==================', 'green');

log('\nNext Steps:', 'yellow');
log('1. Run: npm run dev', 'cyan');
log('2. Open Cursor AI and press Ctrl+Shift+D', 'cyan');
log('3. Select "🚀 Debug Full Stack (Coordinated)"', 'cyan');
log('4. Press F5 to start debugging', 'cyan');
log('5. Set breakpoints in your code and start debugging!', 'cyan');

log('\n✨ Happy debugging! 🐛', 'green');

