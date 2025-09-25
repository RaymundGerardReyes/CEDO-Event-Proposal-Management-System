const express = require('express');
const router = express.Router();

// ✅ FIX: Use universal database connection (PostgreSQL)
const { pool, query } = require('../config/database-postgresql-only');
// ✅ FIX: Use standard authentication middleware
const { validateToken } = require('../middleware/auth');

// ✅ FIX: Removed custom authentication middleware - using standard validateToken from ../middleware/auth

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
router.get('/', validateToken, async (req, res) => {
    try {
        // ✅ FIX: Use PostgreSQL syntax with universal database connection
        const result = await query(
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
            WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
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

// PUT /api/profile - Update profile data (general route for frontend compatibility)
router.put('/', validateToken, async (req, res) => {
    try {
        const { organizationDescription } = req.body;

        // Validate input
        if (organizationDescription && organizationDescription.length > 5000) {
            return res.status(400).json({
                error: 'Organization description must be less than 5000 characters'
            });
        }

        // ✅ FIX: Use PostgreSQL syntax with universal database connection
        const result = await query(
            `UPDATE users 
            SET organization_description = $1, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2`,
            [organizationDescription || null, req.user.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: req.user.id,
                organizationDescription: organizationDescription
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

// PUT /api/profile/organization - Update organization description
router.put('/organization', validateToken, async (req, res) => {
    try {
        const { organizationDescription } = req.body;

        // Validate input
        if (organizationDescription && organizationDescription.length > 5000) {
            return res.status(400).json({
                error: 'Organization description must be less than 5000 characters'
            });
        }

        // ✅ FIX: Use PostgreSQL syntax with universal database connection
        const result = await query(
            `UPDATE users 
            SET organization_description = $1, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2`,
            [organizationDescription || null, req.user.id]
        );

        if (result.rowCount === 0) {
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
router.put('/phone', validateToken, async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        // Validate phone number format
        const validation = validatePhoneNumber(phoneNumber);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        // ✅ FIX: Use PostgreSQL syntax with universal database connection
        // Check if phone number is already in use by another user
        if (phoneNumber) {
            const existingResult = await query(
                'SELECT id FROM users WHERE phone_number = $1 AND id != $2',
                [phoneNumber, req.user.id]
            );

            if (existingResult.rows.length > 0) {
                return res.status(400).json({
                    error: 'Phone number is already in use by another user'
                });
            }
        }

        const result = await query(
            `UPDATE users 
            SET phone_number = $1, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2`,
            [phoneNumber || null, req.user.id]
        );

        if (result.rowCount === 0) {
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
router.put('/bulk', validateToken, async (req, res) => {
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

        // ✅ FIX: Use PostgreSQL syntax with universal database connection
        // Check if phone number is already in use by another user
        if (phoneNumber) {
            const existingResult = await query(
                'SELECT id FROM users WHERE phone_number = $1 AND id != $2',
                [phoneNumber, req.user.id]
            );

            if (existingResult.rows.length > 0) {
                return res.status(400).json({
                    error: 'Phone number is already in use by another user'
                });
            }
        }

        const result = await query(
            `UPDATE users 
            SET organization_description = $1, 
                phone_number = $2,
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = $3`,
            [
                organizationDescription || null,
                phoneNumber || null,
                req.user.id
            ]
        );

        if (result.rowCount === 0) {
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