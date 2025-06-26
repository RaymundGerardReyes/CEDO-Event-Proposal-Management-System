const express = require('express');
const router = express.Router();

const { getDb, pool } = require('./helpers');

// Request throttling map to prevent spam
const requestThrottle = new Map();
const THROTTLE_WINDOW = 1000; // 1 second
const MAX_REQUESTS = 2; // Max 2 requests per second per IP

// Throttling middleware
const throttleRequests = (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requestThrottle.has(clientId)) {
        requestThrottle.set(clientId, []);
    }

    const requests = requestThrottle.get(clientId);
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < THROTTLE_WINDOW);

    if (recentRequests.length >= MAX_REQUESTS) {
        return res.status(429).json({
            success: false,
            error: 'Too many requests. Please slow down.'
        });
    }

    recentRequests.push(now);
    requestThrottle.set(clientId, recentRequests);
    next();
};

// HYBRID admin dashboard – MySQL proposals + MongoDB file metadata
router.get('/proposals-hybrid', throttleRequests, async (req, res) => {
    console.log(`Incoming request: GET /api/mongodb-unified/admin/proposals-hybrid`);

    try {
        const { status, page = 1, limit = 10, search } = req.query;
        const db = getDb();

        // Build MySQL WHERE clause
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

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM proposals ${where}`, params);
        const totalCount = countRows[0].total;

        const [mysqlProposals] = await pool.query(
            `SELECT id, organization_name, organization_type, contact_name, contact_email, contact_phone,
                    event_name, event_venue, event_mode, event_start_date, event_end_date, 
                    event_start_time, event_end_time, school_event_type, community_event_type,
                    proposal_status, created_at, updated_at, submitted_at
             FROM proposals ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limitNum, offset],
        );

        // ✅ SIMPLE: Direct MongoDB connection for files (same as download route)
        const { MongoClient, GridFSBucket } = require('mongodb');
        const mongoUri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin';
        const mongoClient = new MongoClient(mongoUri);
        await mongoClient.connect();
        const mongoDb = mongoClient.db('cedo_auth');

        // ✅ Enrich with MongoDB file metadata + admin comments
        const hybrid = await Promise.all(
            mysqlProposals.map(async (p) => {
                // ✅ Check MongoDB GridFS for files using proposal ID
                const bucket = new GridFSBucket(mongoDb, { bucketName: 'proposal_files' });
                const mongoFiles = await bucket.find({ 'metadata.proposalId': p.id.toString() }).toArray();

                // Build simple files object
                const allFiles = {};
                mongoFiles.forEach(file => {
                    const fileType = file.metadata.fileType;
                    if (fileType) {
                        allFiles[fileType] = {
                            name: file.filename,
                            id: file._id.toString(),
                            source: 'mongodb'
                        };
                    }
                });

                // ✅ NEW: Fetch admin comments from MongoDB
                let adminComments = null;
                try {
                    const latestComment = await mongoDb.collection('proposal_comments')
                        .findOne(
                            { proposalId: p.id.toString() },
                            { sort: { createdAt: -1 } } // Get the most recent comment
                        );

                    if (latestComment) {
                        adminComments = latestComment.comment;
                        console.log(`📝 Found admin comment for proposal ${p.id}:`, adminComments.substring(0, 50) + '...');
                    }
                } catch (commentError) {
                    console.error('❌ Error fetching admin comments for proposal', p.id, ':', commentError);
                }

                return {
                    ...p,
                    files: allFiles,
                    hasFiles: Object.keys(allFiles).length > 0,
                    // ✅ NEW: Include admin comments in response
                    adminComments: adminComments,
                    // Normalize field names for frontend compatibility
                    eventName: p.event_name,
                    contactPerson: p.contact_name,
                    contactEmail: p.contact_email,
                    contactPhone: p.contact_phone,
                    organizationType: p.organization_type, // Fixed: was using organization_name
                    organizationName: p.organization_name,
                    status: p.proposal_status,
                    venue: p.event_venue,
                    startDate: p.event_start_date,
                    endDate: p.event_end_date,
                    timeStart: p.event_start_time,
                    timeEnd: p.event_end_time,
                    eventType: p.school_event_type || p.community_event_type || 'General',
                    eventMode: p.event_mode,
                    submittedAt: p.submitted_at || p.created_at,
                    createdAt: p.created_at,
                    updatedAt: p.updated_at
                };
            }),
        );

        // Close MongoDB connection
        await mongoClient.close();

        res.json({
            success: true,
            proposals: hybrid,
            pagination: {
                page: pageNum,
                pages: Math.ceil(totalCount / limitNum),
                total: totalCount,
                limit: limitNum,
                hasPrev: pageNum > 1,
                hasNext: pageNum < Math.ceil(totalCount / limitNum)
            }
        });
    } catch (err) {
        console.error('Hybrid admin fetch error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// MongoDB-only admin (legacy)
router.get('/proposals', async (req, res) => {
    try {
        const db = await getDb();
        const { status, page = 1, limit = 10, search } = req.query;

        const filter = {};
        if (status && status !== 'all') filter.proposal_status = status;
        if (search && search.trim()) {
            const re = new RegExp(search.trim(), 'i');
            filter.$or = [{ name: re }, { contact_person: re }, { contact_email: re }];
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const total = await db.collection('proposals').countDocuments(filter);
        const docs = await db.collection('proposals').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).toArray();

        res.json({ success: true, proposals: docs, pagination: { page: pageNum, pages: Math.ceil(total / limitNum), total } });
    } catch (err) {
        console.error('Admin Mongo fetch error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ Enhanced: Single proposal details with admin comments (Hybrid: MySQL + MongoDB)
router.get('/proposals/:id', async (req, res) => {
    try {
        const proposalId = req.params.id;
        console.log(`🔍 Fetching proposal details for ID: ${proposalId}`);

        // 1. ✅ First try to get from MySQL (main proposal data)
        const [mysqlRows] = await pool.query(
            `SELECT id, organization_name, organization_type, contact_name, contact_email, contact_phone,
                    event_name, event_venue, event_mode, event_start_date, event_end_date, 
                    event_start_time, event_end_time, school_event_type, community_event_type,
                    proposal_status, created_at, updated_at, submitted_at
             FROM proposals WHERE id = ?`,
            [proposalId]
        );

        if (mysqlRows.length === 0) {
            // 2. ✅ Fallback: Try MongoDB (legacy MongoDB-only proposals)
            const db = await getDb();
            const { ObjectId } = require('mongodb');
            const doc = await db.collection('proposals').findOne({ _id: new ObjectId(proposalId) });
            if (!doc) {
                return res.status(404).json({ success: false, error: 'Proposal not found' });
            }
            return res.json({ success: true, proposal: doc });
        }

        const proposal = mysqlRows[0];

        // 3. ✅ Connect to MongoDB for files and comments
        const { MongoClient, GridFSBucket } = require('mongodb');
        const mongoUri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin';
        const mongoClient = new MongoClient(mongoUri);
        await mongoClient.connect();
        const mongoDb = mongoClient.db('cedo_auth');

        // 4. ✅ Get files from MongoDB GridFS
        const bucket = new GridFSBucket(mongoDb, { bucketName: 'proposal_files' });
        const mongoFiles = await bucket.find({ 'metadata.proposalId': proposalId.toString() }).toArray();

        const allFiles = {};
        mongoFiles.forEach(file => {
            const fileType = file.metadata.fileType;
            if (fileType) {
                allFiles[fileType] = {
                    name: file.filename,
                    id: file._id.toString(),
                    source: 'mongodb'
                };
            }
        });

        // 5. ✅ Get admin comments from MongoDB
        let adminComments = null;
        try {
            const latestComment = await mongoDb.collection('proposal_comments')
                .findOne(
                    { proposalId: proposalId.toString() },
                    { sort: { createdAt: -1 } }
                );

            if (latestComment) {
                adminComments = latestComment.comment;
                console.log(`📝 Found admin comment for proposal ${proposalId}:`, adminComments.substring(0, 50) + '...');
            }
        } catch (commentError) {
            console.error('❌ Error fetching admin comments:', commentError);
        }

        await mongoClient.close();

        // 6. ✅ Build hybrid response
        const hybridProposal = {
            ...proposal,
            files: allFiles,
            hasFiles: Object.keys(allFiles).length > 0,
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

        console.log('✅ Hybrid proposal details fetched successfully');
        res.json({ success: true, proposal: hybridProposal });

    } catch (err) {
        console.error('❌ Admin single proposal error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ✅ Enhanced: Update status in MySQL + save admin comments to MongoDB
router.patch('/proposals/:id/status', async (req, res) => {
    try {
        const proposalId = req.params.id;
        const { status, adminComments } = req.body;

        const newStatus = (status || '').toLowerCase() === 'rejected' ? 'denied' : status;
        const valid = ['pending', 'approved', 'denied', 'draft'];
        if (!valid.includes(newStatus)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        console.log(`🔄 Updating proposal ${proposalId} status to ${newStatus}`);
        if (adminComments) {
            console.log(`💬 Adding admin comment: "${adminComments.substring(0, 50)}..."`);
        }

        // 1. ✅ Update MySQL proposals table (relational data)
        const [result] = await pool.query(
            'UPDATE proposals SET proposal_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newStatus, proposalId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Proposal not found' });
        }

        // 2. ✅ Save admin comments to MongoDB (if provided)
        let savedComment = null;
        if (adminComments && adminComments.trim()) {
            try {
                // Direct MongoDB connection for comments
                const { MongoClient } = require('mongodb');
                const mongoUri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin';
                const mongoClient = new MongoClient(mongoUri);
                await mongoClient.connect();
                const mongoDb = mongoClient.db('cedo_auth');

                // Create comment document in MongoDB
                const commentDoc = {
                    proposalId: proposalId.toString(), // Link to MySQL proposal ID
                    comment: adminComments.trim(),
                    status: newStatus,
                    adminAction: newStatus === 'denied' ? 'rejection' : 'approval',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    // Additional metadata for tracking
                    metadata: {
                        source: 'admin_dashboard',
                        ipAddress: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('User-Agent') || 'Unknown'
                    }
                };

                // Insert comment into MongoDB
                const commentResult = await mongoDb.collection('proposal_comments').insertOne(commentDoc);
                savedComment = {
                    id: commentResult.insertedId.toString(),
                    ...commentDoc
                };

                console.log('✅ Admin comment saved to MongoDB:', commentResult.insertedId);
                await mongoClient.close();

            } catch (mongoError) {
                console.error('❌ MongoDB comment save error:', mongoError);
                // Don't fail the whole request if comment save fails
                // Just log the error and continue
            }
        }

        // 3. ✅ Prepare response with updated proposal data
        const responseData = {
            success: true,
            message: `Proposal ${newStatus} successfully`,
            proposal: {
                id: proposalId,
                status: newStatus,
                adminComments: adminComments || null,
                updatedAt: new Date().toISOString()
            }
        };

        // Add comment info to response if saved
        if (savedComment) {
            responseData.comment = {
                id: savedComment.id,
                saved: true,
                message: 'Admin comment saved to database'
            };
        }

        console.log('✅ Proposal status updated successfully:', responseData.proposal);
        res.json(responseData);

    } catch (err) {
        console.error('❌ Status update error:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to update proposal status',
            details: err.message
        });
    }
});

// ✅ SIMPLE MongoDB GridFS File Download Route
router.get('/proposals/download/:proposalId/:fileType', async (req, res) => {
    try {
        const { proposalId, fileType } = req.params;
        console.log(`🔍 Download request for proposal ${proposalId}, file type: ${fileType}`);

        // Direct MongoDB connection - simple and straightforward
        const { MongoClient, GridFSBucket } = require('mongodb');
        const uri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin';
        const client = new MongoClient(uri);
        await client.connect();

        const db = client.db('cedo_auth');
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        // Find the file by proposalId and fileType
        const files = await bucket.find({
            $or: [
                { filename: `${fileType}_${proposalId}.pdf` },
                { 'metadata.proposalId': proposalId.toString(), 'metadata.fileType': fileType },
                { filename: { $regex: new RegExp(`${fileType}.*${proposalId}`, 'i') } }
            ]
        }).toArray();

        if (files.length === 0) {
            await client.close();
            console.log(`❌ File not found for proposal ${proposalId}, type ${fileType}`);
            return res.status(404).json({
                success: false,
                error: `${fileType.charAt(0).toUpperCase() + fileType.slice(1)} file not found`
            });
        }

        const file = files[0];
        console.log(`✅ Found file: ${file.filename} (ID: ${file._id})`);

        // Set proper headers
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileType}_proposal_${proposalId}.pdf"`
        });

        // Stream the file directly to response
        const downloadStream = bucket.openDownloadStream(file._id);

        downloadStream.on('error', (error) => {
            console.error('❌ Download stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'Download failed' });
            }
        });

        downloadStream.on('end', async () => {
            console.log('✅ File download completed');
            await client.close();
        });

        downloadStream.pipe(res);

    } catch (error) {
        console.error('❌ Download error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error during file download'
        });
    }
});

// ✅ NEW: Get all admin comments for a specific proposal
router.get('/proposals/:id/comments', async (req, res) => {
    try {
        const proposalId = req.params.id;
        console.log(`📝 Fetching all comments for proposal: ${proposalId}`);

        // Direct MongoDB connection for comments
        const { MongoClient } = require('mongodb');
        const mongoUri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin';
        const mongoClient = new MongoClient(mongoUri);
        await mongoClient.connect();
        const mongoDb = mongoClient.db('cedo_auth');

        // Get all comments for this proposal, sorted by creation date
        const comments = await mongoDb.collection('proposal_comments')
            .find({ proposalId: proposalId.toString() })
            .sort({ createdAt: -1 })
            .toArray();

        await mongoClient.close();

        console.log(`✅ Found ${comments.length} comments for proposal ${proposalId}`);
        res.json({
            success: true,
            proposalId: proposalId,
            comments: comments,
            count: comments.length
        });

    } catch (error) {
        console.error('❌ Error fetching comments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch comments'
        });
    }
});

// ✅ NEW: Test endpoint to verify database connections
router.get('/test-connections', async (req, res) => {
    try {
        const results = {
            mysql: { status: 'disconnected', error: null },
            mongodb: { status: 'disconnected', error: null }
        };

        // Test MySQL connection
        try {
            const [rows] = await pool.query('SELECT COUNT(*) as count FROM proposals');
            results.mysql.status = 'connected';
            results.mysql.proposalCount = rows[0].count;
        } catch (mysqlError) {
            results.mysql.status = 'error';
            results.mysql.error = mysqlError.message;
        }

        // Test MongoDB connection
        try {
            const { MongoClient } = require('mongodb');
            const mongoUri = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/?authSource=admin';
            const mongoClient = new MongoClient(mongoUri);
            await mongoClient.connect();
            const mongoDb = mongoClient.db('cedo_auth');

            const commentCount = await mongoDb.collection('proposal_comments').countDocuments();
            const fileCount = await mongoDb.collection('proposal_files.files').countDocuments();

            results.mongodb.status = 'connected';
            results.mongodb.commentCount = commentCount;
            results.mongodb.fileCount = fileCount;

            await mongoClient.close();
        } catch (mongoError) {
            results.mongodb.status = 'error';
            results.mongodb.error = mongoError.message;
        }

        const allConnected = results.mysql.status === 'connected' && results.mongodb.status === 'connected';

        res.json({
            success: allConnected,
            message: allConnected ? 'All database connections working' : 'Some database connections failed',
            connections: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Connection test error:', error);
        res.status(500).json({
            success: false,
            error: 'Connection test failed',
            details: error.message
        });
    }
});

module.exports = router; 