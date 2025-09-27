/**
 * Test if proposal exists for file upload
 */

const { query } = require('./config/database-postgresql-only');

async function testProposalExists() {
    try {
        console.log('🧪 Testing if proposal exists for file upload...');

        const testUUID = 'ecad7631-cefb-4271-ba40-9cb698bcf3fe';
        console.log('📋 Testing UUID:', testUUID);

        const result = await query(
            'SELECT uuid, proposal_status, created_at FROM proposals WHERE uuid = $1',
            [testUUID]
        );

        if (result.rows.length > 0) {
            const proposal = result.rows[0];
            console.log('✅ Proposal exists:');
            console.log('  UUID:', proposal.uuid);
            console.log('  Status:', proposal.proposal_status);
            console.log('  Created:', proposal.created_at);
            return true;
        } else {
            console.log('❌ Proposal not found');
            return false;
        }
    } catch (error) {
        console.error('❌ Error checking proposal:', error.message);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testProposalExists().then(exists => {
        console.log('🏁 Test result:', exists ? '✅ PASS' : '❌ FAIL');
    });
}

module.exports = { testProposalExists };
