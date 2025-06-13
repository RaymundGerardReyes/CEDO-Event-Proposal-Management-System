// ===============================================
// MONGODB UNIFIED API - File Metadata Approach
// Integrates with your existing 3/4 completed code
// ===============================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const router = express.Router();

// MongoDB connection
let db;
let bucket; // Shared GridFS bucket for storing & retrieving files
MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cedo-partnership')
    .then(client => {
        db = client.db();
        // Initialise GridFS bucket once the connection is ready
        bucket = new mongoose.mongo.GridFSBucket(db, {
            bucketName: 'proposal_files',
        });
        console.log('✅ Connected to MongoDB for unified file metadata approach & GridFS initialised');
    })
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Use shared MySQL connection pool from config
const { pool } = require('../config/db');

// ===============================================
// FILE UPLOAD CONFIGURATION
// ===============================================

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/files');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Use memory storage so files are never persisted on local disk – they will be
// streamed directly into GridFS instead.  (Multer still enforces size limits.)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, Word, and Excel files are allowed.'));
        }
    }
});

// ===============================================
// HELPER FUNCTIONS
// ===============================================

// =======================================================================
// NEW: Upload file buffer straight into GridFS and return rich metadata
// =======================================================================

const uploadToGridFS = async (file, fileType, organizationName = 'Unknown') => {
    if (!bucket) {
        throw new Error('GridFS bucket not initialised yet');
    }

    const extension = path.extname(file.originalname);
    const prettyFilename = `${organizationName.replace(/\s+/g, '')}_${fileType.toUpperCase()}${extension}`;

    // Stream buffer into GridFS.  Multer with memoryStorage gives us `file.buffer`.
    const fileDoc = await new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(prettyFilename, {
            contentType: file.mimetype,
            metadata: {
                originalName: file.originalname,
                organizationName,
                fileType
            }
        });

        uploadStream.on('error', (err) => reject(err));
        uploadStream.on('finish', () => {
            // The `finish` event does not include a file document in the MongoDB
            // driver v5+.  We construct the minimal metadata we need using the
            // stream id and the filename we already know.
            resolve({
                _id: uploadStream.id,
                filename: prettyFilename,
                uploadDate: new Date()
            });
        });

        // Write the buffer and signal end-of-stream
        uploadStream.end(file.buffer);
    });

    return {
        // Use the filename stored in GridFS so download by name works
        filename: fileDoc.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: fileDoc.uploadDate,
        gridFsId: fileDoc._id.toString()
    };
};

// ===============================================
// API ROUTES
// ===============================================

