/**
 * Create test proposals for a student user to test the drafts page
 */

const { query } = require('./config/database-postgresql-only');

async function createTestProposalsForStudent() {
    try {
        console.log('📝 Creating test proposals for student user...');

        // Get a student user ID
        const userResult = await query('SELECT id, email, name FROM users WHERE role = $1 LIMIT 1', ['student']);
        if (userResult.rows.length === 0) {
            throw new Error('No student users found');
        }
        const user = userResult.rows[0];
        console.log('👤 Using student user:', user.email, '(ID:', user.id, ')');

        // Create test draft proposals
        const draftProposals = [
            {
                organization_name: 'Xavier University Student Council',
                organization_type: 'school-based',
                contact_person: 'John Doe',
                contact_email: 'john.doe@xu.edu.ph',
                contact_phone: '09123456789',
                event_name: 'Community Service Program',
                event_venue: 'Xavier University Campus',
                event_start_date: '2025-02-15',
                event_end_date: '2025-02-15',
                event_start_time: '09:00:00',
                event_end_time: '17:00:00',
                event_mode: 'offline',
                event_type: 'seminar-webinar',
                target_audience: JSON.stringify(['1st_year', '2nd_year']),
                sdp_credits: 2,
                current_section: 'orgInfo',
                form_completion_percentage: 25.00,
                proposal_status: 'draft',
                report_status: 'draft',
                event_status: 'scheduled'
            },
            {
                organization_name: 'Environmental Club',
                organization_type: 'community-based',
                contact_person: 'Jane Smith',
                contact_email: 'jane.smith@xu.edu.ph',
                contact_phone: '09876543210',
                event_name: 'Tree Planting Initiative',
                event_venue: 'Cagayan de Oro City Park',
                event_start_date: '2025-03-01',
                event_end_date: '2025-03-01',
                event_start_time: '08:00:00',
                event_end_time: '12:00:00',
                event_mode: 'offline',
                event_type: 'academic-enhancement',
                target_audience: JSON.stringify(['all_levels']),
                sdp_credits: 3,
                current_section: 'eventInformation',
                form_completion_percentage: 60.00,
                proposal_status: 'draft',
                report_status: 'draft',
                event_status: 'scheduled'
            }
        ];

        // Create test denied proposal
        const deniedProposal = {
            organization_name: 'Sports Club',
            organization_type: 'school-based',
            contact_person: 'Mike Johnson',
            contact_email: 'mike.johnson@xu.edu.ph',
            contact_phone: '09111222333',
            event_name: 'Sports Tournament',
            event_venue: 'University Gymnasium',
            event_start_date: '2025-01-20',
            event_end_date: '2025-01-22',
            event_start_time: '08:00:00',
            event_end_time: '18:00:00',
            event_mode: 'offline',
            event_type: 'general-assembly',
            target_audience: JSON.stringify(['3rd_year', '4th_year']),
            sdp_credits: 1,
            current_section: 'reporting',
            form_completion_percentage: 100.00,
            proposal_status: 'denied',
            report_status: 'draft',
            event_status: 'cancelled',
            admin_comments: 'Event conflicts with academic schedule. Please reschedule for a different date.'
        };

        // Insert draft proposals
        for (const proposal of draftProposals) {
            const result = await query(`
                INSERT INTO proposals (
                    organization_name, organization_type, contact_person, contact_email, contact_phone,
                    event_name, event_venue, event_start_date, event_end_date, event_start_time, event_end_time,
                    event_mode, event_type, target_audience, sdp_credits, current_section,
                    form_completion_percentage, proposal_status, report_status, event_status,
                    user_id, is_deleted
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
                ) RETURNING uuid, id
            `, [
                proposal.organization_name,
                proposal.organization_type,
                proposal.contact_person,
                proposal.contact_email,
                proposal.contact_phone,
                proposal.event_name,
                proposal.event_venue,
                proposal.event_start_date,
                proposal.event_end_date,
                proposal.event_start_time,
                proposal.event_end_time,
                proposal.event_mode,
                proposal.event_type,
                proposal.target_audience,
                proposal.sdp_credits,
                proposal.current_section,
                proposal.form_completion_percentage,
                proposal.proposal_status,
                proposal.report_status,
                proposal.event_status,
                user.id,
                false
            ]);

            console.log('✅ Draft proposal created:', {
                uuid: result.rows[0].uuid,
                event_name: proposal.event_name,
                status: proposal.proposal_status,
                completion: proposal.form_completion_percentage + '%'
            });
        }

        // Insert denied proposal
        const deniedResult = await query(`
            INSERT INTO proposals (
                organization_name, organization_type, contact_person, contact_email, contact_phone,
                event_name, event_venue, event_start_date, event_end_date, event_start_time, event_end_time,
                event_mode, event_type, target_audience, sdp_credits, current_section,
                form_completion_percentage, proposal_status, report_status, event_status,
                admin_comments, user_id, is_deleted
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
            ) RETURNING uuid, id
        `, [
            deniedProposal.organization_name,
            deniedProposal.organization_type,
            deniedProposal.contact_person,
            deniedProposal.contact_email,
            deniedProposal.contact_phone,
            deniedProposal.event_name,
            deniedProposal.event_venue,
            deniedProposal.event_start_date,
            deniedProposal.event_end_date,
            deniedProposal.event_start_time,
            deniedProposal.event_end_time,
            deniedProposal.event_mode,
            deniedProposal.event_type,
            deniedProposal.target_audience,
            deniedProposal.sdp_credits,
            deniedProposal.current_section,
            deniedProposal.form_completion_percentage,
            deniedProposal.proposal_status,
            deniedProposal.report_status,
            deniedProposal.event_status,
            deniedProposal.admin_comments,
            user.id,
            false
        ]);

        console.log('✅ Denied proposal created:', {
            uuid: deniedResult.rows[0].uuid,
            event_name: deniedProposal.event_name,
            status: deniedProposal.proposal_status,
            completion: deniedProposal.form_completion_percentage + '%'
        });

        console.log('\n🎉 Test proposals created successfully!');
        console.log('\n📊 Summary:');
        console.log(`- Student User: ${user.name} (${user.email})`);
        console.log(`- Draft Proposals: ${draftProposals.length}`);
        console.log(`- Denied Proposals: 1`);
        console.log(`- Total Proposals for this user: ${draftProposals.length + 1}`);
        console.log('\n🔗 You can now test the drafts page with this user account.');

    } catch (error) {
        console.error('❌ Error creating test proposals:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

createTestProposalsForStudent();


