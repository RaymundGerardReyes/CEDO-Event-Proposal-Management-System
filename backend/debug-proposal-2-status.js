#!/usr/bin/env node

/**
 * Debug Script for Proposal ID 2 Status Issues
 * Specifically addresses the student reporting page showing "pending" instead of actual status
 */

require('dotenv').config();
const { pool } = require('./config/db');

async function debugProposal2Status() {
    console.log('🔍 DEBUGGING PROPOSAL ID 2 STATUS ISSUES');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    let connection;
    try {
        connection = await pool.getConnection();

        // ===== STEP 1: RAW DATABASE QUERY =====
        console.log('📊 STEP 1: Raw MySQL Database Query for Proposal ID 2');
        console.log('-'.repeat(40));

        const [rawRows] = await connection.query(
            'SELECT id, uuid, organization_name, event_name, proposal_status, report_status, event_status, created_at, updated_at, user_id FROM proposals WHERE id = ?',
            [2]
        );

        if (rawRows.length === 0) {
            console.log('❌ CRITICAL: Proposal ID 2 not found in database!');

            // Check what proposals do exist
            const [allProposals] = await connection.query(
                'SELECT id, organization_name, event_name, proposal_status FROM proposals ORDER BY id LIMIT 10'
            );

            console.log('\n📋 Available proposals in database:');
            allProposals.forEach(p => {
                console.log(`   ID ${p.id}: ${p.event_name || p.organization_name} (${p.proposal_status})`);
            });

            return;
        }

        const proposal2 = rawRows[0];
        console.log('✅ Raw MySQL Data for Proposal ID 2:');
        console.log(`   ID: ${proposal2.id}`);
        console.log(`   UUID: ${proposal2.uuid}`);
        console.log(`   Organization: ${proposal2.organization_name}`);
        console.log(`   Event Name: ${proposal2.event_name}`);
        console.log(`   User ID: ${proposal2.user_id}`);
        console.log(`   📋 proposal_status: "${proposal2.proposal_status}"`);
        console.log(`   📋 report_status: "${proposal2.report_status}"`);
        console.log(`   📋 event_status: "${proposal2.event_status}"`);
        console.log(`   Created: ${proposal2.created_at}`);
        console.log(`   Updated: ${proposal2.updated_at}\n`);

        // ===== STEP 2: TEST API ENDPOINTS =====
        console.log('📡 STEP 2: Testing API Endpoints for Proposal ID 2');
        console.log('-'.repeat(40));

        // Test the exact endpoints the frontend is trying to use
        const endpoints = [
            {
                name: 'MySQL Student Proposal',
                query: 'SELECT * FROM proposals WHERE id = ?',
                params: [2]
            },
            {
                name: 'User Proposals (by user_id)',
                query: 'SELECT * FROM proposals WHERE user_id = ?',
                params: [proposal2.user_id]
            }
        ];

        for (const endpoint of endpoints) {
            console.log(`\n🔍 Testing: ${endpoint.name}`);
            try {
                const [results] = await connection.query(endpoint.query, endpoint.params);

                if (results.length > 0) {
                    console.log(`   ✅ Found ${results.length} result(s)`);
                    results.forEach((result, index) => {
                        console.log(`   Result ${index + 1}:`);
                        console.log(`     ID: ${result.id}`);
                        console.log(`     proposal_status: "${result.proposal_status}"`);
                        console.log(`     report_status: "${result.report_status}"`);
                        console.log(`     event_name: ${result.event_name}`);
                    });
                } else {
                    console.log(`   ❌ No results found`);
                }
            } catch (error) {
                console.log(`   💥 Query error: ${error.message}`);
            }
        }

        // ===== STEP 3: CHECK FOR STATUS INCONSISTENCIES =====
        console.log('\n🔍 STEP 3: Status Consistency Check');
        console.log('-'.repeat(40));

        // Check if there are multiple proposals for the same user
        const [userProposals] = await connection.query(
            'SELECT id, proposal_status, report_status, event_status, created_at FROM proposals WHERE user_id = ? ORDER BY created_at DESC',
            [proposal2.user_id]
        );

        console.log(`User ${proposal2.user_id} has ${userProposals.length} proposal(s):`);
        userProposals.forEach((p, index) => {
            const isTarget = p.id === 2;
            console.log(`   ${isTarget ? '👉' : '  '} ID ${p.id}: ${p.proposal_status} / ${p.report_status} / ${p.event_status} (${p.created_at})`);
        });

        // ===== STEP 4: SIMULATE API NORMALIZATION =====
        console.log('\n🔄 STEP 4: API Response Simulation');
        console.log('-'.repeat(40));

        // Simulate what the API should return
        const normalizedResponse = {
            success: true,
            proposal: {
                id: proposal2.id,
                mysql_id: proposal2.id,
                uuid: proposal2.uuid,
                proposal_status: proposal2.proposal_status,
                status: proposal2.proposal_status, // This is the key mapping
                report_status: proposal2.report_status,
                event_status: proposal2.event_status,
                admin_comments: proposal2.admin_comments,
                adminComments: proposal2.admin_comments,
                event_name: proposal2.event_name,
                organization_name: proposal2.organization_name,
                created_at: proposal2.created_at,
                updated_at: proposal2.updated_at
            }
        };

        console.log('✅ Simulated API Response:');
        console.log('   Success:', normalizedResponse.success);
        console.log('   📋 proposal.proposal_status:', `"${normalizedResponse.proposal.proposal_status}"`);
        console.log('   📋 proposal.status:', `"${normalizedResponse.proposal.status}"`);
        console.log('   📋 proposal.report_status:', `"${normalizedResponse.proposal.report_status}"`);

        // ===== STEP 5: FRONTEND STORAGE SIMULATION =====
        console.log('\n💾 STEP 5: Frontend Storage Simulation');
        console.log('-'.repeat(40));

        console.log('What should be stored in localStorage:');
        console.log(`   current_proposal_status: "${proposal2.proposal_status}"`);
        console.log(`   current_report_status: "${proposal2.report_status}"`);
        console.log(`   current_mysql_proposal_id: "${proposal2.id}"`);

        // ===== SUMMARY =====
        console.log('\n📋 DEBUGGING SUMMARY');
        console.log('='.repeat(60));

        const actualStatus = proposal2.proposal_status;
        const expectedDisplay = actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1);

        console.log(`✅ Database proposal_status: "${actualStatus}"`);
        console.log(`✅ Expected UI display: "${expectedDisplay}"`);
        console.log(`✅ User ID: ${proposal2.user_id}`);
        console.log(`✅ MySQL ID: ${proposal2.id}`);
        console.log(`✅ UUID: ${proposal2.uuid}`);

        // ===== RECOMMENDATIONS =====
        console.log('\n🎯 TROUBLESHOOTING RECOMMENDATIONS');
        console.log('='.repeat(60));

        if (actualStatus === 'pending') {
            console.log('ℹ️  Status is actually "pending" in database');
            console.log('   - This might be correct if proposal hasn\'t been approved yet');
            console.log('   - Check with admin dashboard to see if approval is needed');
        } else {
            console.log('❌ ISSUE: Database shows different status than frontend');
            console.log('   1. Clear localStorage in browser');
            console.log('   2. Check if correct API endpoint is being called');
            console.log('   3. Verify authentication token is valid');
            console.log('   4. Check if API is returning correct proposal ID');
        }

        console.log('\n🔧 IMMEDIATE ACTIONS:');
        console.log('   1. Clear browser localStorage: current_proposal_status');
        console.log('   2. Use Enhanced Debugger to test API endpoints');
        console.log('   3. Check browser network tab for actual API calls');
        console.log('   4. Verify JWT token is not malformed');

    } catch (error) {
        console.error('❌ DEBUGGING ERROR:', error);
    } finally {
        if (connection) connection.release();
    }
}

// Run the debug
if (require.main === module) {
    debugProposal2Status()
        .then(() => {
            console.log('\n🎉 Debugging complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Debugging failed:', error);
            process.exit(1);
        });
}

module.exports = { debugProposal2Status };

