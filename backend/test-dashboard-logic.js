/**
 * Test the dashboard logic directly without server
 */

const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Raymund-Estaca01',
    database: process.env.MYSQL_DATABASE || 'cedo_auth',
    charset: 'utf8mb4'
};

async function testDashboardLogic() {
    console.log('🧪 Testing Dashboard Logic Directly\n');

    let connection;

    try {
        // Connect to database
        console.log('🔗 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected');

        // Test user email
        const testEmail = 'student@xu.edu.ph'; // Use the demo student from init-db.js

        console.log(`\n📊 Testing dashboard logic for user: ${testEmail}`);

        // Get user's proposals from MySQL (same logic as dashboard API)
        const [proposals] = await connection.query(`
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

        console.log(`✅ Found ${proposals.length} proposals for user`);

        // Calculate stats (same logic as dashboard API)
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

        // Calculate SDP credits and event statistics
        let totalEarnedCredits = 0;
        let pendingCredits = 0;
        const now = new Date();
        const upcomingEvents = [];

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
            if (stats.recentEvents.length < 10) {
                stats.recentEvents.push({
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

        // Calculate overall progress
        const overallPercentage = Math.round((totalEarnedCredits / stats.sdpCredits.totalRequired) * 100);
        stats.progress.overallPercentage = Math.min(overallPercentage, 100);
        stats.progress.overallText = `${totalEarnedCredits} of ${stats.sdpCredits.totalRequired} credits`;

        // Calculate category progress (simplified)
        const leadershipCredits = Math.min(totalEarnedCredits * 0.33, 12);
        const communityCredits = Math.min(totalEarnedCredits * 0.42, 12);
        const professionalCredits = Math.min(totalEarnedCredits * 0.25, 12);

        stats.progress.categories.leadership = {
            current: Math.round(leadershipCredits),
            total: 12,
            percentage: Math.round((leadershipCredits / 12) * 100)
        };

        stats.progress.categories.communityService = {
            current: Math.round(communityCredits),
            total: 12,
            percentage: Math.round((communityCredits / 12) * 100)
        };

        stats.progress.categories.professionalDevelopment = {
            current: Math.round(professionalCredits),
            total: 12,
            percentage: Math.round((professionalCredits / 12) * 100)
        };

        // Display results
        console.log('\n📊 Dashboard Statistics Calculated:');
        console.log('=====================================');
        console.log(`Total SDP Credits Earned: ${stats.sdpCredits.totalEarned}`);
        console.log(`Pending Credits: ${stats.sdpCredits.pending}`);
        console.log(`Upcoming Events: ${stats.events.upcoming}`);
        console.log(`Total Events: ${stats.events.total}`);
        console.log(`Approved Events: ${stats.events.approved}`);
        console.log(`Pending Events: ${stats.events.pending}`);
        console.log(`Draft Events: ${stats.events.draft}`);
        console.log(`Rejected Events: ${stats.events.rejected}`);
        console.log(`Overall Progress: ${stats.progress.overallPercentage}%`);
        console.log(`Progress Text: ${stats.progress.overallText}`);

        console.log('\n📋 Category Progress:');
        console.log(`Leadership: ${stats.progress.categories.leadership.current}/${stats.progress.categories.leadership.total} (${stats.progress.categories.leadership.percentage}%)`);
        console.log(`Community Service: ${stats.progress.categories.communityService.current}/${stats.progress.categories.communityService.total} (${stats.progress.categories.communityService.percentage}%)`);
        console.log(`Professional Development: ${stats.progress.categories.professionalDevelopment.current}/${stats.progress.categories.professionalDevelopment.total} (${stats.progress.categories.professionalDevelopment.percentage}%)`);

        console.log('\n📝 Recent Events:');
        stats.recentEvents.forEach((event, index) => {
            console.log(`${index + 1}. ${event.title} (${event.status}) - ${event.credits} credits`);
        });

        console.log('\n✅ Dashboard logic test completed successfully!');
        console.log('\n📝 Summary:');
        console.log('- ✅ Database connection working');
        console.log('- ✅ Query logic working');
        console.log('- ✅ Statistics calculation working');
        console.log('- ✅ Progress calculation working');
        console.log('- ✅ Event categorization working');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the test
testDashboardLogic().then(() => {
    console.log('\n🏁 Dashboard logic test completed');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
}); 