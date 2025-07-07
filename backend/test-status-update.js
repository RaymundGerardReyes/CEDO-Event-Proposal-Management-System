/**
 * Test script to verify proposal status update functionality
 * This tests the status normalization from "rejected" to "denied"
 */

const fetch = require('node-fetch');

async function testStatusUpdate() {
    const baseUrl = 'http://localhost:5000/api';

    console.log('🧪 Testing proposal status update...');

    // Test data
    const testCases = [
        { status: 'rejected', expected: 'denied' },
        { status: 'denied', expected: 'denied' },
        { status: 'approved', expected: 'approved' },
        { status: 'pending', expected: 'pending' }
    ];

    for (const testCase of testCases) {
        try {
            console.log(`\n📝 Testing status: "${testCase.status}" -> should become "${testCase.expected}"`);

            const response = await fetch(`${baseUrl}/admin/proposals/11/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    // Note: In real testing, you'd need proper authentication
                },
                body: JSON.stringify({
                    status: testCase.status,
                    adminComments: `Test comment for ${testCase.status} status`
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Success: ${data.message}`);
                console.log(`   Response status: ${data.status}`);
            } else {
                const error = await response.text();
                console.log(`❌ Error (${response.status}): ${error}`);
            }
        } catch (error) {
            console.log(`❌ Network error: ${error.message}`);
        }
    }

    console.log('\n🎯 Test completed!');
}

// Run the test
testStatusUpdate().catch(console.error); 