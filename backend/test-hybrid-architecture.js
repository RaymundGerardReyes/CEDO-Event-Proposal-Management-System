#!/usr/bin/env node

/**
 * 🔧 HYBRID ARCHITECTURE TEST SCRIPT
 * 
 * This script verifies the correct implementation of the hybrid database architecture:
 * - MySQL: Proposal data (Section 2 organization info)
 * - MongoDB: File metadata (Section 3 files linked to MySQL proposals)
 * - Hybrid Admin: Combined queries from both databases
 * 
 * Based on best practices from:
 * - https://medium.com/trendyol-tech/how-to-test-database-queries-and-more-with-node-js-2f02b08707a7
 * - https://developers.redhat.com/articles/2023/07/27/introduction-nodejs-reference-architecture-testing
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const TEST_TIMEOUT = 30000; // 30 seconds

// Color logging
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    test: (msg) => console.log(`${colors.magenta}🧪 ${msg}${colors.reset}`),
    section: (msg) => console.log(`${colors.cyan}${colors.bright}\n=== ${msg} ===${colors.reset}`)
};

// Test data
const testOrgData = {
    title: 'Hybrid Test Organization',
    description: 'Testing the hybrid architecture implementation',
    category: 'partnership',
    organizationType: 'school-based',
    contactPerson: 'Test Contact Person',
    contactEmail: 'test@hybridarch.com',
    contactPhone: '1234567890',
    startDate: '2025-06-10',
    endDate: '2025-06-20',
    location: 'Test Venue',
    budget: '5000',
    objectives: 'Test hybrid architecture objectives',
    volunteersNeeded: '5',
    status: 'draft'
};

// Test statistics
let testStats = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

/**
 * Helper function to run a test with error handling
 */
async function runTest(testName, testFn) {
    testStats.total++;
    log.test(`Running: ${testName}`);

    try {
        await testFn();
        testStats.passed++;
        log.success(`PASSED: ${testName}`);
        return true;
    } catch (error) {
        testStats.failed++;
        testStats.errors.push({ test: testName, error: error.message });
        log.error(`FAILED: ${testName} - ${error.message}`);
        return false;
    }
}

/**
 * Helper function to create a test file
 */
function createTestFile(filename, content = 'Test file content for hybrid architecture testing') {
    const filePath = path.join(__dirname, 'temp', filename);

    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
    return filePath;
}

/**
 * Clean up test files
 */
function cleanupTestFiles() {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        log.info('Cleaned up test files');
    }
}

/**
 * TEST 1: Verify backend connectivity
 */
async function testBackendConnectivity() {
    const response = await axios.get(`${BASE_URL}/health`);

    if (response.status !== 200) {
        throw new Error(`Backend health check failed with status ${response.status}`);
    }

    log.info('Backend is running and accessible');
}

/**
 * TEST 2: Test MySQL Section 2 organization data endpoint
 */
async function testMySQLSection2Endpoint() {
    const response = await axios.post(`${BASE_URL}/api/proposals/section2-organization`, testOrgData, {
        headers: { 'Content-Type': 'application/json' }
    });

    if (response.status !== 201) {
        throw new Error(`Expected status 201, got ${response.status}`);
    }

    const result = response.data;

    if (!result.id) {
        throw new Error('Response missing proposal ID');
    }

    if (result.message !== 'Section 2 organization data saved successfully to MySQL') {
        throw new Error(`Unexpected message: ${result.message}`);
    }

    log.info(`MySQL proposal created with ID: ${result.id}`);
    return result.id; // Return for use in subsequent tests
}

/**
 * TEST 3: Test MongoDB file storage endpoint (linked to MySQL proposal)
 */
async function testMongoDBFileStorage(proposalId) {
    // Create test files
    const gpoaFile = createTestFile('test-gpoa.pdf', 'GPOA test content for hybrid architecture');
    const proposalFile = createTestFile('test-proposal.pdf', 'Proposal test content for hybrid architecture');

    const formData = new FormData();
    formData.append('proposal_id', proposalId.toString());
    formData.append('organization_name', testOrgData.title);
    formData.append('gpoaFile', fs.createReadStream(gpoaFile), 'test-gpoa.pdf');
    formData.append('proposalFile', fs.createReadStream(proposalFile), 'test-proposal.pdf');

    const response = await axios.post(`${BASE_URL}/api/proposals/files`, formData, {
        headers: {
            ...formData.getHeaders(),
            'Content-Type': 'multipart/form-data'
        }
    });

    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }

    const result = response.data;

    if (!result.success) {
        throw new Error('File upload failed');
    }

    if (result.proposalId !== proposalId.toString()) {
        throw new Error(`Expected proposalId ${proposalId}, got ${result.proposalId}`);
    }

    if (!result.files.gpoa || !result.files.proposal) {
        throw new Error('Missing file metadata in response');
    }

    log.info(`MongoDB files linked to MySQL proposal ${proposalId}`);
    log.info(`Files uploaded: GPOA (${result.files.gpoa.filename}), Proposal (${result.files.proposal.filename})`);
}

