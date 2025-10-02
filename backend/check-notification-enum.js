/**
 * Check Notification Enum Values
 * Purpose: Check what notification_type_enum values are available
 * Key approaches: Database enum inspection, proper type validation
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

async function checkNotificationEnum() {
    try {
        console.log('🔍 Checking Notification Enum Values...\n');

        // Check existing notification types in database
        const existingTypes = await pool.query(`
            SELECT DISTINCT notification_type 
            FROM notifications 
            ORDER BY notification_type
        `);

        console.log('📋 Existing notification types in database:');
        existingTypes.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.notification_type}`);
        });

        // Check enum definition
        const enumQuery = await pool.query(`
            SELECT 
                t.typname as enum_name,
                e.enumlabel as enum_value
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            WHERE t.typname = 'notification_type_enum'
            ORDER BY e.enumsortorder
        `);

        console.log('\n📋 Available enum values for notification_type_enum:');
        enumQuery.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.enum_value}`);
        });

        // Check if we can create a notification with a valid type
        if (enumQuery.rows.length > 0) {
            const validType = enumQuery.rows[0].enum_value;
            console.log(`\n🧪 Testing with valid type: ${validType}`);

            try {
                const testResult = await pool.query(
                    `INSERT INTO notifications 
                     (recipient_id, sender_id, notification_type, message, is_read)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id, uuid, message`,
                    [
                        1, // recipient_id
                        1, // sender_id
                        validType,
                        'Test notification for User ID 1 - This should work!',
                        false
                    ]
                );

                console.log(`✅ Test notification created successfully!`);
                console.log(`   ID: ${testResult.rows[0].id}`);
                console.log(`   UUID: ${testResult.rows[0].uuid}`);
                console.log(`   Message: ${testResult.rows[0].message}`);

                // Clean up test notification
                await pool.query(`DELETE FROM notifications WHERE id = $1`, [testResult.rows[0].id]);
                console.log(`🧹 Test notification cleaned up`);

            } catch (testError) {
                console.log(`❌ Test notification failed: ${testError.message}`);
            }
        }

        console.log('\n🎉 Enum check completed!');

    } catch (error) {
        console.error('❌ Enum check failed:', error);
    } finally {
        await pool.end();
    }
}

// Run the check
checkNotificationEnum();