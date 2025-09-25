#!/usr/bin/env node

/**
 * Test Runner Script for Backend Tests
 * 
 * This script runs the proposal service tests with proper setup.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Proposal Service Tests...\n');

try {
    // Set environment variables for testing
    process.env.NODE_ENV = 'test';

    // Run the tests
    const testCommand = `npx vitest run tests/services/proposal.service.test.js --reporter=verbose`;

    console.log(`Running: ${testCommand}\n`);

    execSync(testCommand, {
        stdio: 'inherit',
        cwd: __dirname,
        env: {
            ...process.env,
            NODE_ENV: 'test'
        }
    });

    console.log('\n✅ All tests completed successfully!');

} catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    process.exit(1);
}


