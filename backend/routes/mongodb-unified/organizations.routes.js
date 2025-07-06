/**
 * =============================================
 * MONGODB UNIFIED ROUTES - Organization Management
 * =============================================
 * 
 * This module handles organization data management for Section 2 of the
 * proposal submission process. It stores organization information in MongoDB
 * for later retrieval and linking with proposals.
 * 
 * @module routes/mongodb-unified/organizations
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - Organization data storage and retrieval
 * - Contact information management
 * - Organization type classification
 * - Data validation and error handling
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('./helpers');

// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================

/**
 * Validate organization data
 * 
 * @param {Object} orgData - Organization data to validate
 * @returns {Object} Validation result
 */
const validateOrganizationData = (orgData) => {
    const errors = [];

    if (!orgData.organizationName || orgData.organizationName.trim() === '') {
        errors.push('Organization name is required');
    }

    if (!orgData.contactName || orgData.contactName.trim() === '') {
        errors.push('Contact person name is required');
    }

    if (!orgData.contactEmail || orgData.contactEmail.trim() === '') {
        errors.push('Contact email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (orgData.contactEmail && !emailRegex.test(orgData.contactEmail)) {
        errors.push('Invalid email format');
    }

    if (!orgData.organizationType || orgData.organizationType.trim() === '') {
        errors.push('Organization type is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Normalize organization data for storage
 * 
 * @param {Object} reqBody - Request body data
 * @returns {Object} Normalized organization data
 */
const normalizeOrganizationData = (reqBody) => {
    return {
        name: reqBody.organizationName?.trim(),
        description: reqBody.organizationDescription?.trim() || '',
        organizationType: reqBody.organizationType?.trim(),
        contactPerson: reqBody.contactName?.trim(),
        contactEmail: reqBody.contactEmail?.trim().toLowerCase(),
        contactPhone: reqBody.contactPhone?.trim() || '',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
};

// =============================================
// ORGANIZATION MANAGEMENT ROUTES
// =============================================

/**
 * @route POST /api/mongodb-unified/organizations
 * @desc Save organization information (Section 2)
 * @access Public (Student)
 * 
 * @body {string} organizationName - Organization name
 * @body {string} organizationDescription - Organization description
 * @body {string} organizationType - Type of organization (school-based, community-based)
 * @body {string} contactName - Contact person name
 * @body {string} contactEmail - Contact email address
 * @body {string} contactPhone - Contact phone number (optional)
 * 
 * @returns {Object} Success response with organization ID
 */
router.post('/organizations', async (req, res) => {
    try {
        console.log('🏢 ORGANIZATION: ==================== ORGANIZATION SAVE REQUEST ====================');
        console.log('🏢 ORGANIZATION: Request method:', req.method);
        console.log('🏢 ORGANIZATION: Request body keys:', Object.keys(req.body));

        // STEP 1: Validate organization data
        const validation = validateOrganizationData(req.body);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: `Organization validation failed: ${validation.errors.join(', ')}`
            });
        }

        // STEP 2: Normalize data
        const orgData = normalizeOrganizationData(req.body);
        console.log('🏢 ORGANIZATION: Normalized organization data:', {
            name: orgData.name,
            type: orgData.organizationType,
            contactEmail: orgData.contactEmail
        });

        // STEP 3: Save to MongoDB
        const db = await getDb();
        const result = await db.collection('organizations').insertOne(orgData);

        console.log('✅ ORGANIZATION: Successfully saved organization:', {
            organizationId: result.insertedId,
            name: orgData.name,
            contactEmail: orgData.contactEmail
        });

        res.json({
            success: true,
            id: result.insertedId,
            message: 'Organization saved successfully',
            organization: {
                id: result.insertedId,
                name: orgData.name,
                type: orgData.organizationType,
                contactEmail: orgData.contactEmail
            }
        });

    } catch (error) {
        console.error('❌ ORGANIZATION: Error saving organization:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to save organization data'
        });
    }
});

/**
 * @route GET /api/mongodb-unified/organizations/:email
 * @desc Get organization by contact email
 * @access Public (Student)
 * 
 * @param {string} email - Contact email address
 * 
 * @returns {Object} Organization data
 */
router.get('/organizations/:email', async (req, res) => {
    try {
        const contactEmail = req.params.email;
        console.log('🏢 ORGANIZATION: Fetching organization by email:', contactEmail);

        // Validate email parameter
        if (!contactEmail || contactEmail.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Email parameter is required'
            });
        }

        const db = await getDb();
        const organization = await db.collection('organizations').findOne({
            contactEmail: contactEmail.toLowerCase()
        });

        if (!organization) {
            return res.status(404).json({
                success: false,
                error: 'Organization not found'
            });
        }

        console.log('✅ ORGANIZATION: Successfully fetched organization:', {
            id: organization._id,
            name: organization.name,
            contactEmail: organization.contactEmail
        });

        res.json({
            success: true,
            organization: organization
        });

    } catch (error) {
        console.error('❌ ORGANIZATION: Error fetching organization:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch organization data'
        });
    }
});

module.exports = router; 