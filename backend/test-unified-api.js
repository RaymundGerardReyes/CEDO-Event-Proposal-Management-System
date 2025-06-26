const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Test the unified API endpoints
async function testUnifiedAPI() {
    const baseURL = 'http://localhost:5000/api/mongodb-unified';

    console.log('🧪 Testing Unified API endpoints...\n');

    try {
        // Test 1: Check if proposal exists
        console.log('📋 Test 1: Fetching proposal data...');
        try {
            const response = await axios.get(`${baseURL}/proposal/175`);
            console.log('✅ Proposal fetch successful:', {
                success: response.data.success,
                proposalId: response.data.proposal?.id,
                organizationName: response.data.proposal?.organization_name,
                hasFiles: response.data.has_files,
                fileTypes: Object.keys(response.data.files || {})
            });
        } catch (error) {
            console.log('❌ Proposal fetch failed:', error.response?.data || error.message);
        }

        // Test 2: Submit Section 5 data (without files)
        console.log('\n📋 Test 2: Submitting Section 5 data...');
        const formData = new FormData();
        formData.append('proposal_id', '175');
        formData.append('event_status', 'completed');
        formData.append('event_venue', 'Test Venue Updated');
        formData.append('report_description', 'Test report description from unified API');
        formData.append('organization_name', 'ISDA Bulua');
        formData.append('event_name', 'ISDA Bulua Event');
        formData.append('event_start_date', '2025-01-20');
        formData.append('event_end_date', '2025-01-25');

        try {
            const response = await axios.post(`${baseURL}/section5-reporting`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            console.log('✅ Section 5 submission successful:', {
                success: response.data.success,
                proposalId: response.data.proposal_id,
                filesUploaded: Object.keys(response.data.files_uploaded || {}),
                mysqlUpdated: !!response.data.mysql_data
            });
        } catch (error) {
            console.log('❌ Section 5 submission failed:', error.response?.data || error.message);
        }

        // Test 3: Verify data was saved
        console.log('\n📋 Test 3: Verifying data was saved...');
        try {
            const response = await axios.get(`${baseURL}/proposal/175`);
            const proposal = response.data.proposal;
            console.log('✅ Data verification successful:', {
                eventStatus: proposal?.event_status,
                eventVenue: proposal?.event_venue,
                reportDescription: proposal?.report_description,
                eventStartDate: proposal?.event_start_date,
                eventEndDate: proposal?.event_end_date,
                updatedAt: proposal?.updated_at
            });
        } catch (error) {
            console.log('❌ Data verification failed:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
}

// Run the tests
testUnifiedAPI().then(() => {
    console.log('\n🎉 Test suite completed!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test suite error:', error);
    process.exit(1);
}); 