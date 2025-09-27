/**
 * Check existing proposals in the database
 */

const { query } = require('./config/database-postgresql-only');

async function checkProposals() {
    try {
        console.log('🔍 Checking existing proposals in database...');

        // Get all proposals
        const allProposals = await query('SELECT COUNT(*) as total FROM proposals WHERE is_deleted = false');
        console.log('📊 Total proposals:', allProposals.rows[0].total);

        // Get proposals by status
        const statusCounts = await query(`
            SELECT proposal_status, COUNT(*) as count 
            FROM proposals 
            WHERE is_deleted = false 
            GROUP BY proposal_status
        `);
        console.log('📊 Proposals by status:');
        statusCounts.rows.forEach(row => {
            console.log(`  - ${row.proposal_status}: ${row.count}`);
        });

        // Get sample proposals
        const sampleProposals = await query(`
            SELECT uuid, organization_name, event_name, proposal_status, user_id, created_at
            FROM proposals 
            WHERE is_deleted = false 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        console.log('\n📄 Sample proposals:');
        sampleProposals.rows.forEach((proposal, index) => {
            console.log(`  ${index + 1}. ${proposal.organization_name} - ${proposal.event_name} (${proposal.proposal_status}) - User: ${proposal.user_id}`);
        });

        // Check users
        const users = await query('SELECT id, name, email, role FROM users ORDER BY id LIMIT 10');
        console.log('\n👥 Sample users:');
        users.rows.forEach(user => {
            console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
        });

    } catch (error) {
        console.error('❌ Error checking proposals:', error);
    }
}

checkProposals();



