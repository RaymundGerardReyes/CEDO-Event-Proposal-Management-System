const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');
const { validateAdmin, validateToken } = require('../../middleware/auth');
const { handleErrors } = require('./middleware');

// Apply authentication middleware to all report routes
router.use(validateToken, validateAdmin);

// ===============================================
// REPORT GENERATION ENDPOINTS
// ===============================================

/**
 * @route GET /api/admin/reports/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (Admin)
 */
router.get("/dashboard/stats", async (req, res, next) => {
    try {
        console.log('🔍 [Dashboard Stats] Fetching proposal statistics...');

        // Get proposal statistics using correct column names
        const [proposalStats] = await pool.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN proposal_status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN proposal_status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN proposal_status = 'rejected' OR proposal_status = 'denied' THEN 1 ELSE 0 END) as rejected
            FROM proposals
        `);

        // Get yesterday's total for growth calculation (using DATE_SUB for better compatibility)
        const [yesterdayStats] = await pool.query(`
            SELECT COUNT(*) as yesterdayTotal
            FROM proposals 
            WHERE created_at < DATE_SUB(CURDATE(), INTERVAL 0 DAY)
        `);

        // Get new proposals since yesterday
        const [newTodayStats] = await pool.query(`
            SELECT COUNT(*) as newSinceYesterday
            FROM proposals 
            WHERE created_at >= CURDATE()
        `);

        // Get user statistics (check if columns exist first)
        const [userStats] = await pool.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
                SUM(CASE WHEN role = 'faculty' THEN 1 ELSE 0 END) as faculty
            FROM users
        `);

        // Get recent proposals with correct column names
        const [recentProposals] = await pool.query(`
            SELECT 
                id, 
                event_name as eventName, 
                proposal_status as status, 
                COALESCE(submitted_at, created_at) as submittedAt, 
                contact_name as contactPerson
            FROM proposals
            WHERE event_name IS NOT NULL
            ORDER BY COALESCE(submitted_at, created_at) DESC
            LIMIT 5
        `);

        // Get event type distribution
        const [eventTypes] = await pool.query(`
            SELECT 
                COALESCE(school_event_type, community_event_type, 'other') as eventType, 
                COUNT(*) as count
            FROM proposals
            WHERE COALESCE(school_event_type, community_event_type) IS NOT NULL
            GROUP BY COALESCE(school_event_type, community_event_type)
            ORDER BY count DESC
        `);

        // Calculate metrics safely
        const currentTotal = proposalStats[0]?.total || 0;
        const yesterdayTotal = yesterdayStats[0]?.yesterdayTotal || 0;
        const newSinceYesterday = newTodayStats[0]?.newSinceYesterday || 0;

        const dayOverDayChange = yesterdayTotal > 0
            ? ((currentTotal - yesterdayTotal) / yesterdayTotal * 100).toFixed(1)
            : 0;

        const approved = proposalStats[0]?.approved || 0;
        const approvalRate = currentTotal > 0
            ? ((approved / currentTotal) * 100).toFixed(0)
            : 0;

        console.log('✅ [Dashboard Stats] Statistics calculated:', {
            total: currentTotal,
            pending: proposalStats[0]?.pending || 0,
            approved: approved,
            rejected: proposalStats[0]?.rejected || 0,
            newSinceYesterday,
            approvalRate
        });

        res.json({
            success: true,
            stats: {
                proposals: {
                    ...proposalStats[0],
                    newSinceYesterday,
                    dayOverDayChange: parseFloat(dayOverDayChange),
                    approvalRate: parseInt(approvalRate),
                    yesterdayTotal
                },
                users: userStats[0] || { total: 0, students: 0, admins: 0, faculty: 0 },
                recentProposals: recentProposals || [],
                eventTypes: eventTypes || [],
            },
        });
    } catch (error) {
        console.error('❌ [Dashboard Stats] Error:', error.message);
        next(error);
    }
});

/**
 * @route GET /api/admin/reports/proposals
 * @desc Generate proposal report with filters
 * @access Private (Admin)
 */
router.get("/proposals", async (req, res, next) => {
    try {
        const { startDate, endDate, status, eventType, format = "json" } = req.query

        // Build query with filters using correct column names
        let query = "SELECT * FROM proposals WHERE 1=1"
        const queryParams = []

        if (startDate) {
            query += " AND COALESCE(submitted_at, created_at) >= ?"
            queryParams.push(new Date(startDate))
        }

        if (endDate) {
            query += " AND COALESCE(submitted_at, created_at) <= ?"
            queryParams.push(new Date(endDate))
        }

        if (status && status !== "all") {
            query += " AND proposal_status = ?"
            queryParams.push(status)
        }

        if (eventType && eventType !== "all") {
            query += " AND (school_event_type = ? OR community_event_type = ?)"
            queryParams.push(eventType, eventType)
        }

        // Execute query
        const [proposals] = await pool.query(query, queryParams)

        // Format response based on requested format
        if (format === "csv") {
            // Convert to CSV
            const fields = Object.keys(proposals[0] || {})
            let csv = fields.join(",") + "\n"

            proposals.forEach((proposal) => {
                const row = fields.map((field) => {
                    const value = proposal[field]
                    // Handle values that need escaping
                    if (value === null || value === undefined) return ""
                    if (typeof value === "string" && (value.includes(',') || value.includes('"') || value.includes("\n"))) {
                        return `"${value.replace(/"/g, '""')}"`
                    }
                    return value
                })
                csv += row.join(",") + "\n"
            })

            res.setHeader("Content-Type", "text/csv")
            res.setHeader("Content-Disposition", 'attachment; filename="proposal-report.csv"')
            return res.send(csv)
        }

        // Default JSON response
        res.json({
            success: true,
            count: proposals.length,
            proposals,
        })
    } catch (error) {
        next(error)
    }
});

// Apply error handler to all routes
router.use(handleErrors);

module.exports = router; 