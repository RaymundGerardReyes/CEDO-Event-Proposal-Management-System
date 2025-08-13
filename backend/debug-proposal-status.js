#!/usr/bin/env node

/**
 * Comprehensive Proposal Status Debugging Script
 * Traces proposal_status from MySQL to API response for proposal ID 4
 */

require('dotenv').config();
const { pool } = require('./config/db');
const { cache, CacheKeys } = require('./config/redis');

async function debugProposalStatus(proposalId = 4) {
    console.log('🔍 DEBUGGING PROPOSAL STATUS FLOW');
    console.log('='.repeat(50));
    console.log(`Target Proposal ID: ${proposalId}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    let connection;
    try {
        // ===== STEP 1: RAW DATABASE QUERY =====
        console.log('📊 STEP 1: Raw MySQL Database Query');
        console.log('-'.repeat(30));

        connection = await pool.getConnection();
        const [rawRows] = await connection.query(
            'SELECT id, uuid, organization_name, proposal_status, created_at, updated_at FROM proposals WHERE id = ?',
            [proposalId]
        );

        if (rawRows.length === 0) {
            console.log('❌ CRITICAL: Proposal not found in database!');
            return;
        }

        const rawProposal = rawRows[0];
        console.log('✅ Raw MySQL Data:');
        console.log(`   ID: ${rawProposal.id}`);
        console.log(`   UUID: ${rawProposal.uuid}`);
        console.log(`   Organization: ${rawProposal.organization_name}`);
        console.log(`   📋 proposal_status: "${rawProposal.proposal_status}"`);
        console.log(`   Created: ${rawProposal.created_at}`);
        console.log(`   Updated: ${rawProposal.updated_at}\n`);

        // ===== STEP 2: API ENDPOINT SIMULATION =====
        console.log('📡 STEP 2: API Endpoint Query Simulation');
        console.log('-'.repeat(30));

        // Simulate the exact query from admin.routes.js
        const [apiRows] = await connection.query(
            `SELECT id, organization_name, organization_type, contact_name, contact_email, contact_phone,
                    event_name, event_venue, event_mode, event_start_date, event_end_date, 
                    event_start_time, event_end_time, school_event_type, community_event_type,
                    proposal_status, created_at, updated_at, submitted_at
             FROM proposals WHERE id = ?`,
            [proposalId]
        );

        if (apiRows.length === 0) {
            console.log('❌ CRITICAL: Proposal not found in API query!');
            return;
        }

        const apiProposal = apiRows[0];
        console.log('✅ API Query Result:');
        console.log(`   📋 proposal_status: "${apiProposal.proposal_status}"`);
        console.log(`   Fields included: ${Object.keys(apiProposal).length}`);
        console.log(`   Has proposal_status field: ${apiProposal.hasOwnProperty('proposal_status')}\n`);

        // ===== STEP 3: NORMALIZATION SIMULATION =====
        console.log('🔄 STEP 3: Data Normalization Simulation');
        console.log('-'.repeat(30));

        // Simulate normalizeProposalData function
        const normalizedProposal = {
            ...apiProposal,
            files: {},
            hasFiles: false,
            adminComments: null,
            // Critical mapping
            status: apiProposal.proposal_status,
            eventName: apiProposal.event_name,
            organizationName: apiProposal.organization_name,
        };

        console.log('✅ Normalized Data:');
        console.log(`   📋 Original proposal_status: "${apiProposal.proposal_status}"`);
        console.log(`   📋 Mapped status: "${normalizedProposal.status}"`);
        console.log(`   Mapping successful: ${apiProposal.proposal_status === normalizedProposal.status}\n`);

        // ===== STEP 4: FRONTEND TRANSFORMATION SIMULATION =====
        console.log('🎨 STEP 4: Frontend Transformation Simulation');
        console.log('-'.repeat(30));

        // Simulate transformProposal function
        const frontendProposal = {
            title: normalizedProposal.event_name || 'Untitled Event',
            organization: normalizedProposal.organization_name || 'Unknown Organization',
            status: normalizedProposal.proposal_status || 'pending', // Critical line!
            submittedOn: normalizedProposal.created_at
                ? new Date(normalizedProposal.created_at).toISOString().split('T')[0]
                : 'N/A',
        };

        console.log('✅ Frontend Transformation:');
        console.log(`   📋 Input proposal_status: "${normalizedProposal.proposal_status}"`);
        console.log(`   📋 Output status: "${frontendProposal.status}"`);
        console.log(`   Fallback triggered: ${!normalizedProposal.proposal_status}`);
        console.log(`   Transform successful: ${normalizedProposal.proposal_status === frontendProposal.status}\n`);

        // ===== STEP 5: CACHE INVESTIGATION =====
        console.log('💾 STEP 5: Cache Investigation');
        console.log('-'.repeat(30));

        try {
            const cacheKey = CacheKeys.proposal(proposalId);
            const cachedData = await cache.get(cacheKey);

            console.log(`   Cache key: ${cacheKey}`);
            console.log(`   Cached data exists: ${!!cachedData}`);

            if (cachedData) {
                console.log(`   📋 Cached status: "${cachedData.status || cachedData.proposal_status || 'undefined'}"`);
                console.log(`   Cache age: ${cachedData.cached_at ? new Date() - new Date(cachedData.cached_at) : 'unknown'} ms`);
            }
        } catch (cacheError) {
            console.log(`   Cache error: ${cacheError.message}`);
        }
        console.log();

        // ===== STEP 6: COMPLETE API RESPONSE SIMULATION =====
        console.log('📦 STEP 6: Complete API Response Simulation');
        console.log('-'.repeat(30));

        const apiResponse = {
            success: true,
            proposals: [normalizedProposal],
            pagination: {
                page: 1,
                pages: 1,
                total: 1,
                limit: 10
            }
        };

        console.log('✅ API Response Structure:');
        console.log(`   Success: ${apiResponse.success}`);
        console.log(`   Proposals count: ${apiResponse.proposals.length}`);
        console.log(`   📋 First proposal status: "${apiResponse.proposals[0].status}"`);
        console.log();

        // ===== SUMMARY =====
        console.log('📋 DEBUGGING SUMMARY');
        console.log('='.repeat(50));
        console.log(`✅ MySQL proposal_status: "${rawProposal.proposal_status}"`);
        console.log(`✅ API query proposal_status: "${apiProposal.proposal_status}"`);
        console.log(`✅ Normalized status: "${normalizedProposal.status}"`);
        console.log(`✅ Frontend status: "${frontendProposal.status}"`);
        console.log();

        // ===== RECOMMENDATIONS =====
        console.log('🎯 RECOMMENDATIONS');
        console.log('='.repeat(50));

        if (rawProposal.proposal_status === 'approved' && frontendProposal.status !== 'approved') {
            console.log('❌ STATUS MISMATCH DETECTED!');
            console.log();
            console.log('Potential fixes:');
            console.log('1. Check if frontend is using correct API endpoint');
            console.log('2. Verify transformProposal function is receiving correct data');
            console.log('3. Clear any cached data');
            console.log('4. Add logging to trace exact data flow');
        } else {
            console.log('✅ Status flow appears correct');
        }

    } catch (error) {
        console.error('❌ DEBUGGING ERROR:', error);
    } finally {
        if (connection) connection.release();
    }
}

// Run the debug
if (require.main === module) {
    const proposalId = process.argv[2] || 4;
    debugProposalStatus(proposalId)
        .then(() => {
            console.log('\n🎉 Debugging complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Debugging failed:', error);
            process.exit(1);
        });
}

module.exports = { debugProposalStatus };

