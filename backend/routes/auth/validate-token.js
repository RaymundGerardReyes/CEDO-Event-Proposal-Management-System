/**
 * Token Validation Route
 * 
 * Validates JWT tokens for Remember Me functionality
 * - Secure token validation
 * - User data retrieval
 * - Token refresh support
 * - Error handling
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/database-postgresql-only');

// Token validation endpoint
router.post('/validate-token', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

        // Get user data from database
        const userQuery = `
            SELECT 
                id, 
                name, 
                email, 
                role, 
                is_approved,
                created_at,
                updated_at
            FROM users 
            WHERE id = $1 AND is_approved = true
        `;

        const userResult = await pool.query(userQuery, [decoded.userId]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'User not found or not approved'
            });
        }

        const user = userResult.rows[0];

        // Check if user is still active
        if (!user.is_approved) {
            return res.status(401).json({
                success: false,
                error: 'User account is not approved'
            });
        }

        // Return user data
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isApproved: user.is_approved,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }
        });

    } catch (error) {
        console.error('Token validation error:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Token refresh endpoint
router.post('/refresh-token', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        const token = authHeader.substring(7);

        // Verify current token (even if expired)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', {
            ignoreExpiration: true
        });

        // Check if user still exists and is approved
        const userQuery = `
            SELECT 
                id, 
                name, 
                email, 
                role, 
                is_approved
            FROM users 
            WHERE id = $1 AND is_approved = true
        `;

        const userResult = await pool.query(userQuery, [decoded.userId]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'User not found or not approved'
            });
        }

        const user = userResult.rows[0];

        // Generate new token
        const newToken = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'fallback-secret',
            {
                expiresIn: '30d' // 30 days for Remember Me
            }
        );

        // Set new token in cookie
        res.cookie('cedo_auth_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.json({
            success: true,
            token: newToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isApproved: user.is_approved
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;
