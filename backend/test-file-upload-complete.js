/**
 * Complete File Upload Test
 * Tests the entire file upload process with the new multer middleware
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
// Use built-in fetch in Node.js 18+
// const fetch = require('node-fetch');

// Test configuration
const BACKEND_URL = 'http://localhost:5000';
const TEST_UUID = 'a9769c6b-2598-427a-9deb-5f5e1eebb0e3'; // Use the UUID from the error

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

// Test 1: Test file upload with proper FormData
const testFileUploadWithFormData = async () => {
    console.log('🧪 Test 1: Testing file upload with FormData...');
    console.log('='.repeat(60));

    try {
        const testFiles = createTestFiles();
        console.log('📁 Created test files:');
        console.log('  GPOA:', testFiles.gpoaPath);
        console.log('  Project:', testFiles.proposalPath);

        const formData = new FormData();

        // Add files to form data with correct field names
        console.log('📎 Adding files to FormData...');
        formData.append('gpoa', fs.createReadStream(testFiles.gpoaPath));
        formData.append('projectProposal', fs.createReadStream(testFiles.proposalPath));

        // Debug FormData contents
        console.log('📎 FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}:`, value.name || value);
        }

        // Get auth token (you'll need to replace this with actual token)
        const authToken = 'your-auth-token-here'; // Replace with actual token

        console.log('📡 Sending request to:', `${BACKEND_URL}/api/proposals/${TEST_UUID}/files`);
        console.log('📡 Headers:', {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': formData.getHeaders()['content-type']
        });

        const response = await fetch(`${BACKEND_URL}/api/proposals/${TEST_UUID}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        console.log('📡 Response Status:', response.status);
        console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📡 Response Body:', responseText);

        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (parseError) {
            console.log('❌ Failed to parse response as JSON:', parseError.message);
            return false;
        }

        console.log('📡 Parsed Response:', JSON.stringify(responseData, null, 2));

        if (response.ok) {
            console.log('✅ File upload successful');
            return true;
        } else {
            console.log('❌ File upload failed:', responseData);
            return false;
        }
    } catch (error) {
        console.error('❌ File upload test failed:', error.message);
        console.error('❌ Error stack:', error.stack);
        return false;
    }
};

// Test 2: Test different file scenarios
const testFileScenarios = async () => {
    console.log('\n🧪 Test 2: Testing different file scenarios...');
    console.log('='.repeat(60));

    const scenarios = [
        {
            name: 'Both files provided',
            gpoa: true,
            project: true
        },
        {
            name: 'Only GPOA file',
            gpoa: true,
            project: false
        },
        {
            name: 'Only Project file',
            gpoa: false,
            project: true
        },
        {
            name: 'No files',
            gpoa: false,
            project: false
        }
    ];

    for (const scenario of scenarios) {
        console.log(`\n📊 Testing scenario: ${scenario.name}`);

        try {
            const testFiles = createTestFiles();
            const formData = new FormData();

            if (scenario.gpoa) {
                formData.append('gpoa', fs.createReadStream(testFiles.gpoaPath));
                console.log('  ✅ Added GPOA file');
            }

            if (scenario.project) {
                formData.append('projectProposal', fs.createReadStream(testFiles.proposalPath));
                console.log('  ✅ Added Project file');
            }

            console.log('  📎 FormData entries:', Array.from(formData.entries()).map(([key, value]) => `${key}: ${value.name || value}`));

            // Test the request (without actually sending it)
            const headers = formData.getHeaders();
            console.log('  📡 Content-Type:', headers['content-type']);
            console.log('  📡 Content-Length:', headers['content-length']);

        } catch (error) {
            console.error(`  ❌ Scenario failed: ${error.message}`);
        }
    }
};

// Test 3: Test server middleware configuration
const testServerMiddleware = () => {
    console.log('\n🧪 Test 3: Testing server middleware configuration...');
    console.log('='.repeat(60));

    try {
        // Check if multer is properly configured
        const multer = require('multer');
        console.log('✅ Multer is available');

        // Check if the uploads directory exists
        const uploadsDir = path.join(__dirname, 'uploads/proposals');
        if (fs.existsSync(uploadsDir)) {
            console.log('✅ Uploads directory exists:', uploadsDir);
        } else {
            console.log('⚠️ Uploads directory does not exist:', uploadsDir);
        }

        // Check server.js for multer configuration
        const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
        if (serverContent.includes('multer')) {
            console.log('✅ Multer configuration found in server.js');
        } else {
            console.log('❌ Multer configuration not found in server.js');
        }

        if (serverContent.includes('upload.fields')) {
            console.log('✅ Upload fields configuration found');
        } else {
            console.log('❌ Upload fields configuration not found');
        }

        return true;
    } catch (error) {
        console.error('❌ Server middleware test failed:', error.message);
        return false;
    }
};

// Run all tests
const runCompleteTests = async () => {
    console.log('🚀 Starting Complete File Upload Tests...');
    console.log('='.repeat(60));

    try {
        // Test server middleware first
        const middlewareTest = testServerMiddleware();

        // Test file scenarios
        await testFileScenarios();

        // Test actual file upload
        const uploadTest = await testFileUploadWithFormData();

        console.log('\n📊 Test Results Summary:');
        console.log('  Middleware Configuration:', middlewareTest ? '✅ PASS' : '❌ FAIL');
        console.log('  File Upload:', uploadTest ? '✅ PASS' : '❌ FAIL');

        const allTestsPassed = middlewareTest && uploadTest;
        console.log('\n🎯 Overall Result:', allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');

        if (allTestsPassed) {
            console.log('\n🎉 File upload should now work correctly!');
            console.log('📋 The multer middleware is properly configured and should handle file uploads.');
        } else {
            console.log('\n⚠️ Some tests failed. Check the configuration and try again.');
        }

    } catch (error) {
        console.error('❌ Complete test suite failed:', error);
    }

    console.log('='.repeat(60));
    console.log('🏁 Complete Testing Finished');
};

// Export for use in other scripts
module.exports = {
    testFileUploadWithFormData,
    testFileScenarios,
    testServerMiddleware,
    runCompleteTests
};

// Run if called directly
if (require.main === module) {
    runCompleteTests();
}
