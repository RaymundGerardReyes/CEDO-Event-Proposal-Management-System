#!/usr/bin/env node

/**
 * ===================================================================
 * NOTIFICATION SYSTEM TEST RUNNER
 * ===================================================================
 * Purpose: Run comprehensive tests for the notification system
 * Key approaches: Database tests, API tests, integration tests
 * Features: Automated testing, detailed reporting, error handling
 * ===================================================================
 */

const NotificationSystemTester = require('./test-notification-system-comprehensive');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function main() {
    console.log('🚀 Starting Notification System Test Suite');
    console.log('='.repeat(60));

    // Check environment variables
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is required');
        process.exit(1);
    }

    // Test database connection first
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }

    // Run the comprehensive test suite
    const tester = new NotificationSystemTester();

    try {
        await tester.runAllTests();

        // Print final status
        const { passed, failed, total } = tester.testResults;
        if (failed === 0) {
            console.log('\n🎉 All tests passed! Your notification system is working perfectly!');
            process.exit(0);
        } else {
            console.log(`\n⚠️  ${failed} out of ${total} tests failed. Please check the errors above.`);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    } finally {
        await tester.cleanup();
        await pool.end();
    }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the tests
if (require.main === module) {
    main().catch(console.error);
}

module.exports = main;
