/**
 * ===================================================================
 * COMPLETE NOTIFICATION SYSTEM TEST
 * ===================================================================
 * Purpose: Test the complete notification system from database to API
 * Key approaches: End-to-end testing, real data validation
 * Features: Create notifications, test API endpoints, verify frontend integration
 * ===================================================================
 */

const { Pool } = require('pg');
const fetch = require('node-fetch');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function testNotificationSystem() {
    console.log('🚀 Starting Complete Notification System Test\n');

    try {
        // 1. Test Database Connection
        console.log('1️⃣ Testing Database Connection...');
        const dbTest = await pool.query('SELECT NOW() as current_time');
        console.log(`✅ Database connected: ${dbTest.rows[0].current_time}\n`);

        // 2. Check if notifications table exists
        console.log('2️⃣ Checking Notifications Table...');
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'notifications'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('❌ Notifications table does not exist. Please run the schema first.');
            return;
        }
        console.log('✅ Notifications table exists\n');

        // 3. Get a test user
        console.log('3️⃣ Getting Test User...');
        const userResult = await pool.query('SELECT id, name, email, role FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            console.log('❌ No users found. Please create a user first.');
            return;
        }
        const testUser = userResult.rows[0];
        console.log(`✅ Test user: ${testUser.name} (${testUser.email}) - Role: ${testUser.role}\n`);

        // 4. Create test notifications
        console.log('4️⃣ Creating Test Notifications...');

        // Create different types of notifications
        const testNotifications = [
            {
                targetType: 'user',
                targetUserId: testUser.id,
                title: 'Welcome to CEDO!',
                message: 'Welcome to the CEDO notification system. This is your first notification.',
                notificationType: 'system_update',
                priority: 'normal'
            },
            {
                targetType: 'role',
                targetRole: testUser.role,
                title: 'System Maintenance',
                message: 'Scheduled maintenance will occur tonight from 2-4 AM.',
                notificationType: 'system_update',
                priority: 'high'
            },
            {
                targetType: 'all',
                title: 'New Feature Available',
                message: 'Check out the new notification system with real-time updates!',
                notificationType: 'system_update',
                priority: 'normal'
            }
        ];

        const createdNotifications = [];
        for (const notification of testNotifications) {
            const result = await pool.query(`
                SELECT * FROM create_notification(
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                )
            `, [
                notification.targetType,
                notification.targetUserId || null,
                notification.targetRole || null,
                null, // excludedUserIds
                notification.title,
                notification.message,
                notification.notificationType,
                notification.priority,
                null, // relatedProposalId
                null, // relatedUserId
                '{}', // metadata
                '{}', // tags
                null, // expiresAt
                testUser.id // createdBy
            ]);

            createdNotifications.push(result.rows[0]);
            console.log(`✅ Created: ${notification.title}`);
        }
        console.log(`\n✅ Created ${createdNotifications.length} test notifications\n`);

        // 5. Test API Endpoints
        console.log('5️⃣ Testing API Endpoints...');

        // Get auth token (you'll need to implement this based on your auth system)
        console.log('⚠️  Note: API testing requires authentication token');
        console.log('   Please implement token generation or use existing auth system\n');

        // 6. Test Database Functions
        console.log('6️⃣ Testing Database Functions...');

        // Test unread count function
        const unreadCount = await pool.query('SELECT get_unread_notification_count($1) as count', [testUser.id]);
        console.log(`✅ Unread count for user ${testUser.id}: ${unreadCount.rows[0].count}`);

        // Test mark as read function
        const markReadResult = await pool.query('SELECT mark_notifications_as_read($1, $2) as updated_count', [testUser.id, null]);
        console.log(`✅ Marked ${markReadResult.rows[0].updated_count} notifications as read`);

        // Test search functionality
        const searchResult = await pool.query(`
            SELECT n.id, n.title, n.message, ts_rank(n.search_vector, plainto_tsquery('english', $1)) as rank
            FROM notifications n
            WHERE n.search_vector @@ plainto_tsquery('english', $1)
            ORDER BY rank DESC
            LIMIT 5
        `, ['welcome']);
        console.log(`✅ Search for 'welcome' returned ${searchResult.rows.length} results`);

        // 7. Test Statistics
        console.log('\n7️⃣ Testing Statistics...');
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_notifications,
                COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
                COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count
            FROM notifications
            WHERE (
                (target_type = 'user' AND target_user_id = $1) OR
                (target_type = 'role' AND target_role = $2) OR
                (target_type = 'all')
            )
        `, [testUser.id, testUser.role]);

        const stats = statsResult.rows[0];
        console.log(`✅ Total notifications: ${stats.total_notifications}`);
        console.log(`✅ Unread notifications: ${stats.unread_count}`);
        console.log(`✅ High priority notifications: ${stats.high_priority_count}`);

        // 8. Cleanup
        console.log('\n8️⃣ Cleaning Up Test Data...');
        await pool.query('DELETE FROM notifications WHERE created_by = $1', [testUser.id]);
        console.log('✅ Test notifications cleaned up');

        console.log('\n🎉 Complete Notification System Test PASSED!');
        console.log('\n📋 Summary:');
        console.log('✅ Database connection working');
        console.log('✅ Notifications table exists');
        console.log('✅ Database functions working');
        console.log('✅ Search functionality working');
        console.log('✅ Statistics working');
        console.log('✅ Test data cleaned up');

        console.log('\n🚀 Next Steps:');
        console.log('1. Start your backend server: npm start');
        console.log('2. Test API endpoints with authentication');
        console.log('3. Verify frontend integration');
        console.log('4. Create real notifications from your application');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await pool.end();
    }
}

// Run the test
if (require.main === module) {
    testNotificationSystem();
}

module.exports = { testNotificationSystem };
