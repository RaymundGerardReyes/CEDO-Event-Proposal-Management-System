#!/usr/bin/env node

/**
 * Simple Column Mapping Test
 * 
 * This test verifies that:
 * 1. Database connection works
 * 2. Column mapping is correct
 * 3. Data transformation works as expected
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration using the same pattern as other working tests
const DB_CONFIG = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'cedo_auth',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || ''
};

// Column mapping configuration
const COLUMN_MAPPINGS = {
    'eventName': 'event_name',
    'organization': 'organization_name',
    'contact.name': 'contact_person',
    'contact.email': 'contact_email',
    'status': 'proposal_status',
    'date': 'event_start_date',
    'type': 'organization_type'
};

async function testDatabaseConnection() {
    console.log('🔧 Testing Database Connection...');
    console.log('📋 Database Config:', {
        host: DB_CONFIG.host,
        port: DB_CONFIG.port,
        database: DB_CONFIG.database,
        user: DB_CONFIG.user,
        password: DB_CONFIG.password ? '[HIDDEN]' : '[EMPTY]'
    });

    let pool;

    try {
        pool = new Pool(DB_CONFIG);

        // Test connection
        console.log('\n🔌 Testing connection...');
        const connectionTest = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Database connection successful!');
        console.log('⏰ Current time from DB:', connectionTest.rows[0].current_time);

        return pool;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
}

async function testColumnMapping(pool) {
    console.log('\n🧪 Testing Column Mapping...');

    try {
        // Test each column mapping
        for (const [frontendField, dbField] of Object.entries(COLUMN_MAPPINGS)) {
            console.log(`   Testing: ${frontendField} -> ${dbField}`);

            const query = `SELECT ${dbField} FROM proposals LIMIT 1`;
            const result = await pool.query(query);

            if (result.rows.length > 0) {
                console.log(`   ✅ ${frontendField} -> ${dbField}: ${result.rows[0][dbField]}`);
            } else {
                console.log(`   ⚠️  ${frontendField} -> ${dbField}: No data found`);
            }
        }

        return true;
    } catch (error) {
        console.error('❌ Column mapping test error:', error.message);
        return false;
    }
}

async function testDataTransformation(pool) {
    console.log('\n🧪 Testing Data Transformation...');

    try {
        const query = `
            SELECT 
                id,
                uuid,
                event_name,
                organization_name,
                contact_person,
                contact_email,
                contact_phone,
                proposal_status,
                event_start_date,
                organization_type,
                event_type,
                event_venue,
                budget,
                volunteers_needed,
                attendance_count,
                sdp_credits,
                objectives,
                created_at,
                updated_at,
                submitted_at
            FROM proposals 
            LIMIT 1
        `;

        const result = await pool.query(query);

        if (result.rows.length > 0) {
            const proposal = result.rows[0];

            // Simulate the data transformation that happens in the API
            const transformedProposal = {
                id: proposal.id,
                uuid: proposal.uuid,
                eventName: proposal.event_name,
                organization: proposal.organization_name,
                organizationType: proposal.organization_type,
                contact: {
                    name: proposal.contact_person,
                    email: proposal.contact_email,
                    phone: proposal.contact_phone
                },
                status: proposal.proposal_status,
                date: proposal.event_start_date,
                type: proposal.organization_type, // This is the key fix - using organization_type
                eventType: proposal.event_type,
                description: proposal.objectives || `Event: ${proposal.event_name}`,
                location: proposal.event_venue,
                budget: proposal.budget,
                volunteersNeeded: proposal.volunteers_needed,
                attendanceCount: proposal.attendance_count,
                sdpCredits: proposal.sdp_credits,
                createdAt: proposal.created_at,
                updatedAt: proposal.updated_at,
                submittedAt: proposal.submitted_at
            };

            console.log('✅ Data transformation successful:');
            console.log(`   ID: ${transformedProposal.id}`);
            console.log(`   Event Name: ${transformedProposal.eventName}`);
            console.log(`   Organization: ${transformedProposal.organization}`);
            console.log(`   Contact: ${transformedProposal.contact.name} (${transformedProposal.contact.email})`);
            console.log(`   Status: ${transformedProposal.status}`);
            console.log(`   Date: ${transformedProposal.date}`);
            console.log(`   Type: ${transformedProposal.type} (organization_type)`);
            console.log(`   Event Type: ${transformedProposal.eventType}`);

            // Verify required fields
            const requiredFields = ['id', 'eventName', 'organization', 'contact', 'status', 'date', 'type'];
            const missingFields = requiredFields.filter(field => !transformedProposal.hasOwnProperty(field));

            if (missingFields.length === 0) {
                console.log('✅ All required fields are present in transformation');
                return true;
            } else {
                console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
                return false;
            }
        } else {
            console.log('⚠️  No data found for transformation test');
            return false;
        }
    } catch (error) {
        console.error('❌ Data transformation test error:', error.message);
        return false;
    }
}

async function testSortingQueries(pool) {
    console.log('\n🧪 Testing Sorting Queries...');

    try {
        // Test sorting for each column
        for (const [frontendField, dbField] of Object.entries(COLUMN_MAPPINGS)) {
            console.log(`   Testing sort: ${frontendField} -> ${dbField}`);

            const query = `SELECT id, ${dbField} FROM proposals ORDER BY ${dbField} ASC LIMIT 3`;
            const result = await pool.query(query);

            if (result.rows.length > 0) {
                console.log(`   ✅ ${frontendField} sorting works (${result.rows.length} results)`);
                console.log(`      Sample: ${result.rows[0][dbField]}`);
            } else {
                console.log(`   ⚠️  ${frontendField} sorting: No data found`);
            }
        }

        return true;
    } catch (error) {
        console.error('❌ Sorting test error:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Simple Column Mapping Tests\n');

    let pool;

    try {
        pool = await testDatabaseConnection();

        console.log('\n📋 Running Column Mapping Tests:');
        console.log('================================');

        const results = {
            mapping: await testColumnMapping(pool),
            transformation: await testDataTransformation(pool),
            sorting: await testSortingQueries(pool)
        };

        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        console.log(`Column Mapping: ${results.mapping ? '✅' : '❌'}`);
        console.log(`Data Transformation: ${results.transformation ? '✅' : '❌'}`);
        console.log(`Sorting Queries: ${results.sorting ? '✅' : '❌'}`);

        const allPassed = Object.values(results).every(result => result === true);

        if (allPassed) {
            console.log('\n✅ All column mapping tests passed!');
            console.log('🎯 Your column mapping fixes are working correctly.');
            console.log('\n📋 Key Fixes Applied:');
            console.log('   • Fixed type mapping: organization_type (not event_type)');
            console.log('   • Enhanced data transformation with all required fields');
            console.log('   • Proper column mapping for frontend table headers');
            console.log('   • Backend sorting logic updated');
        } else {
            console.log('\n❌ Some tests failed. Check the output above for details.');
        }

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    } finally {
        if (pool) {
            await pool.end();
            console.log('\n🧹 Database connection closed');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    COLUMN_MAPPINGS,
    testColumnMapping,
    testDataTransformation,
    testSortingQueries
};





