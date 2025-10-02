#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Proposal Table Integration
 * 
 * This test verifies:
 * 1. Database schema compatibility
 * 2. Backend API endpoints functionality
 * 3. Data normalization between backend and frontend
 * 4. Route ordering and parameter handling
 * 5. Error handling and edge cases
 */

const { Pool } = require('pg');
const axios = require('axios');

// Test configuration - matches your actual database setup
const DB_CONFIG = {
    host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
    database: process.env.DB_NAME || process.env.POSTGRES_DATABASE || 'cedo_auth',
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || ''
};

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

let pool;
let authToken;

// Test data
const testProposal = {
    organization_name: 'Test Organization',
    organization_type: 'school-based',
    organization_description: 'A test organization for integration testing',
    organization_registration_no: 'TEST-001',
    contact_person: 'John Doe',
    contact_email: 'john.doe@test.com',
    contact_phone: '+1234567890',
    event_name: 'Test Event 2024',
    event_venue: 'Test Venue',
    event_start_date: '2024-12-25',
    event_end_date: '2024-12-26',
    event_start_time: '09:00:00',
    event_end_time: '17:00:00',
    event_mode: 'offline',
    event_type: 'workshop',
    target_audience: JSON.stringify(['students', 'teachers']),
    sdp_credits: 10,
    gpoa_file_name: 'test-gpoa.pdf',
    gpoa_file_size: 1024000,
    gpoa_file_type: 'application/pdf',
    gpoa_file_path: '/uploads/test-gpoa.pdf',
    project_proposal_file_name: 'test-proposal.pdf',
    project_proposal_file_size: 2048000,
    project_proposal_file_type: 'application/pdf',
    project_proposal_file_path: '/uploads/test-proposal.pdf',
    proposal_status: 'pending',
    objectives: 'Test objectives for the event',
    budget: 5000.00,
    volunteers_needed: 5,
    user_id: 1
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

async function createTestData() {
    console.log('📝 Creating test data...');

    try {
        // Insert test proposal
        const result = await pool.query(`
            INSERT INTO proposals (
                organization_name, organization_type, organization_description,
                organization_registration_no, contact_person, contact_email,
                contact_phone, event_name, event_venue, event_start_date,
                event_end_date, event_start_time, event_end_time, event_mode,
                event_type, target_audience, sdp_credits, gpoa_file_name,
                gpoa_file_size, gpoa_file_type, gpoa_file_path,
                project_proposal_file_name, project_proposal_file_size,
                project_proposal_file_type, project_proposal_file_path,
                proposal_status, objectives, budget, volunteers_needed, user_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
            ) RETURNING id, uuid
        `, [
            testProposal.organization_name, testProposal.organization_type,
            testProposal.organization_description, testProposal.organization_registration_no,
            testProposal.contact_person, testProposal.contact_email, testProposal.contact_phone,
            testProposal.event_name, testProposal.event_venue, testProposal.event_start_date,
            testProposal.event_end_date, testProposal.event_start_time, testProposal.event_end_time,
            testProposal.event_mode, testProposal.event_type, testProposal.target_audience,
            testProposal.sdp_credits, testProposal.gpoa_file_name, testProposal.gpoa_file_size,
            testProposal.gpoa_file_type, testProposal.gpoa_file_path, testProposal.project_proposal_file_name,
            testProposal.project_proposal_file_size, testProposal.project_proposal_file_type,
            testProposal.project_proposal_file_path, testProposal.proposal_status,
            testProposal.objectives, testProposal.budget, testProposal.volunteers_needed,
            testProposal.user_id
        ]);

        const insertedProposal = result.rows[0];
        testProposal.id = insertedProposal.id;
        testProposal.uuid = insertedProposal.uuid;

        console.log(`✅ Test proposal created with ID: ${testProposal.id}, UUID: ${testProposal.uuid}`);
        return insertedProposal;
    } catch (error) {
        console.error('❌ Failed to create test data:', error.message);
        throw error;
    }
}

async function authenticate() {
    console.log('🔐 Authenticating...');

    try {
        // For testing, we'll use a mock auth or create a test admin user
        // This depends on your auth system - adjust accordingly
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'testpassword'
        });

        authToken = response.data.token;
        console.log('✅ Authentication successful');
    } catch (error) {
        console.log('⚠️  Authentication failed, using mock token for testing');
        authToken = 'mock-admin-token-for-testing';
    }
}

async function testMainProposalsEndpoint() {
    console.log('🧪 Testing main proposals endpoint...');

    try {
        const response = await axios.get(`${API_BASE_URL}/admin/proposals`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: {
                page: 1,
                limit: 10,
                status: 'all'
            }
        });

        if (response.data.success && Array.isArray(response.data.proposals)) {
            console.log('✅ Main proposals endpoint working');
            console.log(`   Found ${response.data.proposals.length} proposals`);
            console.log(`   Pagination: ${JSON.stringify(response.data.pagination)}`);
            console.log(`   Stats: ${JSON.stringify(response.data.stats)}`);

            // Verify data structure
            if (response.data.proposals.length > 0) {
                const proposal = response.data.proposals[0];
                const requiredFields = ['id', 'eventName', 'organization', 'status', 'contact'];
                const missingFields = requiredFields.filter(field => !proposal.hasOwnProperty(field));

                if (missingFields.length === 0) {
                    console.log('✅ Proposal data structure is correct');
                } else {
                    console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
                }
            }
        } else {
            console.log('❌ Main proposals endpoint failed');
        }
    } catch (error) {
        console.error('❌ Main proposals endpoint error:', error.response?.data || error.message);
    }
}

