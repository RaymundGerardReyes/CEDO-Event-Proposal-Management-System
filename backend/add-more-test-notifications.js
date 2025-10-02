/**
 * Add More Test Notifications
 * Purpose: Add additional realistic notifications for better testing
 * Key approaches: Realistic data, varied notification types, proper timestamps
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

async function addMoreTestNotifications() {
    try {
        console.log('🚀 Adding more test notifications...');

        // Get a user ID
        const userResult = await pool.query('SELECT id FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            console.log('❌ No users found in database.');
            return;
        }

        const userId = userResult.rows[0].id;
        console.log(`📧 Adding notifications for user ID: ${userId}`);

        // Disable triggers temporarily
        await pool.query('ALTER TABLE notifications DISABLE TRIGGER ALL');

        // Add more realistic notifications
        const additionalNotifications = [
            {
                message: 'Welcome to CEDO! Your account has been successfully created.',
                notification_type: 'proposal_status_change',
                is_read: true,
                hours_ago: 24
            },
            {
                message: 'Your proposal "Environmental Science Symposium" has been approved! You can now proceed with your event.',
                notification_type: 'proposal_status_change',
                is_read: false,
                hours_ago: 2
            },
            {
                message: 'Reminder: Your proposal "Math Olympiad 2024" is due for review in 3 days.',
                notification_type: 'proposal_status_change',
                is_read: false,
                hours_ago: 6
            },
            {
                message: 'New system update available! Check out the latest features and improvements.',
                notification_type: 'proposal_status_change',
                is_read: false,
                hours_ago: 1
            },
            {
                message: 'Your proposal "Art Exhibition 2024" requires revision. Please check the admin comments.',
                notification_type: 'proposal_status_change',
                is_read: true,
                hours_ago: 12
            },
            {
                message: 'Congratulations! Your proposal "Science Fair 2024" has been approved and is now live.',
                notification_type: 'proposal_status_change',
                is_read: false,
                hours_ago: 0.5
            }
        ];

        // Insert additional notifications
        for (const notification of additionalNotifications) {
            const created_at = new Date(Date.now() - (notification.hours_ago * 60 * 60 * 1000));

            const result = await pool.query(
                `INSERT INTO notifications 
                 (recipient_id, notification_type, message, is_read, created_at)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, uuid`,
                [
                    userId,
                    notification.notification_type,
                    notification.message,
                    notification.is_read,
                    created_at
                ]
            );

            console.log(`✅ Created notification: ${result.rows[0].uuid}`);
        }

        // Re-enable triggers
        await pool.query('ALTER TABLE notifications ENABLE TRIGGER ALL');

        // Get final count
        const countResult = await pool.query(
            'SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = false THEN 1 END) as unread FROM notifications WHERE recipient_id = $1',
            [userId]
        );

        console.log(`\n📊 Final Notification Summary:`);
        console.log(`   Total notifications: ${countResult.rows[0].total}`);
        console.log(`   Unread notifications: ${countResult.rows[0].unread}`);

        console.log('\n🎉 Additional test notifications created successfully!');
        console.log('💡 Refresh your admin dashboard to see all the notifications in the dropdown.');

    } catch (error) {
        console.error('❌ Failed to add test notifications:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
addMoreTestNotifications();
