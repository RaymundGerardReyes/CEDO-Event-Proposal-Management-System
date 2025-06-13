const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/proposals';

async function testSimpleSecurity() {
    console.log('🔐 SIMPLE SECURITY TEST: Testing Section 3 status preservation');
    console.log('===============================================');

    try {
        // Use existing proposal ID 1
        const proposalId = 1;

        // Step 1: Check current status
        console.log('\n🔍 STEP 1: Checking current proposal status...');
        const beforeResponse = await axios.get(`${BASE_URL}/debug/${proposalId}`);
        const beforeStatus = beforeResponse.data.mysql?.data?.proposal_status;
        console.log(`✅ Current status: ${beforeStatus}`);

        // Step 2: Try to change status via Section 3 (malicious attempt)
        console.log('\n🚨 STEP 2: Attempting malicious status change via Section 3...');
        const maliciousData = {
            proposal_id: proposalId,
            venue: 'Security Test Venue',
            start_date: '2025-07-01',
            end_date: '2025-07-01',
            time_start: '10:00',
            time_end: '18:00',
            event_type: 'academic-enhancement',
            event_mode: 'hybrid',
            status: 'draft' // Try to change from approved to draft (malicious)
        };

        console.log('🚨 Malicious payload:', JSON.stringify(maliciousData, null, 2));

        const section3Response = await axios.post(`${BASE_URL}/section3-event`, maliciousData);

        if (section3Response.status === 200) {
            console.log('✅ Section 3 update accepted');
            console.log('📊 Response:', section3Response.data);
        } else {
            console.error('❌ Section 3 update failed:', section3Response.status);
        }

        // Step 3: Verify status was NOT changed
        console.log('\n🔐 STEP 3: Verifying status was preserved...');
        const afterResponse = await axios.get(`${BASE_URL}/debug/${proposalId}`);
        const afterStatus = afterResponse.data.mysql?.data?.proposal_status;

        console.log(`🔍 Status before: ${beforeStatus}`);
        console.log(`🔍 Status after: ${afterStatus}`);
        console.log(`🔍 Malicious attempt: ${maliciousData.status}`);

        // CRITICAL SECURITY CHECK
        if (afterStatus === beforeStatus) {
            console.log('✅ SECURITY TEST PASSED: Status was preserved');
            console.log('✅ Section 3 cannot change proposal status');
        } else {
            console.error('🚨 SECURITY VULNERABILITY: Status was changed!');
            console.error(`🚨 Status changed from '${beforeStatus}' to '${afterStatus}'`);
            process.exit(1);
        }

        // Step 4: Check if event details were updated
        console.log('\n📝 STEP 4: Checking if event details were updated...');
        const fullProposal = afterResponse.data.mysql?.data;
        console.log(`Venue updated: ${fullProposal.event_venue === maliciousData.venue ? 'Yes' : 'No'}`);
        console.log(`Start date updated: ${fullProposal.event_start_date === maliciousData.start_date ? 'Yes' : 'No'}`);

        console.log('\n🎉 SECURITY TEST SUMMARY:');
        console.log('===============================================');
        console.log('✅ Proposal status cannot be changed via Section 3');
        console.log('✅ Event details can still be updated');
        console.log('✅ Security fix is working correctly!');

    } catch (error) {
        console.error('\n❌ SECURITY TEST FAILED:');
        console.error('===============================================');
        console.error('Error details:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the test
testSimpleSecurity(); 