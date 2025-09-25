/**
 * Fix Proposal Statuses Script
 * Purpose: Update existing proposals with incorrect status values
 * Approach: Batch update proposals that should be pending but are still draft
 */

const postgresql = require('postgresql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.postgresql_PASSWORD || '',
    database: process.env.DB_NAME || 'cedo_auth',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function fixProposalStatuses() {
    let connection;

    try {
        console.log('🔧 Starting proposal status fix...');
        console.log('📊 Database config:', {
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            database: dbConfig.database
        });

        // Create database connection
        connection = await postgresql.createConnection(dbConfig);
        console.log('✅ Database connected');

        // Find proposals that should be pending but are still draft
        console.log('🔍 Finding proposals that need status updates...');

        const [proposals] = await connection.query(`
            SELECT id, uuid, proposal_status, report_status, form_completion_percentage, created_at, updated_at
            FROM proposals 
            WHERE proposal_status = 'draft' 
            AND form_completion_percentage >= 80
            AND updated_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
        `);

        console.log(`📊 Found ${proposals.length} proposals that need status updates`);

        if (proposals.length === 0) {
            console.log('✅ No proposals need status updates');
            return;
        }

        // Update proposals to pending status
        console.log('🔄 Updating proposal statuses...');

        const [updateResult] = await connection.query(`
            UPDATE proposals 
            SET proposal_status = 'pending', 
                report_status = 'pending',
                form_completion_percentage = 100.00,
                updated_at = NOW()
            WHERE proposal_status = 'draft' 
            AND form_completion_percentage >= 80
            AND updated_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
        `);

        console.log(`✅ Updated ${updateResult.affectedRows} proposals to pending status`);

        // Verify the updates
        const [verifyProposals] = await connection.query(`
            SELECT id, uuid, proposal_status, report_status, form_completion_percentage
            FROM proposals 
            WHERE proposal_status = 'pending' 
            AND updated_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        `);

        console.log(`📊 Verification: ${verifyProposals.length} proposals now have pending status`);

        // Show some examples
        if (verifyProposals.length > 0) {
            console.log('📋 Examples of updated proposals:');
            verifyProposals.slice(0, 5).forEach(proposal => {
                console.log(`  - ID: ${proposal.id}, UUID: ${proposal.uuid}, Status: ${proposal.proposal_status}, Report: ${proposal.report_status}`);
            });
        }

        console.log('✅ Proposal status fix completed successfully');

    } catch (error) {
        console.error('❌ Error fixing proposal statuses:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the fix if this script is executed directly
if (require.main === module) {
    fixProposalStatuses()
        .then(() => {
            console.log('🎉 Proposal status fix completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Proposal status fix failed:', error);
            process.exit(1);
        });
}

module.exports = { fixProposalStatuses }; 