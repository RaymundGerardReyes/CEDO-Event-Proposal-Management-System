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

const express = require('express');
const router = express.Router();
const { getDb, pool } = require('./helpers');
const rateLimit = require('express-rate-limit');
const { validateAdmin, validateToken } = require('../../middleware/auth');

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

// Apply authentication middleware to all admin routes
router.use(validateToken, validateAdmin);

// ==============================
// SHARED UTILITY FUNCTIONS
// ==============================

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
    }

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

// ==============================
// Dashboard Statistics Endpoints
// ==============================

/**
 * @route GET /api/mongodb-unified/admin/dashboard-stats
 * @desc Get comprehensive dashboard statistics for admin overview
 * @access Admin
 * 
 * @returns {Object} Dashboard statistics including counts and trends
 */
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

/**
 * @route GET /api/mongodb-unified/admin/proposals/:id/files
 * @desc Get files for a specific proposal (admin access)
 * @access Admin
 * 
 * @param {string} id - Proposal ID
 * 
 * @returns {Object} File metadata for the proposal
 */
router.get('/proposals/:id/files', async (req, res) => {
    try {
        const proposalId = req.params.id;
        console.log(`📁 ADMIN FILES: Fetching files for proposal ID: ${proposalId}`);

        // STEP 1: Verify proposal exists
        const [proposalRows] = await pool.query(
            'SELECT id, organization_name FROM proposals WHERE id = ?',
            [proposalId]
        );

        if (proposalRows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }

        const proposal = proposalRows[0];
        console.log('📁 ADMIN FILES: Found proposal:', {
            id: proposal.id,
            organizationName: proposal.organization_name
        });

        // STEP 2: Get files from MongoDB
        const db = await getDb();
        const files = {};

        // Try section5_files collection first (new Section 5 files)
        let fileUploads = await db.collection('section5_files')
            .find({ proposal_id: parseInt(proposalId) })
            .toArray();

        // If no files in section5_files, try file_uploads collection (legacy)
        if (fileUploads.length === 0) {
            fileUploads = await db.collection('file_uploads')
                .find({ proposal_id: parseInt(proposalId) })
                .toArray();
        }

        // Also check for legacy MySQL file fields
        const mysqlFiles = {};
        if (proposal.accomplishment_report_file_name) {
            mysqlFiles.accomplishment_report = {
                name: proposal.accomplishment_report_file_name,
                path: proposal.accomplishment_report_file_path,
                storage: 'mysql'
            };
        }
        if (proposal.pre_registration_file_name) {
            mysqlFiles.pre_registration = {
                name: proposal.pre_registration_file_name,
                path: proposal.pre_registration_file_path,
                storage: 'mysql'
            };
        }
        if (proposal.final_attendance_file_name) {
            mysqlFiles.final_attendance = {
                name: proposal.final_attendance_file_name,
                path: proposal.final_attendance_file_path,
                storage: 'mysql'
            };
        }

        // Combine MongoDB and MySQL files
        fileUploads.forEach((file) => {
            files[file.upload_type] = {
                id: file._id.toString(),
                filename: file.filename,
                originalName: file.originalName,
                size: file.size,
                mimetype: file.mimetype,
                created_at: file.created_at,
                storage: 'mongodb'
            };
        });

        // Merge with MySQL files (MongoDB files take precedence)
        const allFiles = { ...mysqlFiles, ...files };

        console.log('📁 ADMIN FILES: Found files:', {
            proposalId: proposalId,
            fileCount: Object.keys(allFiles).length,
            fileTypes: Object.keys(allFiles),
            mongoFiles: Object.keys(files).length,
            mysqlFiles: Object.keys(mysqlFiles).length
        });

        res.json({
            success: true,
            files: allFiles,
            proposal: {
                id: proposal.id,
                organization_name: proposal.organization_name
            },
            source: 'admin_files',
            metadata: {
                totalFiles: Object.keys(allFiles).length,
                mongoFiles: Object.keys(files).length,
                mysqlFiles: Object.keys(mysqlFiles).length
            }
        });

    } catch (error) {
        console.error('❌ ADMIN FILES: Error fetching files:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch proposal files'
        });
    }
});

// ==============================
// Proposals Management Endpoints
// ==============================

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
router.get('/proposals-hybrid', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const { where, params } = buildWhereClause(req.query);

        // STEP 1: Get pagination info
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // STEP 2: Get MySQL proposals
        const [mysqlProposals] = await pool.query(
            `SELECT id, organization_name, organization_type, contact_name, contact_email, contact_phone,
                    event_name, event_venue, event_mode, event_start_date, event_end_date, 
                    event_start_time, event_end_time, school_event_type, community_event_type,
                    proposal_status, created_at, updated_at, submitted_at
             FROM proposals ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limitNum, offset]
        );

        console.log(`📊 ADMIN: Found ${mysqlProposals.length} proposals from MySQL`);

        // ✅ DEBUG: Log specific proposal ID 4 status
        const proposal4 = mysqlProposals.find(p => p.id == 4 || p.id == '4');
        if (proposal4) {
            console.log(`🔍 ADMIN DEBUG: Proposal ID 4 status = "${proposal4.proposal_status}"`);
        }

        // STEP 3: Connect to MongoDB for files and comments
        const { mongoClient, mongoDb } = await connectToMongoDB();

        // STEP 4: Enrich proposals with MongoDB data
        const hybrid = await Promise.all(
            mysqlProposals.map(async (proposal) => {
                const files = await getMongoFileMetadata(proposal.id, mongoDb);
                const adminComments = await getAdminComments(proposal.id, mongoDb);

                return normalizeProposalData(proposal, files, adminComments);
            })
        );

        // STEP 5: Close MongoDB connection
        await mongoClient.close();

        // STEP 6: Transform data to match frontend expectations
        const transformedProposals = hybrid.map((p) => {
            const nameFallback = p.contactPerson || p.organizationName || 'Unknown';
            const initials = nameFallback
                .split(/\s+/)
                .map((n) => n[0] || '')
                .join('')
                .slice(0, 2)
                .toUpperCase();

            return {
                ...p,
                initials,
                name: nameFallback
            };
        });

        // STEP 7: Get total count for pagination
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM proposals ${where}`,
            params
        );
        const totalCount = countResult[0].total;

        console.log(`✅ ADMIN: Successfully processed ${transformedProposals.length} hybrid proposals`);

        // ✅ DEBUG: Log final transformed proposal ID 4 status
        const transformedProposal4 = transformedProposals.find(p => p.id == 4 || p.id == '4');
        if (transformedProposal4) {
            console.log(`🔍 ADMIN DEBUG: Final transformed proposal ID 4 status = "${transformedProposal4.status}"`);
        }

        res.json({
            success: true,
            message: `Successfully fetched ${transformedProposals.length} proposals`,
            proposals: transformedProposals,
            pagination: {
                page: pageNum,
                pages: Math.ceil(totalCount / limitNum),
                total: totalCount,
                limit: limitNum,
                hasPrev: pageNum > 1,
                hasNext: pageNum < Math.ceil(totalCount / limitNum)
            }
        });

    } catch (error) {
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
        });
    }
});

// ==============================
// LEGACY MONGODB-ONLY ROUTES
// ==============================

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

// ==============================
// ADMIN COMMENT MANAGEMENT
// ==============================

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