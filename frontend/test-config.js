#!/usr/bin/env node

/**
 * Configuration Test Script for Next.js 15.3.2
 * Tests both Turbopack and Webpack configurations
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Next.js Configuration...\n');

// Check if running from frontend directory
const currentDir = process.cwd();
const isInFrontend = fs.existsSync(path.join(currentDir, 'next.config.js'));

if (!isInFrontend) {
    console.error('❌ Please run this script from the frontend directory');
    process.exit(1);
}

console.log('✅ Running from frontend directory');
console.log('📍 Current directory:', currentDir);

// Test configurations
const tests = [
    {
        name: 'Turbopack Mode (Default)',
        command: 'npm',
        args: ['run', 'dev'],
        timeout: 10000
    },
    {
        name: 'Webpack Mode',
        command: 'npm',
        args: ['run', 'dev:normal'],
        timeout: 10000
    }
];

async function runTest(test) {
    console.log(`\n🧪 Testing ${test.name}...`);

    return new Promise((resolve) => {
        const child = spawn(test.command, test.args, {
            stdio: 'pipe',
            shell: true
        });

        let output = '';
        let hasWarning = false;
        let isReady = false;

        child.stdout.on('data', (data) => {
            output += data.toString();
            const text = data.toString();

            if (text.includes('Webpack is configured while Turbopack is not')) {
                hasWarning = true;
            }

            if (text.includes('Ready in')) {
                isReady = true;
            }
        });

        child.stderr.on('data', (data) => {
            output += data.toString();
        });

        // Kill process after timeout
        setTimeout(() => {
            child.kill('SIGTERM');

            console.log(`📊 Results for ${test.name}:`);
            console.log(`   ${isReady ? '✅' : '❌'} Server started successfully`);
            console.log(`   ${!hasWarning ? '✅' : '❌'} No Webpack/Turbopack warnings`);

            if (hasWarning) {
                console.log('   ⚠️  Found configuration warning');
            }

            resolve({
                name: test.name,
                success: isReady && !hasWarning,
                ready: isReady,
                warning: hasWarning
            });
        }, test.timeout);
    });
}

async function main() {
    const results = [];

    for (const test of tests) {
        const result = await runTest(test);
        results.push(result);

        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n📋 Test Summary:');
    console.log('================');

    results.forEach(result => {
        console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
    });

    const allPassed = results.every(r => r.success);
    console.log(`\n🎯 Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

    if (allPassed) {
        console.log('🚀 Your Next.js configuration is properly set up!');
    } else {
        console.log('🔧 Some configuration issues need to be addressed.');
    }
}

if (require.main === module) {
    main().catch(console.error);
} 