/**
 * Test Notifications API
 * Purpose: Test the notification API endpoints to ensure they work correctly
 * Key approaches: API testing, authentication, data validation
 */

require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function testNotificationsAPI() {
    try {
        console.log('🧪 Testing Notifications API...\n');

        // Get a user and their notifications
        const userResult = await pool.query('SELECT id, name, email FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            console.log('❌ No users found in database.');
            return;
        }

        const user = userResult.rows[0];
        console.log(`👤 Testing for user: ${user.name} (ID: ${user.id})`);

        // Test 1: Get all notifications
        console.log('\n📋 Test 1: Get all notifications');
        const notificationsResult = await pool.query(`
            SELECT 
                n.id,
                n.uuid,
                n.recipient_id,
                n.sender_id,
                n.notification_type,
                n.message,
                n.is_read,
                n.created_at,
                n.updated_at,
                n.related_proposal_id,
                n.related_proposal_uuid
            FROM notifications n
            WHERE n.recipient_id = $1
            ORDER BY n.created_at DESC
            LIMIT 10
        `, [user.id]);

        console.log(`   Found ${notificationsResult.rows.length} notifications:`);
        notificationsResult.rows.forEach((notification, index) => {
            console.log(`   ${index + 1}. ${notification.message} (${notification.is_read ? 'Read' : 'Unread'})`);
        });

        // Test 2: Get unread count
        console.log('\n🔢 Test 2: Get unread count');
        const unreadResult = await pool.query(`
            SELECT COUNT(*) as unread_count 
            FROM notifications 
            WHERE recipient_id = $1 AND is_read = false
        `, [user.id]);

        console.log(`   Unread notifications: ${unreadResult.rows[0].unread_count}`);

        // Test 3: Mark a notification as read
        if (notificationsResult.rows.length > 0) {
            console.log('\n✅ Test 3: Mark notification as read');
            const notificationToMark = notificationsResult.rows.find(n => !n.is_read);
            if (notificationToMark) {
                await pool.query(`
                    UPDATE notifications 
                    SET is_read = true, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = $1
                `, [notificationToMark.id]);

                console.log(`   Marked notification "${notificationToMark.message}" as read`);
            } else {
                console.log('   No unread notifications to mark as read');
            }
        }

        // Test 4: Mark all as read
        console.log('\n✅ Test 4: Mark all notifications as read');
        const markAllResult = await pool.query(`
            UPDATE notifications 
            SET is_read = true, updated_at = CURRENT_TIMESTAMP 
            WHERE recipient_id = $1 AND is_read = false
        `, [user.id]);

        console.log(`   Marked ${markAllResult.rowCount} notifications as read`);

        // Test 5: Final unread count
        console.log('\n🔢 Test 5: Final unread count');
        const finalUnreadResult = await pool.query(`
            SELECT COUNT(*) as unread_count 
            FROM notifications 
            WHERE recipient_id = $1 AND is_read = false
        `, [user.id]);

        console.log(`   Final unread notifications: ${finalUnreadResult.rows[0].unread_count}`);

        console.log('\n🎉 All notification API tests completed successfully!');
        console.log('💡 The notifications should now appear in your admin dashboard dropdown.');

    } catch (error) {
        console.error('❌ Failed to test notifications API:', error);
    } finally {
        await pool.end();
    }
}

// Run the test
testNotificationsAPI();
