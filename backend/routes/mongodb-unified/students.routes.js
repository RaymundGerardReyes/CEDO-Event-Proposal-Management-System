/**
 * =============================================
 * MONGODB UNIFIED ROUTES - Student Dashboard
 * =============================================
 * 
 * This module handles all student dashboard operations including proposal
 * management, draft retrieval, and user-specific data access. It provides
 * both MongoDB and MySQL data access for comprehensive student experience.
 * 
 * @module routes/mongodb-unified/students
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - User proposal retrieval with embedded data
 * - Draft proposal management
 * - Hybrid MongoDB + MySQL data access
 * - Progress tracking and status management
 * - Organization and report linking
 */

const express = require('express');
const router = express.Router();

const { getDb, pool, query } = require('./helpers');

// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================

/**
 * Validate email parameter
 * 
 * @param {string} email - Email address to validate
 * @returns {boolean} Validation result
 */
const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Calculate proposal progress based on completion status
 * 
 * @param {Object} proposal - Proposal data
 * @returns {number} Progress percentage (0-100)
 */
const calculateProgress = (proposal) => {
    let progress = 0;

    if (proposal.organizationName) progress += 20;
    if (proposal.eventName) progress += 20;
    if (proposal.startDate && proposal.endDate) progress += 20;
    if (proposal.files && Object.keys(proposal.files).length > 0) progress += 20;
    if (proposal.proposalStatus === 'submitted') progress += 20;

    return Math.min(progress, 100);
};

/**
 * Normalize draft proposal data for frontend
 * 
 * @param {Object} row - MySQL row data
 * @returns {Object} Normalized draft object
 */
const normalizeDraftData = (row) => {
    return {
        id: row.id,
        name: row.organization_name || 'Untitled Draft',
        lastEdited: row.updated_at || row.created_at,
        step: 'orgInfo',
        progress: calculateProgress({
            organizationName: row.organization_name,
            proposalStatus: row.proposal_status
        }),
        data: {
            organizationName: row.organization_name,
            organizationTypes: [row.organization_type || 'school-based'],
            contactEmail: row.contact_email,
        },
    };
};

// =============================================
// USER PROPOSAL MANAGEMENT ROUTES
// =============================================

/**
 * @route GET /api/mongodb-unified/students/user-proposals/:email
 * @desc Get all proposals for a specific user with embedded data
 * @access Public (Student)
 * 
 * @param {string} email - User's email address
 * 
 * @returns {Object} Array of user proposals with organization and report data
 */
router.get('/user-proposals/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;
        console.log('👤 STUDENT: Fetching proposals for user:', userEmail);

        // Validate email parameter
        if (!validateEmail(userEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address provided'
            });
        }

        const db = await getDb();

        // Aggregate proposals with embedded organization and report data
        const proposals = await db
            .collection('proposals')
            .aggregate([
                {
                    $lookup: {
                        from: 'organizations',
                        localField: 'organizationId',
                        foreignField: '_id',
                        as: 'organization',
                    },
                },
                {
                    $lookup: {
                        from: 'accomplishment_reports',
                        localField: '_id',
                        foreignField: 'proposalId',
                        as: 'reports',
                    },
                },
                { $match: { 'organization.contactEmail': userEmail } },
                { $sort: { createdAt: -1 } },
                {
                    $project: {
                        _id: 1,
                        eventName: 1,
                        proposalStatus: 1,
                        eventType: 1,
                        startDate: 1,
                        endDate: 1,
                        files: 1,
                        organization: { $arrayElemAt: ['$organization', 0] },
                        reportStatus: {
                            $ifNull: [{ $arrayElemAt: ['$reports.reportStatus', 0] }, 'not_submitted'],
                        },
                        createdAt: 1,
                    },
                },
            ])
            .toArray();

        console.log('✅ STUDENT: Successfully fetched proposals:', {
            userEmail: userEmail,
            proposalCount: proposals.length
        });

        res.json({
            success: true,
            proposals: proposals,
            userEmail: userEmail,
            totalCount: proposals.length
        });

    } catch (error) {
        console.error('❌ STUDENT: Error fetching user proposals:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch user proposals'
        });
    }
});

// =============================================
// DRAFT PROPOSAL MANAGEMENT ROUTES
// =============================================

/**
 * @route GET /api/mongodb-unified/students/proposals/drafts/:email
 * @desc Get draft proposals for a specific user from MySQL
 * @access Public (Student)
 * 
 * @param {string} email - User's email address
 * 
 * @returns {Object} Array of draft proposals with progress information
 */
router.get('/proposals/drafts/:email', async (req, res) => {
    try {
        const contactEmail = req.params.email;
        console.log('📝 STUDENT: Fetching draft proposals for user:', contactEmail);

        // Validate email parameter
        if (!validateEmail(contactEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address provided'
            });
        }

        // Query MySQL for draft proposals
        const query = `
            SELECT id, organization_name, contact_email, organization_type, 
                   updated_at, created_at, proposal_status
            FROM proposals
            WHERE contact_email = $1 AND proposal_status = 'draft'
            ORDER BY updated_at DESC
        `;

        const result = await query(query, [contactEmail]);
        const rows = result.rows;

        // Normalize draft data for frontend
        const drafts = rows.map(normalizeDraftData);

        console.log('✅ STUDENT: Successfully fetched draft proposals:', {
            userEmail: contactEmail,
            draftCount: drafts.length
        });

        res.json({
            success: true,
            drafts: drafts,
            userEmail: contactEmail,
            totalCount: drafts.length
        });

    } catch (error) {
        console.error('❌ STUDENT: Error fetching draft proposals:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch draft proposals'
        });
    }
});

// =============================================
// PROPOSAL STATUS ROUTES
// =============================================

/**
 * @route GET /api/mongodb-unified/students/proposals/status/:email
 * @desc Get proposal status summary for a user
 * @access Public (Student)
 * 
 * @param {string} email - User's email address
 * 
 * @returns {Object} Proposal status summary with counts
 */
router.get('/proposals/status/:email', async (req, res) => {
    try {
        const contactEmail = req.params.email;
        console.log('📊 STUDENT: Fetching proposal status for user:', contactEmail);

        // Validate email parameter
        if (!validateEmail(contactEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address provided'
            });
        }

        // Query MySQL for proposal status counts
        const statusQuery = `
            SELECT proposal_status, COUNT(*) as count
            FROM proposals
            WHERE contact_email = $1
            GROUP BY proposal_status
        `;

        const statusResult = await query(statusQuery, [contactEmail]);
        const statusRows = statusResult.rows;

        // Calculate status summary
        const statusSummary = {
            total: 0,
            drafts: 0,
            submitted: 0,
            approved: 0,
            rejected: 0,
            completed: 0
        };

        statusRows.forEach(row => {
            statusSummary.total += row.count;
            statusSummary[row.proposal_status] = row.count;
        });

        console.log('✅ STUDENT: Successfully fetched proposal status:', {
            userEmail: contactEmail,
            statusSummary: statusSummary
        });

        res.json({
            success: true,
            statusSummary: statusSummary,
            userEmail: contactEmail
        });

    } catch (error) {
        console.error('❌ STUDENT: Error fetching proposal status:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch proposal status'
        });
    }
});

module.exports = router; 