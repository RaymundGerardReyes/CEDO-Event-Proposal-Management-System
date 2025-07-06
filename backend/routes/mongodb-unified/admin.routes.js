<<<<<<< HEAD
// ==============================
// Backend Server Proposals Admin Routes
// MongoDB-Unified Admin API
// ==============================
// This file handles all admin-related API endpoints for the CEDO application
// Combines MySQL proposal data with MongoDB file metadata for comprehensive admin features
=======
/**
 * =============================================
 * MONGODB UNIFIED ROUTES - Admin Dashboard
 * =============================================
 * 
 * This module handles all admin dashboard operations including proposal management,
 * file viewing, and admin comments. It implements hybrid storage architecture:
 * - MySQL: Primary proposal data and metadata
 * - MongoDB GridFS: File storage and retrieval
 * - MongoDB: Admin comments and additional metadata
 * 
 * @module routes/mongodb-unified/admin
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - Hybrid MySQL + MongoDB data retrieval
 * - GridFS file management for admins
 * - Admin comment system
 * - Proposal status management
 * - Advanced search and filtering
 * - Pagination support
 */
>>>>>>> f6553a8 (Refactor backend services and configuration files)

const express = require('express');
const router = express.Router();
const { getDb, pool } = require('./helpers');
<<<<<<< HEAD
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
=======
const { rateLimiters } = require('../../middleware/performance');

// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================

/**
 * Build MySQL WHERE clause for filtering
 * 
 * @param {Object} query - Request query parameters
 * @returns {Object} WHERE clause and parameters
 */
const buildWhereClause = (query) => {
    const { status, search } = query;
    let where = 'WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
        where += ' AND proposal_status = ?';
        params.push(status);
    }

    if (search && search.trim()) {
        where += ' AND (organization_name LIKE ? OR contact_name LIKE ? OR contact_email LIKE ? OR event_name LIKE ?)';
        const term = `%${search.trim()}%`;
        params.push(term, term, term, term);
>>>>>>> f6553a8 (Refactor backend services and configuration files)
    }
});

<<<<<<< HEAD
// ==============================
// Proposals Management Endpoints
// ==============================
=======
    return { where, params };
};

/**
 * Get MongoDB file metadata for a proposal
 * 
 * @param {string} proposalId - Proposal ID
 * @param {Object} mongoDb - MongoDB database instance
 * @returns {Promise<Object>} File metadata object
 */
const getMongoFileMetadata = async (proposalId, mongoDb) => {
    try {
        const { GridFSBucket } = require('mongodb');
        const bucket = new GridFSBucket(mongoDb, { bucketName: 'proposal_files' });
        const mongoFiles = await bucket.find({ 'metadata.proposalId': proposalId.toString() }).toArray();

        const allFiles = {};
        mongoFiles.forEach(file => {
            const fileType = file.metadata.fileType;
            if (fileType) {
                allFiles[fileType] = {
                    name: file.filename,
                    id: file._id.toString(),
                    source: 'mongodb',
                    size: file.length,
                    uploadDate: file.uploadDate
                };
            }
        });

        return allFiles;
    } catch (error) {
        console.error(`❌ Error fetching file metadata for proposal ${proposalId}:`, error);
        return {};
    }
};

/**
 * Get admin comments for a proposal
 * 
 * @param {string} proposalId - Proposal ID
 * @param {Object} mongoDb - MongoDB database instance
 * @returns {Promise<string|null>} Latest admin comment or null
 */
const getAdminComments = async (proposalId, mongoDb) => {
    try {
        const latestComment = await mongoDb.collection('proposal_comments')
            .findOne(
                { proposalId: proposalId.toString() },
                { sort: { createdAt: -1 } }
            );

        if (latestComment) {
            console.log(`📝 Found admin comment for proposal ${proposalId}:`,
                latestComment.comment.substring(0, 50) + '...');
            return latestComment.comment;
        }

        return null;
    } catch (error) {
        console.error(`❌ Error fetching admin comments for proposal ${proposalId}:`, error);
        return null;
    }
};

