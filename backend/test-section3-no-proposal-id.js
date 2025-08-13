const axios = require('axios');
const FormData = require('form-data');
const { pool } = require('./config/db');

// Test configuration
const BASE_URL = 'http://localhost:5000';

async function testSection3NoProposalId() {
    console.log('🧪 Testing Section 3 Save with No Proposal ID');
    console.log('='.repeat(50));

    try {
        // Create FormData with school event data but no proposal_id
        const form = new FormData();

        // Add organization and contact information
        form.append('organization_name', 'Test School');
        form.append('contact_person', 'John Doe');
        form.append('contact_email', 'john.doe@testschool.edu.ph');
        form.append('contact_phone', '+63-912-345-6789');

        // Add event data
        form.append('name', 'Test Academic Event');
        form.append('venue', 'School Auditorium');
        form.append('start_date', '2025-02-15');
        form.append('end_date', '2025-02-15');
        form.append('time_start', '09:00');
        form.append('time_end', '17:00');
        form.append('event_type', 'academic');
        form.append('event_mode', 'offline');
        form.append('return_service_credit', '3');
        form.append('target_audience', JSON.stringify(['students', 'faculty']));
        form.append('proposal_status', 'pending');

        console.log('📤 Sending request to MongoDB unified API...');
        console.log('📤 URL:', `${BASE_URL}/api/mongodb-unified/proposals/school-events`);
        console.log('📤 Note: No proposal_id provided - should create new proposal');

        const response = await axios.post(`${BASE_URL}/api/mongodb-unified/proposals/school-events`, form, {
            headers: {
                ...form.getHeaders(),
            },
            timeout: 30000
        });

        console.log('✅ Response received:');
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('🎉 SUCCESS: Section 3 save worked without proposal ID!');
            console.log('📊 New proposal created with ID:', response.data.data?.id || 'unknown');

            // Check if MySQL proposal was created
            console.log('\n🔍 Checking MySQL database for new proposal...');
            const [proposals] = await pool.query(
                'SELECT id, organization_name, contact_email, event_name, proposal_status FROM proposals WHERE contact_email = ? ORDER BY created_at DESC LIMIT 1',
                ['john.doe@testschool.edu.ph']
            );

            if (proposals.length > 0) {
                const proposal = proposals[0];
                console.log('✅ MySQL proposal found:');
                console.log('  - ID:', proposal.id);
                console.log('  - Organization:', proposal.organization_name);
                console.log('  - Contact Email:', proposal.contact_email);
                console.log('  - Event Name:', proposal.event_name);
                console.log('  - Status:', proposal.proposal_status);
            } else {
                console.log('⚠️ No MySQL proposal found with test email');

                // Check recent proposals to see what's in the database
                console.log('\n🔍 Checking recent proposals in database...');
                const [recentProposals] = await pool.query(
                    'SELECT id, organization_name, contact_email, event_name, proposal_status, created_at FROM proposals ORDER BY created_at DESC LIMIT 5'
                );

                if (recentProposals.length > 0) {
                    console.log('📊 Recent proposals in database:');
                    recentProposals.forEach((proposal, index) => {
                        console.log(`  ${index + 1}. ID: ${proposal.id}, Org: ${proposal.organization_name}, Email: ${proposal.contact_email}, Event: ${proposal.event_name}, Status: ${proposal.proposal_status}, Created: ${proposal.created_at}`);
                    });
                } else {
                    console.log('📊 No proposals found in database');
                }
            }
        } else {
            console.log('❌ FAILED: Response indicates failure');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.response ? error.response.data : error.message);

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    } finally {
        // Close the database connection
        await pool.end();
    }
}

// Run the test
testSection3NoProposalId(); 