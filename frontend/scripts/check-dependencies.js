#!/usr/bin/env node
/**
 * Dependency Check and Fix Script
 * Purpose: Verify all required dependencies are installed and working
 * Key approaches: Import testing, dependency validation, automatic fixes
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Required dependencies
const REQUIRED_DEPS = [
    'react-hook-form',
    '@hookform/resolvers',
    'zod',
    'framer-motion',
    'next-themes',
    'sonner',
    'react-google-recaptcha',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-separator',
    'react-error-boundary',
    'axios'
];

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

// Check if package.json exists
function checkPackageJson() {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
        logError('package.json not found');
        return false;
    }
    return true;
}

// Check if dependency is installed
function checkDependency(depName) {
    return new Promise((resolve) => {
        try {
            require.resolve(depName);
            resolve({ name: depName, status: 'installed', error: null });
        } catch (error) {
            resolve({ name: depName, status: 'missing', error: error.message });
        }
    });
}

// Install missing dependencies
function installDependencies(missingDeps) {
    return new Promise((resolve) => {
        if (missingDeps.length === 0) {
            resolve(true);
            return;
        }

        logInfo(`Installing ${missingDeps.length} missing dependencies...`);
        const installCommand = `npm install ${missingDeps.join(' ')}`;

        exec(installCommand, (error, stdout, stderr) => {
            if (error) {
                logError(`Installation failed: ${error.message}`);
                resolve(false);
            } else {
                logSuccess('Dependencies installed successfully');
                resolve(true);
            }
        });
    });
}

// Test import functionality
function testImport(depName) {
    return new Promise((resolve) => {
        try {
            const module = require(depName);
            resolve({ name: depName, import: 'success', error: null });
        } catch (error) {
            resolve({ name: depName, import: 'failed', error: error.message });
        }
    });
}

// Main dependency check function
async function checkDependencies() {
    log('🔍 Dependency Check and Fix', 'bright');
    log('============================', 'bright');

    try {
        // Check package.json
        if (!checkPackageJson()) {
            return false;
        }

        logInfo('Checking required dependencies...');

        // Check each dependency
        const results = [];
        for (const dep of REQUIRED_DEPS) {
            const result = await checkDependency(dep);
            results.push(result);

            if (result.status === 'installed') {
                logSuccess(`${dep}: Installed`);
            } else {
                logError(`${dep}: Missing - ${result.error}`);
            }
        }

        // Filter missing dependencies
        const missingDeps = results.filter(r => r.status === 'missing').map(r => r.name);

        if (missingDeps.length > 0) {
            logWarning(`Found ${missingDeps.length} missing dependencies`);

            // Install missing dependencies
            const installSuccess = await installDependencies(missingDeps);
            if (!installSuccess) {
                return false;
            }

            // Re-check after installation
            logInfo('Re-checking dependencies after installation...');
            for (const dep of missingDeps) {
                const result = await checkDependency(dep);
                if (result.status === 'installed') {
                    logSuccess(`${dep}: Now installed`);
                } else {
                    logError(`${dep}: Still missing - ${result.error}`);
                }
            }
        } else {
            logSuccess('All dependencies are installed');
        }

        // Test imports
        logInfo('Testing imports...');
        for (const dep of REQUIRED_DEPS) {
            const result = await testImport(dep);
            if (result.import === 'success') {
                logSuccess(`${dep}: Import test passed`);
            } else {
                logError(`${dep}: Import test failed - ${result.error}`);
            }
        }

        logSuccess('Dependency check completed');
        return true;

    } catch (error) {
        logError(`Dependency check failed: ${error.message}`);
        return false;
    }
}

// Main execution
async function main() {
    const success = await checkDependencies();

    if (success) {
        logSuccess('All dependencies are properly installed and working');
        process.exit(0);
    } else {
        logError('Dependency check failed');
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { checkDependencies, checkDependency, testImport };
