/**
 * Create a test draft proposal for testing the drafts API
 */

const { query } = require('./config/database-postgresql-only');

async function createTestDraft() {
    try {
        console.log('📝 Creating test draft proposal...');

        // Get a student user ID
        const userResult = await query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['student']);
        if (userResult.rows.length === 0) {
            throw new Error('No student users found');
        }
        const userId = userResult.rows[0].id;
        console.log('👤 Using user ID:', userId);

        // Create a test draft proposal
        const draftProposal = await query(`
            INSERT INTO proposals (
                organization_name,
                organization_type,
                contact_person,
                contact_email,
                contact_phone,
                event_name,
                event_venue,
                event_start_date,
                event_end_date,
                event_start_time,
                event_end_time,
                event_mode,
                event_type,
                target_audience,
                sdp_credits,
                current_section,
                form_completion_percentage,
                proposal_status,
                report_status,
                event_status,
                user_id,
                is_deleted
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
            ) RETURNING uuid, id
        `, [
            'Test Organization',           // organization_name
            'school-based',               // organization_type
            'Test Contact Person',        // contact_person
            'test@example.com',           // contact_email
            '09123456789',                // contact_phone
            'Test Draft Event',           // event_name
            'Test Venue',                 // event_venue
            '2025-02-01',                // event_start_date
            '2025-02-01',                // event_end_date
            '09:00:00',                  // event_start_time
            '17:00:00',                  // event_end_time
            'offline',                   // event_mode
            'seminar-webinar',           // event_type
            JSON.stringify(['1st_year', '2nd_year']), // target_audience
            1,                           // sdp_credits
            'orgInfo',                   // current_section
            25.00,                       // form_completion_percentage
            'draft',                     // proposal_status
            'draft',                     // report_status
            'scheduled',                 // event_status
            userId,                      // user_id
            false                        // is_deleted
        ]);

        console.log('✅ Test draft proposal created:');
        console.log('  - UUID:', draftProposal.rows[0].uuid);
        console.log('  - ID:', draftProposal.rows[0].id);
        console.log('  - User ID:', userId);

        // Also create a rejected proposal
        const rejectedProposal = await query(`
            INSERT INTO proposals (
                organization_name,
                organization_type,
                contact_person,
                contact_email,
                contact_phone,
                event_name,
                event_venue,
                event_start_date,
                event_end_date,
                event_start_time,
                event_end_time,
                event_mode,
                event_type,
                target_audience,
                sdp_credits,
                current_section,
                form_completion_percentage,
                proposal_status,
                report_status,
                event_status,
                user_id,
                is_deleted
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
            ) RETURNING uuid, id
        `, [
            'Rejected Organization',     // organization_name
            'community-based',           // organization_type
            'Rejected Contact Person',   // contact_person
            'rejected@example.com',      // contact_email
            '09876543210',               // contact_phone
            'Rejected Event',            // event_name
            'Rejected Venue',            // event_venue
            '2025-03-01',               // event_start_date
            '2025-03-01',               // event_end_date
            '10:00:00',                 // event_start_time
            '16:00:00',                 // event_end_time
            'online',                   // event_mode
            'seminar-webinar',          // event_type
            JSON.stringify(['all_levels']), // target_audience
            2,                          // sdp_credits
            'reporting',                // current_section
            100.00,                     // form_completion_percentage
            'denied',                   // proposal_status
            'draft',                    // report_status
            'cancelled',                // event_status
            userId,                     // user_id
            false                       // is_deleted
        ]);

        console.log('✅ Test rejected proposal created:');
        console.log('  - UUID:', rejectedProposal.rows[0].uuid);
        console.log('  - ID:', rejectedProposal.rows[0].id);

        console.log('\n🎉 Test proposals created successfully!');
        console.log('You can now test the drafts API endpoint.');

    } catch (error) {
        console.error('❌ Error creating test proposals:', error);
    }
}

createTestDraft();
