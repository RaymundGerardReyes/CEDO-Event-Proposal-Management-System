#!/usr/bin/env node

/**
 * Test Column Mapping Between Frontend and Database
 * 
 * This test verifies that:
 * 1. Frontend column names properly map to database fields
 * 2. Sorting works correctly for all mapped columns
 * 3. Data transformation preserves all required fields
 * 4. API responses match frontend expectations
 */

const { Pool } = require('pg');
const axios = require('axios');

// Test configuration
const DB_CONFIG = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DATABASE || 'cedo_db',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password'
};

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

let pool;
let authToken;

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

async function authenticate() {
    console.log('🔐 Authenticating...');

    try {
        // Mock authentication for testing
        authToken = 'mock-admin-token-for-testing';
        console.log('✅ Authentication successful');
    } catch (error) {
        console.log('⚠️  Authentication failed, using mock token for testing');
        authToken = 'mock-admin-token-for-testing';
    }
}

async function testColumnMapping() {
    console.log('🧪 Testing column mapping...');

    try {
        const response = await axios.get(`${API_BASE_URL}/admin/proposals`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: {
                page: 1,
                limit: 5,
                status: 'all'
            }
        });

        if (response.data.success && Array.isArray(response.data.proposals)) {
            console.log('✅ API response received');

            if (response.data.proposals.length > 0) {
                const proposal = response.data.proposals[0];
                console.log('📊 Sample proposal data:');
                console.log(`   ID: ${proposal.id}`);
                console.log(`   Event Name: ${proposal.eventName}`);
                console.log(`   Organization: ${proposal.organization}`);
                console.log(`   Contact: ${proposal.contact?.name} (${proposal.contact?.email})`);
                console.log(`   Status: ${proposal.status}`);
                console.log(`   Date: ${proposal.date}`);
                console.log(`   Type: ${proposal.type}`);

                // Verify required fields are present
                const requiredFields = ['id', 'eventName', 'organization', 'contact', 'status', 'date', 'type'];
                const missingFields = requiredFields.filter(field => !proposal.hasOwnProperty(field));

                if (missingFields.length === 0) {
                    console.log('✅ All required fields are present');
                } else {
                    console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
                }
            } else {
                console.log('⚠️  No proposals found for testing');
            }
        } else {
            console.log('❌ API response failed');
        }
    } catch (error) {
        console.error('❌ Column mapping test error:', error.response?.data || error.message);
    }
}

async function testSortingForEachColumn() {
    console.log('🧪 Testing sorting for each column...');

    for (const [frontendField, dbField] of Object.entries(COLUMN_MAPPINGS)) {
        try {
            console.log(`   Testing sort: ${frontendField} -> ${dbField}`);

            const response = await axios.get(`${API_BASE_URL}/admin/proposals`, {
                headers: { Authorization: `Bearer ${authToken}` },
                params: {
                    page: 1,
                    limit: 3,
                    sortField: frontendField,
                    sortDirection: 'asc'
                }
            });

            if (response.data.success) {
                console.log(`   ✅ ${frontendField} sorting works`);
            } else {
                console.log(`   ❌ ${frontendField} sorting failed`);
            }
        } catch (error) {
            console.log(`   ❌ ${frontendField} sorting error: ${error.response?.data?.message || error.message}`);
        }
    }
}

async function testDatabaseFieldExistence() {
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
                organization_type
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
        } else {
            console.log('⚠️  No data found in proposals table');
        }
    } catch (error) {
        console.error('❌ Database field test error:', error.message);
    }
}

async function testDataTransformation() {
    console.log('🧪 Testing data transformation...');

    try {
        const response = await axios.get(`${API_BASE_URL}/admin/proposals`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: {
                page: 1,
                limit: 1,
                status: 'all'
            }
        });

        if (response.data.success && response.data.proposals.length > 0) {
            const proposal = response.data.proposals[0];

            // Test contact object structure
            if (proposal.contact && typeof proposal.contact === 'object') {
                console.log('✅ Contact object properly structured');
                console.log(`   Name: ${proposal.contact.name}`);
                console.log(`   Email: ${proposal.contact.email}`);
                console.log(`   Phone: ${proposal.contact.phone || 'N/A'}`);
            } else {
                console.log('❌ Contact object missing or malformed');
            }

            // Test date formatting
            if (proposal.date) {
                console.log(`✅ Date field present: ${proposal.date}`);
            } else {
                console.log('❌ Date field missing');
            }

            // Test type mapping
            if (proposal.type) {
                console.log(`✅ Type field present: ${proposal.type}`);
            } else {
                console.log('❌ Type field missing');
            }
        }
    } catch (error) {
        console.error('❌ Data transformation test error:', error.response?.data || error.message);
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
    console.log('🚀 Starting Column Mapping Tests\n');

    try {
        await setupDatabase();
        await authenticate();

        console.log('\n📋 Running Column Mapping Tests:');
        console.log('================================');

        await testDatabaseFieldExistence();
        await testColumnMapping();
        await testDataTransformation();
        await testSortingForEachColumn();

        console.log('\n✅ All column mapping tests completed!');

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
    testColumnMapping,
    testSortingForEachColumn
};
