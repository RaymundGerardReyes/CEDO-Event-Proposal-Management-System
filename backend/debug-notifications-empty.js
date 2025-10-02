/**
 * Debug Notifications Empty Issue
 * Purpose: Debug why notifications page shows empty state
 * Key approaches: Database analysis, user authentication, notification data verification
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

async function debugNotificationsEmpty() {
    try {
        console.log('🔍 Debugging Notifications Empty Issue...\n');

        // Check 1: Get all users and their notification counts
        console.log('📋 Check 1: Users and their notification counts');
        const usersResult = await pool.query(`
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role,
                COUNT(n.id) as notification_count,
                COUNT(CASE WHEN n.is_read = false THEN 1 END) as unread_count
            FROM users u
            LEFT JOIN notifications n ON u.id = n.recipient_id
            GROUP BY u.id, u.name, u.email, u.role
            ORDER BY u.id
        `);

        console.log('   Users and their notification counts:');
        usersResult.rows.forEach(user => {
            console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
            console.log(`     Total notifications: ${user.notification_count}, Unread: ${user.unread_count}`);
        });

        // Check 2: Get all notifications in the database
        console.log('\n📋 Check 2: All notifications in database');
        const allNotificationsResult = await pool.query(`
            SELECT 
                n.id,
                n.recipient_id,
                n.sender_id,
                n.notification_type,
                n.message,
                n.is_read,
                n.created_at,
                u.name as recipient_name,
                s.name as sender_name
            FROM notifications n
            LEFT JOIN users u ON n.recipient_id = u.id
            LEFT JOIN users s ON n.sender_id = s.id
            ORDER BY n.created_at DESC
            LIMIT 20
        `);

        console.log(`   Found ${allNotificationsResult.rows.length} total notifications:`);
        allNotificationsResult.rows.forEach((notif, index) => {
            console.log(`   ${index + 1}. ID: ${notif.id}, Recipient: ${notif.recipient_name} (${notif.recipient_id})`);
            console.log(`      Message: ${notif.message}`);
            console.log(`      Type: ${notif.notification_type}, Read: ${notif.is_read}`);
            console.log(`      Created: ${notif.created_at}`);
            console.log('');
        });

        // Check 3: Test the exact API query that the frontend would use
        console.log('📋 Check 3: Testing API query for user ID 2 (admin)');
        const apiTestResult = await pool.query(`
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
                n.related_proposal_uuid,
                p.event_name,
                p.contact_person,
                p.organization_type,
                u.name as sender_name,
                u.email as sender_email
            FROM notifications n
            LEFT JOIN proposals p ON n.related_proposal_id = p.id
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.recipient_id = $1
            ORDER BY n.created_at DESC 
            LIMIT 50
        `, [2]); // Test with user ID 2 (admin)

        console.log(`   API query result for user ID 2: ${apiTestResult.rows.length} notifications`);
        apiTestResult.rows.forEach((notif, index) => {
            console.log(`   ${index + 1}. ${notif.message} (${notif.is_read ? 'Read' : 'Unread'})`);
        });

        // Check 4: Test with different user IDs
        console.log('\n📋 Check 4: Testing with different user IDs');
        for (let userId = 1; userId <= 5; userId++) {
            const userTestResult = await pool.query(`
                SELECT COUNT(*) as count
                FROM notifications 
                WHERE recipient_id = $1
            `, [userId]);

            console.log(`   User ID ${userId}: ${userTestResult.rows[0].count} notifications`);
        }

        // Check 5: Create a test notification for user ID 2 if none exist
        if (apiTestResult.rows.length === 0) {
            console.log('\n📋 Check 5: No notifications found for user ID 2, creating test notification...');

            try {
                const testNotificationResult = await pool.query(
                    `INSERT INTO notifications 
                     (recipient_id, sender_id, notification_type, message, is_read, related_proposal_id, related_proposal_uuid)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     RETURNING id, uuid, message`,
                    [
                        2, // recipient_id (admin user)
                        2, // sender_id (admin user)
                        'proposal_status_change', // notification_type
                        'Test notification for admin dashboard - This should appear in the notifications page!', // message
                        false, // is_read
                        123, // related_proposal_id
                        'test-proposal-uuid-123' // related_proposal_uuid
                    ]
                );

                console.log(`   ✅ Test notification created: ${testNotificationResult.rows[0].uuid}`);
                console.log(`   Message: ${testNotificationResult.rows[0].message}`);
            } catch (insertError) {
                console.log(`   ❌ Failed to create test notification: ${insertError.message}`);
            }
        }

        // Check 6: Verify the test notification was created
        console.log('\n📋 Check 6: Verifying test notification');
        const verifyResult = await pool.query(`
            SELECT id, message, is_read, created_at
            FROM notifications 
            WHERE recipient_id = 2 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        console.log(`   Found ${verifyResult.rows.length} notifications for user ID 2:`);
        verifyResult.rows.forEach((notif, index) => {
            console.log(`   ${index + 1}. ${notif.message} (${notif.is_read ? 'Read' : 'Unread'})`);
        });

        console.log('\n🎉 Debug completed!');
        console.log('💡 If notifications exist but the page shows empty, check:');
        console.log('   1. Authentication token is valid');
        console.log('   2. User ID in token matches recipient_id in notifications');
        console.log('   3. API endpoint is accessible');
        console.log('   4. Frontend is making the correct API call');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the debug
debugNotificationsEmpty();
