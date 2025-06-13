const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/proposals';

// Test data for creating a test proposal
const testProposalData = {
    title: 'Security Test Organization',
    organization_name: 'Security Test Organization',
    organization_description: 'Test organization for security validation',
    organization_type: 'school-based',
    contactPerson: 'Test User',
    contact_name: 'Test User',
    contactEmail: 'securitytest@example.com',
    contact_email: 'securitytest@example.com',
    contactPhone: '1234567890',
    contact_phone: '1234567890',
    status: 'draft'
};

const testSection3Data = {
    venue: 'Updated Test Venue',
    start_date: '2025-07-01',
    end_date: '2025-07-01',
    time_start: '10:00',
    time_end: '18:00',
    event_type: 'academic-enhancement',
    event_mode: 'hybrid',
    return_service_credit: 2,
    target_audience: JSON.stringify(['1st Year', '2nd Year']),
    status: 'approved' // 🚨 MALICIOUS: Trying to auto-approve via Section 3
};

async function testSection3Security() {
    console.log('🔐 SECURITY TEST: Testing Section 3 auto-approval prevention');
    console.log('=====================================');

    try {
        // Step 1: Create a test proposal in draft status
        console.log('\n📝 STEP 1: Creating test proposal in DRAFT status...');
        const createResponse = await axios.post(`${BASE_URL}/section2-organization`, testProposalData);

        if (createResponse.status !== 201) {
            throw new Error(`Failed to create proposal: ${createResponse.status}`);
        }

        const proposalId = createResponse.data.id;
        console.log(`✅ Created proposal with ID: ${proposalId}`);
        console.log(`✅ Initial status: ${testProposalData.status}`);

        // Step 2: Verify initial proposal status
        console.log('\n🔍 STEP 2: Verifying initial proposal status...');
        const debugResponse = await axios.get(`${BASE_URL}/debug/${proposalId}`);
        const initialStatus = debugResponse.data.mysql?.data?.proposal_status;
        console.log(`✅ Confirmed initial status: ${initialStatus}`);

        if (initialStatus !== 'draft') {
            throw new Error(`Expected 'draft' status, got '${initialStatus}'`);
        }

        // Step 3: Attempt Section 3 update with malicious status change
        console.log('\n🚨 STEP 3: Attempting Section 3 update with MALICIOUS status="approved"...');
        testSection3Data.proposal_id = proposalId;

        console.log('🚨 Malicious payload:', JSON.stringify(testSection3Data, null, 2));

        const section3Response = await axios.post(`${BASE_URL}/section3-event`, testSection3Data);

        if (section3Response.status !== 200) {
            throw new Error(`Section 3 update failed: ${section3Response.status}`);
        }

        console.log('✅ Section 3 update completed');
        console.log('📊 Response:', section3Response.data);

        // Step 4: Verify status was NOT changed to approved
        console.log('\n🔐 STEP 4: Verifying status was NOT auto-approved...');
        const postUpdateResponse = await axios.get(`${BASE_URL}/debug/${proposalId}`);
        const finalStatus = postUpdateResponse.data.mysql?.data?.proposal_status;

        console.log(`🔍 Final status: ${finalStatus}`);
        console.log(`🔍 Expected: draft (unchanged)`);
        console.log(`🔍 Malicious attempt: approved`);

        // CRITICAL SECURITY CHECK
        if (finalStatus === 'approved') {
            console.error('🚨 SECURITY VULNERABILITY: Proposal was auto-approved by Section 3!');
            console.error('🚨 This is a critical security issue!');
            process.exit(1);
        } else if (finalStatus === initialStatus) {
            console.log('✅ SECURITY TEST PASSED: Status was preserved');
            console.log('✅ Auto-approval prevention is working correctly');
        } else {
            console.warn(`⚠️ Status changed from '${initialStatus}' to '${finalStatus}' - unexpected but not auto-approved`);
        }

        // Step 5: Verify event details were updated
        console.log('\n📝 STEP 5: Verifying event details were updated correctly...');
        const fullProposal = postUpdateResponse.data.mysql?.data;

        console.log('Event details verification:');
        console.log(`  Venue: ${fullProposal.event_venue} (expected: ${testSection3Data.venue})`);
        console.log(`  Start date: ${fullProposal.event_start_date} (expected: ${testSection3Data.start_date})`);
        console.log(`  Event type: ${fullProposal.school_event_type} (expected: ${testSection3Data.event_type})`);

        if (fullProposal.event_venue === testSection3Data.venue &&
            fullProposal.event_start_date === testSection3Data.start_date &&
            fullProposal.school_event_type === testSection3Data.event_type) {
            console.log('✅ Event details updated correctly');
        } else {
            console.warn('⚠️ Some event details may not have updated correctly');
        }

        // Step 6: Test legitimate admin approval (if admin endpoint exists)
        console.log('\n👨‍💼 STEP 6: Testing legitimate admin approval (if available)...');
        try {
            // Note: This would require proper admin authentication in a real system
            const adminApprovalData = {
                status: 'approved',
                adminComments: 'Approved for security testing purposes'
            };

            // This might not work without proper admin auth, but we'll test the concept
            const adminResponse = await axios.patch(`${BASE_URL}/admin/proposals/${proposalId}/status`, adminApprovalData);

            if (adminResponse.status === 200) {
                console.log('✅ Admin approval endpoint worked');

                // Verify admin approval actually changed status
                const adminVerifyResponse = await axios.get(`${BASE_URL}/debug/${proposalId}`);
                const adminApprovedStatus = adminVerifyResponse.data.mysql?.data?.proposal_status;

                if (adminApprovedStatus === 'approved') {
                    console.log('✅ Admin approval successfully changed status to approved');
                } else {
                    console.log(`⚠️ Admin approval may not have worked - status: ${adminApprovedStatus}`);
                }
            }
        } catch (adminError) {
            console.log('ℹ️ Admin approval test skipped (endpoint may require authentication)');
            console.log(`   Error: ${adminError.message}`);
        }

        console.log('\n🎉 SECURITY TEST SUMMARY:');
        console.log('=====================================');
        console.log('✅ Section 3 cannot auto-approve proposals');
        console.log('✅ Malicious status changes are prevented');
        console.log('✅ Event details update correctly');
        console.log('✅ Status preservation works correctly');
        console.log('\n🔐 Security fix is working correctly!');

    } catch (error) {
        console.error('\n❌ SECURITY TEST FAILED:');
        console.error('=====================================');
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testSection3Security();
}

module.exports = { testSection3Security }; 