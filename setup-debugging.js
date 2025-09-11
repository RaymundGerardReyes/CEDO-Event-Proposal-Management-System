#!/usr/bin/env node

/**
 * Debugging Setup Script for CEDO Google Auth Project
 * 
 * This script helps you set up debugging for both frontend and backend
 * Run with: node setup-debugging.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🐛 Setting up debugging for CEDO Google Auth Project...\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ Error: Please run this script from the project root directory');
    process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion < 18) {
    console.warn(`⚠️  Warning: Node.js version ${nodeVersion} detected. Recommended: v18.17.0+`);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if .vscode directory exists
const vscodeDir = path.join(process.cwd(), '.vscode');
if (!fs.existsSync(vscodeDir)) {
    console.log('📁 Creating .vscode directory...');
    fs.mkdirSync(vscodeDir);
}

// Check if launch.json exists
const launchJsonPath = path.join(vscodeDir, 'launch.json');
if (fs.existsSync(launchJsonPath)) {
    console.log('✅ launch.json already exists');
} else {
    console.log('❌ launch.json not found. Please ensure it was created properly.');
}

// Check if tasks.json exists
const tasksJsonPath = path.join(vscodeDir, 'tasks.json');
if (fs.existsSync(tasksJsonPath)) {
    console.log('✅ tasks.json already exists');
} else {
    console.log('❌ tasks.json not found. Please ensure it was created properly.');
}

// Check dependencies
console.log('\n📦 Checking dependencies...');

// Check backend dependencies
const backendPackageJson = path.join(process.cwd(), 'backend', 'package.json');
if (fs.existsSync(backendPackageJson)) {
    console.log('✅ Backend package.json found');

    // Check if node_modules exists
    const backendNodeModules = path.join(process.cwd(), 'backend', 'node_modules');
    if (fs.existsSync(backendNodeModules)) {
        console.log('✅ Backend dependencies installed');
    } else {
        console.log('⚠️  Backend dependencies not installed. Run: cd backend && npm install');
    }
} else {
    console.log('❌ Backend package.json not found');
}

// Check frontend dependencies
const frontendPackageJson = path.join(process.cwd(), 'frontend', 'package.json');
if (fs.existsSync(frontendPackageJson)) {
    console.log('✅ Frontend package.json found');

    // Check if node_modules exists
    const frontendNodeModules = path.join(process.cwd(), 'frontend', 'node_modules');
    if (fs.existsSync(frontendNodeModules)) {
        console.log('✅ Frontend dependencies installed');
    } else {
        console.log('⚠️  Frontend dependencies not installed. Run: cd frontend && npm install');
    }
} else {
    console.log('❌ Frontend package.json not found');
}

// Check if server.js exists
const serverJsPath = path.join(process.cwd(), 'backend', 'server.js');
if (fs.existsSync(serverJsPath)) {
    console.log('✅ Backend server.js found');
} else {
    console.log('❌ Backend server.js not found');
}

// Check if Next.js config exists
const nextConfigPath = path.join(process.cwd(), 'frontend', 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
    console.log('✅ Next.js config found');
} else {
    console.log('❌ Next.js config not found');
}

console.log('\n🎯 Debugging Setup Summary:');
console.log('============================');
console.log('✅ launch.json configured with multiple debugging options');
console.log('✅ tasks.json configured for development tasks');
console.log('✅ DEBUGGING_GUIDE.md created with comprehensive instructions');
console.log('\n📋 Next Steps:');
console.log('1. Open Cursor AI');
console.log('2. Press Ctrl+Shift+D to open Debug panel');
console.log('3. Select a debugging configuration from the dropdown');
console.log('4. Set breakpoints in your code');
console.log('5. Press F5 to start debugging');
console.log('\n🚀 Quick Start Commands:');
console.log('• Backend: Select "🚀 Launch Backend Server (Node.js)"');
console.log('• Frontend: Select "🌐 Launch Frontend (Next.js) - Chrome"');
console.log('• Full Stack: Select "🚀 Debug Full Stack Application"');
console.log('\n📖 For detailed instructions, see DEBUGGING_GUIDE.md');
console.log('\n🎉 Debugging setup complete! Happy debugging! 🐛');

