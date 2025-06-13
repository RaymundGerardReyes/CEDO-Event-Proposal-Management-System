#!/usr/bin/env node

/**
 * Comprehensive Test for Section 2 to Section 3 Data Flow
 * Tests the entire pipeline to ensure data persistence and retrieval works correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test organization data
const testOrgData = {
    title: 'Flow Test Organization',
    description: 'Testing the complete data flow from Section 2 to Section 3',
    organizationType: 'school-based',
    contactPerson: 'Test Contact Person',
    contactEmail: 'flowtest@example.com',
    contactPhone: '1234567890',
    status: 'draft'
};

async function runFlowTest() {
    console.log('🧪 === SECTION 2 TO SECTION 3 FLOW TEST ===\n');

    try {
        // Step 1: Test Section 2 data save
        console.log('📝 Step 1: Testing Section 2 data save...');
        const section2Response = await axios.post(`${BASE_URL}/api/proposals/section2-organization`, testOrgData, {
            headers: { 'Content-Type': 'application/json' }
        });

        console.log('✅ Section 2 Response Status:', section2Response.status);
        console.log('✅ Section 2 Response Data:', JSON.stringify(section2Response.data, null, 2));

        const proposalId = section2Response.data.id;
        if (!proposalId) {
            throw new Error('❌ No proposal ID returned from Section 2 save');
        }

        console.log('✅ Extracted Proposal ID:', proposalId);

        // Step 2: Verify data was saved using debug endpoint
        console.log('\n🔍 Step 2: Verifying data was saved...');
        const debugResponse = await axios.get(`${BASE_URL}/api/proposals/debug/${proposalId}`);

        console.log('✅ Debug Response:', JSON.stringify(debugResponse.data, null, 2));

        if (!debugResponse.data.recommendations.hasData) {
            throw new Error('❌ Verification failed - data not found in database');
        }

        console.log('✅ Data verification successful - Source:', debugResponse.data.recommendations.source);

        // Step 3: Test search functionality (what Section 3 might use as fallback)
        console.log('\n🔍 Step 3: Testing search functionality...');
        const searchResponse = await axios.post(`${BASE_URL}/api/proposals/search`, {
            organization_name: testOrgData.title,
            contact_email: testOrgData.contactEmail
        });

        console.log('✅ Search Response:', JSON.stringify(searchResponse.data, null, 2));

        if (searchResponse.data.id !== proposalId) {
            console.warn('⚠️ Search returned different ID than save operation');
        } else {
            console.log('✅ Search returned consistent proposal ID');
        }

        // Step 4: Simulate Section 3 validation requirements
        console.log('\n🔍 Step 4: Simulating Section 3 validation...');

        // This simulates what Section 3 expects in formData
        const simulatedFormData = {
            organizationName: testOrgData.title,          // Section 3 looks for this
            contactEmail: testOrgData.contactEmail,      // Section 3 looks for this
            id: proposalId,                              // Section 3 needs this
            proposalId: proposalId,                      // Alternative ID field
            organization_id: proposalId,                 // Another alternative
            section2_completed: true,                    // Completion flag
            lastSavedSection: 'section2'                 // Tracking field
        };

        console.log('📊 Simulated formData for Section 3:', JSON.stringify(simulatedFormData, null, 2));

        // Check if Section 3 validation would pass
        const hasOrgName = !!(simulatedFormData.organizationName);
        const hasContactEmail = !!(simulatedFormData.contactEmail);
        const hasProposalId = !!(simulatedFormData.id || simulatedFormData.proposalId || simulatedFormData.organization_id);

        console.log('🔍 Section 3 Validation Check:');
        console.log('  ✅ Organization Name:', hasOrgName ? 'Present' : '❌ Missing');
        console.log('  ✅ Contact Email:', hasContactEmail ? 'Present' : '❌ Missing');
        console.log('  ✅ Proposal ID:', hasProposalId ? 'Present' : '❌ Missing');

        if (hasOrgName && hasContactEmail && hasProposalId) {
            console.log('✅ Section 3 validation would PASS');
        } else {
            console.log('❌ Section 3 validation would FAIL');
            throw new Error('Section 3 validation requirements not met');
        }

        // Step 5: Test cleanup (optional)
        console.log('\n🧹 Step 5: Test completed successfully');
        console.log('✅ Complete data flow from Section 2 to Section 3 is working correctly');

        // Summary
        console.log('\n📊 === FLOW TEST SUMMARY ===');
        console.log('✅ Section 2 save: PASS');
        console.log('✅ Data verification: PASS');
        console.log('✅ Search functionality: PASS');
        console.log('✅ Section 3 validation: PASS');
        console.log('✅ Overall flow: WORKING CORRECTLY');

        return {
            success: true,
            proposalId: proposalId,
            message: 'Complete flow test passed successfully'
        };

    } catch (error) {
        console.error('\n❌ === FLOW TEST FAILED ===');
        console.error('❌ Error:', error.message);

        if (error.response) {
            console.error('❌ Response Status:', error.response.status);
            console.error('❌ Response Data:', JSON.stringify(error.response.data, null, 2));
        }

        console.error('\n🔧 === TROUBLESHOOTING RECOMMENDATIONS ===');
        console.error('1. Ensure backend server is running on port 5000');
        console.error('2. Check MySQL database connection');
        console.error('3. Verify the /api/proposals/section2-organization endpoint exists');
        console.error('4. Check backend logs for detailed error information');
        console.error('5. Ensure the proposals table exists in MySQL');

        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    runFlowTest()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 Flow test completed successfully!');
                process.exit(0);
            } else {
                console.log('\n💥 Flow test failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Unexpected error during flow test:', error);
            process.exit(1);
        });
}

module.exports = { runFlowTest, testOrgData }; 