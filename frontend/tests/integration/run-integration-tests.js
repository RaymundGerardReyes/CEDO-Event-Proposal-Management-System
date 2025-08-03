#!/usr/bin/env node

/**
 * Integration Test Runner
 * Purpose: Execute comprehensive integration tests for the CEDO frontend application
 * Key approaches: Test orchestration, reporting, error handling, coverage analysis
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Test configuration
const TEST_CONFIG = {
    testFiles: [
        'tests/integration/auth-flow.integration.test.js',
        'tests/integration/dashboard-flow.integration.test.js',
        'tests/integration/event-submission.integration.test.js',
        'tests/integration/api-integration.integration.test.js'
    ],
    outputDir: 'test-results',
    coverageDir: 'coverage',
    timeout: 300000, // 5 minutes
    retries: 2
};

// ANSI color codes for console output
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Utility functions
const log = (message, color = 'reset') => {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
};

const logHeader = (message) => {
    log('\n' + '='.repeat(60), 'cyan');
    log(` ${message}`, 'bright');
    log('='.repeat(60), 'cyan');
};

const logSection = (message) => {
    log('\n' + '-'.repeat(40), 'blue');
    log(` ${message}`, 'bright');
    log('-'.repeat(40), 'blue');
};

const logSuccess = (message) => log(`✓ ${message}`, 'green');
const logError = (message) => log(`✗ ${message}`, 'red');
const logWarning = (message) => log(`⚠ ${message}`, 'yellow');
const logInfo = (message) => log(`ℹ ${message}`, 'blue');

// Test execution functions
const runSingleTest = (testFile, retryCount = 0) => {
    try {
        logInfo(`Running test: ${testFile}`);

        const command = `npx vitest run ${testFile} --reporter=verbose --timeout=${TEST_CONFIG.timeout}`;
        const result = execSync(command, {
            encoding: 'utf8',
            stdio: 'pipe',
            cwd: process.cwd()
        });

        logSuccess(`Test passed: ${testFile}`);
        return { success: true, output: result, file: testFile };
    } catch (error) {
        if (retryCount < TEST_CONFIG.retries) {
            logWarning(`Test failed, retrying (${retryCount + 1}/${TEST_CONFIG.retries}): ${testFile}`);
            return runSingleTest(testFile, retryCount + 1);
        } else {
            logError(`Test failed after ${TEST_CONFIG.retries} retries: ${testFile}`);
            return {
                success: false,
                error: error.message,
                output: error.stdout || error.stderr,
                file: testFile
            };
        }
    }
};

const runAllTests = async () => {
    const results = [];
    const startTime = Date.now();

    logHeader('CEDO Frontend Integration Test Suite');
    logInfo(`Starting integration tests at ${new Date().toISOString()}`);
    logInfo(`Test files: ${TEST_CONFIG.testFiles.length}`);
    logInfo(`Timeout: ${TEST_CONFIG.timeout / 1000}s per test`);
    logInfo(`Retries: ${TEST_CONFIG.retries} per test`);

    // Create output directory
    if (!existsSync(TEST_CONFIG.outputDir)) {
        mkdirSync(TEST_CONFIG.outputDir, { recursive: true });
    }

    // Run each test file
    for (const testFile of TEST_CONFIG.testFiles) {
        logSection(`Executing: ${testFile}`);

        const result = runSingleTest(testFile);
        results.push(result);

        // Save individual test result
        const resultFile = join(TEST_CONFIG.outputDir, `${testFile.replace(/[\/\.]/g, '_')}_result.json`);
        writeFileSync(resultFile, JSON.stringify(result, null, 2));

        if (result.success) {
            logSuccess(`Completed: ${testFile}`);
        } else {
            logError(`Failed: ${testFile}`);
        }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    return { results, duration };
};

const generateReport = (testResults) => {
    const { results, duration } = testResults;

    logHeader('Integration Test Report');

    // Summary statistics
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    logInfo(`Total Tests: ${totalTests}`);
    logInfo(`Passed: ${passedTests}`);
    logInfo(`Failed: ${failedTests}`);
    logInfo(`Success Rate: ${successRate}%`);
    logInfo(`Duration: ${duration.toFixed(2)}s`);

    // Detailed results
    logSection('Test Results');

    results.forEach((result, index) => {
        const status = result.success ? 'PASS' : 'FAIL';
        const color = result.success ? 'green' : 'red';
        const icon = result.success ? '✓' : '✗';

        log(`${icon} [${status}] ${result.file}`, color);

        if (!result.success && result.error) {
            log(`   Error: ${result.error}`, 'red');
        }
    });

    // Failed tests details
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
        logSection('Failed Tests Details');

        failedResults.forEach((result, index) => {
            log(`\n${index + 1}. ${result.file}`, 'red');
            if (result.error) {
                log(`   Error: ${result.error}`, 'red');
            }
            if (result.output) {
                log(`   Output: ${result.output.substring(0, 500)}...`, 'yellow');
            }
        });
    }

    // Generate JSON report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: parseFloat(successRate),
            duration: duration
        },
        results: results.map(r => ({
            file: r.file,
            success: r.success,
            error: r.error || null,
            output: r.output || null
        }))
    };

    const reportFile = join(TEST_CONFIG.outputDir, 'integration-test-report.json');
    writeFileSync(reportFile, JSON.stringify(report, null, 2));

    logInfo(`Detailed report saved to: ${reportFile}`);

    return report;
};

const runCoverageAnalysis = async () => {
    try {
        logSection('Running Coverage Analysis');

        const command = `npx vitest run --coverage --reporter=json`;
        const result = execSync(command, {
            encoding: 'utf8',
            stdio: 'pipe',
            cwd: process.cwd()
        });

        logSuccess('Coverage analysis completed');

        // Parse coverage results
        const coverageData = JSON.parse(result);
        const summary = coverageData.summary;

        logSection('Coverage Summary');
        logInfo(`Statements: ${summary.statements.pct}%`);
        logInfo(`Branches: ${summary.branches.pct}%`);
        logInfo(`Functions: ${summary.functions.pct}%`);
        logInfo(`Lines: ${summary.lines.pct}%`);

        return summary;
    } catch (error) {
        logError('Coverage analysis failed');
        logError(error.message);
        return null;
    }
};

const checkTestEnvironment = () => {
    logSection('Environment Check');

    // Check if we're in the frontend directory
    if (!existsSync('package.json')) {
        logError('package.json not found. Please run this script from the frontend directory.');
        process.exit(1);
    }

    // Check if vitest is available
    try {
        execSync('npx vitest --version', { stdio: 'pipe' });
        logSuccess('Vitest is available');
    } catch (error) {
        logError('Vitest is not available. Please install it first.');
        process.exit(1);
    }

    // Check if test files exist
    const missingFiles = TEST_CONFIG.testFiles.filter(file => !existsSync(file));
    if (missingFiles.length > 0) {
        logWarning('Some test files are missing:');
        missingFiles.forEach(file => logWarning(`  - ${file}`));
    } else {
        logSuccess('All test files found');
    }

    logSuccess('Environment check passed');
};

const main = async () => {
    try {
        // Check environment
        checkTestEnvironment();

        // Run tests
        const testResults = await runAllTests();

        // Generate report
        const report = generateReport(testResults);

        // Run coverage analysis
        const coverage = await runCoverageAnalysis();

        // Final summary
        logHeader('Final Summary');

        if (report.summary.failed === 0) {
            logSuccess('All integration tests passed! 🎉');
        } else {
            logError(`${report.summary.failed} test(s) failed`);
            process.exit(1);
        }

        if (coverage) {
            const avgCoverage = (
                coverage.statements.pct +
                coverage.branches.pct +
                coverage.functions.pct +
                coverage.lines.pct
            ) / 4;

            if (avgCoverage >= 80) {
                logSuccess(`Coverage is good: ${avgCoverage.toFixed(1)}%`);
            } else {
                logWarning(`Coverage could be improved: ${avgCoverage.toFixed(1)}%`);
            }
        }

        logInfo(`Test execution completed in ${report.summary.duration.toFixed(2)}s`);

    } catch (error) {
        logError('Test execution failed');
        logError(error.message);
        process.exit(1);
    }
};

// Run the main function
if (process.argv[1] === import.meta.url.replace('file://', '')) {
    main();
}

export { generateReport, main, runAllTests, runCoverageAnalysis };