/**
 * Normalize proposal data for frontend compatibility
 * 
 * @param {Object} proposal - Raw proposal data from MySQL
 * @param {Object} files - File metadata from MongoDB
 * @param {string|null} adminComments - Admin comments
 * @returns {Object} Normalized proposal object
 */
const normalizeProposalData = (proposal, files = {}, adminComments = null) => {
    return {
        ...proposal,
        files: files,
        hasFiles: Object.keys(files).length > 0,
        adminComments: adminComments,
        // Normalize field names for frontend compatibility
        eventName: proposal.event_name,
        contactPerson: proposal.contact_name,
        contactEmail: proposal.contact_email,
        contactPhone: proposal.contact_phone,
        organizationType: proposal.organization_type,
        organizationName: proposal.organization_name,
        status: proposal.proposal_status,
        venue: proposal.event_venue,
        startDate: proposal.event_start_date,
        endDate: proposal.event_end_date,
        timeStart: proposal.event_start_time,
        timeEnd: proposal.event_end_time,
        eventType: proposal.school_event_type || proposal.community_event_type || 'General',
        eventMode: proposal.event_mode,
        submittedAt: proposal.submitted_at || proposal.created_at,
        createdAt: proposal.created_at,
        updatedAt: proposal.updated_at
    };
};

/**
 * Connect to MongoDB for file operations
 * 
 * @returns {Promise<Object>} MongoDB client and database
 */
const connectToMongoDB = async () => {
    const { MongoClient } = require('mongodb');
    const mongoUri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin';
    const mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    const mongoDb = mongoClient.db('cedo_auth');

    return { mongoClient, mongoDb };
};

// =============================================
// HYBRID PROPOSAL MANAGEMENT ROUTES
// =============================================

/**
 * @route GET /api/mongodb-unified/admin/proposals-hybrid
 * @desc Get all proposals with hybrid data (MySQL + MongoDB files)
 * @access Admin
 * 
 * @query {string} status - Filter by proposal status
 * @query {string} search - Search in organization name, contact info, event name
 * @query {number} page - Page number for pagination
 * @query {number} limit - Items per page
 * 
 * @returns {Object} Paginated proposals with file metadata and admin comments
 */
