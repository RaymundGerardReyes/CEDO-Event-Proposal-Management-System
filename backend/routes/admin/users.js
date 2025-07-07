const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');
const { validateAdmin, validateToken } = require('../../middleware/auth');
const { handleErrors } = require('./middleware');

// Apply authentication middleware to all user management routes
router.use(validateToken, validateAdmin);

// ===============================================
// USER MANAGEMENT ENDPOINTS
// ===============================================

/**
 * @route GET /api/admin/users
 * @desc Get all users for admin management
 * @access Private (Admin)
 */
router.get('/', async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT 
                id, name, email, role, organization, organization_type, 
                is_approved, created_at, last_login 
            FROM users 
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error('Admin users error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve users',
            message: error.message
        });
    }
});

/**
 * @route GET /api/admin/users/stats
 * @desc Get user statistics for admin dashboard
 * @access Private (Admin)
 */
router.get('/stats', async (req, res) => {
    try {
        console.log('Admin user stats endpoint hit by user:', req.user?.id);

        // Get various user statistics from the database
        const [userStats] = await pool.query('SELECT COUNT(*) as total FROM users');
        const [proposalStats] = await pool.query('SELECT COUNT(*) as total FROM proposals');
        const [pendingApprovals] = await pool.query('SELECT COUNT(*) as total FROM users WHERE is_approved = 0');

        // Get recent activity (last 30 days)
        const [recentUsers] = await pool.query(
            'SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );

        // Get approved vs pending users
        const [approvedUsers] = await pool.query('SELECT COUNT(*) as total FROM users WHERE is_approved = 1');

        const stats = {
            totalUsers: userStats[0].total,
            totalProposals: proposalStats[0].total,
            pendingApprovals: pendingApprovals[0].total,
            approvedUsers: approvedUsers[0].total,
            recentUsers: recentUsers[0].total,
            timestamp: new Date().toISOString()
        };

        console.log('Admin user stats retrieved successfully:', stats);

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Admin user stats error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve admin user statistics',
            message: error.message
        });
    }
});

// Apply error handler to all routes
router.use(handleErrors);

module.exports = router; 