/**
 * TEST 4: Test MySQL proposal update (Section 3 event details)
 */
async function testMySQLProposalUpdate(proposalId) {
    const eventUpdateData = {
        proposal_id: proposalId,
        venue: 'Updated Test Venue',
        start_date: '2025-06-15',
        end_date: '2025-06-25',
        time_start: '09:00',
        time_end: '17:00',
        event_type: 'academic',
        event_mode: 'hybrid',
        return_service_credit: 2,
        target_audience: JSON.stringify(['1st Year', '2nd Year']),
        status: 'pending'
    };

    const response = await axios.post(`${BASE_URL}/api/proposals/section2-organization`, eventUpdateData, {
        headers: { 'Content-Type': 'application/json' }
    });

    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }

    const result = response.data;

    if (result.message !== 'Section 2 organization data updated successfully in MySQL') {
        throw new Error(`Unexpected message: ${result.message}`);
    }

    log.info(`MySQL proposal ${proposalId} updated with event details`);
}

/**
 * TEST 5: Test hybrid admin dashboard endpoint
 */
async function testHybridAdminDashboard(proposalId) {
    const response = await axios.get(`${BASE_URL}/api/proposals/admin/proposals-hybrid?page=1&limit=10`);

    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }

    const result = response.data;

    if (!result.success) {
        throw new Error('Hybrid admin query failed');
    }

    if (!result.metadata || result.metadata.architecture !== 'MySQL (proposals) + MongoDB (files)') {
        throw new Error('Missing or incorrect hybrid architecture metadata');
    }

    // Find our test proposal
    const testProposal = result.proposals.find(p => p.id === proposalId);

    if (!testProposal) {
        throw new Error(`Test proposal ${proposalId} not found in hybrid admin results`);
    }

    if (testProposal.dataSource !== 'hybrid') {
        throw new Error(`Expected dataSource 'hybrid', got '${testProposal.dataSource}'`);
    }

    if (!testProposal.files || Object.keys(testProposal.files).length === 0) {
        throw new Error('Test proposal missing file metadata from MongoDB');
    }

    log.info(`Hybrid admin dashboard successfully retrieved proposal ${proposalId} with file metadata`);
    log.info(`Data sources: MySQL (${result.metadata.mysqlProposals} proposals), MongoDB (${result.metadata.withFileMetadata} with files)`);
}

/**
 * TEST 6: Test data consistency between MySQL and MongoDB
 */
async function testDataConsistency(proposalId) {
    // Get MySQL data
    const mysqlResponse = await axios.get(`${BASE_URL}/api/proposals/${proposalId}`);

    if (mysqlResponse.status !== 200) {
        log.warning('MySQL direct query endpoint may not exist, using hybrid endpoint instead');
    }

    // Get hybrid data (which combines MySQL + MongoDB)
    const hybridResponse = await axios.get(`${BASE_URL}/api/proposals/admin/proposals-hybrid?page=1&limit=100`);

    if (hybridResponse.status !== 200) {
        throw new Error(`Hybrid endpoint failed with status ${hybridResponse.status}`);
    }

    const testProposal = hybridResponse.data.proposals.find(p => p.id === proposalId);

    if (!testProposal) {
        throw new Error(`Proposal ${proposalId} not found in hybrid results`);
    }

    // Verify data integrity
    if (testProposal.organizationName !== testOrgData.title) {
        throw new Error(`Data mismatch: expected '${testOrgData.title}', got '${testProposal.organizationName}'`);
    }

    if (testProposal.contactEmail !== testOrgData.contactEmail) {
        throw new Error(`Data mismatch: expected '${testOrgData.contactEmail}', got '${testProposal.contactEmail}'`);
    }

    if (!testProposal.files || !testProposal.files.gpoa || !testProposal.files.proposal) {
        throw new Error('Missing file metadata from MongoDB');
    }

    log.info('Data consistency verified between MySQL and MongoDB');
}

