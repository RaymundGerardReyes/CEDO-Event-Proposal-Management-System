#!/usr/bin/env node

/**
 * Test script to verify DOM removeChild error fixes
 * Based on React issue #11538 and Next.js issue #58055 research
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing DOM removeChild Error Fixes...\n');

// 1. Check for conflicting layout files
const authLayoutDir = path.join(__dirname, 'src/app/(auth)');
const layouts = fs.readdirSync(authLayoutDir).filter(file =>
    file.startsWith('layout.') && (file.endsWith('.js') || file.endsWith('.jsx'))
);

console.log('📁 Layout files in (auth) directory:', layouts);

if (layouts.length > 1) {
    console.log('❌ CONFLICT: Multiple layout files detected');
    console.log('   This can cause Next.js routing conflicts');
    process.exit(1);
} else {
    console.log('✅ No layout conflicts detected');
}

// 2. Check for React Fragment patterns in layout files
const checkFileForFragments = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const fragmentPatterns = [
        /<>\s*{children}\s*<\/>/,
        /return\s*<>\s*.*\s*<\/>/,
        /Fragment.*children.*Fragment/
    ];

    return fragmentPatterns.some(pattern => pattern.test(content));
};

let hasFragmentIssues = false;

// Check all layout files
const allLayoutFiles = [
    'src/app/layout.js',
    'src/app/(auth)/layout.js',
    'src/app/(main)/layout.jsx'
];

for (const layoutFile of allLayoutFiles) {
    const fullPath = path.join(__dirname, layoutFile);
    if (fs.existsSync(fullPath)) {
        if (checkFileForFragments(fullPath)) {
            console.log(`❌ Fragment pattern detected in: ${layoutFile}`);
            hasFragmentIssues = true;
        } else {
            console.log(`✅ No fragment issues in: ${layoutFile}`);
        }
    }
}

if (hasFragmentIssues) {
    console.log('\n❌ Fragment issues detected - these can cause removeChild errors');
    console.log('   Reference: https://github.com/facebook/react/issues/11538');
    process.exit(1);
}

// 3. Check if DOM error protection components exist
const protectionComponents = [
    'src/components/dom-error-boundary.jsx',
    'src/components/browser-extension-detector.jsx',
    'src/components/dom-error-monitor.jsx'
];

for (const component of protectionComponents) {
    const fullPath = path.join(__dirname, component);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ Protection component exists: ${component}`);
    } else {
        console.log(`❌ Missing protection component: ${component}`);
        process.exit(1);
    }
}

// 4. Check if React canary version is installed
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const reactVersion = packageJson.dependencies?.react;
const reactDomVersion = packageJson.dependencies?.['react-dom'];

console.log(`\n📦 React version: ${reactVersion}`);
console.log(`📦 React DOM version: ${reactDomVersion}`);

if (reactVersion?.includes('canary') && reactDomVersion?.includes('canary')) {
    console.log('✅ React canary version installed for improved error handling');
} else {
    console.log('⚠️  Consider upgrading to React canary for better DOM error handling');
}

// 5. Check if root layout includes protection components
const rootLayoutPath = path.join(__dirname, 'src/app/layout.js');
const rootLayoutContent = fs.readFileSync(rootLayoutPath, 'utf8');

const protectionImports = [
    'dom-error-boundary',
    'browser-extension-detector',
    'dom-error-monitor'
];

let allProtectionImported = true;
for (const protection of protectionImports) {
    if (rootLayoutContent.includes(protection)) {
        console.log(`✅ Root layout includes: ${protection}`);
    } else {
        console.log(`❌ Root layout missing: ${protection}`);
        allProtectionImported = false;
    }
}

console.log('\n🎉 DOM Error Fix Verification Complete!');
console.log('\n📋 Summary:');
console.log(`   • Layout conflicts: ${layouts.length <= 1 ? '✅ Resolved' : '❌ Present'}`);
console.log(`   • Fragment issues: ${!hasFragmentIssues ? '✅ Resolved' : '❌ Present'}`);
console.log(`   • Protection components: ${protectionComponents.every(c => fs.existsSync(path.join(__dirname, c))) ? '✅ Installed' : '❌ Missing'}`);
console.log(`   • React canary: ${reactVersion?.includes('canary') ? '✅ Installed' : '⚠️  Recommended'}`);
console.log(`   • Root protection: ${allProtectionImported ? '✅ Active' : '❌ Incomplete'}`);

console.log('\n🔗 References:');
console.log('   • React Issue #11538: https://github.com/facebook/react/issues/11538');
console.log('   • Next.js Issue #58055: https://github.com/vercel/next.js/issues/58055');
console.log('   • Remix Issue #4822: https://github.com/remix-run/remix/issues/4822');

if (hasFragmentIssues || layouts.length > 1 || !allProtectionImported) {
    console.log('\n❌ Issues detected - please review and fix before testing');
    process.exit(1);
} else {
    console.log('\n✅ All checks passed - DOM error protection is active!');
    console.log('   Your application should now be protected against removeChild errors.');
} 