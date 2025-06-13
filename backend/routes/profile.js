const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

// Database connection configuration - Updated to match your setup
const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cedo_auth',
    port: process.env.DB_PORT || process.env.MYSQL_PORT || 3306
};

// Check if the token is likely a JWT
const isLikelyJWT = (token) => {
    // JWTs have three dot-separated base64url sections
    return typeof token === 'string' && token.split('.').length === 3;
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    if (!isLikelyJWT(token)) {
        return res.status(401).json({ error: 'Malformed or missing JWT token' });
    }

    // Use JWT_SECRET (primary) or fallback to JWT_SECRET_DEV for dev
    const jwtSecret = process.env.JWT_SECRET || process.env.JWT_SECRET_DEV;

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err.message);
            return res.status(403).json({
                error: 'Invalid or expired token',
                details: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
        req.user = user;
        next();
    });
};

// Phone number validation function
const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return { isValid: true, error: null }; // Allow null/empty

    // Remove any spaces or dashes
    const cleanPhone = phoneNumber.replace(/[\s-]/g, '');

    // Check if it's exactly 11 digits and starts with '09'
    const phoneRegex = /^09\d{9}$/;

    if (!phoneRegex.test(cleanPhone)) {
        return {
            isValid: false,
            error: 'Phone number must be exactly 11 digits starting with 09 (e.g., 09123456789)'
        };
    }

    return { isValid: true, error: null };
};

// GET /api/profile - Get user profile data
router.get('/', authenticateToken, async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.execute(
            `SELECT 
        id, 
        name, 
        email, 
        role, 
        organization, 
        organization_description, 
        phone_number, 
        avatar,
        created_at,
        updated_at
      FROM users 
      WHERE id = ?`,
            [req.user.id]
        );

        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = rows[0];
        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                organization: user.organization,
                organizationDescription: user.organization_description,
                phoneNumber: user.phone_number,
                avatar: user.avatar,
                createdAt: user.created_at,
                updatedAt: user.updated_at
            }
        });

    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            error: 'Failed to fetch profile data',
            details: error.message
        });
    }
});

// PUT /api/profile/organization - Update organization description
router.put('/organization', authenticateToken, async (req, res) => {
    try {
        const { organizationDescription } = req.body;

        // Validate input
        if (organizationDescription && organizationDescription.length > 5000) {
            return res.status(400).json({
                error: 'Organization description must be less than 5000 characters'
            });
        }

        const connection = await mysql.createConnection(dbConfig);

        const [result] = await connection.execute(
            `UPDATE users 
       SET organization_description = ?, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
            [organizationDescription || null, req.user.id]
        );

        await connection.end();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Organization description updated successfully',
            organizationDescription: organizationDescription
        });

    } catch (error) {
        console.error('Error updating organization description:', error);
        res.status(500).json({
            error: 'Failed to update organization description',
            details: error.message
        });
    }
});

// PUT /api/profile/phone - Update phone number
router.put('/phone', authenticateToken, async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        // Validate phone number format
        const validation = validatePhoneNumber(phoneNumber);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        const connection = await mysql.createConnection(dbConfig);

        // Check if phone number is already in use by another user
        if (phoneNumber) {
            const [existingRows] = await connection.execute(
                'SELECT id FROM users WHERE phone_number = ? AND id != ?',
                [phoneNumber, req.user.id]
            );

            if (existingRows.length > 0) {
                await connection.end();
                return res.status(400).json({
                    error: 'Phone number is already in use by another user'
                });
            }
        }

        const [result] = await connection.execute(
            `UPDATE users 
       SET phone_number = ?, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
            [phoneNumber || null, req.user.id]
        );

        await connection.end();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Phone number updated successfully',
            phoneNumber: phoneNumber
        });

    } catch (error) {
        console.error('Error updating phone number:', error);
        res.status(500).json({
            error: 'Failed to update phone number',
            details: error.message
        });
    }
});

// PUT /api/profile/bulk - Update multiple profile fields at once
router.put('/bulk', authenticateToken, async (req, res) => {
    try {
        const { organizationDescription, phoneNumber } = req.body;

        // Validate organization description
        if (organizationDescription && organizationDescription.length > 5000) {
            return res.status(400).json({
                error: 'Organization description must be less than 5000 characters'
            });
        }

        // Validate phone number
        const phoneValidation = validatePhoneNumber(phoneNumber);
        if (!phoneValidation.isValid) {
            return res.status(400).json({ error: phoneValidation.error });
        }

        const connection = await mysql.createConnection(dbConfig);

        // Check if phone number is already in use by another user
        if (phoneNumber) {
            const [existingRows] = await connection.execute(
                'SELECT id FROM users WHERE phone_number = ? AND id != ?',
                [phoneNumber, req.user.id]
            );

            if (existingRows.length > 0) {
                await connection.end();
                return res.status(400).json({
                    error: 'Phone number is already in use by another user'
                });
            }
        }

        const [result] = await connection.execute(
            `UPDATE users 
       SET organization_description = ?, 
           phone_number = ?,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
            [
                organizationDescription || null,
                phoneNumber || null,
                req.user.id
            ]
        );

        await connection.end();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                organizationDescription: organizationDescription,
                phoneNumber: phoneNumber
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            details: error.message
        });
    }
});

module.exports = router;