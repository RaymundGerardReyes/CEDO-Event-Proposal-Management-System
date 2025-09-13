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
            VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
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

        // Check if user exists
        const [existingUser] = await query(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User does not exist'
            });
        }

        // Update user
        await query(`
            UPDATE users 
            SET name = ?, email = ?, role = ?, organization = ?, organization_type = ?, is_approved = ?
            WHERE id = ?
        `, [name, email, role, organization, organization_type, is_approved, userId]);

        // Get updated user
        const [updatedUser] = await query(`
            SELECT id, name, email, role, organization, organization_type, 
                   is_approved, created_at, last_login 
            FROM users WHERE id = ?
        `, [userId]);

        console.log('Admin updated user:', updatedUser[0]);

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser[0]
        });

    } catch (error) {
        console.error('Admin update user error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to update user',
            message: error.message
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
        const [existingUser] = await query(
            'SELECT id FROM users WHERE id = ?',
            [userId]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                message: 'User does not exist'
            });
        }

        // Delete user
        await query('DELETE FROM users WHERE id = ?', [userId]);

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
        const [userStats] = await query('SELECT COUNT(*) as total FROM users');
        const [proposalStats] = await query('SELECT COUNT(*) as total FROM proposals');
        const [pendingApprovals] = await query('SELECT COUNT(*) as total FROM users WHERE is_approved = 0');

        // Get recent activity (last 30 days)
        const [recentUsers] = await query(
            'SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)'
        );

        // Get approved vs pending users
        const [approvedUsers] = await query('SELECT COUNT(*) as total FROM users WHERE is_approved = 1');

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