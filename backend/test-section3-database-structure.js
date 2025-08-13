const axios = require('axios');
const FormData = require('form-data');
const { pool } = require('./config/db');

// Test configuration
const BASE_URL = 'http://localhost:5000';

async function testSection3DatabaseStructure() {
    console.log('🧪 Testing Section 3 Database Structure Compliance');
    console.log('='.repeat(60));

    try {
        // Test 1: School Event with proper database structure
        console.log('\n📚 Test 1: School Event with Database Structure');
        console.log('-'.repeat(40));

        const schoolForm = new FormData();

        // Add organization and contact information
        schoolForm.append('organization_name', 'Test School Database');
        schoolForm.append('contact_person', 'Jane Smith');
        schoolForm.append('contact_email', 'jane.smith@testschool.edu.ph');
        schoolForm.append('contact_phone', '+63-912-345-6789');

        // Add event data with correct enum values
        schoolForm.append('name', 'Academic Enhancement Workshop');
        schoolForm.append('venue', 'School Library');
        schoolForm.append('start_date', '2025-03-15');
        schoolForm.append('end_date', '2025-03-15');
        schoolForm.append('time_start', '09:00');
        schoolForm.append('time_end', '17:00');
        schoolForm.append('event_type', 'academic'); // Should map to 'academic-enhancement'
        schoolForm.append('event_mode', 'offline');
        schoolForm.append('return_service_credit', '3');
        schoolForm.append('target_audience', JSON.stringify(['students', 'faculty', 'staff']));
        schoolForm.append('proposal_status', 'pending');

        console.log('📤 Sending school event request...');
        const schoolResponse = await axios.post(`${BASE_URL}/api/mongodb-unified/proposals/school-events`, schoolForm, {
            headers: {
                ...schoolForm.getHeaders(),
            },
            timeout: 30000
        });

        console.log('✅ School Event Response:');
        console.log('Status:', schoolResponse.status);
        console.log('Data:', JSON.stringify(schoolResponse.data, null, 2));

        // Test 2: Community Event with proper database structure
        console.log('\n🏘️ Test 2: Community Event with Database Structure');
        console.log('-'.repeat(40));

        const communityForm = new FormData();

        // Add organization and contact information
        communityForm.append('organization_name', 'Test Community Organization');
        communityForm.append('contact_person', 'John Doe');
        communityForm.append('contact_email', 'john.doe@community.org');
        communityForm.append('contact_phone', '+63-912-345-6789');

        // Add event data with correct enum values
        communityForm.append('name', 'Leadership Training Seminar');
        communityForm.append('venue', 'Community Center');
        communityForm.append('start_date', '2025-03-20');
        communityForm.append('end_date', '2025-03-20');
        communityForm.append('time_start', '10:00');
        communityForm.append('time_end', '16:00');
        communityForm.append('event_type', 'leadership'); // Should map to 'leadership-training'
        communityForm.append('event_mode', 'hybrid');
        communityForm.append('sdp_credits', '2');
        communityForm.append('target_audience', JSON.stringify(['community leaders', 'volunteers']));
        communityForm.append('proposal_status', 'pending');

        console.log('📤 Sending community event request...');
        const communityResponse = await axios.post(`${BASE_URL}/api/mongodb-unified/proposals/community-events`, communityForm, {
            headers: {
                ...communityForm.getHeaders(),
            },
            timeout: 30000
        });

        console.log('✅ Community Event Response:');
        console.log('Status:', communityResponse.status);
        console.log('Data:', JSON.stringify(communityResponse.data, null, 2));

        // Test 3: Check MySQL database for created proposals
        console.log('\n🔍 Test 3: Checking MySQL Database for Created Proposals');
        console.log('-'.repeat(40));

        const [recentProposals] = await pool.query(
            `SELECT 
                id, uuid, organization_name, organization_type, 
                contact_name, contact_email, event_name, event_venue,
                school_event_type, school_return_service_credit, school_target_audience,
                community_event_type, community_sdp_credits, community_target_audience,
                proposal_status, event_status, current_section, created_at
            FROM proposals 
            WHERE organization_name LIKE '%Test%' 
            ORDER BY created_at DESC 
            LIMIT 5`
        );

        if (recentProposals.length > 0) {
            console.log('📊 Recent test proposals in database:');
            recentProposals.forEach((proposal, index) => {
                console.log(`\n  ${index + 1}. Proposal Details:`);
                console.log(`     ID: ${proposal.id}`);
                console.log(`     UUID: ${proposal.uuid}`);
                console.log(`     Organization: ${proposal.organization_name}`);
                console.log(`     Type: ${proposal.organization_type}`);
                console.log(`     Contact: ${proposal.contact_name} (${proposal.contact_email})`);
                console.log(`     Event: ${proposal.event_name} at ${proposal.event_venue}`);
                console.log(`     School Event Type: ${proposal.school_event_type || 'N/A'}`);
                console.log(`     School Return Credit: ${proposal.school_return_service_credit || 'N/A'}`);
                console.log(`     Community Event Type: ${proposal.community_event_type || 'N/A'}`);
                console.log(`     Community SDP Credits: ${proposal.community_sdp_credits || 'N/A'}`);
                console.log(`     Status: ${proposal.proposal_status}`);
                console.log(`     Event Status: ${proposal.event_status}`);
                console.log(`     Current Section: ${proposal.current_section}`);
                console.log(`     Created: ${proposal.created_at}`);
            });
        } else {
            console.log('⚠️ No test proposals found in database');
        }

        console.log('\n🎉 Database Structure Test Completed Successfully!');

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
testSection3DatabaseStructure(); 