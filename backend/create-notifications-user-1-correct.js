/**
 * Create Notifications for User 1 (head_admin) - Correct Version
 * Purpose: Create notifications for the currently logged-in user using correct enum values
 * Key approaches: Proper enum usage, user-specific targeting, comprehensive notifications
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

async function createNotificationsForUser1Correct() {
    try {
        console.log('🔍 Creating Notifications for User 1 (head_admin) - Correct Version...\n');

        // Check current user
        const userResult = await pool.query(`
            SELECT id, name, email, role 
            FROM users 
            WHERE id = 1
        `);

        if (userResult.rows.length === 0) {
            console.log('❌ User ID 1 not found');
            return;
        }

        const user = userResult.rows[0];
        console.log(`👤 Creating notifications for: ${user.name} (${user.email}) - Role: ${user.role}`);

        // Create comprehensive notifications for head_admin using correct enum
        const notifications = [
            {
                message: 'Welcome to CEDO Admin Dashboard! Your notifications system is now fully operational.',
                is_read: false,
                related_proposal_id: null,
                related_proposal_uuid: null
            },
            {
                message: 'New proposal "Science Fair 2024" has been submitted by John Doe from Science Club. Please review it.',
                is_read: false,
                related_proposal_id: 101,
                related_proposal_uuid: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
            },
            {
                message: 'Your proposal "Tech Conference 2024" has been approved! Congratulations!',
                is_read: true,
                related_proposal_id: 102,
                related_proposal_uuid: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0'
            },
            {
                message: 'System maintenance scheduled for this weekend. Some features may be temporarily unavailable.',
                is_read: false,
                related_proposal_id: null,
                related_proposal_uuid: null
            },
            {
                message: 'New proposal "Environmental Workshop" has been submitted by Jane Smith from Green Club. Please review it.',
                is_read: false,
                related_proposal_id: 103,
                related_proposal_uuid: 'c3d4e5f6-a7b8-9012-3456-7890abcdef01'
            },
            {
                message: 'Your proposal "Leadership Training 2024" requires revision. Please check the admin comments.',
                is_read: false,
                related_proposal_id: 104,
                related_proposal_uuid: 'd4e5f6a7-b8c9-0123-4567-890abcdef012'
            },
            {
                message: 'Reminder: Please review pending proposals in your dashboard.',
                is_read: true,
                related_proposal_id: null,
                related_proposal_uuid: null
            },
            {
                message: 'New user registration: Adam Smith (adam@example.com) is waiting for approval.',
                is_read: false,
                related_proposal_id: null,
                related_proposal_uuid: null
            },
            {
                message: 'System update: All notification features are now fully functional.',
                is_read: false,
                related_proposal_id: null,
                related_proposal_uuid: null
            },
            {
                message: 'Your proposal "Community Outreach Program" has been approved! Great work!',
                is_read: true,
                related_proposal_id: 105,
                related_proposal_uuid: 'e5f6a7b8-c9d0-1234-5678-90abcdef0123'
            },
            {
                message: 'New proposal "Math Olympiad 2024" has been submitted by Mike Johnson from Math Club. Please review it.',
                is_read: false,
                related_proposal_id: 106,
                related_proposal_uuid: 'f6a7b8c9-d0e1-2345-6789-0abcdef01234'
            },
            {
                message: 'Your proposal "Art Exhibition 2024" was not approved. Please review the feedback and resubmit.',
                is_read: false,
                related_proposal_id: 107,
                related_proposal_uuid: 'a7b8c9d0-e1f2-3456-7890-abcdef012345'
            }
        ];

        console.log(`📧 Creating ${notifications.length} notifications for User ID 1...`);

        let createdCount = 0;
        let unreadCount = 0;

        for (const notif of notifications) {
            try {
                const result = await pool.query(
                    `INSERT INTO notifications 
                     (recipient_id, sender_id, notification_type, message, is_read, related_proposal_id, related_proposal_uuid)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     RETURNING id, uuid, message, is_read`,
                    [
                        1, // recipient_id (head_admin user)
                        1, // sender_id (head_admin user)
                        'proposal_status_change', // Use correct enum value
                        notif.message,
                        notif.is_read,
                        notif.related_proposal_id,
                        notif.related_proposal_uuid
                    ]
                );

                console.log(`✅ Created notification: ${result.rows[0].uuid}`);
                console.log(`   Message: ${result.rows[0].message}`);
                console.log(`   Read: ${result.rows[0].is_read}`);
                console.log('');

                createdCount++;
                if (!result.rows[0].is_read) {
                    unreadCount++;
                }
            } catch (insertError) {
                console.log(`❌ Failed to create notification: ${insertError.message}`);
            }
        }

        // Get final count
        const countResult = await pool.query(`
            SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = false THEN 1 END) as unread
            FROM notifications 
            WHERE recipient_id = 1
        `);

        console.log('\n📊 Final Notification Summary:');
        console.log(`   Total notifications created: ${createdCount}`);
        console.log(`   Unread notifications: ${unreadCount}`);
        console.log(`   Total notifications for User ID 1: ${countResult.rows[0].total}`);
        console.log(`   Final unread count: ${countResult.rows[0].unread}`);

        console.log('\n🎉 Notifications created successfully!');
        console.log('💡 Now refresh your admin dashboard notifications page to see the notifications.');

    } catch (error) {
        console.error('❌ Failed to create notifications:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
createNotificationsForUser1Correct();