// 📝 SECTION 2: Save Organization Info
router.post('/organizations', async (req, res) => {
    try {
        const orgData = {
            name: req.body.organizationName,
            description: req.body.organizationDescription,
            organizationType: req.body.organizationType,
            contactPerson: req.body.contactName,
            contactEmail: req.body.contactEmail,
            contactPhone: req.body.contactPhone,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('organizations').insertOne(orgData);

        res.json({
            success: true,
            id: result.insertedId,
            message: 'Organization saved successfully'
        });
    } catch (error) {
        console.error('Error saving organization:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🔧 ARCHITECTURAL FIX: File Storage Endpoint (Links to MySQL Proposals)
router.post('/proposals/files',
    upload.fields([
        { name: 'gpoaFile', maxCount: 1 },
        { name: 'proposalFile', maxCount: 1 },
        { name: 'accomplishmentReport', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            console.log('📁 MongoDB: Received file upload request');
            console.log('📁 Body:', req.body);
            console.log('📁 Files:', req.files);

            const { proposal_id, organization_name = 'Unknown' } = req.body;

            if (!proposal_id) {
                return res.status(400).json({
                    success: false,
                    error: 'proposal_id is required to link files to MySQL proposal'
                });
            }

            // Generate file metadata for uploaded files
            const fileMetadata = {};

            if (req.files.gpoaFile) {
                fileMetadata.gpoa = await uploadToGridFS(
                    req.files.gpoaFile[0],
                    'gpoa',
                    organization_name
                );
                console.log('📁 Generated GPOA metadata:', fileMetadata.gpoa);
            }

            if (req.files.proposalFile) {
                fileMetadata.proposal = await uploadToGridFS(
                    req.files.proposalFile[0],
                    'proposal',
                    organization_name
                );
                console.log('📁 Generated Proposal metadata:', fileMetadata.proposal);
            }

            if (req.files.accomplishmentReport) {
                fileMetadata.accomplishmentReport = await uploadToGridFS(
                    req.files.accomplishmentReport[0],
                    'AR',
                    organization_name
                );
                console.log('📁 Generated AR metadata:', fileMetadata.accomplishmentReport);
            }

            // Create file record that links to MySQL proposal
            const fileRecord = {
                proposalId: proposal_id, // Links to MySQL proposals.id
                organizationName: organization_name,
                files: fileMetadata,
                uploadedAt: new Date(),
                updatedAt: new Date()
            };

            console.log('📁 Saving file record to MongoDB:', fileRecord);

            const result = await db.collection('proposal_files').insertOne(fileRecord);

            console.log('✅ MongoDB: File metadata saved with ID:', result.insertedId);

            res.json({
                success: true,
                id: result.insertedId,
                message: 'Files uploaded and metadata saved to MongoDB',
                proposalId: proposal_id,
                files: fileMetadata,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ MongoDB: Error saving file metadata:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
);

// 🏫 SECTION 3: Save School Event with File Metadata
router.post('/proposals/school-events',
    upload.fields([
        { name: 'gpoaFile', maxCount: 1 },
        { name: 'proposalFile', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const orgName = req.body.organization_name || 'Unknown';

            // Generate file metadata for uploaded files
            const fileMetadata = {};

            if (req.files.gpoaFile) {
                fileMetadata.gpoa = await uploadToGridFS(
                    req.files.gpoaFile[0],
                    'gpoa',
                    orgName
                );
            }

            if (req.files.proposalFile) {
                fileMetadata.proposal = await uploadToGridFS(
                    req.files.proposalFile[0],
                    'proposal',
                    orgName
                );
            }

            // Create proposal document with file metadata
            const proposalData = {
                organizationId: ObjectId(req.body.organization_id),

                // Event details
                eventName: req.body.name,
                venue: req.body.venue,
                startDate: new Date(req.body.start_date),
                endDate: new Date(req.body.end_date),
                timeStart: req.body.time_start,
                timeEnd: req.body.time_end,

                eventType: req.body.event_type,
                eventMode: req.body.event_mode,
                targetAudience: JSON.parse(req.body.target_audience || '[]'),

                eventSpecificData: {
                    returnServiceCredit: req.body.return_service_credit
                },

                proposalStatus: 'pending',
                adminComments: '',

                // 🎯 YOUR FILE METADATA APPROACH!
                files: fileMetadata,

                createdAt: new Date(),
                updatedAt: new Date(),
                submittedAt: new Date()
            };

            const result = await db.collection('proposals').insertOne(proposalData);

            res.json({
                success: true,
                id: result.insertedId,
                message: 'School event proposal saved successfully',
                files: fileMetadata
            });

        } catch (error) {
            console.error('Error saving school event:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

// 🌍 SECTION 4: Save Community Event with File Metadata  
router.post('/proposals/community-events',
    upload.fields([
        { name: 'gpoaFile', maxCount: 1 },
        { name: 'proposalFile', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const orgName = req.body.organization_name || 'Unknown';

            // Generate file metadata for uploaded files
            const fileMetadata = {};

            if (req.files.gpoaFile) {
                fileMetadata.gpoa = await uploadToGridFS(
                    req.files.gpoaFile[0],
                    'gpoa',
                    orgName
                );
            }

            if (req.files.proposalFile) {
                fileMetadata.proposal = await uploadToGridFS(
                    req.files.proposalFile[0],
                    'proposal',
                    orgName
                );
            }

            const proposalData = {
                organizationId: ObjectId(req.body.organization_id),

                eventName: req.body.name,
                venue: req.body.venue,
                startDate: new Date(req.body.start_date),
                endDate: new Date(req.body.end_date),
                timeStart: req.body.time_start,
                timeEnd: req.body.time_end,

                eventType: req.body.event_type,
                eventMode: req.body.event_mode,
                targetAudience: JSON.parse(req.body.target_audience || '[]'),

                eventSpecificData: {
                    sdpCredits: req.body.sdp_credits
                },

                proposalStatus: 'pending',

                // 🎯 YOUR FILE METADATA APPROACH!
                files: fileMetadata,

                createdAt: new Date(),
                updatedAt: new Date(),
                submittedAt: new Date()
            };

            const result = await db.collection('proposals').insertOne(proposalData);

            res.json({
                success: true,
                id: result.insertedId,
                message: 'Community event proposal saved successfully',
                files: fileMetadata
            });

        } catch (error) {
            console.error('Error saving community event:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

// 📊 SECTION 5: Save Accomplishment Report with File Metadata
router.post('/accomplishment-reports',
    upload.single('accomplishmentReport'),
    async (req, res) => {
        try {
            let fileMetadata = {};

            if (req.file) {
                const orgName = req.body.organization_name || 'Unknown';
                fileMetadata.accomplishmentReport = await uploadToGridFS(
                    req.file,
                    'AR',
                    orgName
                );
            }

            const reportData = {
                proposalId: ObjectId(req.body.proposal_id),

                description: req.body.description,
                attendanceCount: parseInt(req.body.attendance_count),
                eventStatus: req.body.event_status,

                // 🎯 YOUR FILE METADATA APPROACH!
                files: fileMetadata,

                digitalSignature: req.body.signature, // Base64 signature data
                reportStatus: 'pending',
                adminComments: '',

                createdAt: new Date(),
                updatedAt: new Date(),
                submittedAt: new Date()
            };

            const result = await db.collection('accomplishment_reports').insertOne(reportData);

            res.json({
                success: true,
                id: result.insertedId,
                message: 'Accomplishment report saved successfully',
                files: fileMetadata
            });

        } catch (error) {
            console.error('Error saving accomplishment report:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

// 📋 SECTION 1: Get User's Proposals Overview
router.get('/user-proposals/:email', async (req, res) => {
    try {
        const userEmail = req.params.email;

        const proposals = await db.collection('proposals').aggregate([
            {
                $lookup: {
                    from: 'organizations',
                    localField: 'organizationId',
                    foreignField: '_id',
                    as: 'organization'
                }
            },
            {
                $lookup: {
                    from: 'accomplishment_reports',
                    localField: '_id',
                    foreignField: 'proposalId',
                    as: 'reports'
                }
            },
            {
                $match: {
                    'organization.contactEmail': userEmail
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $project: {
                    _id: 1,
                    eventName: 1,
                    proposalStatus: 1,
                    eventType: 1,
                    startDate: 1,
                    endDate: 1,
                    files: 1, // Include file metadata
                    organization: { $arrayElemAt: ['$organization', 0] },
                    reportStatus: {
                        $ifNull: [
                            { $arrayElemAt: ['$reports.reportStatus', 0] },
                            'not_submitted'
                        ]
                    },
                    createdAt: 1
                }
            }
        ]).toArray();

        res.json({
            success: true,
            proposals: proposals
        });

    } catch (error) {
        console.error('Error fetching user proposals:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 📄 Get file by path (for downloading)
router.get('/files/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(uploadsDir, filename);

        if (fs.existsSync(filePath)) {
            res.download(filePath);
        } else {
            res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===============================================
// FILE DOWNLOAD ENDPOINTS
// ===============================================

// Download file by proposal ID and file type (HYBRID: Works with MySQL proposal IDs)
router.get('/proposals/download/:proposalId/:fileType', async (req, res) => {
    try {
        const { proposalId, fileType } = req.params;

        console.log(`📥 Hybrid Download request: MySQL Proposal ${proposalId}, File type: ${fileType}`);

        // Validate file type
        const validFileTypes = ['gpoa', 'proposal'];
        if (!validFileTypes.includes(fileType)) {
            return res.status(400).json({
                error: 'Invalid file type. Must be: gpoa or proposal'
            });
        }

        // Get file record from proposal_files collection using MySQL proposal ID
        const fileRecord = await db.collection('proposal_files').findOne({
            proposalId: proposalId.toString() // MySQL proposal ID as string
        });

        if (!fileRecord) {
            return res.status(404).json({
                error: 'No files found for this proposal',
                proposalId: proposalId
            });
        }

        // Get file metadata from file record
        const fileMetadata = fileRecord.files && fileRecord.files[fileType];
        if (!fileMetadata) {
            return res.status(404).json({
                error: `${fileType.toUpperCase()} file not found for this proposal`,
                availableFiles: Object.keys(fileRecord.files || {})
            });
        }

        console.log(`📋 File metadata found:`, fileMetadata);

        // Create GridFS bucket for file retrieval
        const bucket = new mongoose.mongo.GridFSBucket(db, {
            bucketName: 'proposal_files',
            chunkSizeBytes: 255 * 1024 // 255KB chunks
        });

        // Check if file exists in GridFS
        const fileDoc = await bucket.find({
            filename: fileMetadata.filename
        }).toArray();

        if (!fileDoc || fileDoc.length === 0) {
            console.error(`❌ File not found in GridFS: ${fileMetadata.filename}`);
            return res.status(404).json({
                error: 'File not found in storage'
            });
        }

        const file = fileDoc[0];
        console.log(`✅ File found in GridFS:`, {
            filename: file.filename,
            length: file.length,
            uploadDate: file.uploadDate
        });

        // Set response headers for file download
        res.set({
            'Content-Type': file.metadata?.mimeType || 'application/octet-stream',
            'Content-Length': file.length,
            'Content-Disposition': `attachment; filename="${fileMetadata.originalName || file.filename}"`,
            'Cache-Control': 'no-cache',
            'X-File-Info': JSON.stringify({
                originalName: fileMetadata.originalName,
                size: file.length,
                uploadDate: file.uploadDate
            })
        });

        // Stream file from GridFS to response
        const downloadStream = bucket.openDownloadStreamByName(file.filename);

        downloadStream.on('error', (error) => {
            console.error('❌ GridFS download stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error streaming file' });
            }
        });

        downloadStream.on('end', () => {
            console.log(`✅ File download completed: ${file.filename}`);
        });

        // Pipe the file stream to the response
        downloadStream.pipe(res);

    } catch (error) {
        console.error('❌ File download error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Failed to download file',
                details: error.message
            });
        }
    }
});

// Get file information without downloading (HYBRID: Works with MySQL proposal IDs)
router.get('/proposals/file-info/:proposalId/:fileType', async (req, res) => {
    try {
        const { proposalId, fileType } = req.params;

        // Validate file type
        const validFileTypes = ['gpoa', 'proposal'];
        if (!validFileTypes.includes(fileType)) {
            return res.status(400).json({
                error: 'Invalid file type. Must be: gpoa or proposal'
            });
        }

        // Get file record from proposal_files collection using MySQL proposal ID
        const fileRecord = await db.collection('proposal_files').findOne({
            proposalId: proposalId.toString()
        });

        if (!fileRecord) {
            return res.status(404).json({
                error: 'No files found for this proposal',
                proposalId: proposalId
            });
        }

        // Get file metadata from file record
        const fileMetadata = fileRecord.files && fileRecord.files[fileType];
        if (!fileMetadata) {
            return res.status(404).json({
                error: `${fileType.toUpperCase()} file not found for this proposal`,
                availableFiles: Object.keys(fileRecord.files || {})
            });
        }

        // Return file information
        res.json({
            success: true,
            fileInfo: {
                filename: fileMetadata.filename,
                originalName: fileMetadata.originalName,
                size: fileMetadata.size,
                mimeType: fileMetadata.mimeType,
                uploadedAt: fileMetadata.uploadedAt,
                downloadUrl: `/api/mongodb-proposals/proposals/download/${proposalId}/${fileType}`
            }
        });

    } catch (error) {
        console.error('❌ Get file info error:', error);
        res.status(500).json({
            error: 'Failed to get file information',
            details: error.message
        });
    }
});

// List all files for a proposal (HYBRID: Works with MySQL proposal IDs)
router.get('/proposals/files/:proposalId', async (req, res) => {
    try {
        const { proposalId } = req.params;

        // Get file record from proposal_files collection using MySQL proposal ID
        const fileRecord = await db.collection('proposal_files').findOne({
            proposalId: proposalId.toString()
        });

        if (!fileRecord) {
            return res.status(404).json({
                error: 'No files found for this proposal',
                proposalId: proposalId,
                files: {}
            });
        }

        const files = {};

        // Check for each file type
        ['gpoa', 'proposal'].forEach(fileType => {
            if (fileRecord.files && fileRecord.files[fileType]) {
                files[fileType] = {
                    ...fileRecord.files[fileType],
                    downloadUrl: `/api/mongodb-proposals/proposals/download/${proposalId}/${fileType}`
                };
            }
        });

        res.json({
            success: true,
            proposalId: proposalId,
            files: files,
            hasFiles: Object.keys(files).length > 0
        });

    } catch (error) {
        console.error('❌ List files error:', error);
        res.status(500).json({
            error: 'Failed to list files',
            details: error.message
        });
    }
});

// ===============================================
// HYBRID ADMIN ENDPOINTS (MySQL + MongoDB)
// ===============================================

// 🔧 ARCHITECTURAL FIX: Hybrid Admin Dashboard - Query MySQL + MongoDB
router.get('/admin/proposals-hybrid', async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search } = req.query;

        console.log('📋 Hybrid Admin: Fetching proposals with filters:', { status, page, limit, search });

        // Build MySQL query filter
        let whereClause = 'WHERE 1=1';
        const queryParams = [];

        // Filter by status if provided
        if (status && status !== 'all') {
            whereClause += ' AND proposal_status = ?';
            queryParams.push(status);
        }

        // Search filter (search in organization name, contact person, contact email)
        if (search && search.trim()) {
            whereClause += ' AND (organization_name LIKE ? OR contact_name LIKE ? OR contact_email LIKE ?)';
            const searchTerm = `%${search.trim()}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        console.log('🔍 MySQL query filter:', whereClause, queryParams);

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM proposals ${whereClause}`;
        const [countResult] = await pool.query(countQuery, queryParams);
        const totalCount = countResult[0].total;

        // Fetch proposals from MySQL with pagination
        const proposalsQuery = `
            SELECT id, organization_name, organization_description, organization_type,
                   contact_name, contact_email, contact_phone,
                   event_start_date, event_end_date, event_venue, 
                   school_event_type, community_event_type,
                   proposal_status, created_at, updated_at
            FROM proposals 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `;

        const [mysqlProposals] = await pool.query(proposalsQuery, [...queryParams, limitNum, offset]);

        console.log(`✅ MySQL: Fetched ${mysqlProposals.length} proposals from MySQL`);

        // For each proposal, get file metadata from MongoDB
        const hybridProposals = await Promise.all(
            mysqlProposals.map(async (proposal) => {
                try {
                    // Query MongoDB for file metadata linked to this proposal
                    const fileRecord = await db.collection('proposal_files').findOne({
                        proposalId: proposal.id.toString()
                    });

                    console.log(`📁 MongoDB: File metadata for proposal ${proposal.id}:`, fileRecord ? 'Found' : 'Not found');

                    return {
                        // MySQL data (primary proposal information) - using correct column names
                        id: proposal.id,
                        organizationName: proposal.organization_name,
                        eventName: proposal.organization_name, // Use organization_name as event name
                        eventType: proposal.organization_type || 'unknown',
                        status: proposal.proposal_status,
                        submittedAt: proposal.created_at,
                        contactPerson: proposal.contact_name,
                        contactEmail: proposal.contact_email,
                        contactPhone: proposal.contact_phone,
                        venue: proposal.event_venue,
                        startDate: proposal.event_start_date,
                        endDate: proposal.event_end_date,
                        description: proposal.organization_description,
                        category: proposal.school_event_type || proposal.community_event_type || 'other',
                        organizationType: proposal.organization_type,
                        // Default values for fields not in the current table structure
                        budget: 0,
                        objectives: 'Objectives to be defined',
                        volunteersNeeded: 0,

                        // MongoDB data (file metadata)
                        files: fileRecord ? fileRecord.files : {},
                        fileUploadedAt: fileRecord ? fileRecord.uploadedAt : null,

                        // Hybrid metadata
                        dataSource: 'hybrid',
                        mysqlId: proposal.id,
                        mongoFileId: fileRecord ? fileRecord._id.toString() : null
                    };
                } catch (fileError) {
                    console.error(`❌ Error fetching files for proposal ${proposal.id}:`, fileError);
                    return {
                        // MySQL data with correct column mapping
                        id: proposal.id,
                        organizationName: proposal.organization_name,
                        eventName: proposal.organization_name,
                        eventType: proposal.organization_type || 'unknown',
                        status: proposal.proposal_status,
                        submittedAt: proposal.created_at,
                        contactPerson: proposal.contact_name,
                        contactEmail: proposal.contact_email,
                        contactPhone: proposal.contact_phone,
                        venue: proposal.event_venue,
                        startDate: proposal.event_start_date,
                        endDate: proposal.event_end_date,
                        description: proposal.organization_description,
                        category: proposal.school_event_type || proposal.community_event_type || 'other',
                        organizationType: proposal.organization_type,
                        budget: 0,
                        objectives: 'Objectives to be defined',
                        volunteersNeeded: 0,
                        // File metadata (empty due to error)
                        files: {},
                        fileUploadedAt: null,
                        dataSource: 'mysql-only',
                        mysqlId: proposal.id,
                        mongoFileId: null
                    };
                }
            })
        );

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: Math.ceil(totalCount / limitNum),
            hasNext: pageNum < Math.ceil(totalCount / limitNum),
            hasPrev: pageNum > 1
        };

        console.log('✅ Hybrid Admin: Successfully fetched proposals:', {
            count: hybridProposals.length,
            pagination,
            mysqlCount: mysqlProposals.length,
            withFiles: hybridProposals.filter(p => Object.keys(p.files).length > 0).length
        });

        res.json({
            success: true,
            proposals: hybridProposals,
            pagination,
            filters: { status, search },
            metadata: {
                dataSource: 'hybrid',
                mysqlProposals: mysqlProposals.length,
                withFileMetadata: hybridProposals.filter(p => p.mongoFileId).length,
                architecture: 'MySQL (proposals) + MongoDB (files)'
            }
        });

    } catch (error) {
        console.error('❌ Hybrid Admin: Error fetching proposals:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch hybrid proposals',
            details: error.message,
            proposals: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 }
        });
    }
});

// ===============================================
// ADMIN ENDPOINTS (Original MongoDB-only)
// ===============================================

// Get all proposals for admin dashboard (with filtering and pagination)
router.get('/admin/proposals', async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search } = req.query;

        console.log('📋 Admin: Fetching proposals with filters:', { status, page, limit, search });

        // Build query filter
        let filter = {};

        // Filter by status if provided
        if (status && status !== 'all') {
            filter.proposal_status = status;
        }

        // Search filter (search in organization name, event name, contact person)
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { name: searchRegex },
                { contact_person: searchRegex },
                { contact_email: searchRegex }
            ];
        }

        console.log('🔍 MongoDB query filter:', filter);

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get total count for pagination
        const totalCount = await db.collection('proposals').countDocuments(filter);

        // Fetch proposals with pagination
        const proposals = await db.collection('proposals')
            .find(filter)
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limitNum)
            .toArray();

        // Transform data for frontend
        const transformedProposals = proposals.map(proposal => ({
            id: proposal._id.toString(),
            organizationName: proposal.contact_person || 'Unknown Organization',
            eventName: proposal.name || 'Unnamed Event',
            eventType: proposal.event_type || 'unknown',
            status: proposal.proposal_status || 'pending',
            submittedAt: proposal.createdAt || proposal.start_date || new Date().toISOString(),
            contactPerson: proposal.contact_person || 'Unknown',
            contactEmail: proposal.contact_email || 'No email',
            contactPhone: proposal.contact_phone || 'No phone',
            venue: proposal.venue || 'TBD',
            startDate: proposal.start_date,
            endDate: proposal.end_date,
            timeStart: proposal.time_start,
            timeEnd: proposal.time_end,
            eventMode: proposal.event_mode || 'offline',
            returnServiceCredit: proposal.return_service_credit || 0,
            targetAudience: proposal.target_audience || [],
            adminComments: proposal.admin_comments || '',
            files: proposal.files || {},
            // Additional fields that might be useful
            description: proposal.description || '',
            category: proposal.category || '',
            organizationType: proposal.organization_type || 'school-based'
        }));

        const pagination = {
            page: pageNum,
            limit: limitNum,
            total: totalCount,
            pages: Math.ceil(totalCount / limitNum),
            hasNext: pageNum < Math.ceil(totalCount / limitNum),
            hasPrev: pageNum > 1
        };

        console.log('✅ Admin: Successfully fetched proposals:', {
            count: transformedProposals.length,
            pagination
        });

        res.json({
            success: true,
            proposals: transformedProposals,
            pagination,
            filters: { status, search }
        });

    } catch (error) {
        console.error('❌ Admin: Error fetching proposals:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch proposals',
            details: error.message,
            proposals: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 }
        });
    }
});

// Get single proposal details for admin
router.get('/admin/proposals/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log('📋 Admin: Fetching proposal details for ID:', id);

        const proposal = await db.collection('proposals').findOne({
            _id: new ObjectId(id)
        });

        if (!proposal) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found'
            });
        }

        // Transform data for frontend
        const transformedProposal = {
            id: proposal._id.toString(),
            organizationName: proposal.contact_person || 'Unknown Organization',
            eventName: proposal.name || 'Unnamed Event',
            eventType: proposal.event_type || 'unknown',
            status: proposal.proposal_status || 'pending',
            submittedAt: proposal.createdAt || proposal.start_date || new Date().toISOString(),
            contactPerson: proposal.contact_person || 'Unknown',
            contactEmail: proposal.contact_email || 'No email',
            contactPhone: proposal.contact_phone || 'No phone',
            venue: proposal.venue || 'TBD',
            startDate: proposal.start_date,
            endDate: proposal.end_date,
            timeStart: proposal.time_start,
            timeEnd: proposal.time_end,
            eventMode: proposal.event_mode || 'offline',
            returnServiceCredit: proposal.return_service_credit || 0,
            targetAudience: proposal.target_audience || [],
            adminComments: proposal.admin_comments || '',
            files: proposal.files || {},
            description: proposal.description || '',
            category: proposal.category || '',
            organizationType: proposal.organization_type || 'school-based',
            // Raw data for debugging
            rawData: proposal
        };

        console.log('✅ Admin: Successfully fetched proposal details');

        res.json({
            success: true,
            proposal: transformedProposal
        });

    } catch (error) {
        console.error('❌ Admin: Error fetching proposal details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch proposal details',
            details: error.message
        });
    }
});

// ===============================================
// HYBRID ADMIN ENDPOINTS FOR STATUS UPDATES
// ===============================================

// Update proposal status (hybrid: MySQL proposal + MongoDB files)
router.patch('/admin/proposals/:id/status', async (req, res) => {
    try {
        const proposalId = req.params.id;
        const { status, adminComments } = req.body;

        console.log('🔧 Hybrid Admin: Updating proposal status');
        console.log('📊 Proposal ID:', proposalId);
        console.log('📊 Request body:', req.body);

        // Validate and normalise the new status.
        //   • Front-end historically sends "denied" while some legacy code uses
        //     "rejected".  MySQL enum is "denied".  Accept both and map to the
        //     canonical column value to avoid 500 errors.

        const inputStatus = (status || '').toLowerCase();

        const normalisedStatus = inputStatus === 'rejected' ? 'denied' : inputStatus;

        const validStatuses = ['pending', 'approved', 'denied', 'draft'];

        if (!validStatuses.includes(normalisedStatus)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status',
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        // Update status in MySQL proposals table
        const updateQuery = `
            UPDATE proposals 
            SET proposal_status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        const [updateResult] = await pool.query(updateQuery, [normalisedStatus, proposalId]);

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found',
                message: `No proposal found with ID: ${proposalId}`
            });
        }

        console.log('✅ Hybrid Admin: Proposal status updated successfully in MySQL');

        // Return success response
        res.json({
            success: true,
            message: `Proposal ${normalisedStatus} successfully`,
            proposal: {
                id: proposalId,
                status: normalisedStatus,
                adminComments: adminComments || '',
                updatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Hybrid Admin: Error updating proposal status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update proposal status',
            message: error.message
        });
    }
});

// Download file from hybrid proposal (MySQL + MongoDB files)
router.get('/proposals/:id/download/:fileType', async (req, res) => {
    try {
        const proposalId = req.params.id;
        const fileType = req.params.fileType; // 'gpoa' or 'proposal'

        console.log('📁 Hybrid Download: Requested file download');
        console.log('📊 Proposal ID:', proposalId);
        console.log('📊 File Type:', fileType);

        // Find file metadata in MongoDB
        const fileRecord = await db.collection('proposal_files').findOne({
            proposalId: proposalId.toString()
        });

        if (!fileRecord) {
            console.log('❌ Hybrid Download: No file metadata found in MongoDB');
            return res.status(404).json({
                success: false,
                error: 'File metadata not found',
                message: `No files found for proposal ID: ${proposalId}`
            });
        }

        const fileMetadata = fileRecord.files[fileType];
        if (!fileMetadata) {
            console.log(`❌ Hybrid Download: ${fileType} file not found`);
            return res.status(404).json({
                success: false,
                error: 'File not found',
                message: `${fileType} file not found for proposal ID: ${proposalId}`
            });
        }

        // =============================================
        // NEW – Stream directly from GridFS
        // =============================================

        try {
            const fileDocArr = await bucket.find({ filename: fileMetadata.filename }).toArray();
            if (!fileDocArr || fileDocArr.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'File not found in GridFS'
                });
            }

            const fileDoc = fileDocArr[0];

            res.set({
                'Content-Type': fileMetadata.mimeType || 'application/octet-stream',
                'Content-Length': fileDoc.length,
                'Content-Disposition': `attachment; filename="${fileMetadata.originalName || fileDoc.filename}"`,
                'Cache-Control': 'no-cache'
            });

            const downloadStream = bucket.openDownloadStreamByName(fileMetadata.filename);

            downloadStream.on('error', (err) => {
                console.error('❌ GridFS stream error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, error: 'Error streaming file' });
                }
            });

            downloadStream.on('end', () => {
                console.log('✅ Hybrid Download: File streamed successfully via GridFS');
            });

            downloadStream.pipe(res);

        } catch (streamErr) {
            console.error('❌ Hybrid Download: GridFS lookup error:', streamErr);
            return res.status(500).json({ success: false, error: 'Failed to stream file', details: streamErr.message });
        }

    } catch (error) {
        console.error('❌ Hybrid Download: Error downloading file:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download file',
            message: error.message
        });
    }
});

// ===============================================
// STUDENT ENDPOINT – LIST DRAFT PROPOSALS (MySQL)
// ===============================================

/**
 * GET /api/mongodb-proposals/proposals/drafts/:email
 * Hybrid helper used by the student "Resume Drafts" page.
 * Returns all proposals that belong to a given contact_email and are still in
 * `draft` status.  The data is lightweight – just enough for the list view.
 *
 * Params
 *   • email – student's login email (same as proposals.contact_email)
 */
router.get('/proposals/drafts/:email', async (req, res) => {
    try {
        const contactEmail = req.params.email;
        if (!contactEmail) {
            return res.status(400).json({ success: false, error: 'email param is required' });
        }

        console.log('📋 Student Drafts – fetching drafts for:', contactEmail);

        const query = `
            SELECT id,
                   organization_name,
                   contact_email,
                   organization_type,
                   updated_at,
                   created_at,
                   proposal_status
            FROM proposals
            WHERE contact_email = ? AND proposal_status = 'draft'
            ORDER BY updated_at DESC
        `;

        const [rows] = await pool.query(query, [contactEmail]);

        const drafts = rows.map(row => ({
            id: row.id,
            name: row.organization_name || 'Untitled Draft',
            lastEdited: row.updated_at || row.created_at,
            step: 'orgInfo',          // minimal info; frontend will refine
            progress: 40,             // rough placeholder – calculate client-side if needed
            data: {
                organizationName: row.organization_name,
                organizationTypes: [row.organization_type || 'school-based'],
                contactEmail: row.contact_email
            }
        }));

        res.json({ success: true, drafts });
    } catch (err) {
        console.error('❌ Error fetching draft proposals:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch drafts', details: err.message });
    }
});

module.exports = router; 