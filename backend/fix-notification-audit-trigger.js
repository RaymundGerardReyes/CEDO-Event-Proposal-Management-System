/**
 * Fix Notification Audit Trigger
 * Purpose: Fix the audit trigger for notifications to use allowed action_type values
 * Key approaches: Database trigger modification, constraint compliance
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

async function fixNotificationAuditTrigger() {
    try {
        console.log('🔧 Fixing notification audit trigger...\n');

        // Check current trigger function
        const triggerResult = await pool.query(`
            SELECT 
                p.proname as function_name,
                pg_get_functiondef(p.oid) as function_definition
            FROM pg_proc p
            JOIN pg_trigger t ON p.oid = t.tgfoid
            WHERE t.tgname = 'notifications_audit_trigger'
        `);

        if (triggerResult.rows.length > 0) {
            console.log('📋 Current trigger function:');
            console.log(triggerResult.rows[0].function_definition);
        }

        // Create a new trigger function that uses 'CREATE' instead of 'INSERT'
        console.log('\n🔧 Creating new trigger function...');

        const newTriggerFunction = `
            CREATE OR REPLACE FUNCTION notifications_audit_trigger_function()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Use 'CREATE' instead of 'INSERT' to comply with audit_logs constraints
                INSERT INTO audit_logs (user_id, action_type, table_name, record_id, new_values)
                VALUES (COALESCE(NEW.sender_id, OLD.sender_id), 'CREATE', 'notifications', COALESCE(NEW.id, OLD.id),
                        to_jsonb(NEW));
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        `;

        await pool.query(newTriggerFunction);
        console.log('✅ New trigger function created successfully');

        // Test the fix by creating a notification
        console.log('\n🧪 Testing the fix...');

        try {
            const testResult = await pool.query(
                `INSERT INTO notifications 
                 (recipient_id, notification_type, message, related_proposal_id, related_proposal_uuid)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, uuid, message`,
                [
                    2, // recipient_id
                    'proposal_status_change', // notification_type
                    'Test notification after trigger fix', // message
                    123, // related_proposal_id
                    'test-uuid-after-fix' // related_proposal_uuid
                ]
            );

            console.log(`✅ Test notification created successfully: ${testResult.rows[0].uuid}`);
            console.log(`   Message: ${testResult.rows[0].message}`);

            // Check if audit log was created
            const auditResult = await pool.query(`
                SELECT action_type, table_name, record_id 
                FROM audit_logs 
                WHERE table_name = 'notifications' 
                AND record_id = $1
                ORDER BY created_at DESC 
                LIMIT 1
            `, [testResult.rows[0].id]);

            if (auditResult.rows.length > 0) {
                console.log(`✅ Audit log created: action_type=${auditResult.rows[0].action_type}, table_name=${auditResult.rows[0].table_name}`);
            } else {
                console.log('⚠️ No audit log found for the test notification');
            }

        } catch (testError) {
            console.log(`❌ Test failed: ${testError.message}`);
            console.log(`   Error code: ${testError.code}`);
        }

        console.log('\n🎉 Notification audit trigger fix completed!');
        console.log('💡 The notification API should now work without 500 errors.');

    } catch (error) {
        console.error('❌ Failed to fix notification audit trigger:', error);
    } finally {
        await pool.end();
    }
}

// Run the fix
fixNotificationAuditTrigger();
