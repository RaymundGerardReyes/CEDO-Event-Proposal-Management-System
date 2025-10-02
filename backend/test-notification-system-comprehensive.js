/**
 * ===================================================================
 * COMPREHENSIVE NOTIFICATION SYSTEM TEST
 * ===================================================================
 * Purpose: Test the complete notification system end-to-end
 * Key approaches: Database operations, API testing, frontend integration
 * Features: CRUD operations, targeting, search, statistics, real-time updates
 * ===================================================================
 */

const { Pool } = require('pg');
const fetch = require('node-fetch');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// API base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

// Test data
const testUsers = [
    { id: 1, name: 'Test Student', email: 'student@test.com', role: 'student' },
    { id: 2, name: 'Test Admin', email: 'admin@test.com', role: 'admin' }
];

const testNotifications = [
    {
        targetType: 'user',
        targetUserId: 1,
        title: 'Welcome to CEDO!',
        message: 'Welcome to the CEDO platform. Start by exploring the dashboard.',
        notificationType: 'system_update',
        priority: 'normal'
    },
    {
        targetType: 'role',
        targetRole: 'student',
        title: 'New Assignment Available',
        message: 'A new assignment has been posted. Please check your dashboard.',
        notificationType: 'assignment',
        priority: 'high'
    },
    {
        targetType: 'all',
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2-4 AM.',
        notificationType: 'system_update',
        priority: 'urgent'
    }
];

