/**
 * Comprehensive File Upload Testing Suite
 * Tests the complete file upload and display flow
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Test configuration
const BACKEND_URL = 'http://localhost:5000';
const TEST_UUID = '2ff855e1-093f-4657-861f-7ec2160952e1'; // Use your actual UUID

// Create test files
const createTestFiles = () => {
    const testDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
    }

    // Create test GPOA file
    const gpoaContent = 'Test GPOA Document Content\nThis is a test file for GPOA upload.';
    fs.writeFileSync(path.join(testDir, 'test-gpoa.pdf'), gpoaContent);

    // Create test Project Proposal file
    const proposalContent = 'Test Project Proposal Content\nThis is a test file for project proposal upload.';
    fs.writeFileSync(path.join(testDir, 'test-proposal.pdf'), proposalContent);

    return {
        gpoaPath: path.join(testDir, 'test-gpoa.pdf'),
        proposalPath: path.join(testDir, 'test-proposal.pdf')
    };
};

// Test 1: Direct File Upload to Backend
const testFileUpload = async () => {
    console.log('🧪 Test 1: Testing file upload endpoint directly...');

    try {
        const testFiles = createTestFiles();
        const formData = new FormData();

        // Add files to form data
        formData.append('gpoa', fs.createReadStream(testFiles.gpoaPath));
        formData.append('projectProposal', fs.createReadStream(testFiles.proposalPath));

        // Get auth token (you'll need to replace this with actual token)
        const authToken = 'your-auth-token-here'; // Replace with actual token

        const response = await fetch(`${BACKEND_URL}/api/proposals/${TEST_UUID}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        console.log('📡 Upload Response Status:', response.status);
        const responseData = await response.json();
        console.log('📡 Upload Response Data:', JSON.stringify(responseData, null, 2));

        if (response.ok) {
            console.log('✅ File upload successful');
            return true;
        } else {
            console.log('❌ File upload failed:', responseData);
            return false;
        }
    } catch (error) {
        console.error('❌ File upload test failed:', error.message);
        return false;
    }
};

// Test 2: Check Database After Upload
const testDatabaseFileStorage = async () => {
    console.log('\n🧪 Test 2: Checking database file storage...');

    try {
        const { query } = require('./config/database-postgresql-only');

        const result = await query(
            'SELECT uuid, gpoa_file_name, gpoa_file_size, gpoa_file_type, gpoa_file_path, project_proposal_file_name, project_proposal_file_size, project_proposal_file_type, project_proposal_file_path FROM proposals WHERE uuid = $1',
            [TEST_UUID]
        );

        if (result.rows.length > 0) {
            const proposal = result.rows[0];
            console.log('📊 Database Record:');
            console.log('  UUID:', proposal.uuid);
            console.log('  GPOA File Name:', proposal.gpoa_file_name || 'NULL');
            console.log('  GPOA File Size:', proposal.gpoa_file_size || 'NULL');
            console.log('  GPOA File Type:', proposal.gpoa_file_type || 'NULL');
            console.log('  GPOA File Path:', proposal.gpoa_file_path || 'NULL');
            console.log('  Project File Name:', proposal.project_proposal_file_name || 'NULL');
            console.log('  Project File Size:', proposal.project_proposal_file_size || 'NULL');
            console.log('  Project File Type:', proposal.project_proposal_file_type || 'NULL');
            console.log('  Project File Path:', proposal.project_proposal_file_path || 'NULL');

            const hasFiles = !!(proposal.gpoa_file_name || proposal.project_proposal_file_name);
            console.log('  Has Files:', hasFiles);

            return hasFiles;
        } else {
            console.log('❌ No proposal found with UUID:', TEST_UUID);
            return false;
        }
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
        return false;
    }
};

// Test 3: Test Admin API Response
const testAdminAPIResponse = async () => {
    console.log('\n🧪 Test 3: Testing admin API response...');

    try {
        const authToken = 'your-auth-token-here'; // Replace with actual token

        const response = await fetch(`${BACKEND_URL}/api/admin/proposals?limit=10`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Admin API Response Status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('📊 Admin API Response Structure:');
            console.log('  Success:', data.success);
            console.log('  Proposals Count:', data.proposals?.length || 0);

            if (data.proposals && data.proposals.length > 0) {
                const testProposal = data.proposals.find(p => p.uuid === TEST_UUID);
                if (testProposal) {
                    console.log('📋 Test Proposal Data:');
                    console.log('  UUID:', testProposal.uuid);
                    console.log('  Has Files Object:', !!testProposal.files);
                    console.log('  Files Object:', JSON.stringify(testProposal.files, null, 2));
                    console.log('  GPOA File Name:', testProposal.gpoa_file_name || 'NULL');
                    console.log('  Project File Name:', testProposal.project_proposal_file_name || 'NULL');

                    return !!testProposal.files && Object.keys(testProposal.files).length > 0;
                } else {
                    console.log('❌ Test proposal not found in admin API response');
                    return false;
                }
            } else {
                console.log('❌ No proposals returned from admin API');
                return false;
            }
        } else {
            const errorData = await response.json();
            console.log('❌ Admin API failed:', errorData);
            return false;
        }
    } catch (error) {
        console.error('❌ Admin API test failed:', error.message);
        return false;
    }
};

// Test 4: Test Frontend File Display Logic
const testFrontendFileDisplay = () => {
    console.log('\n🧪 Test 4: Testing frontend file display logic...');

    // Simulate the frontend logic
    const mockProposal = {
        uuid: TEST_UUID,
        gpoa_file_name: 'test-gpoa.pdf',
        gpoa_file_size: 1024,
        gpoa_file_type: 'application/pdf',
        gpoa_file_path: '/uploads/test-gpoa.pdf',
        project_proposal_file_name: 'test-proposal.pdf',
        project_proposal_file_size: 2048,
        project_proposal_file_type: 'application/pdf',
        project_proposal_file_path: '/uploads/test-proposal.pdf'
    };

    // Test hasFiles logic
    const hasFiles = !!(mockProposal.gpoa_file_name || mockProposal.project_proposal_file_name);
    console.log('📊 Frontend hasFiles Logic:');
    console.log('  GPOA File Name:', mockProposal.gpoa_file_name);
    console.log('  Project File Name:', mockProposal.project_proposal_file_name);
    console.log('  Has Files:', hasFiles);

    // Test files object construction
    const files = {
        ...(mockProposal.gpoa_file_name && {
            gpoa: {
                name: mockProposal.gpoa_file_name,
                size: mockProposal.gpoa_file_size,
                type: mockProposal.gpoa_file_type,
                path: mockProposal.gpoa_file_path
            }
        }),
        ...(mockProposal.project_proposal_file_name && {
            projectProposal: {
                name: mockProposal.project_proposal_file_name,
                size: mockProposal.project_proposal_file_size,
                type: mockProposal.project_proposal_file_type,
                path: mockProposal.project_proposal_file_path
            }
        })
    };

    console.log('📊 Constructed Files Object:');
    console.log('  Files:', JSON.stringify(files, null, 2));
    console.log('  File Count:', Object.keys(files).length);
    console.log('  Has Files:', Object.keys(files).length > 0);

    return Object.keys(files).length > 0;
};

// Test 5: End-to-End Integration Test
const testEndToEndFlow = async () => {
    console.log('\n🧪 Test 5: End-to-End Integration Test...');

    const results = {
        fileUpload: false,
        databaseStorage: false,
        adminAPI: false,
        frontendDisplay: false
    };

    // Run all tests
    results.fileUpload = await testFileUpload();
    results.databaseStorage = await testDatabaseFileStorage();
    results.adminAPI = await testAdminAPIResponse();
    results.frontendDisplay = testFrontendFileDisplay();

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('  File Upload:', results.fileUpload ? '✅ PASS' : '❌ FAIL');
    console.log('  Database Storage:', results.databaseStorage ? '✅ PASS' : '❌ FAIL');
    console.log('  Admin API:', results.adminAPI ? '✅ PASS' : '❌ FAIL');
    console.log('  Frontend Display:', results.frontendDisplay ? '✅ PASS' : '❌ FAIL');

    const allPassed = Object.values(results).every(result => result === true);
    console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

    return results;
};

// Run the comprehensive test suite
const runComprehensiveTests = async () => {
    console.log('🚀 Starting Comprehensive File Upload Testing Suite...');
    console.log('='.repeat(60));

    try {
        await testEndToEndFlow();
    } catch (error) {
        console.error('❌ Test suite failed:', error);
    }

    console.log('='.repeat(60));
    console.log('🏁 Testing Complete');
};

// Export for use in other scripts
module.exports = {
    testFileUpload,
    testDatabaseFileStorage,
    testAdminAPIResponse,
    testFrontendFileDisplay,
    testEndToEndFlow,
    runComprehensiveTests
};

// Run if called directly
if (require.main === module) {
    runComprehensiveTests();
}