const express = require('express');
const router = express.Router();
const { pool, query } = require('../../config/database');
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
        const result = await query(`
            SELECT 
                id, name, email, role, organization, organization_type, 
                is_approved, created_at, last_login 
            FROM users 
            ORDER BY created_at DESC
        `);
        const users = result.rows;

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
 * @route POST /api/admin/users
 * @desc Create a new user (admin only)
 * @access Private (Admin)
 */
router.post('/', async (req, res) => {
    try {
        const { name, email, role, organization, organization_type, password } = req.body;

        // Validate required fields
        if (!name || !email || !role) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields',
                message: 'Name, email, and role are required'
            });
        }

        // Check if user already exists
        const existingResult = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        const existingUsers = existingResult.rows;

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'User already exists',
                message: 'A user with this email already exists'
            });
        }

        // Handle password for manager and head_admin accounts
        const bcrypt = require('bcryptjs');
        let hashedPassword = null;
        let plainPassword = null;

        if (role === 'manager' || role === 'head_admin') {
            if (password) {
                // Use provided password for manager/head_admin
                hashedPassword = await bcrypt.hash(password, 12);
                plainPassword = password; // Keep plain password for response
                console.log(`🔐 ${role} password provided and hashed`);
            } else {
                // Generate a secure password for manager/head_admin if none provided
                const crypto = require('crypto');
                plainPassword = crypto.randomBytes(8).toString('hex') + '!@#';
                hashedPassword = await bcrypt.hash(plainPassword, 12);
                console.log(`🔐 Generated secure password for ${role}`);
            }
        } else if (password) {
            // For other roles, hash provided password
            hashedPassword = await bcrypt.hash(password, 12);
            console.log('🔐 Password provided and hashed for other role');
        }

        // Insert new user
        const result = await query(`
            INSERT INTO users (name, email, role, organization, organization_type, password, is_approved, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP)
            RETURNING id
        `, [name, email, role, organization || null, organization_type || null, hashedPassword]);

        // Get the created user
        const newUserResult = await query(`
            SELECT id, name, email, role, organization, organization_type, 
                   is_approved, created_at, last_login 
            FROM users WHERE id = $1
        `, [result.rows[0].id]);
        const newUser = newUserResult.rows;

        console.log('Admin created new user:', newUser[0]);

        // Prepare response
        const responseData = {
            ...newUser[0],
            ...((role === 'manager' || role === 'head_admin') && plainPassword && {
                generated_password: plainPassword // Include generated password in response
            })
        };

        res.status(201).json({
            success: true,
            message: (role === 'manager' || role === 'head_admin')
                ? `${role} user created successfully with generated password`
                : 'User created successfully',
            data: responseData
        });

    } catch (error) {
        console.error('Admin create user error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to create user',
            message: error.message
        });
    }
});

/**
 * @route PUT /api/admin/users/:id
 * @desc Update a user (admin only)
 * @access Private (Admin)
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email, role, organization, organization_type, is_approved } = req.body;

        // Validate userId
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid user ID',
                message: 'User ID must be a valid number'
            });
        }

        // Validate required fields if provided
        if (email && !email.includes('@')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format',
                message: 'Email must be a valid email address'
            });
        }

        if (role && !['student', 'partner', 'admin', 'head_admin', 'manager', 'reviewer'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role',
                message: 'Role must be one of: student, partner, admin, head_admin, manager, reviewer'
            });
        }

        // Check if user exists
        const existingUserResult = await query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
        );

        if (existingUserResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User does not exist'
            });
        }

        // Get current user data to preserve existing values
        const currentUserResult = await query(
            'SELECT name, email, role, organization, organization_type, is_approved FROM users WHERE id = $1',
            [userId]
        );
        const currentUser = currentUserResult.rows[0];

        // Update user with preserved values for fields not being updated
        await query(`
            UPDATE users 
            SET name = $1, email = $2, role = $3, organization = $4, organization_type = $5, is_approved = $6, updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
        `, [
            name || currentUser.name,
            email || currentUser.email,
            role || currentUser.role,
            organization !== undefined ? organization : currentUser.organization,
            organization_type !== undefined ? organization_type : currentUser.organization_type,
            is_approved !== undefined ? is_approved : currentUser.is_approved,
            userId
        ]);

        // Get updated user
        const updatedUserResult = await query(`
            SELECT id, name, email, role, organization, organization_type, 
                   is_approved, created_at, last_login 
            FROM users WHERE id = $1
        `, [userId]);

        console.log('Admin updated user:', updatedUserResult.rows[0]);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUserResult.rows[0]
        });

    } catch (error) {
        console.error('Admin update user error:', error);

        // Handle specific PostgreSQL errors
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                error: 'Unique constraint violation',
                message: 'A user with this email already exists'
            });
        }

        if (error.code === '23503') {
            return res.status(400).json({
                success: false,
                error: 'Foreign key constraint violation',
                message: 'Referenced record does not exist'
            });
        }

        if (error.code === '23502') {
            return res.status(400).json({
                success: false,
                error: 'Not null constraint violation',
                message: 'Required field cannot be null'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to update user',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete a user (admin only)
 * @access Private (Admin)
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const existingUserResult = await query(
            'SELECT id FROM users WHERE id = $1',
            [userId]
        );

        if (existingUserResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User does not exist'
            });
        }

        // Delete user
        await query('DELETE FROM users WHERE id = $1', [userId]);

        console.log('Admin deleted user:', userId);

        res.json({
            success: true,
            message: 'User deleted successfully',
            data: { id: userId }
        });

    } catch (error) {
        console.error('Admin delete user error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user',
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
        const userStatsResult = await query('SELECT COUNT(*) as total FROM users');
        const proposalStatsResult = await query('SELECT COUNT(*) as total FROM proposals');
        const pendingApprovalsResult = await query('SELECT COUNT(*) as total FROM users WHERE is_approved = false');

        // Get recent activity (last 30 days)
        const recentUsersResult = await query(
            'SELECT COUNT(*) as total FROM users WHERE created_at >= (CURRENT_TIMESTAMP - INTERVAL \'30 days\')'
        );

        // Get approved vs pending users
        const approvedUsersResult = await query('SELECT COUNT(*) as total FROM users WHERE is_approved = true');

        const stats = {
            totalUsers: userStatsResult.rows[0].total,
            totalProposals: proposalStatsResult.rows[0].total,
            pendingApprovals: pendingApprovalsResult.rows[0].total,
            approvedUsers: approvedUsersResult.rows[0].total,
            recentUsers: recentUsersResult.rows[0].total,
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