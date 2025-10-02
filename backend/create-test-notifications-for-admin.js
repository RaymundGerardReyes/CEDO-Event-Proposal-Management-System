/**
 * Create Test Notifications for Admin Users
 * Purpose: Create notifications specifically for admin users to test the frontend
 * Key approaches: Database insertion, proper enum values, realistic data
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function createTestNotificationsForAdmin() {
    console.log('🚀 Creating test notifications for admin users...');

    try {
        // 1. Find admin users
        console.log('\n👥 Finding admin users...');
        const adminUsers = await pool.query(`
            SELECT id, name, email, role 
            FROM users 
            WHERE role IN ('head_admin', 'admin') 
            ORDER BY id
        `);

        if (adminUsers.rows.length === 0) {
            console.log('❌ No admin users found! Creating a test admin user...');

            // Create a test admin user
            const testAdmin = await pool.query(`
                INSERT INTO users (name, email, role, is_approved, organization)
                VALUES ('Test Admin', 'admin@test.com', 'head_admin', true, 'Test Organization')
                RETURNING id, name, email, role
            `);
            console.log(`✅ Created test admin: ${testAdmin.rows[0].name} (${testAdmin.rows[0].email})`);
            adminUsers.rows.push(testAdmin.rows[0]);
        }

        console.log(`👑 Found ${adminUsers.rows.length} admin users:`);
        adminUsers.rows.forEach(user => {
            console.log(`   ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });

        // 2. Clear existing notifications for admin users
        console.log('\n🧹 Clearing existing notifications...');
        const deleteResult = await pool.query(`
            DELETE FROM notifications 
            WHERE recipient_id IN (${adminUsers.rows.map(u => u.id).join(',')})
        `);
        console.log(`🗑️ Deleted ${deleteResult.rowCount} existing notifications`);

        // 3. Create diverse test notifications
        console.log('\n📝 Creating test notifications...');
        const notifications = [
            {
                recipient_id: adminUsers.rows[0].id,
                sender_id: adminUsers.rows[0].id, // Self-sent
                notification_type: 'proposal_status_change',
                message: 'New proposal "Tech Conference 2024" has been submitted by John Doe from Tech Club. Please review it.',
                is_read: false,
                related_proposal_id: 101,
                related_proposal_uuid: 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
            },
            {
                recipient_id: adminUsers.rows[0].id,
                sender_id: adminUsers.rows[0].id,
                notification_type: 'proposal_status_change',
                message: 'Proposal "Science Fair 2024" has been approved! Great work on the comprehensive planning.',
                is_read: true,
                related_proposal_id: 102,
                related_proposal_uuid: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0'
            },
            {
                recipient_id: adminUsers.rows[0].id,
                sender_id: null, // System notification
                notification_type: 'proposal_status_change',
                message: 'System maintenance scheduled for tonight from 11 PM to 1 AM. Some features may be temporarily unavailable.',
                is_read: false,
                related_proposal_id: null,
                related_proposal_uuid: null
            },
            {
                recipient_id: adminUsers.rows[0].id,
                sender_id: adminUsers.rows[0].id,
                notification_type: 'proposal_status_change',
                message: 'Your proposal "Community Outreach Program" was not approved. Please review the feedback and resubmit with the requested changes.',
                is_read: false,
                related_proposal_id: 103,
                related_proposal_uuid: 'c3d4e5f6-a7b8-9012-3456-7890abcdef01'
            },
            {
                recipient_id: adminUsers.rows[0].id,
                sender_id: adminUsers.rows[0].id,
                notification_type: 'proposal_status_change',
                message: 'New user registration: Sarah Johnson (sarah@example.com) is waiting for approval.',
                is_read: true,
                related_proposal_id: null,
                related_proposal_uuid: null
            },
            {
                recipient_id: adminUsers.rows[0].id,
                sender_id: adminUsers.rows[0].id,
                notification_type: 'proposal_status_change',
                message: 'Proposal "Art Exhibition 2024" has been approved! Congratulations on the excellent event planning.',
                is_read: false,
                related_proposal_id: 104,
                related_proposal_uuid: 'd4e5f6a7-b8c9-0123-4567-890abcdef012'
            },
            {
                recipient_id: adminUsers.rows[0].id,
                sender_id: null,
                notification_type: 'proposal_status_change',
                message: 'System update: All notification features are now fully functional. You can now receive real-time updates.',
                is_read: true,
                related_proposal_id: null,
                related_proposal_uuid: null
            },
            {
                recipient_id: adminUsers.rows[0].id,
                sender_id: adminUsers.rows[0].id,
                notification_type: 'proposal_status_change',
                message: 'New proposal "Math Olympiad 2024" has been submitted by Mike Johnson from Math Club. Please review it.',
                is_read: false,
                related_proposal_id: 105,
                related_proposal_uuid: 'e5f6a7b8-c9d0-1234-5678-90abcdef0123'
            }
        ];

        let createdCount = 0;
        let unreadCount = 0;

        for (const notif of notifications) {
            try {
                const result = await pool.query(`
                    INSERT INTO notifications 
                    (recipient_id, sender_id, notification_type, message, is_read, related_proposal_id, related_proposal_uuid)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id, is_read
                `, [
                    notif.recipient_id,
                    notif.sender_id,
                    notif.notification_type,
                    notif.message,
                    notif.is_read,
                    notif.related_proposal_id,
                    notif.related_proposal_uuid
                ]);

                console.log(`✅ Created notification: ${notif.message.substring(0, 50)}...`);
                createdCount++;
                if (!result.rows[0].is_read) {
                    unreadCount++;
                }
            } catch (error) {
                console.error(`❌ Failed to create notification: ${error.message}`);
            }
        }

        // 4. Verify the created notifications
        console.log('\n📊 VERIFICATION');
        console.log('-'.repeat(40));
        const verification = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_read = false THEN 1 END) as unread,
                COUNT(CASE WHEN is_read = true THEN 1 END) as read
            FROM notifications 
            WHERE recipient_id = $1
        `, [adminUsers.rows[0].id]);

        console.log(`📈 Created ${createdCount} notifications`);
        console.log(`📊 Total notifications for admin: ${verification.rows[0].total}`);
        console.log(`🔴 Unread notifications: ${verification.rows[0].unread}`);
        console.log(`✅ Read notifications: ${verification.rows[0].read}`);

        // 5. Show recent notifications
        console.log('\n🔔 RECENT NOTIFICATIONS');
        console.log('-'.repeat(40));
        const recentNotifications = await pool.query(`
            SELECT id, message, is_read, created_at
            FROM notifications 
            WHERE recipient_id = $1
            ORDER BY created_at DESC
            LIMIT 5
        `, [adminUsers.rows[0].id]);

        recentNotifications.rows.forEach((notif, index) => {
            console.log(`${index + 1}. ${notif.is_read ? '✅' : '🔴'} ${notif.message.substring(0, 60)}...`);
        });

        console.log('\n🎉 SUCCESS! Test notifications created successfully!');
        console.log('💡 Now refresh your admin dashboard to see the notifications in the dropdown.');
        console.log('🔧 If notifications still don\'t appear, check:');
        console.log('   1. Backend server is running (npm run dev)');
        console.log('   2. Frontend is making API calls to correct endpoint');
        console.log('   3. Authentication token is valid');
        console.log('   4. Browser console for any errors');

    } catch (error) {
        console.error('❌ Failed to create test notifications:', error);
    } finally {
        await pool.end();
    }
}

// Run the script
createTestNotificationsForAdmin();
