#!/usr/bin/env node

/**
 * Test Database Connection and Data Fetching
 * This script tests the actual database connection and fetches real proposal data
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const DB_CONFIG = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'cedo_auth',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || ''
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

        // Check if proposals table exists
        console.log('\n📊 Checking proposals table...');
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'proposals'
            );
        `);

        if (tableCheck.rows[0].exists) {
            console.log('✅ Proposals table exists');

            // Get table structure
            console.log('\n📋 Table structure:');
            const structure = await pool.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'proposals' 
                ORDER BY ordinal_position;
            `);

            console.log('Columns:');
            structure.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
            });

            // Count total proposals
            console.log('\n📊 Proposal statistics:');
            const countResult = await pool.query('SELECT COUNT(*) as total FROM proposals');
            const totalProposals = parseInt(countResult.rows[0].total);
            console.log(`📈 Total proposals: ${totalProposals}`);

            if (totalProposals > 0) {
                // Get status breakdown
                const statusResult = await pool.query(`
                    SELECT 
                        proposal_status,
                        COUNT(*) as count
                    FROM proposals 
                    GROUP BY proposal_status 
                    ORDER BY count DESC;
                `);

                console.log('\n📊 Status breakdown:');
                statusResult.rows.forEach(row => {
                    console.log(`  - ${row.proposal_status}: ${row.count}`);
                });

                // Get sample proposals
                console.log('\n📋 Sample proposals (first 5):');
                const sampleResult = await pool.query(`
                    SELECT 
                        id,
                        uuid,
                        event_name,
                        organization_name,
                        contact_person,
                        contact_email,
                        proposal_status,
                        event_start_date,
                        event_type,
                        created_at
                    FROM proposals 
                    ORDER BY created_at DESC 
                    LIMIT 5;
                `);

                sampleResult.rows.forEach((proposal, index) => {
                    console.log(`\n  ${index + 1}. ${proposal.event_name}`);
                    console.log(`     Organization: ${proposal.organization_name}`);
                    console.log(`     Contact: ${proposal.contact_person} (${proposal.contact_email})`);
                    console.log(`     Status: ${proposal.proposal_status}`);
                    console.log(`     Event Date: ${proposal.event_start_date}`);
                    console.log(`     Type: ${proposal.event_type}`);
                    console.log(`     Created: ${proposal.created_at}`);
                });

                // Test the exact query used by the API
                console.log('\n🧪 Testing API query...');
                const apiQuery = `
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
                    ORDER BY p.submitted_at DESC
                    LIMIT 10;
                `;

                const apiResult = await pool.query(apiQuery);
                console.log(`✅ API query successful! Found ${apiResult.rows.length} proposals`);

                if (apiResult.rows.length > 0) {
                    console.log('\n📋 First result from API query:');
                    const firstProposal = apiResult.rows[0];
                    console.log(`  - ID: ${firstProposal.id}`);
                    console.log(`  - UUID: ${firstProposal.uuid}`);
                    console.log(`  - Event: ${firstProposal.event_name}`);
                    console.log(`  - Organization: ${firstProposal.organization_name}`);
                    console.log(`  - Status: ${firstProposal.proposal_status}`);
                    console.log(`  - File Count: ${firstProposal.file_count}`);
                    console.log(`  - User: ${firstProposal.user_name || 'No user'}`);
                }

            } else {
                console.log('⚠️  No proposals found in database');
                console.log('💡 You may need to create some test proposals');
            }

        } else {
            console.log('❌ Proposals table does not exist!');
            console.log('💡 You may need to run your database migration scripts');
        }

        console.log('\n✅ Database test completed successfully!');

    } catch (error) {
        console.error('\n❌ Database test failed:', error.message);
        console.error('Full error:', error);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Troubleshooting:');
            console.log('  - Make sure PostgreSQL is running');
            console.log('  - Check if the database exists');
            console.log('  - Verify connection parameters');
        } else if (error.code === '28P01') {
            console.log('\n💡 Troubleshooting:');
            console.log('  - Check username and password');
            console.log('  - Verify database credentials');
        } else if (error.code === '3D000') {
            console.log('\n💡 Troubleshooting:');
            console.log('  - Database does not exist');
            console.log('  - Create the database or check the name');
        }
    } finally {
        if (pool) {
            await pool.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the test
if (require.main === module) {
    testDatabaseConnection().catch(console.error);
}

module.exports = { testDatabaseConnection, DB_CONFIG };