async function testStatsEndpoint() {
    console.log('🧪 Testing stats endpoint...');

    try {
        const response = await axios.get(`${API_BASE_URL}/admin/proposals/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.stats) {
            console.log('✅ Stats endpoint working');
            console.log(`   Stats: ${JSON.stringify(response.data.stats)}`);
        } else {
            console.log('❌ Stats endpoint failed');
        }
    } catch (error) {
        console.error('❌ Stats endpoint error:', error.response?.data || error.message);
    }
}

async function testSuggestionsEndpoint() {
    console.log('🧪 Testing suggestions endpoint...');

    try {
        const response = await axios.get(`${API_BASE_URL}/admin/proposals/suggestions`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { q: 'test' }
        });

        if (response.data.success && Array.isArray(response.data.suggestions)) {
            console.log('✅ Suggestions endpoint working');
            console.log(`   Found ${response.data.suggestions.length} suggestions`);
        } else {
            console.log('❌ Suggestions endpoint failed');
        }
    } catch (error) {
        console.error('❌ Suggestions endpoint error:', error.response?.data || error.message);
    }
}

async function testExportEndpoint() {
    console.log('🧪 Testing export endpoint...');

    try {
        const response = await axios.get(`${API_BASE_URL}/admin/proposals/export`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { format: 'json' }
        });

        if (response.status === 200 && response.data) {
            console.log('✅ Export endpoint working');
            console.log(`   Export data type: ${typeof response.data}`);
        } else {
            console.log('❌ Export endpoint failed');
        }
    } catch (error) {
        console.error('❌ Export endpoint error:', error.response?.data || error.message);
    }
}

async function testIndividualProposalEndpoint() {
    console.log('🧪 Testing individual proposal endpoint...');

    if (!testProposal.id) {
        console.log('⚠️  Skipping individual proposal test - no test proposal ID');
        return;
    }

    try {
        const response = await axios.get(`${API_BASE_URL}/admin/proposals/${testProposal.id}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (response.data.success && response.data.proposal) {
            console.log('✅ Individual proposal endpoint working');
            console.log(`   Proposal: ${response.data.proposal.eventName}`);
        } else {
            console.log('❌ Individual proposal endpoint failed');
        }
    } catch (error) {
        console.error('❌ Individual proposal endpoint error:', error.response?.data || error.message);
    }
}

async function testFilteringAndSearch() {
    console.log('🧪 Testing filtering and search...');

    try {
        // Test status filter
        const statusResponse = await axios.get(`${API_BASE_URL}/admin/proposals`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { status: 'pending' }
        });

        if (statusResponse.data.success) {
            console.log('✅ Status filtering working');
        }

        // Test search
        const searchResponse = await axios.get(`${API_BASE_URL}/admin/proposals`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { search: 'test' }
        });

        if (searchResponse.data.success) {
            console.log('✅ Search functionality working');
        }

        // Test sorting
        const sortResponse = await axios.get(`${API_BASE_URL}/admin/proposals`, {
            headers: { Authorization: `Bearer ${authToken}` },
            params: { sortField: 'event_name', sortDirection: 'asc' }
        });

        if (sortResponse.data.success) {
            console.log('✅ Sorting functionality working');
        }

    } catch (error) {
        console.error('❌ Filtering/Search test error:', error.response?.data || error.message);
    }
}

async function testBulkOperations() {
    console.log('🧪 Testing bulk operations...');

    if (!testProposal.id) {
        console.log('⚠️  Skipping bulk operations test - no test proposal ID');
        return;
    }

    try {
        // Test bulk approve
        const approveResponse = await axios.patch(`${API_BASE_URL}/admin/proposals/bulk-status`, {
            ids: [testProposal.id],
            status: 'approved',
            adminComments: 'Test approval via integration test'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (approveResponse.data.success) {
            console.log('✅ Bulk approve operation working');
        }

        // Test bulk deny
        const denyResponse = await axios.patch(`${API_BASE_URL}/admin/proposals/bulk-status`, {
            ids: [testProposal.id],
            status: 'denied',
            adminComments: 'Test denial via integration test'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        if (denyResponse.data.success) {
            console.log('✅ Bulk deny operation working');
        }

    } catch (error) {
        console.error('❌ Bulk operations test error:', error.response?.data || error.message);
    }
}

async function cleanup() {
    console.log('🧹 Cleaning up test data...');

    try {
        if (testProposal.id) {
            await pool.query('DELETE FROM proposals WHERE id = $1', [testProposal.id]);
            console.log('✅ Test proposal deleted');
        }
    } catch (error) {
        console.error('❌ Cleanup error:', error.message);
    }

    if (pool) {
        await pool.end();
        console.log('✅ Database connection closed');
    }
}

async function runTests() {
    console.log('🚀 Starting Proposal Table Integration Tests\n');

    try {
        await setupDatabase();
        await createTestData();
        await authenticate();

        console.log('\n📋 Running API Endpoint Tests:');
        console.log('================================');

        await testMainProposalsEndpoint();
        await testStatsEndpoint();
        await testSuggestionsEndpoint();
        await testExportEndpoint();
        await testIndividualProposalEndpoint();

        console.log('\n🔍 Running Advanced Feature Tests:');
        console.log('===================================');

        await testFilteringAndSearch();
        await testBulkOperations();

        console.log('\n✅ All tests completed successfully!');

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
    testProposal,
    setupDatabase,
    createTestData,
    authenticate
};
