const axios = require('axios');
const FormData = require('form-data');
const { pool } = require('./config/db');

// Test configuration
const BASE_URL = 'http://localhost:5000';

async function testCommunityEventStatusTransition() {
    console.log('🧪 Testing Community Event Proposal Status Transition (Draft → Pending)');
    console.log('='.repeat(70));

    try {
        // Step 1: Create a community event proposal
        console.log('\n🏘️ Step 1: Creating a community event proposal...');
        console.log('-'.repeat(50));

        const communityForm = new FormData();
        communityForm.append('organization_name', 'Test Community Status Organization');
        communityForm.append('contact_person', 'Community Status Test User');
        communityForm.append('contact_email', 'community.status@test.org');
        communityForm.append('contact_phone', '+63-912-345-6789');

        // Complete community event data
        communityForm.append('name', 'Leadership Training Workshop');
        communityForm.append('venue', 'Community Center');
        communityForm.append('start_date', '2025-04-15');
        communityForm.append('end_date', '2025-04-15');
        communityForm.append('time_start', '10:00');
        communityForm.append('time_end', '16:00');
        communityForm.append('event_type', 'leadership'); // Should map to 'leadership-training'
        communityForm.append('event_mode', 'hybrid');
        communityForm.append('sdp_credits', '2');
        communityForm.append('target_audience', JSON.stringify(['community leaders', 'volunteers', 'youth']));
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

        // Step 2: Check the database for the created proposal
        console.log('\n🔍 Step 2: Checking database for created community proposal...');
        console.log('-'.repeat(50));

        const [communityProposals] = await pool.query(
            `SELECT id, uuid, organization_name, organization_type, proposal_status, 
                    form_completion_percentage, community_event_type, community_sdp_credits,
                    submitted_at, created_at 
             FROM proposals 
             WHERE organization_name = 'Test Community Status Organization' 
             ORDER BY created_at DESC 
             LIMIT 1`
        );

        if (communityProposals.length === 0) {
            console.log('❌ No community proposal found in database');
            return;
        }

        const communityProposal = communityProposals[0];
        console.log('📊 Community proposal found:');
        console.log('  - ID:', communityProposal.id);
        console.log('  - UUID:', communityProposal.uuid);
        console.log('  - Organization Type:', communityProposal.organization_type);
        console.log('  - Status:', communityProposal.proposal_status);
        console.log('  - Completion:', communityProposal.form_completion_percentage + '%');
        console.log('  - Event Type:', communityProposal.community_event_type);
        console.log('  - SDP Credits:', communityProposal.community_sdp_credits);
        console.log('  - Submitted:', communityProposal.submitted_at);
        console.log('  - Created:', communityProposal.created_at);

        // Step 3: Submit the same proposal again (simulating form completion)
        console.log('\n📤 Step 3: Submitting completed community form (same proposal ID)...');
        console.log('-'.repeat(50));

        const completeCommunityForm = new FormData();
        completeCommunityForm.append('proposal_id', communityProposal.id); // Use existing proposal ID
        completeCommunityForm.append('organization_name', 'Test Community Status Organization');
        completeCommunityForm.append('contact_person', 'Community Status Test User');
        completeCommunityForm.append('contact_email', 'community.status@test.org');
        completeCommunityForm.append('contact_phone', '+63-912-345-6789');

        // Complete form data
        completeCommunityForm.append('name', 'Advanced Leadership Training Seminar');
        completeCommunityForm.append('venue', 'Community Conference Center');
        completeCommunityForm.append('start_date', '2025-04-15');
        completeCommunityForm.append('end_date', '2025-04-15');
        completeCommunityForm.append('time_start', '10:00');
        completeCommunityForm.append('time_end', '16:00');
        completeCommunityForm.append('event_type', 'leadership');
        completeCommunityForm.append('event_mode', 'hybrid');
        completeCommunityForm.append('sdp_credits', '2');
        completeCommunityForm.append('target_audience', JSON.stringify(['community leaders', 'volunteers', 'youth', 'seniors']));
        completeCommunityForm.append('proposal_status', 'pending');

        console.log('📤 Sending completed community form request...');
        const completeCommunityResponse = await axios.post(`${BASE_URL}/api/mongodb-unified/proposals/community-events`, completeCommunityForm, {
            headers: {
                ...completeCommunityForm.getHeaders(),
            },
            timeout: 30000
        });

        console.log('✅ Complete Community Form Response:');
        console.log('Status:', completeCommunityResponse.status);
        console.log('Data:', JSON.stringify(completeCommunityResponse.data, null, 2));

        // Step 4: Check the database for status update
        console.log('\n🔍 Step 4: Checking database for community proposal status update...');
        console.log('-'.repeat(50));

        const [updatedCommunityProposals] = await pool.query(
            `SELECT id, uuid, organization_name, organization_type, proposal_status, 
                    form_completion_percentage, community_event_type, community_sdp_credits,
                    submitted_at, updated_at 
             FROM proposals 
             WHERE id = ?`,
            [communityProposal.id]
        );

        if (updatedCommunityProposals.length === 0) {
            console.log('❌ Updated community proposal not found in database');
            return;
        }

        const updatedCommunityProposal = updatedCommunityProposals[0];
        console.log('📊 Updated community proposal:');
        console.log('  - ID:', updatedCommunityProposal.id);
        console.log('  - UUID:', updatedCommunityProposal.uuid);
        console.log('  - Organization Type:', updatedCommunityProposal.organization_type);
        console.log('  - Status:', updatedCommunityProposal.proposal_status);
        console.log('  - Completion:', updatedCommunityProposal.form_completion_percentage + '%');
        console.log('  - Event Type:', updatedCommunityProposal.community_event_type);
        console.log('  - SDP Credits:', updatedCommunityProposal.community_sdp_credits);
        console.log('  - Submitted:', updatedCommunityProposal.submitted_at);
        console.log('  - Updated:', updatedCommunityProposal.updated_at);

        // Step 5: Verify the transition
        console.log('\n✅ Step 5: Verifying community event status transition...');
        console.log('-'.repeat(50));

        if (updatedCommunityProposal.proposal_status === 'pending') {
            console.log('🎉 SUCCESS: Community proposal status correctly set to pending!');
            console.log('📈 Form completion percentage:', updatedCommunityProposal.form_completion_percentage + '%');
            console.log('📅 Submitted at:', updatedCommunityProposal.submitted_at);
            console.log('🏘️ Organization type:', updatedCommunityProposal.organization_type);
            console.log('🎯 Event type:', updatedCommunityProposal.community_event_type);
            console.log('⭐ SDP credits:', updatedCommunityProposal.community_sdp_credits);
        } else {
            console.log('❌ FAILED: Community proposal status did not transition properly');
            console.log('Expected: pending, Got:', updatedCommunityProposal.proposal_status);
        }

        console.log('\n🎉 Community Event Status Transition Test Completed!');

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
testCommunityEventStatusTransition(); 