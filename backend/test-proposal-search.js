const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testProposalSearch() {
    console.log('🧪 Testing proposal search endpoint...');

    try {
        // Test data that should match a proposal in the database
        const searchData = {
            organization_name: 'Test Organization',
            contact_email: 'test@example.com'
        };

        console.log('📤 Searching for proposal:', searchData);

        const response = await axios.post(`${BASE_URL}/api/proposals/search`, searchData, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('📨 Response status:', response.status);
        console.log('📨 Response data:', response.data);

        if (response.status === 200 && response.data.id) {
            console.log('✅ Search test passed! Found proposal ID:', response.data.id);
            return response.data.id;
        } else if (response.status === 404) {
            console.log('⚠️ No proposal found with test data - this is expected if no test data exists');
            console.log('💡 To test with real data, update the searchData object with actual values from your database');
            return null;
        }

    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('⚠️ No proposal found - this is expected if no matching proposal exists');
            return null;
        }

        console.error('❌ Search test failed:', error.message);
        if (error.response) {
            console.error('❌ Response status:', error.response.status);
            console.error('❌ Response data:', error.response.data);
        }
        throw error;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testProposalSearch()
        .then(result => {
            if (result) {
                console.log(`🎉 Test completed successfully! Proposal ID: ${result}`);
            } else {
                console.log('🔍 Test completed - no proposal found (check if test data exists)');
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Test failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testProposalSearch }; 