router.get('/proposals-hybrid', rateLimiters.table, async (req, res) => {
    console.log(`🔍 ADMIN: Incoming request: GET /api/mongodb-unified/admin/proposals-hybrid`);
>>>>>>> f6553a8 (Refactor backend services and configuration files)

// GET /api/mongodb-unified/admin/proposals-hybrid
// **PRIMARY ENDPOINT** - Returns proposals with hybrid MySQL+MongoDB data
// This is the main endpoint used by the admin review page
router.get('/proposals-hybrid', async (req, res) => {
    try {
<<<<<<< HEAD
        console.log('📊 Admin Routes: Fetching hybrid proposals data');
        console.log('📊 Query parameters:', req.query);

        const { page = 1, limit = 100, search, status, sort, order } = req.query;

        // Get proposals from MySQL with MongoDB file metadata
        const result = await getAdminProposals({ page, limit, search, status, sort, order });
=======
        const { page = 1, limit = 10 } = req.query;
        const { where, params } = buildWhereClause(req.query);

        // STEP 1: Get pagination info
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
>>>>>>> f6553a8 (Refactor backend services and configuration files)

        // Transform data to match frontend expectations
        const transformedProposals = (result.proposals || []).map((p) => {
            const nameFallback = p.contact_name || p.organization_name || 'Unknown';
            const initials = nameFallback
                .split(/\s+/)
                .map((n) => n[0] || '')
                .join('')
                .slice(0, 2)
                .toUpperCase();

<<<<<<< HEAD
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
=======
        // STEP 2: Get MySQL proposals
        const [mysqlProposals] = await pool.query(
            `SELECT id, organization_name, organization_type, contact_name, contact_email, contact_phone,
                    event_name, event_venue, event_mode, event_start_date, event_end_date, 
                    event_start_time, event_end_time, school_event_type, community_event_type,
                    proposal_status, created_at, updated_at, submitted_at
             FROM proposals ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limitNum, offset],
        );

        console.log(`📊 ADMIN: Found ${mysqlProposals.length} proposals from MySQL`);

        // STEP 3: Connect to MongoDB for files and comments
        const { mongoClient, mongoDb } = await connectToMongoDB();

        // STEP 4: Enrich proposals with MongoDB data
        const hybrid = await Promise.all(
            mysqlProposals.map(async (proposal) => {
                const files = await getMongoFileMetadata(proposal.id, mongoDb);
                const adminComments = await getAdminComments(proposal.id, mongoDb);

                return normalizeProposalData(proposal, files, adminComments);
            }),
        );

        // STEP 5: Close MongoDB connection
        await mongoClient.close();
>>>>>>> f6553a8 (Refactor backend services and configuration files)

        console.log(`✅ ADMIN: Successfully processed ${hybrid.length} hybrid proposals`);

        res.json({
            success: true,
            message: `Successfully fetched ${transformedProposals.length} proposals`,
            proposals: transformedProposals,
            pagination: {
<<<<<<< HEAD
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
=======
                page: pageNum,
                pages: Math.ceil(totalCount / limitNum),
                total: totalCount,
                limit: limitNum,
                hasPrev: pageNum > 1,
                hasNext: pageNum < Math.ceil(totalCount / limitNum)
>>>>>>> f6553a8 (Refactor backend services and configuration files)
            }
        });

    } catch (error) {
<<<<<<< HEAD
        console.error('❌ Admin Routes: Error fetching hybrid proposals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch proposals',
            error: error.message
=======
        console.error('❌ ADMIN: Hybrid admin fetch error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch proposals with hybrid data'
        });
    }
});

/**
 * @route GET /api/mongodb-unified/admin/proposals/:id
 * @desc Get detailed proposal information with files and comments
 * @access Admin
 * 
 * @param {string} id - Proposal ID
 * 
 * @returns {Object} Detailed proposal with files and admin comments
 */
router.get('/proposals/:id', async (req, res) => {
    try {
        const proposalId = req.params.id;
        console.log(`🔍 ADMIN: Fetching detailed proposal for ID: ${proposalId}`);

        // STEP 1: Get MySQL proposal data
        const [mysqlRows] = await pool.query(
            `SELECT id, organization_name, organization_type, contact_name, contact_email, contact_phone,
                    event_name, event_venue, event_mode, event_start_date, event_end_date, 
                    event_start_time, event_end_time, school_event_type, community_event_type,
                    proposal_status, created_at, updated_at, submitted_at
             FROM proposals WHERE id = ?`,
            [proposalId]
        );

        if (mysqlRows.length === 0) {
            // STEP 2: Fallback to MongoDB-only proposals (legacy)
            const db = await getDb();
            const { ObjectId } = require('mongodb');

            try {
                const doc = await db.collection('proposals').findOne({ _id: new ObjectId(proposalId) });
                if (!doc) {
                    return res.status(404).json({
                        success: false,
                        error: 'Proposal not found'
                    });
                }
                return res.json({ success: true, proposal: doc });
            } catch (mongoError) {
                return res.status(404).json({
                    success: false,
                    error: 'Proposal not found in either database'
                });
            }
        }

        const proposal = mysqlRows[0];

        // STEP 3: Connect to MongoDB for files and comments
        const { mongoClient, mongoDb } = await connectToMongoDB();

        // STEP 4: Get MongoDB data
        const files = await getMongoFileMetadata(proposal.id, mongoDb);
        const adminComments = await getAdminComments(proposal.id, mongoDb);

        // STEP 5: Close MongoDB connection
        await mongoClient.close();

        // STEP 6: Return normalized data
        const normalizedProposal = normalizeProposalData(proposal, files, adminComments);

        console.log(`✅ ADMIN: Successfully fetched detailed proposal ${proposalId}`);

        res.json({
            success: true,
            proposal: normalizedProposal
        });

    } catch (error) {
        console.error('❌ ADMIN: Error fetching detailed proposal:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch detailed proposal'
>>>>>>> f6553a8 (Refactor backend services and configuration files)
        });
    }
});

<<<<<<< HEAD
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
=======
// =============================================
// LEGACY MONGODB-ONLY ROUTES
// =============================================

/**
 * @route GET /api/mongodb-unified/admin/proposals
 * @desc Get MongoDB-only proposals (legacy endpoint)
 * @access Admin
 * 
 * @query {string} status - Filter by proposal status
 * @query {string} search - Search in proposal fields
 * @query {number} page - Page number for pagination
 * @query {number} limit - Items per page
 * 
 * @returns {Object} Paginated MongoDB proposals
 */
router.get('/proposals', async (req, res) => {
    try {
        const db = await getDb();
        const { status, page = 1, limit = 10, search } = req.query;

        // Build filter
        const filter = {};
        if (status && status !== 'all') filter.proposal_status = status;
        if (search && search.trim()) {
            const re = new RegExp(search.trim(), 'i');
            filter.$or = [{ name: re }, { contact_person: re }, { contact_email: re }];
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const total = await db.collection('proposals').countDocuments(filter);
        const docs = await db.collection('proposals')
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .toArray();

        console.log(`📊 ADMIN: Found ${docs.length} MongoDB-only proposals`);

        res.json({
            success: true,
            proposals: docs,
            pagination: {
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                total
            }
        });

    } catch (error) {
        console.error('❌ ADMIN: MongoDB-only fetch error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch MongoDB proposals'
        });
    }
});

// =============================================
// ADMIN COMMENT MANAGEMENT
// =============================================

/**
 * @route POST /api/mongodb-unified/admin/proposals/:id/comments
 * @desc Add admin comment to a proposal
 * @access Admin
 * 
 * @param {string} id - Proposal ID
 * @body {string} comment - Admin comment text
 * @body {string} adminName - Admin name (optional)
 * 
 * @returns {Object} Success response with comment details
 */
router.post('/proposals/:id/comments', async (req, res) => {
    try {
        const proposalId = req.params.id;
        const { comment, adminName = 'Admin' } = req.body;

        if (!comment || comment.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Comment is required'
            });
        }

        // Connect to MongoDB
        const { mongoClient, mongoDb } = await connectToMongoDB();

        // Create comment record
        const commentRecord = {
            proposalId: proposalId.toString(),
            comment: comment.trim(),
            adminName: adminName,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await mongoDb.collection('proposal_comments').insertOne(commentRecord);

        // Close MongoDB connection
        await mongoClient.close();

        console.log(`✅ ADMIN: Added comment to proposal ${proposalId}`);

        res.json({
            success: true,
            comment: {
                id: result.insertedId,
                ...commentRecord
            },
            message: 'Comment added successfully'
        });

    } catch (error) {
        console.error('❌ ADMIN: Error adding comment:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to add comment'
        });
    }
});

/**
 * @route GET /api/mongodb-unified/admin/proposals/:id/comments
 * @desc Get all admin comments for a proposal
 * @access Admin
 * 
 * @param {string} id - Proposal ID
 * 
 * @returns {Object} Array of admin comments
 */
router.get('/proposals/:id/comments', async (req, res) => {
    try {
        const proposalId = req.params.id;

        // Connect to MongoDB
        const { mongoClient, mongoDb } = await connectToMongoDB();

        // Get comments
        const comments = await mongoDb.collection('proposal_comments')
            .find({ proposalId: proposalId.toString() })
            .sort({ createdAt: -1 })
            .toArray();

        // Close MongoDB connection
        await mongoClient.close();

        console.log(`📝 ADMIN: Retrieved ${comments.length} comments for proposal ${proposalId}`);

        res.json({
            success: true,
            comments: comments
        });

    } catch (error) {
        console.error('❌ ADMIN: Error fetching comments:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch comments'
>>>>>>> f6553a8 (Refactor backend services and configuration files)
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