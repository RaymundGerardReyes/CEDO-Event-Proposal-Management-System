#!/usr/bin/env node

/**
 * Test Audit Service Fix
 * 
 * Tests that the audit service correctly handles UUID to ID conversion
 */

const { createAuditLog } = require('./services/audit.service.js');
const { query } = require('./config/database-postgresql-only.js');

async function testAuditService() {
    console.log('🧪 Testing Audit Service Fix...\n');

    try {
        // First, create a test proposal to get a UUID
        const testUuid = `test-audit-${Date.now()}`;

        console.log('📝 Creating test proposal...');
        const insertResult = await query(`
            INSERT INTO proposals (
                uuid, organization_name, organization_type, contact_person, contact_email,
                event_name, event_venue, event_start_date, event_end_date,
                event_start_time, event_end_time, event_mode, event_type,
                target_audience, sdp_credits, current_section, proposal_status,
                form_completion_percentage, user_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
            )
        `, [
            testUuid,
            'Test Organization',
            'school-based',
            'Test Contact',
            'test@example.com',
            'Test Event',
            'Test Venue',
            '2025-02-15',
            '2025-02-16',
            '09:00:00',
            '17:00:00',
            'offline',
            'academic-enhancement',
            JSON.stringify(['1st_year']),
            1,
            'orgInfo',
            'draft',
            100.00,
            1
        ]);

        console.log('✅ Test proposal created successfully');

        // Now test the audit service
        console.log('📝 Testing audit log creation...');
        const auditResult = await createAuditLog(
            testUuid,
            'proposal_created',
            1,
            'Test audit log entry',
            { test: 'data' }
        );

        if (auditResult) {
            console.log('✅ Audit log created successfully!');
            console.log('📊 Audit result:', auditResult);
        } else {
            console.log('❌ Audit log creation failed');
        }

        // Verify the audit log was created correctly
        console.log('🔍 Verifying audit log in database...');
        const auditCheck = await query(
            'SELECT * FROM audit_logs WHERE additional_info->>\'note\' = $1 ORDER BY created_at DESC LIMIT 1',
            ['Test audit log entry']
        );

        if (auditCheck.rows.length > 0) {
            const auditEntry = auditCheck.rows[0];
            console.log('✅ Audit log found in database:');
            console.log(`   - Action: ${auditEntry.action_type}`);
            console.log(`   - Table: ${auditEntry.table_name}`);
            console.log(`   - Record ID: ${auditEntry.record_id} (should be numeric)`);
            console.log(`   - User ID: ${auditEntry.user_id}`);

            // Verify record_id is numeric (PostgreSQL returns BIGINT as string in JS)
            if (!isNaN(auditEntry.record_id) && auditEntry.record_id > 0) {
                console.log('✅ Record ID is correctly numeric (as string from PostgreSQL)');
            } else {
                console.log('❌ Record ID is not valid:', auditEntry.record_id);
            }
        } else {
            console.log('❌ Audit log not found in database');
        }

        // Clean up test data
        console.log('🧹 Cleaning up test data...');
        await query('DELETE FROM proposals WHERE uuid = $1', [testUuid]);
        await query('DELETE FROM audit_logs WHERE additional_info->>\'note\' = $1', ['Test audit log entry']);
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 Audit service fix test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📋 Error details:', error);
        process.exit(1);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testAuditService().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testAuditService };
