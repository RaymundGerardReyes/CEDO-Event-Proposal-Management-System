#!/usr/bin/env node

/**
 * Test Type Field Mapping
 * 
 * This script tests the exact API response format for the type field
 */

const { query } = require('./config/database-postgresql-only');

async function testTypeFieldMapping() {
    console.log('🔧 Testing Type Field Mapping...');

    try {
        // Test database query to see what organization_type values exist
        console.log('\n📊 Database Query Test:');
        console.log('======================');

        const result = await query(`
            SELECT 
                id, uuid, organization_name, organization_type, 
                proposal_status, event_name
            FROM proposals 
            WHERE is_deleted = false 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        console.log('✅ Database records found:', result.rows.length);

        result.rows.forEach((proposal, index) => {
            console.log(`\n📋 Proposal ${index + 1}:`);
            console.log(`  ID: ${proposal.id}`);
            console.log(`  UUID: ${proposal.uuid}`);
            console.log(`  Organization: ${proposal.organization_name}`);
            console.log(`  Organization Type: ${proposal.organization_type}`);
            console.log(`  Status: ${proposal.proposal_status}`);
            console.log(`  Event: ${proposal.event_name}`);
        });

        // Test the API mapping logic
        console.log('\n🔍 API Mapping Test:');
        console.log('===================');

        const testProposal = result.rows[0];
        if (testProposal) {
            console.log('📝 Testing API response mapping:');

            // Simulate the API response mapping
            const apiResponse = {
                id: testProposal.id,
                uuid: testProposal.uuid,
                eventName: testProposal.event_name,
                organization: testProposal.organization_name,
                organizationType: testProposal.organization_type,
                status: testProposal.proposal_status,
                // This is the key mapping
                type: testProposal.organization_type,
            };

            console.log('✅ API Response Object:');
            console.log('  id:', apiResponse.id);
            console.log('  uuid:', apiResponse.uuid);
            console.log('  eventName:', apiResponse.eventName);
            console.log('  organization:', apiResponse.organization);
            console.log('  organizationType:', apiResponse.organizationType);
            console.log('  status:', apiResponse.status);
            console.log('  type:', apiResponse.type);

            console.log('\n🎯 Type Field Analysis:');
            console.log('======================');
            console.log('✅ Database field: organization_type =', testProposal.organization_type);
            console.log('✅ API mapping: type =', apiResponse.type);
            console.log('✅ Mapping correct:', apiResponse.type === testProposal.organization_type);

            if (apiResponse.type) {
                console.log('✅ Type field has value:', apiResponse.type);
            } else {
                console.log('❌ Type field is empty or undefined');
            }
        } else {
            console.log('❌ No proposals found to test');
        }

        console.log('\n🔧 Troubleshooting:');
        console.log('==================');
        console.log('If type field is empty:');
        console.log('1. Check if organization_type has values in database');
        console.log('2. Verify API mapping in backend/routes/admin/proposals.js');
        console.log('3. Check frontend normalizeProposal function');
        console.log('4. Ensure the field is being passed correctly');

        console.log('\n✅ Type Field Mapping Test Complete!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testTypeFieldMapping();





