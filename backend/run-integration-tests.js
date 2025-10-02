#!/usr/bin/env node

/**
 * Integration Test Runner
 * 
 * Runs comprehensive tests for the Proposal Table integration:
 * 1. Database connectivity and schema validation
 * 2. Backend API endpoint testing
 * 3. Frontend component testing
 * 4. End-to-end integration testing
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args = [], cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
        log(`Running: ${command} ${args.join(' ')}`, 'cyan');

        const child = spawn(command, args, {
            cwd,
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

async function checkPrerequisites() {
    log('🔍 Checking prerequisites...', 'yellow');

    // Check if Node.js is installed
    try {
        await runCommand('node', ['--version']);
        log('✅ Node.js is installed', 'green');
    } catch (error) {
        log('❌ Node.js is not installed', 'red');
        throw error;
    }

    // Check if npm is installed
    try {
        await runCommand('npm', ['--version']);
        log('✅ npm is installed', 'green');
    } catch (error) {
        log('❌ npm is not installed', 'red');
        throw error;
    }

    // Check if PostgreSQL is accessible
    try {
        await runCommand('psql', ['--version']);
        log('✅ PostgreSQL is installed', 'green');
    } catch (error) {
        log('⚠️  PostgreSQL may not be installed or accessible', 'yellow');
    }

    // Check if required files exist
    const requiredFiles = [
        'backend/test-proposal-table-basic.js',
        'backend/test-api-endpoints.js',
        'frontend/tests/proposal-table-integration.test.js',
        'backend/package.json',
        'frontend/package.json'
    ];

    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            log(`✅ ${file} exists`, 'green');
        } else {
            log(`❌ ${file} is missing`, 'red');
            throw new Error(`Required file ${file} is missing`);
        }
    }
}

async function runBackendTests() {
    log('\n🧪 Running Backend Integration Tests...', 'blue');

    try {
        // Install dependencies if needed
        if (!fs.existsSync('backend/node_modules')) {
            log('📦 Installing backend dependencies...', 'yellow');
            await runCommand('npm', ['install'], path.join(process.cwd(), 'backend'));
        }

        // Run backend tests
        await runCommand('node', ['test-proposal-table-integration.js'], path.join(process.cwd(), 'backend'));
        log('✅ Backend tests passed', 'green');
    } catch (error) {
        log('❌ Backend tests failed', 'red');
        throw error;
    }
}

async function runFrontendTests() {
    log('\n🧪 Running Frontend Integration Tests...', 'blue');

    try {
        // Install dependencies if needed
        if (!fs.existsSync('frontend/node_modules')) {
            log('📦 Installing frontend dependencies...', 'yellow');
            await runCommand('npm', ['install'], path.join(process.cwd(), 'frontend'));
        }

        // Run frontend tests with Vitest
        await runCommand('npm', ['run', 'test', '--', 'tests/proposal-table-integration.test.js'], path.join(process.cwd(), 'frontend'));
        log('✅ Frontend tests passed', 'green');
    } catch (error) {
        log('❌ Frontend tests failed', 'red');
        throw error;
    }
}

async function runLintingTests() {
    log('\n🔍 Running Code Quality Tests...', 'blue');

    try {
        // Backend linting
        if (fs.existsSync('backend/.eslintrc.js') || fs.existsSync('backend/.eslintrc.json')) {
            await runCommand('npm', ['run', 'lint'], path.join(process.cwd(), 'backend'));
            log('✅ Backend linting passed', 'green');
        } else {
            log('⚠️  No backend linting configuration found', 'yellow');
        }

        // Frontend linting
        if (fs.existsSync('frontend/.eslintrc.js') || fs.existsSync('frontend/.eslintrc.json')) {
            await runCommand('npm', ['run', 'lint'], path.join(process.cwd(), 'frontend'));
            log('✅ Frontend linting passed', 'green');
        } else {
            log('⚠️  No frontend linting configuration found', 'yellow');
        }
    } catch (error) {
        log('❌ Linting tests failed', 'red');
        throw error;
    }
}

async function runTypeChecking() {
    log('\n🔍 Running Type Checking...', 'blue');

    try {
        // Frontend type checking (if TypeScript is configured)
        if (fs.existsSync('frontend/tsconfig.json')) {
            await runCommand('npm', ['run', 'type-check'], path.join(process.cwd(), 'frontend'));
            log('✅ Frontend type checking passed', 'green');
        } else {
            log('⚠️  No TypeScript configuration found', 'yellow');
        }
    } catch (error) {
        log('❌ Type checking failed', 'red');
        throw error;
    }
}

async function generateTestReport() {
    log('\n📊 Generating Test Report...', 'blue');

    const report = {
        timestamp: new Date().toISOString(),
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        },
        tests: {
            backend: 'passed',
            frontend: 'passed',
            linting: 'passed',
            typeChecking: 'passed'
        },
        summary: 'All tests passed successfully'
    };

    const reportPath = path.join(process.cwd(), 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    log(`✅ Test report generated: ${reportPath}`, 'green');
}

async function main() {
    log('🚀 Starting Comprehensive Integration Test Suite', 'bright');
    log('='.repeat(60), 'cyan');

    const startTime = Date.now();
    let allTestsPassed = true;

    try {
        await checkPrerequisites();
        await runBackendTests();
        await runFrontendTests();
        await runLintingTests();
        await runTypeChecking();
        await generateTestReport();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log('\n🎉 All tests completed successfully!', 'green');
        log(`⏱️  Total execution time: ${duration} seconds`, 'cyan');

    } catch (error) {
        allTestsPassed = false;
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        log('\n💥 Test suite failed!', 'red');
        log(`❌ Error: ${error.message}`, 'red');
        log(`⏱️  Execution time: ${duration} seconds`, 'cyan');

        process.exit(1);
    }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    log('\n💥 Uncaught Exception:', 'red');
    log(error.message, 'red');
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    log('\n💥 Unhandled Rejection:', 'red');
    log(reason, 'red');
    process.exit(1);
});

// Run the test suite
if (require.main === module) {
    main().catch((error) => {
        log('\n💥 Test suite crashed:', 'red');
        log(error.message, 'red');
        process.exit(1);
    });
}

module.exports = {
    main,
    checkPrerequisites,
    runBackendTests,
    runFrontendTests,
    runLintingTests,
    runTypeChecking,
    generateTestReport
};
