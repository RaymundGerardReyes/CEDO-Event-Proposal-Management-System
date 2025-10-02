/**
 * Create Test Notifications Script (Simple Version)
 * Purpose: Add sample notifications to the database for testing
 * Key approaches: Direct database insertion, bypassing audit triggers
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

async function createTestNotifications() {
    try {
        console.log('🚀 Creating test notifications...');

        // First, get a user ID to create notifications for
        const userResult = await pool.query('SELECT id FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            console.log('❌ No users found in database. Please create a user first.');
            return;
        }

        const userId = userResult.rows[0].id;
        console.log(`📧 Creating notifications for user ID: ${userId}`);

        // Create test notifications with direct SQL (bypassing triggers)
        const testNotifications = [
            {
                message: 'Your proposal "Annual Science Fair 2024" has been approved! Congratulations!',
                notification_type: 'proposal_status_change',
                related_proposal_id: 1,
                related_proposal_uuid: 'test-uuid-1',
                is_read: false
            },
            {
                message: 'Your proposal "Tech Conference 2024" was not approved. Please review the feedback and resubmit.',
                notification_type: 'proposal_status_change',
                related_proposal_id: 2,
                related_proposal_uuid: 'test-uuid-2',
                is_read: false
            },
            {
                message: 'New proposal "Student Workshop Series" has been submitted and is pending review.',
                notification_type: 'proposal_status_change',
                related_proposal_id: 3,
                related_proposal_uuid: 'test-uuid-3',
                is_read: true
            },
            {
                message: 'System maintenance scheduled for this weekend. Some features may be temporarily unavailable.',
                notification_type: 'proposal_status_change',
                related_proposal_id: null,
                related_proposal_uuid: null,
                is_read: false
            },
            {
                message: 'Your proposal "Community Outreach Program" has been approved! Great work!',
                notification_type: 'proposal_status_change',
                related_proposal_id: 4,
                related_proposal_uuid: 'test-uuid-4',
                is_read: true
            }
        ];

        // Disable triggers temporarily
        await pool.query('ALTER TABLE notifications DISABLE TRIGGER ALL');

        // Insert notifications
        for (const notification of testNotifications) {
            const result = await pool.query(
                `INSERT INTO notifications 
                 (recipient_id, notification_type, message, is_read, related_proposal_id, related_proposal_uuid, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id, uuid`,
                [
                    userId,
                    notification.notification_type,
                    notification.message,
                    notification.is_read,
                    notification.related_proposal_id,
                    notification.related_proposal_uuid,
                    new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time within last week
                ]
            );

            console.log(`✅ Created notification: ${result.rows[0].uuid}`);
        }

        // Re-enable triggers
        await pool.query('ALTER TABLE notifications ENABLE TRIGGER ALL');

        // Get count of notifications for this user
        const countResult = await pool.query(
            'SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = false THEN 1 END) as unread FROM notifications WHERE recipient_id = $1',
            [userId]
        );

        console.log(`📊 Notification Summary:`);
        console.log(`   Total notifications: ${countResult.rows[0].total}`);
        console.log(`   Unread notifications: ${countResult.rows[0].unread}`);

        console.log('🎉 Test notifications created successfully!');
        console.log('💡 Now refresh your admin dashboard to see the notifications in the dropdown.');

    } catch (error) {
        console.error('❌ Failed to create test notifications:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
createTestNotifications();
