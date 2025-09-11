#!/usr/bin/env node

/**
 * Debugging Setup Test Script
 * 
 * This script tests the debugging configurations and provides
 * recommendations for fixing browser debugging issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing Debugging Setup...\n');

// Test results
const results = {
    launchJson: false,
    tasksJson: false,
    frontendRunning: false,
    backendRunning: false,
    portsAvailable: {},
    browserPaths: {},
    recommendations: []
};

// Test 1: Check launch.json
console.log('1️⃣ Checking launch.json...');
try {
    const launchJsonPath = path.join(process.cwd(), '.vscode', 'launch.json');
    if (fs.existsSync(launchJsonPath)) {
        const launchJson = JSON.parse(fs.readFileSync(launchJsonPath, 'utf8'));
        const chromeConfigs = launchJson.configurations.filter(config =>
            config.type === 'chrome' || config.type === 'msedge'
        );

        if (chromeConfigs.length >= 3) {
            results.launchJson = true;
            console.log('✅ launch.json has multiple browser configurations');
        } else {
            console.log('⚠️  launch.json has limited browser configurations');
            results.recommendations.push('Add more browser debugging configurations');
        }
    } else {
        console.log('❌ launch.json not found');
        results.recommendations.push('Create .vscode/launch.json file');
    }
} catch (error) {
    console.log('❌ Error reading launch.json:', error.message);
    results.recommendations.push('Fix launch.json syntax errors');
}

// Test 2: Check tasks.json
console.log('\n2️⃣ Checking tasks.json...');
try {
    const tasksJsonPath = path.join(process.cwd(), '.vscode', 'tasks.json');
    if (fs.existsSync(tasksJsonPath)) {
        const tasksJson = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf8'));
        if (tasksJson.tasks && tasksJson.tasks.length > 0) {
            results.tasksJson = true;
            console.log('✅ tasks.json configured');
        }
    } else {
        console.log('⚠️  tasks.json not found');
        results.recommendations.push('Create .vscode/tasks.json file');
    }
} catch (error) {
    console.log('❌ Error reading tasks.json:', error.message);
}

// Test 3: Check if frontend is running
console.log('\n3️⃣ Checking frontend server...');
try {
    const response = require('http').get('http://localhost:3000', (res) => {
        results.frontendRunning = true;
        console.log('✅ Frontend server is running on port 3000');
    }).on('error', (err) => {
        console.log('⚠️  Frontend server not running on port 3000');
        results.recommendations.push('Start frontend server: cd frontend && npm run dev');
    });

    setTimeout(() => {
        if (!results.frontendRunning) {
            console.log('⚠️  Frontend server not responding');
        }
    }, 2000);
} catch (error) {
    console.log('⚠️  Could not check frontend server');
}

// Test 4: Check if backend is running
console.log('\n4️⃣ Checking backend server...');
try {
    const response = require('http').get('http://localhost:5000', (res) => {
        results.backendRunning = true;
        console.log('✅ Backend server is running on port 5000');
    }).on('error', (err) => {
        console.log('⚠️  Backend server not running on port 5000');
        results.recommendations.push('Start backend server: cd backend && npm run dev');
    });

    setTimeout(() => {
        if (!results.backendRunning) {
            console.log('⚠️  Backend server not responding');
        }
    }, 2000);
} catch (error) {
    console.log('⚠️  Could not check backend server');
}

// Test 5: Check debug ports
console.log('\n5️⃣ Checking debug ports...');
const debugPorts = [9222, 9223, 9224, 9225];

debugPorts.forEach(port => {
    try {
        const netstat = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
        if (netstat.trim()) {
            results.portsAvailable[port] = false;
            console.log(`❌ Port ${port} is in use`);
        } else {
            results.portsAvailable[port] = true;
            console.log(`✅ Port ${port} is available`);
        }
    } catch (error) {
        results.portsAvailable[port] = true;
        console.log(`✅ Port ${port} is available`);
    }
});

// Test 6: Check browser paths
console.log('\n6️⃣ Checking browser installations...');

// Chrome paths
const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
];

chromePaths.forEach(chromePath => {
    if (fs.existsSync(chromePath)) {
        results.browserPaths.chrome = chromePath;
        console.log(`✅ Chrome found: ${chromePath}`);
        return;
    }
});

if (!results.browserPaths.chrome) {
    console.log('⚠️  Chrome not found in standard locations');
    results.recommendations.push('Install Chrome or update browser path in VS Code settings');
}

// Edge paths
const edgePaths = [
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

edgePaths.forEach(edgePath => {
    if (fs.existsSync(edgePath)) {
        results.browserPaths.edge = edgePath;
        console.log(`✅ Edge found: ${edgePath}`);
        return;
    }
});

if (!results.browserPaths.edge) {
    console.log('⚠️  Edge not found in standard locations');
    results.recommendations.push('Install Edge or update browser path in VS Code settings');
}

// Generate recommendations
console.log('\n📋 Recommendations:');
console.log('==================');

if (results.recommendations.length === 0) {
    console.log('🎉 No issues found! Your debugging setup looks good.');
} else {
    results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
    });
}

// Quick fixes
console.log('\n🚀 Quick Fixes:');
console.log('===============');

if (!results.frontendRunning) {
    console.log('• Start frontend: cd frontend && npm run dev');
}

if (!results.backendRunning) {
    console.log('• Start backend: cd backend && npm run dev');
}

if (Object.values(results.portsAvailable).some(available => !available)) {
    console.log('• Kill processes using debug ports:');
    console.log('  - Use Task Manager to end Chrome/Edge processes');
    console.log('  - Or run: taskkill /F /IM chrome.exe /T');
    console.log('  - Or run: taskkill /F /IM msedge.exe /T');
}

console.log('\n🔧 Manual Browser Launch:');
console.log('=========================');
console.log('If automatic browser launching fails, try:');
console.log('• Run: launch-chrome-debug.bat');
console.log('• Run: launch-edge-debug.bat');
console.log('• Run: powershell -ExecutionPolicy Bypass -File launch-browser-debug.ps1');

console.log('\n📖 Documentation:');
console.log('=================');
console.log('• Read: BROWSER_DEBUGGING_TROUBLESHOOTING.md');
console.log('• Read: DEBUGGING_GUIDE.md');

console.log('\n🎯 Next Steps:');
console.log('==============');
console.log('1. Fix any issues listed above');
console.log('2. Open Cursor AI');
console.log('3. Press Ctrl+Shift+D to open Debug panel');
console.log('4. Try "🌐 Launch Frontend (Next.js) - Chrome (Clean)" first');
console.log('5. If that fails, use manual browser launch methods');

console.log('\n✨ Debugging setup test complete!');
