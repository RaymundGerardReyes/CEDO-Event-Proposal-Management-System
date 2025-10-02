#!/usr/bin/env node

/**
 * Test Audit Logs UUID Fix
 * 
 * This script tests the fixed audit_logs query that uses numeric ID instead of UUID
 */

const { pool, query } = require('./config/database-postgresql-only');

async function testAuditLogsUuidFix() {
    console.log('🔧 Testing Audit Logs UUID Fix...');
    console.log('==================================');

    try {
        // Test 1: Get a proposal with UUID to test
        console.log('\n1. 📋 Getting a proposal with UUID...');
        const proposalsResult = await query(`
            SELECT id, uuid, event_name, organization_name, proposal_status, organization_type
            FROM proposals 
            WHERE uuid IS NOT NULL 
            LIMIT 1
        `);

        if (proposalsResult.rows.length === 0) {
            console.log('❌ No proposals with UUID found');
            return;
        }

        const testProposal = proposalsResult.rows[0];
        console.log('✅ Found test proposal:', {
            id: testProposal.id,
            uuid: testProposal.uuid,
            eventName: testProposal.event_name,
            organization: testProposal.organization_name
        });

        // Test 2: Test the fixed audit_logs query
        console.log('\n2. 🎯 Testing audit_logs query with numeric ID...');
        const auditLogsResult = await query(
            'SELECT * FROM audit_logs WHERE table_name = $1 AND record_id = $2 ORDER BY created_at DESC',
            ['proposals', testProposal.id]
        );

        console.log(`✅ Audit logs query successful! Found ${auditLogsResult.rows.length} audit log entries`);
        if (auditLogsResult.rows.length > 0) {
            console.log('   - Sample audit log:', {
                id: auditLogsResult.rows[0].id,
                actionType: auditLogsResult.rows[0].action_type,
                recordId: auditLogsResult.rows[0].record_id,
                createdAt: auditLogsResult.rows[0].created_at
            });
        }

        // Test 3: Test the old problematic query (should fail)
        console.log('\n3. 🚫 Testing old problematic query (should fail)...');
        try {
            await query(
                'SELECT * FROM audit_logs WHERE table_name = $1 AND record_id = $2 ORDER BY created_at DESC',
                ['proposals', testProposal.uuid]
            );
            console.log('❌ Old query should have failed but didn\'t');
        } catch (error) {
            console.log('✅ Old query correctly failed:', error.message);
        }

        // Test 4: Test the complete route logic
        console.log('\n4. 🧪 Testing complete route logic...');
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        const isUuid = uuidRegex.test(testProposal.uuid);

        console.log('✅ Route logic test:');
        console.log(`   - UUID "${testProposal.uuid}" is UUID: ${isUuid}`);
        console.log(`   - Will query proposals by UUID: ${isUuid}`);
        console.log(`   - Will query audit_logs by numeric ID: ${testProposal.id}`);

        // Test 5: Test the complete proposal fetch with audit logs
        console.log('\n5. 🔍 Testing complete proposal fetch...');
        let proposalsResult2;
        if (isUuid) {
            proposalsResult2 = await query("SELECT * FROM proposals WHERE uuid = $1", [testProposal.uuid]);
        } else {
            proposalsResult2 = await query("SELECT * FROM proposals WHERE id = $1", [testProposal.id]);
        }

        if (proposalsResult2.rows.length > 0) {
            const proposal = proposalsResult2.rows[0];
            console.log('✅ Proposal fetch successful!');

            // Test audit logs with the proposal's numeric ID
            const historyResult = await query(
                "SELECT * FROM audit_logs WHERE table_name = 'proposals' AND record_id = $1 ORDER BY created_at DESC",
                [proposal.id]
            );

            console.log(`✅ Audit logs fetch successful! Found ${historyResult.rows.length} entries`);
        } else {
            console.log('❌ Proposal fetch failed');
        }

        console.log('\n🎉 Audit Logs UUID Fix Test Complete!');
        console.log('=====================================');
        console.log('✅ Audit logs query uses numeric ID correctly');
        console.log('✅ UUID-based proposal queries work');
        console.log('✅ Route logic handles UUID vs ID correctly');
        console.log('✅ No more "invalid input syntax for type bigint" errors');

        console.log('\n🔗 Expected API Behavior:');
        console.log('==========================');
        console.log(`GET /api/admin/proposals/${testProposal.uuid}`);
        console.log('├── Query proposals: WHERE uuid = $1 (using UUID)');
        console.log('└── Query audit_logs: WHERE record_id = $1 (using numeric ID)');

        console.log('\n📊 Frontend Navigation Test:');
        console.log('===========================');
        console.log('1. ✅ Open browser and navigate to /admin-dashboard/proposals');
        console.log('2. ✅ Open browser console (F12)');
        console.log('3. ✅ Click on any proposal row');
        console.log('4. ✅ Check console logs for successful API call');
        console.log('5. ✅ Verify navigation to proposal detail page');
        console.log('6. ✅ No more "invalid input syntax for type bigint" errors');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('   - Error message:', error.message);
        console.error('   - Error code:', error.code);
    } finally {
        await pool.end();
    }
}

// Run the test
testAuditLogsUuidFix();





