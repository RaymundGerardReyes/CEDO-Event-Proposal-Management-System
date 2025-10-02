/**
 * Create Notifications for Current User
 * Purpose: Create test notifications for the currently logged-in user
 * Key approaches: User identification, notification creation, testing
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

async function createNotificationsForCurrentUser() {
    try {
        console.log('🔍 Creating notifications for current user...\n');

        // Get all users to see who might be logged in
        const usersResult = await pool.query(`
            SELECT id, name, email, role 
            FROM users 
            ORDER BY id
        `);

        console.log('👥 Available users:');
        usersResult.rows.forEach(user => {
            console.log(`   ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });

        // Create notifications for user ID 2 (admin) since that's where most notifications are
        const targetUserId = 2;
        console.log(`\n📧 Creating notifications for user ID ${targetUserId}...`);

        const testNotifications = [
            {
                message: 'Welcome to CEDO Admin Dashboard! Your notifications are working correctly.',
                is_read: false
            },
            {
                message: 'System update: All notification features are now fully functional.',
                is_read: false
            },
            {
                message: 'New proposal "Test Event 2024" has been submitted and is pending review.',
                is_read: false
            },
            {
                message: 'Your proposal "Science Fair 2024" has been approved! Congratulations!',
                is_read: true
            },
            {
                message: 'Reminder: Please review pending proposals in your dashboard.',
                is_read: false
            }
        ];

        for (const notif of testNotifications) {
            const result = await pool.query(
                `INSERT INTO notifications 
                 (recipient_id, sender_id, notification_type, message, is_read, related_proposal_id, related_proposal_uuid)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, uuid, message`,
                [
                    targetUserId, // recipient_id
                    targetUserId, // sender_id
                    'proposal_status_change', // notification_type
                    notif.message, // message
                    notif.is_read, // is_read
                    null, // related_proposal_id
                    null // related_proposal_uuid
                ]
            );

            console.log(`✅ Created notification: ${result.rows[0].uuid}`);
            console.log(`   Message: ${result.rows[0].message}`);
        }

        // Get final count
        const countResult = await pool.query(`
            SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = false THEN 1 END) as unread
            FROM notifications 
            WHERE recipient_id = $1
        `, [targetUserId]);

        console.log('\n📊 Final notification count:');
        console.log(`   Total notifications: ${countResult.rows[0].total}`);
        console.log(`   Unread notifications: ${countResult.rows[0].unread}`);

        console.log('\n🎉 Notifications created successfully!');
        console.log('💡 Now refresh your admin dashboard notifications page to see the notifications.');

    } catch (error) {
        console.error('❌ Failed to create notifications:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
createNotificationsForCurrentUser();
