// ==============================
// Backend Server Proposals Admin Routes
// MongoDB-Unified Admin API
// ==============================
// This file handles all admin-related API endpoints for the CEDO application
// Combines MySQL proposal data with MongoDB file metadata for comprehensive admin features

const express = require('express');
const router = express.Router();
const { getDb, pool } = require('./helpers');
const rateLimit = require('express-rate-limit');

// ==============================
// Import Admin Services
// ==============================
const {
    getAdminProposals,
    getAdminStats,
    saveSection5Reporting
} = require('../../services/admin.service.js');
const { accomplishmentReportUpload } = require('../../config/multer.config');

// ==============================
// Rate Limiting Configuration
// ==============================
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});

const strictLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(apiLimiter);

// ==============================
// Dashboard Statistics Endpoints
// ==============================

// GET /api/mongodb-unified/admin/dashboard-stats
// Returns comprehensive dashboard statistics for admin overview
router.get('/dashboard-stats', strictLimiter, async (req, res) => {
    try {
        console.log('📊 Admin Routes: Fetching dashboard statistics');
        const stats = await getAdminStats();
        res.json(stats);
    } catch (error) {
        console.error('❌ Admin Routes: Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
});

// ==============================
// Proposals Management Endpoints
// ==============================

// GET /api/mongodb-unified/admin/proposals-hybrid
// **PRIMARY ENDPOINT** - Returns proposals with hybrid MySQL+MongoDB data
// This is the main endpoint used by the admin review page
router.get('/proposals-hybrid', async (req, res) => {
    try {
        console.log('📊 Admin Routes: Fetching hybrid proposals data');
        console.log('📊 Query parameters:', req.query);

        const { page = 1, limit = 100, search, status, sort, order } = req.query;

        // Get proposals from MySQL with MongoDB file metadata
        const result = await getAdminProposals({ page, limit, search, status, sort, order });

        // Transform data to match frontend expectations
        const transformedProposals = (result.proposals || []).map((p) => {
            const nameFallback = p.contact_name || p.organization_name || 'Unknown';
            const initials = nameFallback
                .split(/\s+/)
                .map((n) => n[0] || '')
                .join('')
                .slice(0, 2)
                .toUpperCase();

            // Normalize status (convert 'denied' to 'rejected' for frontend consistency)
            const normalizedStatus = p.proposal_status ?
                (p.proposal_status === 'denied' ? 'rejected' : p.proposal_status) : 'pending';

            return {
                // Raw database fields for OverviewTab compatibility
                id: p.id,
                organization_name: p.organization_name,
                organization_type: p.organization_type,
                organization_description: p.organization_description,
                contact_name: p.contact_name,
                contact_email: p.contact_email,
                contact_phone: p.contact_phone,
                event_name: p.event_name,
                event_venue: p.event_venue,
                event_start_date: p.event_start_date,
                event_end_date: p.event_end_date,
                event_start_time: p.event_start_time,
                event_end_time: p.event_end_time,
                event_mode: p.event_mode,
                event_type: p.event_type,
                proposal_status: p.proposal_status,
                event_status: p.event_status,
                attendance_count: p.attendance_count,
                created_at: p.created_at,
                updated_at: p.updated_at,
                admin_comments: p.admin_comments,
                objectives: p.objectives,
                budget: p.budget,
                volunteersNeeded: p.volunteersNeeded,

                // Normalized fields for table compatibility
                status: normalizedStatus,
                priority: 'medium', // Default priority
                title: p.event_name || 'Untitled Event',
                date: p.created_at || new Date().toISOString(),
                category: p.event_type || p.organization_type || 'General',
                submitted_at: p.created_at,

                // Submitter information
                submitter: {
                    name: nameFallback,
                    avatar: null,
                    initials,
                },

                // Details structure for compatibility
                details: {
                    purpose: p.objectives || p.event_type || 'Event Proposal',
                    organization: {
                        description: p.organization_description || '',
                        type: [p.organization_type || 'unknown'],
                    },
                    comments: [],
                    // Include file information from MongoDB
                    files: p.files || {},
                    hasFiles: p.files && Object.keys(p.files).length > 0,
                    adminComments: p.admin_comments || null,
                },
            };
        });

        console.log(`📊 Admin Routes: Successfully fetched ${transformedProposals.length} proposals`);

        res.json({
            success: true,
            message: `Successfully fetched ${transformedProposals.length} proposals`,
            proposals: transformedProposals,
            pagination: {
                currentPage: parseInt(page),
                totalCount: result.totalCount,
                totalPages: Math.ceil(result.totalCount / parseInt(limit)),
                hasNextPage: parseInt(page) * parseInt(limit) < result.totalCount,
                hasPrevPage: parseInt(page) > 1,
                limit: parseInt(limit)
            },
            filters: {
                status: status || 'all',
                search: search || ''
            },
            metadata: {
                source: 'mysql_mongodb_hybrid',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Admin Routes: Error fetching hybrid proposals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch proposals',
            error: error.message
        });
    }
});

// GET /api/mongodb-unified/admin/proposals
// Legacy endpoint for basic proposal data
router.get('/proposals', async (req, res) => {
    try {
        console.log('📊 Admin Routes: Fetching basic proposals data (legacy)');
        const { page = 1, limit = 10, search, status, sort, order } = req.query;
        const result = await getAdminProposals({ page, limit, search, status, sort, order });
        res.json(result);
    } catch (error) {
        console.error('❌ Admin Routes: Error fetching proposals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get proposals',
            error: error.message
        });
    }
});

// ==============================
// Proposal Status Management
// ==============================

// PUT /api/mongodb-unified/admin/proposals/:id/status
// Updates the status of a specific proposal
router.put('/proposals/:id/status', strictLimiter, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_comments, reviewed_by_admin_id } = req.body;

        console.log(`📊 Admin Routes: Updating proposal ${id} status to ${status}`);

        // Update proposal status in MySQL
        const { pool } = require('../../config/db');
        const updateQuery = `
            UPDATE proposals 
            SET proposal_status = ?, admin_comments = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        const [result] = await pool.query(updateQuery, [status, admin_comments, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Proposal not found'
            });
        }

        // Fetch updated proposal
        const [updatedProposal] = await pool.query(
            'SELECT * FROM proposals WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: `Proposal ${status} successfully`,
            proposal: updatedProposal[0]
        });

    } catch (error) {
        console.error('❌ Admin Routes: Error updating proposal status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update proposal status',
            error: error.message
        });
    }
});

// ==============================
// Reporting Endpoints
// ==============================

// POST /api/mongodb-unified/admin/section5-reporting
// Handles accomplishment report submissions
router.post('/section5-reporting', accomplishmentReportUpload, async (req, res) => {
    try {
        console.log('📊 Admin Routes: Processing Section 5 reporting data');

        if (!req.body.proposal_id) {
            return res.status(400).json({
                success: false,
                message: 'Proposal ID is required.'
            });
        }

        const result = await saveSection5Reporting(req.body, req.files);

        res.status(200).json({
            success: true,
            message: 'Reporting data saved successfully.',
            verified_data: result
        });

    } catch (error) {
        console.error('❌ Admin Routes: Error in section5-reporting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save reporting data.',
            error: error.message
        });
    }
});

// ==============================
// Legacy/Compatibility Endpoints
// ==============================
// These endpoints maintain backwards compatibility with existing frontend code

router.get('/proposals/recent', async (req, res) => {
    try {
        const result = await getAdminProposals({ page: 1, limit: 5, status: 'pending' });
        res.json({ success: true, proposals: result.proposals });
    } catch (error) {
        console.error('❌ Admin Routes: Error fetching recent proposals:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch recent proposals' });
    }
});

router.get('/proposals/counts', async (req, res) => {
    try {
        const stats = await getAdminStats();
        res.json({
            success: true,
            counts: {
                pending: stats.pending,
                approved: stats.approved,
                rejected: stats.rejected,
                total: stats.pending + stats.approved + stats.rejected
            }
        });
    } catch (error) {
        console.error('❌ Admin Routes: Error fetching proposal counts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch proposal counts' });
    }
});

module.exports = router; 