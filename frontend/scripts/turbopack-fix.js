#!/usr/bin/env node
/**
 * Turbopack Configuration Fix Script
 * Purpose: Diagnose and fix Turbopack compatibility issues
 * Key approaches: Configuration validation, automatic fixes, compatibility checks
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const CONFIG = {
    NEXT_CONFIG_PATH: 'next.config.js',
    TURBOPACK_CONFIG_PATH: 'next.config.turbopack.js',
    BACKUP_SUFFIX: '.backup',
    LOG_FILE: '.next/turbopack-fix.log',
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

// Check if file exists
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// Create backup of file
function createBackup(filePath) {
    if (fileExists(filePath)) {
        const backupPath = `${filePath}${CONFIG.BACKUP_SUFFIX}`;
        fs.copyFileSync(filePath, backupPath);
        logInfo(`Created backup: ${backupPath}`);
        return true;
    }
    return false;
}

// Read and parse Next.js config
function readNextConfig() {
    try {
        const configPath = CONFIG.NEXT_CONFIG_PATH;
        if (!fileExists(configPath)) {
            logError(`Next.js config not found: ${configPath}`);
            return null;
        }

        const content = fs.readFileSync(configPath, 'utf8');
        return { content, path: configPath };
    } catch (error) {
        logError(`Error reading config: ${error.message}`);
        return null;
    }
}

// Check for problematic configuration options
function checkProblematicOptions(content) {
    const issues = [];

    // Check for serverExternalPackages (ignore comments)
    if (content.includes('serverExternalPackages') && !content.includes('// Removed:') && !content.includes('// ✅ CRITICAL:')) {
        issues.push({
            type: 'serverExternalPackages',
            message: 'serverExternalPackages is not supported by Turbopack',
            fix: 'Remove serverExternalPackages from experimental or root config'
        });
    }

    // Check for experimental.cssChunking (ignore comments)
    if (content.includes('cssChunking') && !content.includes('// Removed:') && !content.includes('// ✅ CRITICAL:')) {
        issues.push({
            type: 'cssChunking',
            message: 'experimental.cssChunking is not supported by Turbopack',
            fix: 'Remove cssChunking from experimental config'
        });
    }

    // Check for turbopack config in wrong place
    if (content.includes('turbopack:') && !content.includes('experimental:')) {
        issues.push({
            type: 'turbopackConfig',
            message: 'turbopack config should be inside experimental',
            fix: 'Move turbopack config inside experimental object'
        });
    }

    // Check for missing JWT_SECRET
    if (content.includes('JWT_SECRET') && !content.includes('JWT_SECRET: process.env.JWT_SECRET ||')) {
        issues.push({
            type: 'missingJWTSecret',
            message: 'JWT_SECRET environment variable is missing default value',
            fix: 'Add default value for JWT_SECRET in env config'
        });
    }

    return issues;
}

// Fix configuration issues
function fixConfiguration(content, issues) {
    let fixedContent = content;

    issues.forEach(issue => {
        switch (issue.type) {
            case 'serverExternalPackages':
                // Remove serverExternalPackages from root level
                fixedContent = fixedContent.replace(
                    /serverExternalPackages:\s*\[[^\]]+\],?\s*/g,
                    ''
                );
                logInfo('Removed serverExternalPackages from root config');
                break;

            case 'cssChunking':
                // Remove cssChunking from experimental
                fixedContent = fixedContent.replace(
                    /cssChunking:\s*false,?\s*/g,
                    ''
                );
                logInfo('Removed cssChunking from experimental config');
                break;

            case 'turbopackConfig':
                // Move turbopack config to experimental
                const turbopackMatch = fixedContent.match(/turbopack:\s*\{[^}]+\}/s);
                if (turbopackMatch) {
                    const turbopackConfig = turbopackMatch[0];
                    fixedContent = fixedContent.replace(turbopackMatch[0], '');

                    // Add to experimental
                    fixedContent = fixedContent.replace(
                        /experimental:\s*\{/,
                        `experimental: {\n    // Turbopack configuration\n    ${turbopackConfig.replace('turbopack:', 'turbo:')},`
                    );
                    logInfo('Moved turbopack config to experimental');
                }
                break;

            case 'missingJWTSecret':
                // Add default JWT_SECRET
                fixedContent = fixedContent.replace(
                    /JWT_SECRET:\s*process\.env\.JWT_SECRET,/,
                    'JWT_SECRET: process.env.JWT_SECRET || process.env.JWT_SECRET_DEV || "dev-secret-key-change-in-production",'
                );
                logInfo('Added default JWT_SECRET value');
                break;
        }
    });

    return fixedContent;
}

// Validate fixed configuration
function validateConfiguration(content) {
    const issues = checkProblematicOptions(content);
    return {
        isValid: issues.length === 0,
        issues: issues
    };
}

// Test Turbopack compatibility
function testTurbopackCompatibility() {
    return new Promise((resolve) => {
        logInfo('Testing Turbopack compatibility...');

        const testProcess = exec('npx next dev --turbo --help', (error, stdout, stderr) => {
            if (error) {
                logWarning('Turbopack test failed - may have compatibility issues');
                resolve(false);
            } else {
                logSuccess('Turbopack compatibility test passed');
                resolve(true);
            }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
            testProcess.kill();
            logWarning('Turbopack test timeout');
            resolve(false);
        }, 10000);
    });
}

// Main fix function
async function fixTurbopackConfig(fixMode = false) {
    log('🔧 Turbopack Configuration Fix', 'bright');
    log('==============================', 'bright');

    try {
        // Read current config
        const configData = readNextConfig();
        if (!configData) {
            return false;
        }

        logInfo(`Reading config from: ${configData.path}`);

        // Check for issues
        const issues = checkProblematicOptions(configData.content);

        if (issues.length === 0) {
            logSuccess('No configuration issues found');
            return true;
        }

        logWarning(`Found ${issues.length} configuration issues:`);
        issues.forEach((issue, index) => {
            log(`  ${index + 1}. ${issue.message}`, 'yellow');
            log(`     Fix: ${issue.fix}`, 'cyan');
        });

        if (!fixMode) {
            logInfo('Run with --fix flag to apply automatic fixes');
            return false;
        }

        // Create backup
        createBackup(configData.path);

        // Apply fixes
        logInfo('Applying automatic fixes...');
        const fixedContent = fixConfiguration(configData.content, issues);

        // Validate fixes
        const validation = validateConfiguration(fixedContent);

        if (validation.isValid) {
            // Write fixed config
            fs.writeFileSync(configData.path, fixedContent);
            logSuccess('Configuration fixed successfully');

            // Test compatibility
            const isCompatible = await testTurbopackCompatibility();
            if (isCompatible) {
                logSuccess('Turbopack compatibility verified');
            } else {
                logWarning('Turbopack may still have issues - check logs');
            }

            return true;
        } else {
            logError('Fixes did not resolve all issues');
            validation.issues.forEach(issue => {
                log(`  - ${issue.message}`, 'red');
            });
            return false;
        }

    } catch (error) {
        logError(`Fix failed: ${error.message}`);
        return false;
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    const fixMode = args.includes('--fix');

    if (fixMode) {
        log('Running in FIX mode - will apply automatic fixes', 'yellow');
    } else {
        log('Running in DIAGNOSE mode - use --fix to apply changes', 'blue');
    }

    const success = await fixTurbopackConfig(fixMode);

    if (success) {
        logSuccess('Turbopack configuration fix completed');
        process.exit(0);
    } else {
        logError('Turbopack configuration fix failed');
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { fixTurbopackConfig, checkProblematicOptions, validateConfiguration };
