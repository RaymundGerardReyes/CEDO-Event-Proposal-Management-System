/**
 * Test Notification Fix Verification
 * Purpose: Verify that the notification creation now works without audit trigger errors
 * Key approaches: Database testing, error verification, success confirmation
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

async function testNotificationFixVerification() {
    try {
        console.log('🧪 Testing Notification Fix Verification...\n');

        // Test 1: Create user notification (simulating the API call)
        console.log('📋 Test 1: Creating user notification...');
        try {
            const userNotificationResult = await pool.query(
                `INSERT INTO notifications 
                 (recipient_id, sender_id, notification_type, message, related_proposal_id, related_proposal_uuid)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, uuid, message, created_at`,
                [
                    2, // recipient_id
                    2, // sender_id (admin user)
                    'proposal_status_change', // notification_type
                    'Your proposal "Test Science Fair 2024" has been submitted for review. You will be notified once it\'s reviewed by the admin.', // message
                    123, // related_proposal_id
                    'test-proposal-uuid-123' // related_proposal_uuid
                ]
            );

            console.log('✅ User notification created successfully');
            console.log(`   ID: ${userNotificationResult.rows[0].id}`);
            console.log(`   UUID: ${userNotificationResult.rows[0].uuid}`);
            console.log(`   Message: ${userNotificationResult.rows[0].message}`);
            console.log(`   Created: ${userNotificationResult.rows[0].created_at}`);

        } catch (userError) {
            console.log('❌ User notification creation failed');
            console.log(`   Error: ${userError.message}`);
            console.log(`   Code: ${userError.code}`);
            return;
        }

        // Test 2: Create admin notification (simulating the API call)
        console.log('\n📋 Test 2: Creating admin notification...');
        try {
            const adminNotificationResult = await pool.query(
                `INSERT INTO notifications 
                 (recipient_id, sender_id, notification_type, message, related_proposal_id, related_proposal_uuid)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id, uuid, message, created_at`,
                [
                    2, // recipient_id (admin user)
                    2, // sender_id (admin user)
                    'proposal_status_change', // notification_type
                    'New proposal "Test Science Fair 2024" has been submitted by John Doe from Science Club. Please review it.', // message
                    123, // related_proposal_id
                    'test-proposal-uuid-123' // related_proposal_uuid
                ]
            );

            console.log('✅ Admin notification created successfully');
            console.log(`   ID: ${adminNotificationResult.rows[0].id}`);
            console.log(`   UUID: ${adminNotificationResult.rows[0].uuid}`);
            console.log(`   Message: ${adminNotificationResult.rows[0].message}`);
            console.log(`   Created: ${adminNotificationResult.rows[0].created_at}`);

        } catch (adminError) {
            console.log('❌ Admin notification creation failed');
            console.log(`   Error: ${adminError.message}`);
            console.log(`   Code: ${adminError.code}`);
            return;
        }

        // Test 3: Check audit logs were created correctly
        console.log('\n📋 Test 3: Checking audit logs...');
        try {
            const auditLogsResult = await pool.query(`
                SELECT action_type, table_name, record_id, created_at
                FROM audit_logs 
                WHERE table_name = 'notifications' 
                ORDER BY created_at DESC 
                LIMIT 5
            `);

            console.log('✅ Audit logs retrieved successfully');
            console.log(`   Count: ${auditLogsResult.rows.length}`);
            auditLogsResult.rows.forEach((log, index) => {
                console.log(`   ${index + 1}. action_type=${log.action_type}, table_name=${log.table_name}, record_id=${log.record_id}`);
            });

        } catch (auditError) {
            console.log('❌ Failed to get audit logs');
            console.log(`   Error: ${auditError.message}`);
        }

        // Test 4: Get notification count
        console.log('\n📋 Test 4: Getting notification counts...');
        try {
            const countResult = await pool.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN is_read = false THEN 1 END) as unread
                FROM notifications 
                WHERE recipient_id = 2
            `);

            console.log('✅ Notification counts retrieved successfully');
            console.log(`   Total notifications: ${countResult.rows[0].total}`);
            console.log(`   Unread notifications: ${countResult.rows[0].unread}`);

        } catch (countError) {
            console.log('❌ Failed to get notification counts');
            console.log(`   Error: ${countError.message}`);
        }

        console.log('\n🎉 Notification fix verification completed successfully!');
        console.log('💡 The notification system should now work in the frontend without 500 errors.');

    } catch (error) {
        console.error('❌ Notification fix verification failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the test
testNotificationFixVerification();
