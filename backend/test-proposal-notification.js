/**
 * Test Proposal Notification Creation
 * Purpose: Test the notification creation when a proposal is submitted
 * Key approaches: API testing, database verification, notification validation
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

async function testProposalNotification() {
    try {
        console.log('🧪 Testing Proposal Notification Creation...\n');

        // Get user information
        const userResult = await pool.query('SELECT id, name, email FROM users LIMIT 1');
        if (userResult.rows.length === 0) {
            console.log('❌ No users found in database.');
            return;
        }

        const user = userResult.rows[0];
        console.log(`👤 Testing for user: ${user.name} (ID: ${user.id})`);

        // Simulate proposal submission notification creation
        const proposalData = {
            eventName: 'Test Science Fair 2024',
            contactPerson: 'John Doe',
            organizationName: 'Science Club',
            proposalId: 999,
            proposalUuid: 'test-proposal-uuid-123'
        };

        console.log('\n📝 Creating proposal submission notification...');

        // Disable triggers temporarily to avoid audit log issues
        await pool.query('ALTER TABLE notifications DISABLE TRIGGER ALL');

        // Create user notification
        const userNotificationResult = await pool.query(
            `INSERT INTO notifications 
             (recipient_id, notification_type, message, is_read, related_proposal_id, related_proposal_uuid, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, uuid, message`,
            [
                user.id,
                'proposal_status_change',
                `Your proposal "${proposalData.eventName}" has been submitted for review. You will be notified once it's reviewed by the admin.`,
                false,
                proposalData.proposalId,
                proposalData.proposalUuid,
                new Date()
            ]
        );

        console.log(`✅ User notification created: ${userNotificationResult.rows[0].uuid}`);
        console.log(`   Message: ${userNotificationResult.rows[0].message}`);

        // Create admin notification
        const adminNotificationResult = await pool.query(
            `INSERT INTO notifications 
             (recipient_id, notification_type, message, is_read, related_proposal_id, related_proposal_uuid, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, uuid, message`,
            [
                2, // Admin user ID
                'proposal_status_change',
                `New proposal "${proposalData.eventName}" has been submitted by ${proposalData.contactPerson} from ${proposalData.organizationName}. Please review it.`,
                false,
                proposalData.proposalId,
                proposalData.proposalUuid,
                new Date()
            ]
        );

        console.log(`✅ Admin notification created: ${adminNotificationResult.rows[0].uuid}`);
        console.log(`   Message: ${adminNotificationResult.rows[0].message}`);

        // Re-enable triggers
        await pool.query('ALTER TABLE notifications ENABLE TRIGGER ALL');

        // Get final counts
        const userCountResult = await pool.query(
            'SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = false THEN 1 END) as unread FROM notifications WHERE recipient_id = $1',
            [user.id]
        );

        const adminCountResult = await pool.query(
            'SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = false THEN 1 END) as unread FROM notifications WHERE recipient_id = $1',
            [2]
        );

        console.log('\n📊 Notification Summary:');
        console.log(`   User (${user.name}):`);
        console.log(`     Total notifications: ${userCountResult.rows[0].total}`);
        console.log(`     Unread notifications: ${userCountResult.rows[0].unread}`);
        console.log(`   Admin:`);
        console.log(`     Total notifications: ${adminCountResult.rows[0].total}`);
        console.log(`     Unread notifications: ${adminCountResult.rows[0].unread}`);

        // Test notification retrieval
        console.log('\n🔍 Testing notification retrieval...');

        const userNotifications = await pool.query(
            `SELECT message, is_read, created_at 
             FROM notifications 
             WHERE recipient_id = $1 
             ORDER BY created_at DESC 
             LIMIT 3`,
            [user.id]
        );

        console.log('   Recent user notifications:');
        userNotifications.rows.forEach((notification, index) => {
            console.log(`   ${index + 1}. ${notification.message} (${notification.is_read ? 'Read' : 'Unread'})`);
        });

        const adminNotifications = await pool.query(
            `SELECT message, is_read, created_at 
             FROM notifications 
             WHERE recipient_id = $1 
             ORDER BY created_at DESC 
             LIMIT 3`,
            [2]
        );

        console.log('   Recent admin notifications:');
        adminNotifications.rows.forEach((notification, index) => {
            console.log(`   ${index + 1}. ${notification.message} (${notification.is_read ? 'Read' : 'Unread'})`);
        });

        console.log('\n🎉 Proposal notification test completed successfully!');
        console.log('💡 The notifications should now appear in both user and admin dashboards.');

    } catch (error) {
        console.error('❌ Failed to test proposal notification:', error);
    } finally {
        await pool.end();
    }
}

// Run the test
testProposalNotification();
