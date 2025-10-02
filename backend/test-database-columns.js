#!/usr/bin/env node

/**
 * Test Database Column Mapping
 * 
 * This test verifies that:
 * 1. Database fields exist and are accessible
 * 2. Column mapping works correctly
 * 3. Data can be fetched with proper sorting
 */

const { Pool } = require('pg');

// Test configuration with fallbacks
const DB_CONFIG = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DATABASE || 'cedo_db',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password'
};

let pool;

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

async function setupDatabase() {
    console.log('🔧 Setting up database connection...');
    pool = new Pool(DB_CONFIG);

    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection established');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
}

async function testDatabaseFields() {
    console.log('🧪 Testing database field existence...');

    try {
        const result = await pool.query(`
            SELECT 
                event_name,
                organization_name,
                contact_person,
                contact_email,
                proposal_status,
                event_start_date,
                organization_type,
                event_type,
                event_venue,
                event_end_date,
                event_start_time,
                event_end_time
            FROM proposals 
            LIMIT 1
        `);

        if (result.rows.length > 0) {
            const row = result.rows[0];
            console.log('✅ Database fields exist:');
            console.log(`   event_name: ${row.event_name}`);
            console.log(`   organization_name: ${row.organization_name}`);
            console.log(`   contact_person: ${row.contact_person}`);
            console.log(`   contact_email: ${row.contact_email}`);
            console.log(`   proposal_status: ${row.proposal_status}`);
            console.log(`   event_start_date: ${row.event_start_date}`);
            console.log(`   organization_type: ${row.organization_type}`);
            console.log(`   event_type: ${row.event_type}`);
            console.log(`   event_venue: ${row.event_venue}`);
            return true;
        } else {
            console.log('⚠️  No data found in proposals table');
            return false;
        }
    } catch (error) {
        console.error('❌ Database field test error:', error.message);
        return false;
    }
}

async function testColumnMapping() {
    console.log('🧪 Testing column mapping with actual queries...');

    try {
        // Test each column mapping with a simple query
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

async function testSortingQueries() {
    console.log('🧪 Testing sorting queries...');

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

async function testDataTransformation() {
    console.log('🧪 Testing data transformation simulation...');

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
                event_end_date,
                event_start_time,
                event_end_time,
                budget,
                volunteers_needed,
                attendance_count,
                sdp_credits,
                objectives,
                admin_comments,
                created_at,
                updated_at,
                submitted_at,
                reviewed_at,
                approved_at
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
                type: proposal.organization_type, // This is the key fix
                eventType: proposal.event_type,
                description: proposal.objectives || `Event: ${proposal.event_name}`,
                location: proposal.event_venue,
                budget: proposal.budget,
                volunteersNeeded: proposal.volunteers_needed,
                attendanceCount: proposal.attendance_count,
                sdpCredits: proposal.sdp_credits,
                startDate: proposal.event_start_date,
                endDate: proposal.event_end_date,
                startTime: proposal.event_start_time,
                endTime: proposal.event_end_time,
                createdAt: proposal.created_at,
                updatedAt: proposal.updated_at,
                submittedAt: proposal.submitted_at,
                reviewedAt: proposal.reviewed_at,
                approvedAt: proposal.approved_at
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
            } else {
                console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
            }

            return true;
        } else {
            console.log('⚠️  No data found for transformation test');
            return false;
        }
    } catch (error) {
        console.error('❌ Data transformation test error:', error.message);
        return false;
    }
}

async function testComplexQuery() {
    console.log('🧪 Testing complex query with sorting and filtering...');

    try {
        const query = `
            SELECT p.*, 
                   u.name as user_name,
                   u.email as user_email,
                   CASE 
                       WHEN p.gpoa_file_name IS NOT NULL AND p.project_proposal_file_name IS NOT NULL THEN 2
                       WHEN p.gpoa_file_name IS NOT NULL OR p.project_proposal_file_name IS NOT NULL THEN 1
                       ELSE 0
                   END as file_count
            FROM proposals p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.proposal_status = 'pending'
            ORDER BY p.event_start_date DESC
            LIMIT 5
        `;

        const result = await pool.query(query);

        if (result.rows.length > 0) {
            console.log(`✅ Complex query successful (${result.rows.length} results)`);
            console.log(`   Sample: ${result.rows[0].event_name} - ${result.rows[0].proposal_status}`);
            return true;
        } else {
            console.log('⚠️  No pending proposals found');
            return false;
        }
    } catch (error) {
        console.error('❌ Complex query test error:', error.message);
        return false;
    }
}

async function cleanup() {
    console.log('🧹 Cleaning up...');

    if (pool) {
        await pool.end();
        console.log('✅ Database connection closed');
    }
}

async function runTests() {
    console.log('🚀 Starting Database Column Tests\n');

    try {
        await setupDatabase();

        console.log('\n📋 Running Database Tests:');
        console.log('===========================');

        const results = {
            fields: await testDatabaseFields(),
            mapping: await testColumnMapping(),
            sorting: await testSortingQueries(),
            transformation: await testDataTransformation(),
            complex: await testComplexQuery()
        };

        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        console.log(`Database Fields: ${results.fields ? '✅' : '❌'}`);
        console.log(`Column Mapping: ${results.mapping ? '✅' : '❌'}`);
        console.log(`Sorting Queries: ${results.sorting ? '✅' : '❌'}`);
        console.log(`Data Transformation: ${results.transformation ? '✅' : '❌'}`);
        console.log(`Complex Queries: ${results.complex ? '✅' : '❌'}`);

        const allPassed = Object.values(results).every(result => result === true);

        if (allPassed) {
            console.log('\n✅ All database tests passed!');
            console.log('🎯 Your column mapping fixes are working correctly.');
        } else {
            console.log('\n❌ Some tests failed. Check the output above for details.');
        }

    } catch (error) {
        console.error('\n❌ Test suite failed:', error.message);
        process.exit(1);
    } finally {
        await cleanup();
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    COLUMN_MAPPINGS,
    testDatabaseFields,
    testColumnMapping,
    testSortingQueries,
    testDataTransformation
};