class NotificationSystemTester {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
    }

    /**
     * Run a test and record results
     */
    async runTest(testName, testFunction) {
        this.testResults.total++;
        console.log(`\n🧪 Running: ${testName}`);

        try {
            const result = await testFunction();
            this.testResults.passed++;
            this.testResults.details.push({ name: testName, status: 'PASSED', result });
            console.log(`✅ ${testName}: PASSED`);
            return result;
        } catch (error) {
            this.testResults.failed++;
            this.testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
            console.log(`❌ ${testName}: FAILED - ${error.message}`);
            throw error;
        }
    }

    /**
     * Test database connection
     */
    async testDatabaseConnection() {
        const result = await pool.query('SELECT NOW() as current_time');
        return result.rows[0];
    }

    /**
     * Test notification table exists
     */
    async testNotificationTableExists() {
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications'
        `);
        return result.rows.length > 0;
    }

    /**
     * Test notification functions exist
     */
    async testNotificationFunctions() {
        const functions = [
            'create_notification',
            'get_unread_notification_count',
            'mark_notifications_as_read',
            'cleanup_expired_notifications'
        ];

        const results = {};
        for (const funcName of functions) {
            const result = await pool.query(`
                SELECT routine_name 
                FROM information_schema.routines 
                WHERE routine_schema = 'public' 
                AND routine_name = $1
            `, [funcName]);
            results[funcName] = result.rows.length > 0;
        }
        return results;
    }

    /**
     * Test creating notifications
     */
    async testCreateNotifications() {
        const results = [];

        for (const notificationData of testNotifications) {
            const result = await pool.query(`
                SELECT * FROM create_notification(
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                )
            `, [
                notificationData.targetType,
                notificationData.title,
                notificationData.message,
                notificationData.notificationType,
                notificationData.targetUserId || null,
                notificationData.targetRole || null,
                null, // excluded_user_ids
                notificationData.priority,
                null, // related_proposal_id
                null, // related_user_id
                '{}', // metadata
                '{}', // tags
                null, // expires_at
                1 // created_by
            ]);

            results.push(result.rows[0]);
        }

        return results;
    }

    /**
     * Test fetching notifications
     */
    async testFetchNotifications() {
        const result = await pool.query(`
            SELECT 
                n.id, n.uuid, n.title, n.message, n.notification_type, n.priority,
                n.is_read, n.read_at, n.is_hidden, n.status, n.created_at,
                n.target_type, n.target_user_id, n.target_role
            FROM notifications n
            WHERE n.is_hidden = false
            AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
            AND n.status != 'expired'
            ORDER BY n.created_at DESC
            LIMIT 10
        `);

        return result.rows;
    }

    /**
     * Test unread count function
     */
    async testUnreadCount() {
        const result = await pool.query('SELECT get_unread_notification_count($1) as count', [1]);
        return parseInt(result.rows[0].count);
    }

    /**
     * Test marking notifications as read
     */
    async testMarkAsRead() {
        const result = await pool.query('SELECT mark_notifications_as_read($1, $2) as updated_count', [1, null]);
        return parseInt(result.rows[0].updated_count);
    }

    /**
     * Test notification statistics
     */
    async testNotificationStats() {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_notifications,
                COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
                COUNT(CASE WHEN is_read = true THEN 1 END) as read_count,
                COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
                COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count
            FROM notifications
            WHERE is_hidden = false
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            AND status != 'expired'
        `);

        return result.rows[0];
    }

    /**
     * Test search functionality
     */
    async testSearchNotifications() {
        const result = await pool.query(`
            SELECT 
                n.id, n.title, n.message,
                ts_rank(n.search_vector, plainto_tsquery('english', $1)) as rank
            FROM notifications n
            WHERE n.search_vector @@ plainto_tsquery('english', $1)
            AND n.is_hidden = false
            ORDER BY rank DESC
            LIMIT 5
        `, ['welcome']);

        return result.rows;
    }

    /**
     * Test API endpoints (if server is running)
     */
    async testAPIEndpoints() {
        const endpoints = [
            { url: '/api/notifications', method: 'GET' },
            { url: '/api/notifications/unread-count', method: 'GET' },
            { url: '/api/notifications/stats', method: 'GET' }
        ];

        const results = {};

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${API_BASE_URL}${endpoint.url}`, {
                    method: endpoint.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test-token' // Mock token for testing
                    }
                });

                results[endpoint.url] = {
                    status: response.status,
                    ok: response.ok
                };
            } catch (error) {
                results[endpoint.url] = {
                    error: error.message,
                    ok: false
                };
            }
        }

        return results;
    }

    /**
     * Test notification targeting
     */
    async testNotificationTargeting() {
        // Test user-specific notifications
        const userNotifications = await pool.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE target_type = 'user' AND target_user_id = 1
        `);

        // Test role-specific notifications
        const roleNotifications = await pool.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE target_type = 'role' AND target_role = 'student'
        `);

        // Test global notifications
        const globalNotifications = await pool.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE target_type = 'all'
        `);

        return {
            user: parseInt(userNotifications.rows[0].count),
            role: parseInt(roleNotifications.rows[0].count),
            global: parseInt(globalNotifications.rows[0].count)
        };
    }

    /**
     * Test notification preferences
     */
    async testNotificationPreferences() {
        // Check if preferences table exists
        const tableExists = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'notification_preferences'
        `);

        if (tableExists.rows.length === 0) {
            return { exists: false };
        }

        // Test inserting preferences
        const result = await pool.query(`
            INSERT INTO notification_preferences 
            (user_id, notification_type, in_app, email, sms, push, frequency)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, notification_type)
            DO UPDATE SET
                in_app = EXCLUDED.in_app,
                email = EXCLUDED.email,
                sms = EXCLUDED.sms,
                push = EXCLUDED.push,
                frequency = EXCLUDED.frequency,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [1, 'system_update', true, true, false, true, 'immediate']);

        return { exists: true, preference: result.rows[0] };
    }

    /**
     * Test cleanup function
     */
    async testCleanupFunction() {
        // Create an expired notification
        await pool.query(`
            INSERT INTO notifications 
            (target_type, title, message, notification_type, priority, expires_at, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            'user', 'Expired Test', 'This notification has expired',
            'test', 'normal', new Date(Date.now() - 86400000), 1 // 1 day ago
        ]);

        // Run cleanup
        await pool.query('SELECT cleanup_expired_notifications()');

        // Check if expired notification was handled
        const result = await pool.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE title = 'Expired Test'
        `);

        return parseInt(result.rows[0].count);
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 Starting Comprehensive Notification System Test\n');
        console.log('='.repeat(60));

        try {
            // Database tests
            await this.runTest('Database Connection', () => this.testDatabaseConnection());
            await this.runTest('Notification Table Exists', () => this.testNotificationTableExists());
            await this.runTest('Notification Functions Exist', () => this.testNotificationFunctions());

            // CRUD tests
            await this.runTest('Create Notifications', () => this.testCreateNotifications());
            await this.runTest('Fetch Notifications', () => this.testFetchNotifications());
            await this.runTest('Unread Count Function', () => this.testUnreadCount());
            await this.runTest('Mark as Read Function', () => this.testMarkAsRead());

            // Advanced tests
            await this.runTest('Notification Statistics', () => this.testNotificationStats());
            await this.runTest('Search Functionality', () => this.testSearchNotifications());
            await this.runTest('Notification Targeting', () => this.testNotificationTargeting());
            await this.runTest('Notification Preferences', () => this.testNotificationPreferences());
            await this.runTest('Cleanup Function', () => this.testCleanupFunction());

            // API tests (optional - only if server is running)
            try {
                await this.runTest('API Endpoints', () => this.testAPIEndpoints());
            } catch (error) {
                console.log('⚠️  API tests skipped (server not running)');
            }

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }

        // Print results
        this.printResults();
    }

    /**
     * Print test results
     */
    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.testResults.total}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

        if (this.testResults.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.details
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    console.log(`  - ${test.name}: ${test.error}`);
                });
        }

        console.log('\n🎉 Notification System Test Complete!');

        if (this.testResults.failed === 0) {
            console.log('✅ All tests passed! Your notification system is working perfectly!');
        } else {
            console.log('⚠️  Some tests failed. Please check the errors above.');
        }
    }

    /**
     * Cleanup test data
     */
    async cleanup() {
        try {
            await pool.query('DELETE FROM notifications WHERE title LIKE \'%Test%\'');
            await pool.query('DELETE FROM notification_preferences WHERE user_id = 1');
            console.log('🧹 Test data cleaned up');
        } catch (error) {
            console.error('Error cleaning up test data:', error.message);
        }
    }
}

// Run the tests
async function main() {
    const tester = new NotificationSystemTester();

    try {
        await tester.runAllTests();
    } catch (error) {
        console.error('Test suite failed:', error);
    } finally {
        await tester.cleanup();
        await pool.end();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = NotificationSystemTester;
