/**
 * Simple test for drafts API integration
 */

const { query } = require('./config/database-postgresql-only');

async function testDraftsIntegration() {
    try {
        console.log('🧪 Testing Drafts Integration...');
        console.log('='.repeat(50));

        // 1. Check what proposals exist
        console.log('\n📊 Current proposals in database:');
        const allProposals = await query(`
            SELECT p.uuid, p.organization_name, p.event_name, p.proposal_status, p.user_id, u.name as user_name, u.email as user_email
            FROM proposals p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.is_deleted = false
            ORDER BY p.created_at DESC
            LIMIT 10
        `);

        allProposals.rows.forEach((proposal, index) => {
            console.log(`  ${index + 1}. ${proposal.organization_name} - ${proposal.event_name}`);
            console.log(`     Status: ${proposal.proposal_status}, User: ${proposal.user_name} (${proposal.user_email})`);
            console.log(`     UUID: ${proposal.uuid}`);
        });

        // 2. Check drafts specifically
        console.log('\n📋 Draft proposals:');
        const draftProposals = await query(`
            SELECT p.uuid, p.organization_name, p.event_name, p.proposal_status, p.user_id, u.name as user_name
            FROM proposals p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.is_deleted = false AND p.proposal_status = 'draft'
        `);

        console.log(`Found ${draftProposals.rows.length} draft proposals:`);
        draftProposals.rows.forEach((proposal, index) => {
            console.log(`  ${index + 1}. ${proposal.organization_name} - ${proposal.event_name} (User: ${proposal.user_name})`);
        });

        // 3. Check denied proposals
        console.log('\n❌ Denied proposals:');
        const deniedProposals = await query(`
            SELECT p.uuid, p.organization_name, p.event_name, p.proposal_status, p.user_id, u.name as user_name
            FROM proposals p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.is_deleted = false AND p.proposal_status = 'denied'
        `);

        console.log(`Found ${deniedProposals.rows.length} denied proposals:`);
        deniedProposals.rows.forEach((proposal, index) => {
            console.log(`  ${index + 1}. ${proposal.organization_name} - ${proposal.event_name} (User: ${proposal.user_name})`);
        });

        // 4. Test the query that the API endpoint uses
        console.log('\n🔍 Testing API endpoint query for user ID 4 (Demo Student):');
        const apiTestQuery = await query(`
            SELECT 
                p.uuid,
                p.organization_name,
                p.organization_type,
                p.contact_person,
                p.contact_email,
                p.contact_phone,
                p.event_name,
                p.event_venue,
                p.event_start_date,
                p.event_end_date,
                p.event_start_time,
                p.event_end_time,
                p.event_mode,
                p.event_type,
                p.target_audience,
                p.sdp_credits,
                p.current_section,
                p.form_completion_percentage,
                p.proposal_status,
                p.report_status,
                p.event_status,
                p.attendance_count,
                p.objectives,
                p.budget,
                p.volunteers_needed,
                p.report_description,
                p.admin_comments,
                p.submitted_at,
                p.approved_at,
                p.created_at,
                p.updated_at,
                u.name as user_name,
                u.email as user_email
            FROM proposals p
            LEFT JOIN users u ON p.user_id = u.id
            WHERE p.user_id = $1 
                AND p.is_deleted = false 
                AND p.proposal_status IN ('draft', 'denied')
            ORDER BY p.updated_at DESC
            LIMIT $2 OFFSET $3
        `, [4, 100, 0]); // User ID 4, limit 100, offset 0

        console.log(`API query returned ${apiTestQuery.rows.length} proposals for user ID 4:`);
        apiTestQuery.rows.forEach((proposal, index) => {
            console.log(`  ${index + 1}. ${proposal.organization_name} - ${proposal.event_name}`);
            console.log(`     Status: ${proposal.proposal_status}, UUID: ${proposal.uuid}`);
        });

        console.log('\n✅ Drafts integration test completed!');
        console.log('\n📊 Summary:');
        console.log(`- Total proposals: ${allProposals.rows.length}`);
        console.log(`- Draft proposals: ${draftProposals.rows.length}`);
        console.log(`- Denied proposals: ${deniedProposals.rows.length}`);
        console.log(`- API query results for user 4: ${apiTestQuery.rows.length}`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

testDraftsIntegration();



