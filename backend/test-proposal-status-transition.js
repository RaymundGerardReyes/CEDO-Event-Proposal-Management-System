const axios = require('axios');
const FormData = require('form-data');
const { pool } = require('./config/db');

// Test configuration
const BASE_URL = 'http://localhost:5000';

async function testProposalStatusTransition() {
    console.log('🧪 Testing Proposal Status Transition (Draft → Pending)');
    console.log('='.repeat(60));

    try {
        // Step 1: Create a draft proposal first
        console.log('\n📝 Step 1: Creating a draft proposal...');
        console.log('-'.repeat(40));

        const draftForm = new FormData();
        draftForm.append('organization_name', 'Test Status Transition School');
        draftForm.append('contact_person', 'Status Test User');
        draftForm.append('contact_email', 'status.test@school.edu.ph');
        draftForm.append('contact_phone', '+63-912-345-6789');

        // Send minimal data to create a draft
        draftForm.append('name', 'Draft Event');
        draftForm.append('venue', 'Draft Venue');
        draftForm.append('start_date', '2025-04-01');
        draftForm.append('end_date', '2025-04-01');
        draftForm.append('time_start', '09:00');
        draftForm.append('time_end', '17:00');
        draftForm.append('event_type', 'academic');
        draftForm.append('event_mode', 'offline');
        draftForm.append('return_service_credit', '1');
        draftForm.append('target_audience', JSON.stringify(['students']));
        draftForm.append('proposal_status', 'draft');

        console.log('📤 Sending draft creation request...');
        const draftResponse = await axios.post(`${BASE_URL}/api/mongodb-unified/proposals/school-events`, draftForm, {
            headers: {
                ...draftForm.getHeaders(),
            },
            timeout: 30000
        });

        console.log('✅ Draft Response:');
        console.log('Status:', draftResponse.status);
        console.log('Data:', JSON.stringify(draftResponse.data, null, 2));

        // Step 2: Check the database for the created proposal
        console.log('\n🔍 Step 2: Checking database for created proposal...');
        console.log('-'.repeat(40));

        const [draftProposals] = await pool.query(
            `SELECT id, uuid, organization_name, proposal_status, form_completion_percentage, created_at 
             FROM proposals 
             WHERE organization_name = 'Test Status Transition School' 
             ORDER BY created_at DESC 
             LIMIT 1`
        );

        if (draftProposals.length === 0) {
            console.log('❌ No draft proposal found in database');
            return;
        }

        const draftProposal = draftProposals[0];
        console.log('📊 Draft proposal found:');
        console.log('  - ID:', draftProposal.id);
        console.log('  - UUID:', draftProposal.uuid);
        console.log('  - Status:', draftProposal.proposal_status);
        console.log('  - Completion:', draftProposal.form_completion_percentage + '%');
        console.log('  - Created:', draftProposal.created_at);

        // Step 3: Submit the same proposal again (simulating form completion)
        console.log('\n📤 Step 3: Submitting completed form (same proposal ID)...');
        console.log('-'.repeat(40));

        const completeForm = new FormData();
        completeForm.append('proposal_id', draftProposal.id); // Use existing proposal ID
        completeForm.append('organization_name', 'Test Status Transition School');
        completeForm.append('contact_person', 'Status Test User');
        completeForm.append('contact_email', 'status.test@school.edu.ph');
        completeForm.append('contact_phone', '+63-912-345-6789');

        // Complete form data
        completeForm.append('name', 'Complete Academic Workshop');
        completeForm.append('venue', 'School Auditorium');
        completeForm.append('start_date', '2025-04-01');
        completeForm.append('end_date', '2025-04-01');
        completeForm.append('time_start', '09:00');
        completeForm.append('time_end', '17:00');
        completeForm.append('event_type', 'academic');
        completeForm.append('event_mode', 'offline');
        completeForm.append('return_service_credit', '3');
        completeForm.append('target_audience', JSON.stringify(['students', 'faculty', 'staff']));
        completeForm.append('proposal_status', 'pending');

        console.log('📤 Sending completed form request...');
        const completeResponse = await axios.post(`${BASE_URL}/api/mongodb-unified/proposals/school-events`, completeForm, {
            headers: {
                ...completeForm.getHeaders(),
            },
            timeout: 30000
        });

        console.log('✅ Complete Form Response:');
        console.log('Status:', completeResponse.status);
        console.log('Data:', JSON.stringify(completeResponse.data, null, 2));

        // Step 4: Check the database for status update
        console.log('\n🔍 Step 4: Checking database for status update...');
        console.log('-'.repeat(40));

        const [updatedProposals] = await pool.query(
            `SELECT id, uuid, organization_name, proposal_status, form_completion_percentage, submitted_at, updated_at 
             FROM proposals 
             WHERE id = ?`,
            [draftProposal.id]
        );

        if (updatedProposals.length === 0) {
            console.log('❌ Updated proposal not found in database');
            return;
        }

        const updatedProposal = updatedProposals[0];
        console.log('📊 Updated proposal:');
        console.log('  - ID:', updatedProposal.id);
        console.log('  - UUID:', updatedProposal.uuid);
        console.log('  - Status:', updatedProposal.proposal_status);
        console.log('  - Completion:', updatedProposal.form_completion_percentage + '%');
        console.log('  - Submitted:', updatedProposal.submitted_at);
        console.log('  - Updated:', updatedProposal.updated_at);

        // Step 5: Verify the transition
        console.log('\n✅ Step 5: Verifying status transition...');
        console.log('-'.repeat(40));

        if (updatedProposal.proposal_status === 'pending') {
            console.log('🎉 SUCCESS: Proposal status correctly transitioned from draft to pending!');
            console.log('📈 Form completion percentage:', updatedProposal.form_completion_percentage + '%');
            console.log('📅 Submitted at:', updatedProposal.submitted_at);
        } else {
            console.log('❌ FAILED: Proposal status did not transition properly');
            console.log('Expected: pending, Got:', updatedProposal.proposal_status);
        }

        console.log('\n🎉 Proposal Status Transition Test Completed!');

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
testProposalStatusTransition(); 