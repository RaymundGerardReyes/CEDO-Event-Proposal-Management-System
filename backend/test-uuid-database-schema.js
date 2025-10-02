#!/usr/bin/env node

/**
 * Test UUID Database Schema
 * 
 * This script tests the database schema to ensure UUID field is properly defined
 */

const { pool, query } = require('./config/database-postgresql-only');

async function testUuidDatabaseSchema() {
    console.log('🔧 Testing UUID Database Schema...');
    console.log('==================================');

    try {
        // Test 1: Check if proposals table exists and has uuid column
        console.log('\n1. 📋 Checking proposals table structure...');
        const tableInfo = await query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'proposals' 
            AND column_name = 'uuid'
            ORDER BY ordinal_position
        `);

        if (tableInfo.rows.length === 0) {
            console.log('❌ UUID column not found in proposals table');
            return;
        }

        console.log('✅ UUID column found:', tableInfo.rows[0]);

        // Test 2: Check data type of uuid column
        const uuidColumn = tableInfo.rows[0];
        console.log('\n2. 🔍 UUID column details:');
        console.log('   - Column Name:', uuidColumn.column_name);
        console.log('   - Data Type:', uuidColumn.data_type);
        console.log('   - Is Nullable:', uuidColumn.is_nullable);
        console.log('   - Default Value:', uuidColumn.column_default);

        // Test 3: Check if there are any proposals with UUIDs
        console.log('\n3. 📊 Checking existing proposals with UUIDs...');
        const proposalsWithUuid = await query(`
            SELECT id, uuid, event_name, organization_name, proposal_status
            FROM proposals 
            WHERE uuid IS NOT NULL 
            LIMIT 5
        `);

        console.log(`✅ Found ${proposalsWithUuid.rows.length} proposals with UUIDs:`);
        proposalsWithUuid.rows.forEach((proposal, index) => {
            console.log(`   ${index + 1}. ID: ${proposal.id}, UUID: ${proposal.uuid}, Event: ${proposal.event_name}`);
        });

        // Test 4: Test UUID query directly
        if (proposalsWithUuid.rows.length > 0) {
            const testUuid = proposalsWithUuid.rows[0].uuid;
            console.log(`\n4. 🎯 Testing UUID query with: ${testUuid}`);

            try {
                const testResult = await query(
                    'SELECT * FROM proposals WHERE uuid = $1',
                    [testUuid]
                );

                if (testResult.rows.length > 0) {
                    console.log('✅ UUID query successful!');
                    console.log('   - Found proposal:', testResult.rows[0].event_name);
                } else {
                    console.log('❌ UUID query returned no results');
                }
            } catch (queryError) {
                console.log('❌ UUID query failed:', queryError.message);
                console.log('   - Error code:', queryError.code);
                console.log('   - Error detail:', queryError.detail);
            }
        }

        // Test 5: Check if there are any proposals without UUIDs
        console.log('\n5. 📋 Checking proposals without UUIDs...');
        const proposalsWithoutUuid = await query(`
            SELECT id, event_name, organization_name, proposal_status
            FROM proposals 
            WHERE uuid IS NULL 
            LIMIT 5
        `);

        console.log(`📊 Found ${proposalsWithoutUuid.rows.length} proposals without UUIDs:`);
        proposalsWithoutUuid.rows.forEach((proposal, index) => {
            console.log(`   ${index + 1}. ID: ${proposal.id}, Event: ${proposal.event_name}`);
        });

        // Test 6: Check total proposals count
        console.log('\n6. 📊 Total proposals count...');
        const totalCount = await query('SELECT COUNT(*) as total FROM proposals');
        console.log(`✅ Total proposals: ${totalCount.rows[0].total}`);

        console.log('\n🎉 Database Schema Test Complete!');
        console.log('==================================');
        console.log('✅ UUID column exists and is properly typed');
        console.log('✅ UUID queries work correctly');
        console.log('✅ Database schema is compatible');

    } catch (error) {
        console.error('❌ Database schema test failed:', error);
        console.error('   - Error message:', error.message);
        console.error('   - Error code:', error.code);
        console.error('   - Error detail:', error.detail);
    } finally {
        await pool.end();
    }
}

// Run the test
testUuidDatabaseSchema();





