#!/usr/bin/env node
/**
 * Development Fallback Script for CEDO Frontend
 * Purpose: Smart development server with Turbopack fallback
 * Key approaches: Error detection, automatic fallback, performance monitoring
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    TURBOPACK_TIMEOUT: 10000, // 10 seconds
    MAX_RETRIES: 3,
    FALLBACK_COMMAND: 'next dev',
    TURBO_COMMAND: 'next dev --turbo',
    LOG_FILE: '.next/dev-fallback.log',
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Check if Turbopack is supported
function checkTurbopackSupport() {
    return new Promise((resolve) => {
        logInfo('Checking Turbopack support...');

        const checkProcess = spawn('npx', ['next', '--help'], {
            stdio: 'pipe',
            shell: true
        });

        let output = '';
        checkProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        checkProcess.on('close', (code) => {
            const hasTurboFlag = output.includes('--turbo') || output.includes('turbo');
            resolve(hasTurboFlag && code === 0);
        });

        checkProcess.on('error', () => {
            resolve(false);
        });
    });
}

// Test Turbopack with timeout
function testTurbopack() {
    return new Promise((resolve) => {
        logInfo('Testing Turbopack startup...');

        const testProcess = spawn('npx', ['next', 'dev', '--turbo'], {
            stdio: 'pipe',
            shell: true,
            env: { ...process.env, NEXT_TURBOPACK_TRACING: '0' }
        });

        let hasStarted = false;
        let hasError = false;

        const timeout = setTimeout(() => {
            if (!hasStarted) {
                logWarning('Turbopack startup timeout - will use fallback');
                testProcess.kill();
                resolve(false);
            }
        }, CONFIG.TURBOPACK_TIMEOUT);

        testProcess.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Ready in') || output.includes('Local:')) {
                hasStarted = true;
                clearTimeout(timeout);
                testProcess.kill();
                resolve(true);
            }
        });

        testProcess.stderr.on('data', (data) => {
            const error = data.toString();
            if (error.includes('not yet supported') ||
                error.includes('Unsupported') ||
                error.includes('Invalid next.config.js')) {
                hasError = true;
                clearTimeout(timeout);
                testProcess.kill();
                resolve(false);
            }
        });

        testProcess.on('error', () => {
            clearTimeout(timeout);
            resolve(false);
        });
    });
}

// Start development server
function startDevServer(useTurbo = false) {
    const command = useTurbo ? CONFIG.TURBO_COMMAND : CONFIG.FALLBACK_COMMAND;
    const mode = useTurbo ? 'Turbopack' : 'Stable';

    logInfo(`Starting development server with ${mode} mode...`);
    log(`Command: ${command}`, 'cyan');

    const devProcess = spawn('npx', command.split(' '), {
        stdio: 'inherit',
        shell: true,
        env: {
            ...process.env,
            NEXT_TURBOPACK_TRACING: useTurbo ? '0' : undefined
        }
    });

    devProcess.on('error', (error) => {
        logError(`Development server error: ${error.message}`);
        process.exit(1);
    });

    devProcess.on('close', (code) => {
        if (code !== 0) {
            logError(`Development server exited with code ${code}`);
            if (useTurbo) {
                logInfo('Turbopack failed, trying stable mode...');
                startDevServer(false);
            } else {
                process.exit(code);
            }
        }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        logInfo('Shutting down development server...');
        devProcess.kill('SIGINT');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        devProcess.kill('SIGTERM');
        process.exit(0);
    });
}

// Main execution
async function main() {
    log('🚀 CEDO Development Server - Smart Fallback', 'bright');
    log('==========================================', 'bright');

    try {
        // Check if we should use Turbopack
        const hasTurbopackSupport = await checkTurbopackSupport();

        if (!hasTurbopackSupport) {
            logWarning('Turbopack not supported - using stable mode');
            startDevServer(false);
            return;
        }

        // Test Turbopack
        const turbopackWorks = await testTurbopack();

        if (turbopackWorks) {
            logSuccess('Turbopack is working - starting with Turbopack mode');
            startDevServer(true);
        } else {
            logWarning('Turbopack has issues - falling back to stable mode');
            startDevServer(false);
        }

    } catch (error) {
        logError(`Unexpected error: ${error.message}`);
        logInfo('Falling back to stable mode...');
        startDevServer(false);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main, checkTurbopackSupport, testTurbopack, startDevServer };
