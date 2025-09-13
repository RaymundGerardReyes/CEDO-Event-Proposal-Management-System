const express = require("express");
const router = express.Router();
const { pool, query } = require("../config/database");
const { validateToken } = require("../middleware/auth");

// ===============================================
// DASHBOARD STATISTICS ENDPOINTS
// ===============================================

/**
 * @route GET /api/dashboard/stats
 * @desc Get dashboard statistics for the authenticated user
 * @access Private (All authenticated users)
 * 
 * @returns {Object} Dashboard statistics including SDP credits, events, etc.
 */
router.get("/stats", validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;
        const userRole = req.user.role;

        console.log(`📊 DASHBOARD: Fetching stats for user ${userId} (${userEmail}) with role ${userRole}`);

        // Initialize stats object
        const stats = {
            sdpCredits: {
                totalEarned: 0,
                pending: 0,
                totalRequired: 36 // Based on your requirements
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
        `, [userEmail]);

        console.log(`📊 DASHBOARD: Found ${proposals.length} proposals for user`);

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

        // Calculate category progress (simplified - you can enhance this based on your specific requirements)
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

        console.log(`📊 DASHBOARD: Stats calculated successfully`, {
            totalEarned: stats.sdpCredits.totalEarned,
            pending: stats.sdpCredits.pending,
            upcomingEvents: stats.events.upcoming,
            overallProgress: stats.progress.overallPercentage
        });

        res.json({
            success: true,
            stats: stats,
            user: {
                id: userId,
                email: userEmail,
                role: userRole
            }
        });

    } catch (error) {
        console.error("❌ DASHBOARD: Error fetching stats:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch dashboard statistics",
            message: error.message
        });
    }
});

/**
 * @route GET /api/dashboard/recent-events
 * @desc Get recent events for the authenticated user
 * @access Private (All authenticated users)
 * 
 * @returns {Object} Recent events with pagination
 */
router.get("/recent-events", validateToken, async (req, res) => {
    try {
        const userEmail = req.user.email;
        const { limit = 10, status } = req.query;

        console.log(`📊 DASHBOARD: Fetching recent events for ${userEmail}`);

        let query = `
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
        `;

        const params = [userEmail];

        if (status && status !== 'all') {
            query += ' AND proposal_status = ?';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [proposals] = await pool.query(query, params);

        const events = proposals.map(proposal => ({
            id: proposal.id,
            title: proposal.event_name,
            date: proposal.event_start_date,
            status: proposal.proposal_status,
            type: proposal.school_return_service_credit ? 'school' : 'community',
            credits: proposal.school_return_service_credit || proposal.community_sdp_credits || 0
        }));

        res.json({
            success: true,
            events: events,
            total: events.length
        });

    } catch (error) {
        console.error("❌ DASHBOARD: Error fetching recent events:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch recent events",
            message: error.message
        });
    }
});

module.exports = router; 