/**
 * TEST 7: Test error handling for missing proposal ID
 */
async function testErrorHandling() {
    try {
        // Try to upload files without proposal_id
        const formData = new FormData();
        formData.append('organization_name', 'Test Org');

        const response = await axios.post(`${BASE_URL}/api/proposals/files`, formData, {
            headers: formData.getHeaders()
        });

        throw new Error('Expected error for missing proposal_id, but request succeeded');
    } catch (error) {
        if (error.response && error.response.status === 400) {
            const errorData = error.response.data;
            if (errorData.error && errorData.error.includes('proposal_id is required')) {
                log.info('Error handling working correctly for missing proposal_id');
                return;
            }
        }
        throw new Error(`Unexpected error response: ${error.message}`);
    }
}

/**
 * Main test runner
 */
async function runAllTests() {
    log.section('HYBRID ARCHITECTURE INTEGRATION TESTS');
    log.info(`Testing backend at: ${BASE_URL}`);
    log.info('Architecture: MySQL (proposals) + MongoDB (files)');

    let proposalId;

    try {
        // Test 1: Backend connectivity
        await runTest('Backend Connectivity', testBackendConnectivity);

        // Test 2: MySQL Section 2 endpoint
        proposalId = await runTest('MySQL Section 2 Organization Data', async () => {
            proposalId = await testMySQLSection2Endpoint();
        });

        if (!proposalId) {
            log.error('Cannot continue tests without proposal ID');
            return;
        }

        // Test 3: MongoDB file storage
        await runTest('MongoDB File Storage (linked to MySQL)', () => testMongoDBFileStorage(proposalId));

        // Test 4: MySQL proposal update
        await runTest('MySQL Proposal Update (Section 3)', () => testMySQLProposalUpdate(proposalId));

        // Test 5: Hybrid admin dashboard
        await runTest('Hybrid Admin Dashboard Query', () => testHybridAdminDashboard(proposalId));

        // Test 6: Data consistency
        await runTest('Data Consistency (MySQL + MongoDB)', () => testDataConsistency(proposalId));

        // Test 7: Error handling
        await runTest('Error Handling (Missing proposal_id)', testErrorHandling);

    } catch (error) {
        log.error(`Critical error: ${error.message}`);
    } finally {
        // Cleanup
        cleanupTestFiles();
    }

    // Print test results
    log.section('TEST RESULTS');
    log.info(`Total tests: ${testStats.total}`);
    log.success(`Passed: ${testStats.passed}`);

    if (testStats.failed > 0) {
        log.error(`Failed: ${testStats.failed}`);

        log.section('FAILED TESTS');
        testStats.errors.forEach((error, index) => {
            log.error(`${index + 1}. ${error.test}: ${error.error}`);
        });
    }

    // Architecture verification summary
    log.section('ARCHITECTURE VERIFICATION');

    if (testStats.passed === testStats.total) {
        log.success('🎉 HYBRID ARCHITECTURE WORKING CORRECTLY!');
        log.success('✅ MySQL: Storing proposal data (Section 2)');
        log.success('✅ MongoDB: Storing file metadata (Section 3) linked to MySQL proposals');
        log.success('✅ Hybrid Admin: Querying both databases successfully');
        log.success('✅ Data Consistency: Verified between both databases');
    } else {
        log.error('🚨 HYBRID ARCHITECTURE HAS ISSUES!');
        log.error('Please review failed tests and fix the implementation');
    }

    // Exit with appropriate code
    process.exit(testStats.failed > 0 ? 1 : 0);
}

// Run tests with timeout
const testTimeout = setTimeout(() => {
    log.error('Tests timed out after 30 seconds');
    process.exit(1);
}, TEST_TIMEOUT);

runAllTests()
    .then(() => {
        clearTimeout(testTimeout);
    })
    .catch((error) => {
        clearTimeout(testTimeout);
        log.error(`Test runner failed: ${error.message}`);
        process.exit(1);
    });

// Handle graceful shutdown
process.on('SIGINT', () => {
    log.warning('Tests interrupted by user');
    cleanupTestFiles();
    process.exit(130);
});

process.on('SIGTERM', () => {
    log.warning('Tests terminated');
    cleanupTestFiles();
    process.exit(143);
}); 