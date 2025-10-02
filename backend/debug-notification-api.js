/**
 * Debug Notification API
 * Purpose: Test the notification API endpoints to identify the 500 error
 * Key approaches: API testing, error logging, database debugging
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

async function debugNotificationAPI() {
    try {
        console.log('🔍 Debugging Notification API...\n');

        // Test 1: Check if notifications table exists and has correct structure
        console.log('📋 Test 1: Checking notifications table structure...');
        const tableInfo = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            ORDER BY ordinal_position
        `);

        console.log('   Notifications table columns:');
        tableInfo.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });

        // Test 2: Check notification_type_enum values
        console.log('\n📋 Test 2: Checking notification_type_enum values...');
        const enumValues = await pool.query(`
            SELECT unnest(enum_range(NULL::notification_type_enum)) as enum_value
        `);

        console.log('   Available enum values:');
        enumValues.rows.forEach(row => {
            console.log(`   - ${row.enum_value}`);
        });

        // Test 3: Test direct database insertion
        console.log('\n📋 Test 3: Testing direct database insertion...');

        // Disable triggers temporarily
        await pool.query('ALTER TABLE notifications DISABLE TRIGGER ALL');

        try {
            const testResult = await pool.query(
                `INSERT INTO notifications 
                 (recipient_id, notification_type, message, related_proposal_id, related_proposal_uuid)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, uuid, message`,
                [
                    2, // recipient_id
                    'proposal_status_change', // notification_type
                    'Test notification from debug script', // message
                    123, // related_proposal_id
                    'test-uuid-123' // related_proposal_uuid
                ]
            );

            console.log(`   ✅ Direct insertion successful: ${testResult.rows[0].uuid}`);
            console.log(`   Message: ${testResult.rows[0].message}`);

        } catch (insertError) {
            console.log(`   ❌ Direct insertion failed: ${insertError.message}`);
            console.log(`   Error code: ${insertError.code}`);
            console.log(`   Error detail: ${insertError.detail}`);
        }

        // Re-enable triggers
        await pool.query('ALTER TABLE notifications ENABLE TRIGGER ALL');

        // Test 4: Check users table for valid recipient_id
        console.log('\n📋 Test 4: Checking users table...');
        const usersResult = await pool.query('SELECT id, name, email FROM users LIMIT 5');
        console.log('   Available users:');
        usersResult.rows.forEach(user => {
            console.log(`   - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
        });

        // Test 5: Check proposals table for valid related_proposal_id
        console.log('\n📋 Test 5: Checking proposals table...');
        const proposalsResult = await pool.query('SELECT id, uuid, event_name FROM proposals LIMIT 5');
        console.log('   Available proposals:');
        proposalsResult.rows.forEach(proposal => {
            console.log(`   - ID: ${proposal.id}, UUID: ${proposal.uuid}, Event: ${proposal.event_name}`);
        });

        // Test 6: Test the exact API call that's failing
        console.log('\n📋 Test 6: Testing API call simulation...');

        const apiTestData = {
            recipientId: 2,
            notificationType: 'proposal_status_change',
            message: 'Your proposal "Test Event" has been submitted for review. You will be notified once it\'s reviewed by the admin.',
            relatedProposalId: 123,
            relatedProposalUuid: 'test-proposal-uuid-123'
        };

        console.log('   API test data:');
        console.log(`   - recipientId: ${apiTestData.recipientId}`);
        console.log(`   - notificationType: ${apiTestData.notificationType}`);
        console.log(`   - message: ${apiTestData.message}`);
        console.log(`   - relatedProposalId: ${apiTestData.relatedProposalId}`);
        console.log(`   - relatedProposalUuid: ${apiTestData.relatedProposalUuid}`);

        // Test the exact query that the API would use
        try {
            const apiTestResult = await pool.query(
                `INSERT INTO notifications 
                 (recipient_id, sender_id, notification_type, message, related_proposal_id, related_proposal_uuid)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [
                    apiTestData.recipientId,
                    2, // sender_id (assuming user ID 2)
                    apiTestData.notificationType,
                    apiTestData.message,
                    apiTestData.relatedProposalId,
                    apiTestData.relatedProposalUuid
                ]
            );

            console.log(`   ✅ API simulation successful: ${apiTestResult.rows[0].uuid}`);

        } catch (apiError) {
            console.log(`   ❌ API simulation failed: ${apiError.message}`);
            console.log(`   Error code: ${apiError.code}`);
            console.log(`   Error detail: ${apiError.detail}`);
            console.log(`   Error hint: ${apiError.hint}`);
        }

        console.log('\n🎉 Debug completed!');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the debug
debugNotificationAPI();
