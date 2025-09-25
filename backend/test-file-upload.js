#!/usr/bin/env node

/**
 * Test File Upload Endpoint
 * 
 * Tests the file upload functionality to debug the 500/400 errors
 */

const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testFileUpload() {
    console.log('🧪 Testing File Upload Endpoint...\n');

    try {
        // Create a test file
        const testContent = 'This is a test PDF content for file upload testing.';
        const testFilePath = path.join(__dirname, 'test-file.pdf');
        fs.writeFileSync(testFilePath, testContent);

        console.log('📝 Created test file:', testFilePath);

        // Create FormData
        const formData = new FormData();
        formData.append('gpoa', fs.createReadStream(testFilePath), 'test-gpoa.pdf');
        formData.append('projectProposal', fs.createReadStream(testFilePath), 'test-proposal.pdf');

        console.log('📦 Created FormData with test files');

        // Test UUID (you can replace with a real one)
        const testUuid = 'test-uuid-' + Date.now();

        // Make request to file upload endpoint
        const response = await fetch(`http://localhost:5000/api/proposals/${testUuid}/files`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer test-token', // You'll need a real token
                ...formData.getHeaders()
            },
            body: formData
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📡 Response body:', responseText);

        // Clean up test file
        fs.unlinkSync(testFilePath);
        console.log('🧹 Cleaned up test file');

        if (response.ok) {
            console.log('✅ File upload test successful!');
        } else {
            console.log('❌ File upload test failed:', response.status, responseText);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('📋 Error details:', error);
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testFileUpload().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testFileUpload };



