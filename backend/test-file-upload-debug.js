/**
 * File Upload Debug Test
 * Tests the file upload process with detailed debugging
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Test configuration
const BACKEND_URL = 'http://localhost:5000';
const TEST_UUID = 'ecad7631-cefb-4271-ba40-9cb698bcf3fe'; // Use the UUID from the error

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

// Test file upload with detailed debugging
const testFileUploadDebug = async () => {
    console.log('🧪 Testing file upload with detailed debugging...');
    console.log('='.repeat(60));

    try {
        const testFiles = createTestFiles();
        console.log('📁 Created test files:');
        console.log('  GPOA:', testFiles.gpoaPath);
        console.log('  Project:', testFiles.proposalPath);

        const formData = new FormData();

        // Add files to form data
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

// Test with different file scenarios
const testFileScenarios = async () => {
    console.log('\n🧪 Testing different file scenarios...');

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

        } catch (error) {
            console.error(`  ❌ Scenario failed: ${error.message}`);
        }
    }
};

// Run all tests
const runDebugTests = async () => {
    console.log('🚀 Starting File Upload Debug Tests...');
    console.log('='.repeat(60));

    try {
        await testFileScenarios();
        await testFileUploadDebug();
    } catch (error) {
        console.error('❌ Debug tests failed:', error);
    }

    console.log('='.repeat(60));
    console.log('🏁 Debug Testing Complete');
};

// Export for use in other scripts
module.exports = {
    testFileUploadDebug,
    testFileScenarios,
    runDebugTests
};

// Run if called directly
if (require.main === module) {
    runDebugTests();
}
