const { pool } = require('./config/db');

async function testDashboardLogic() {
    console.log('🧪 Testing Dashboard Logic (No Auth)');
    console.log('='.repeat(50));

    try {
        // Test with a known user email
        const testEmail = 'admin@cedo.gov.ph';

        console.log('🔍 Testing dashboard logic for user:', testEmail);

        // Get user's proposals from MySQL
        const [proposals] = await pool.query(`
            SELECT 
                id,
                event_name,
                event_start_date,
                event_end_date,
                proposal_status,
                event_status,
                school_return_service_credit,
                community_sdp_credits,
                created_at,
                updated_at
            FROM proposals 
            WHERE contact_email = ? AND is_deleted = FALSE
            ORDER BY created_at DESC
        `, [testEmail]);

        console.log(`📊 Found ${proposals.length} proposals for user`);

        // Calculate SDP credits and event statistics
        let totalEarnedCredits = 0;
        let pendingCredits = 0;
        const now = new Date();
        const upcomingEvents = [];
        const recentEvents = [];

        const stats = {
            sdpCredits: {
                totalEarned: 0,
                pending: 0,
                totalRequired: 36
            },
            events: {
                upcoming: 0,
                total: 0,
                approved: 0,
                pending: 0,
                draft: 0,
                rejected: 0
            },
            progress: {
                overallPercentage: 0,
                overallText: "0 of 36 credits",
                categories: {
                    leadership: { current: 0, total: 12, percentage: 0 },
                    communityService: { current: 0, total: 12, percentage: 0 },
                    professionalDevelopment: { current: 0, total: 12, percentage: 0 }
                }
            },
            recentEvents: []
        };

        proposals.forEach(proposal => {
            // Count events by status
            stats.events.total++;

            switch (proposal.proposal_status) {
                case 'approved':
                    stats.events.approved++;
                    // Calculate earned credits for approved events
                    if (proposal.school_return_service_credit && proposal.school_return_service_credit !== 'Not Applicable') {
                        totalEarnedCredits += parseInt(proposal.school_return_service_credit);
                    }
                    if (proposal.community_sdp_credits) {
                        totalEarnedCredits += parseInt(proposal.community_sdp_credits);
                    }
                    break;
                case 'pending':
                    stats.events.pending++;
                    // Calculate pending credits
                    if (proposal.school_return_service_credit && proposal.school_return_service_credit !== 'Not Applicable') {
                        pendingCredits += parseInt(proposal.school_return_service_credit);
                    }
                    if (proposal.community_sdp_credits) {
                        pendingCredits += parseInt(proposal.community_sdp_credits);
                    }
                    break;
                case 'draft':
                    stats.events.draft++;
                    break;
                case 'denied':
                    stats.events.rejected++;
                    break;
            }

            // Check for upcoming events (approved events with future dates)
            if (proposal.proposal_status === 'approved' && proposal.event_start_date) {
                const eventDate = new Date(proposal.event_start_date);
                if (eventDate > now) {
                    upcomingEvents.push({
                        id: proposal.id,
                        title: proposal.event_name,
                        date: proposal.event_start_date,
                        status: proposal.proposal_status,
                        type: proposal.school_return_service_credit ? 'school' : 'community',
                        credits: proposal.school_return_service_credit || proposal.community_sdp_credits || 0
                    });
                }
            }

            // Add to recent events (last 10)
            if (recentEvents.length < 10) {
                recentEvents.push({
                    id: proposal.id,
                    title: proposal.event_name,
                    date: proposal.event_start_date,
                    status: proposal.proposal_status,
                    type: proposal.school_return_service_credit ? 'school' : 'community',
                    credits: proposal.school_return_service_credit || proposal.community_sdp_credits || 0
                });
            }
        });

        // Update SDP credits
        stats.sdpCredits.totalEarned = totalEarnedCredits;
        stats.sdpCredits.pending = pendingCredits;
        stats.events.upcoming = upcomingEvents.length;
        stats.recentEvents = recentEvents;

        // Calculate overall progress
        const overallPercentage = Math.round((totalEarnedCredits / stats.sdpCredits.totalRequired) * 100);
        stats.progress.overallPercentage = Math.min(overallPercentage, 100);
        stats.progress.overallText = `${totalEarnedCredits} of ${stats.sdpCredits.totalRequired} credits`;

        console.log('✅ Dashboard logic test successful!');
        console.log('📊 Calculated stats:', JSON.stringify(stats, null, 2));

    } catch (error) {
        console.error('❌ Dashboard logic test failed:', error.message);
    } finally {
        // Close the database connection
        await pool.end();
    }
}

// Run the test
testDashboardLogic(); 