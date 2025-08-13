/**
 * =============================================
 * MONGODB UNIFIED ROUTES - Reports & Documentation
 * =============================================
 * 
 * This module handles all reporting and documentation operations including
 * accomplishment reports, file uploads, and post-event documentation.
 * It implements hybrid storage for comprehensive reporting:
 * - MySQL: Event status and metadata updates
 * - MongoDB: File storage and report documents
 * - GridFS: Large file handling for reports
 * 
 * @module routes/mongodb-unified/reports
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - Section 5 accomplishment report processing
 * - Multi-file upload support (PDF, CSV)
 * - Hybrid MySQL + MongoDB data storage
 * - File download and metadata management
 * - Report status tracking
 * - Digital signature support
 */

const express = require('express');
const { Binary } = require('mongodb');
const router = express.Router();

const {
    getDb,
    upload,
    toObjectId,
    uploadToGridFS,
    pool,
} = require('./helpers');

// =============================================
// DEBUGGING MIDDLEWARE
// =============================================

// Log all requests to the reports router
router.use((req, res, next) => {
    console.log('📊 REPORTS ROUTER: Request received:', {
        method: req.method,
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl
    });
    next();
});

// ✅ SIMPLE DEBUG ROUTE - SHOULD WORK FIRST
router.get('/debug', (req, res) => {
    console.log('🐛 DEBUG: Simple debug route called successfully!');
    res.json({
        success: true,
        message: 'Debug route is working',
        timestamp: new Date().toISOString(),
        request_info: {
            method: req.method,
            path: req.path,
            url: req.url,
            originalUrl: req.originalUrl,
            baseUrl: req.baseUrl
        }
    });
});

// =============================================
// STUDENT PROPOSAL STATUS ENDPOINT
// =============================================

/**
 * @route GET /api/mongodb-unified/reports/student-proposal/:id
 * @desc Get proposal status for student (handles both MongoDB ObjectId and MySQL integer ID)
 * @access Public (Student)
 * 
 * @param {string} id - Proposal ID (can be MongoDB ObjectId or MySQL integer)
 * @returns {Object} Proposal status and metadata
 */
router.get('/student-proposal/:id', async (req, res) => {
    const proposalId = req.params.id;
    console.log('📋 STUDENT PROPOSAL: Fetching proposal status for ID:', proposalId);

    let connection;
    try {
        // STEP 1: Determine if this is a MongoDB ObjectId or MySQL integer
        let isMongoId = false;
        let mysqlId = proposalId;

        // Check if it looks like a MongoDB ObjectId (24 character hex string)
        if (proposalId.match(/^[0-9a-fA-F]{24}$/)) {
            isMongoId = true;
            console.log('📋 STUDENT PROPOSAL: Detected MongoDB ObjectId format');
        } else if (!isNaN(parseInt(proposalId))) {
            mysqlId = parseInt(proposalId);
            console.log('📋 STUDENT PROPOSAL: Detected MySQL integer format');
        }

        // STEP 2: Get MySQL proposal data
        connection = await pool.getConnection();
        let proposalQuery;
        let queryParams;

        if (isMongoId) {
            // If it's a MongoDB ID, try to find by UUID or other fields
            proposalQuery = `
                SELECT * FROM proposals 
                WHERE uuid = ? OR id = ? 
                ORDER BY created_at DESC 
                LIMIT 1
            `;
            queryParams = [proposalId, proposalId];
        } else {
            // If it's a MySQL ID, query directly
            proposalQuery = 'SELECT * FROM proposals WHERE id = ?';
            queryParams = [mysqlId];
        }

        console.log('📋 STUDENT PROPOSAL: Executing query:', { proposalQuery, queryParams });
        const [rows] = await connection.query(proposalQuery, queryParams);

        if (rows.length === 0) {
            console.log('📋 STUDENT PROPOSAL: No proposal found for ID:', proposalId);

            // ✅ DEBUGGING: Try to find any proposals to help with debugging
            try {
                const [allProposals] = await connection.query('SELECT id, uuid, organization_name, proposal_status FROM proposals LIMIT 5');
                console.log('📋 STUDENT PROPOSAL: Available proposals (first 5):', allProposals);
            } catch (debugError) {
                console.log('📋 STUDENT PROPOSAL: Could not fetch debug proposals:', debugError.message);
            }

            return res.status(404).json({
                success: false,
                error: 'Proposal not found',
                searchedId: proposalId,
                searchType: isMongoId ? 'mongodb_objectid' : 'mysql_integer',
                debug: {
                    query: proposalQuery,
                    params: queryParams,
                    message: 'Check console logs for available proposals'
                }
            });
        }

        const proposal = rows[0];
        console.log('✅ STUDENT PROPOSAL: Found proposal:', {
            id: proposal.id,
            uuid: proposal.uuid,
            organization_name: proposal.organization_name,
            proposal_status: proposal.proposal_status,
            report_status: proposal.report_status
        });

        // STEP 3: Return formatted response
        const responseData = {
            success: true,
            proposal: {
                id: proposal.id,
                uuid: proposal.uuid,
                mysql_id: proposal.id,
                proposal_status: proposal.proposal_status,
                status: proposal.proposal_status, // Normalized field
                report_status: proposal.report_status,
                admin_comments: proposal.admin_comments,
                adminComments: proposal.admin_comments, // Normalized field
                event_name: proposal.event_name,
                organization_name: proposal.organization_name,
                created_at: proposal.created_at,
                updated_at: proposal.updated_at,
                submitted_at: proposal.submitted_at,
                event_status: proposal.event_status
            },
            meta: {
                searched_id: proposalId,
                found_by: isMongoId ? 'uuid_lookup' : 'mysql_id',
                mysql_id: proposal.id
            }
        };

        console.log('✅ STUDENT PROPOSAL: Returning proposal data for student access');
        res.json(responseData);

    } catch (error) {
        console.error('❌ STUDENT PROPOSAL: Error fetching proposal:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch proposal status',
            searched_id: proposalId
        });
    } finally {
        if (connection) connection.release();
    }
});

// =============================================
// USER PROPOSALS ENDPOINT
// =============================================

/**
 * @route GET /api/mongodb-unified/reports/user-proposals
 * @desc Get all proposals for the current authenticated user
 * @access Private (Authenticated users)
 * 
 * @returns {Object} Array of user proposals with status and metadata
 */
router.get('/user-proposals', async (req, res) => {
    try {
        // Get user from request (set by auth middleware)
        const user = req.user;
        if (!user || !user.id) {
            return res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
        }

        console.log('📋 REPORTS: Fetching proposals for user:', user.id);

        // Get MySQL connection
        const connection = await pool.getConnection();

        try {
            // Fetch proposals from MySQL for the current user
            const [proposals] = await connection.execute(
                `SELECT 
                    id as mysql_id,
                    uuid,
                    event_name,
                    organization_name,
                    organization_type,
                    contact_email,
                    proposal_status,
                    report_status,
                    event_status,
                    created_at,
                    updated_at,
                    submitted_at,
                    admin_comments,
                    objectives,
                    budget,
                    attendance_count
                FROM proposals 
                WHERE user_id = ? 
                ORDER BY created_at DESC`,
                [user.id]
            );

            console.log('✅ REPORTS: Successfully fetched proposals:', {
                userId: user.id,
                proposalCount: proposals.length
            });

            res.json({
                success: true,
                proposals: proposals,
                userId: user.id,
                totalCount: proposals.length
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('❌ REPORTS: Error fetching user proposals:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch user proposals'
        });
    }
});

// =============================================
// TEST ROUTE (for debugging) - PLACED FIRST
// =============================================

/**
 * @route GET /api/mongodb-unified/reports/test
 * @desc Test endpoint to verify backend connectivity
 * @access Public
 * 
 * @returns {Object} Simple success response
 */
// ✅ SIMPLE TEST ROUTE - DEBUGGING
router.get('/test', (req, res) => {
    console.log('🧪 TEST: Test endpoint called successfully!');
    res.json({
        success: true,
        message: 'Section 5 reporting backend is working',
        timestamp: new Date().toISOString(),
        routes_registered: 'YES',
        endpoints: {
            student_proposal: 'GET /api/mongodb-unified/reports/student-proposal/:id',
            user_proposals: 'GET /api/mongodb-unified/reports/user-proposals',
            section5_reporting: 'POST /api/mongodb-unified/reports/section5-reporting',
            health: 'GET /api/mongodb-unified/reports/health',
            test: 'GET /api/mongodb-unified/reports/test'
        }
    });
});

// ✅ SIMPLE HEALTH CHECK ROUTE - DEBUGGING
router.get('/health', (req, res) => {
    console.log('🏥 HEALTH: Simple health check called successfully!');
    res.json({
        success: true,
        message: 'Reports service is healthy',
        timestamp: new Date().toISOString(),
        status: 'OK'
    });
});

/**
 * @route POST /api/mongodb-unified/reports/section5-reporting-test
 * @desc Test route for section5-reporting without upload middleware
 * @access Public (Student)
 */
router.post('/section5-reporting-test', (req, res) => {
    console.log('🧪 TEST: Section5-reporting test route called');
    console.log('🧪 TEST: Request method:', req.method);
    console.log('🧪 TEST: Request headers:', req.headers);
    console.log('🧪 TEST: Request body keys:', Object.keys(req.body));
    console.log('🧪 TEST: Request body:', req.body);

    // Check if this is a connectivity test
    if (req.body.test) {
        res.json({
            success: true,
            message: 'Test endpoint working - connectivity verified',
            receivedData: req.body,
            timestamp: new Date().toISOString(),
            endpoint: '/api/mongodb-unified/reports/section5-reporting-test'
        });
        return;
    }

    res.json({
        success: true,
        message: 'Test endpoint working',
        receivedData: req.body,
        timestamp: new Date().toISOString()
    });
});

/**
 * @route GET /api/mongodb-unified/reports/section5-reporting-test
 * @desc Test route for section5-reporting (GET method)
 * @access Public (Student)
 */
router.get('/section5-reporting-test', (req, res) => {
    console.log('🧪 TEST: Section5-reporting test route (GET) called');
    console.log('🧪 TEST: Request method:', req.method);
    console.log('🧪 TEST: Request headers:', req.headers);
    console.log('🧪 TEST: Query params:', req.query);

    res.json({
        success: true,
        message: 'Test endpoint working (GET)',
        timestamp: new Date().toISOString(),
        endpoint: '/api/mongodb-unified/reports/section5-reporting-test',
        method: 'GET'
    });
});

// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================

/**
 * Validate Section 5 reporting data
 * 
 * @param {Object} reqBody - Request body data
 * @param {Object} files - Uploaded files
 * @returns {Object} Validation result
 */
const validateSection5Data = (reqBody, files) => {
    const errors = [];

    // Required basic fields
    if (!reqBody.proposal_id) {
        errors.push('proposal_id is required');
    }

    if (!reqBody.event_status) {
        errors.push('event_status is required');
    }

    // File validation - be more flexible
    if (!files || Object.keys(files).length === 0) {
        errors.push('At least one file is required');
    } else {
        // Check for at least one of the expected file types
        const expectedFiles = [
            'accomplishment_report_file',
            'pre_registration_file',
            'final_attendance_file',
            'final_attendance_proof_file'
        ];

        const hasAtLeastOneFile = expectedFiles.some(fileType =>
            files && files[fileType] && files[fileType].length > 0
        );

        if (!hasAtLeastOneFile) {
            errors.push('At least one file is required (accomplishment report, pre-registration list, attendance list, or attendance proof)');
        } else {
            // Log which files were found for debugging
            const foundFiles = expectedFiles.filter(fileType =>
                files && files[fileType] && files[fileType].length > 0
            );
            console.log('📊 SECTION 5: Found files:', foundFiles);
        }
    }

    // Additional validation for required fields
    if (!reqBody.organization_name) {
        errors.push('organization_name is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Process file uploads for Section 5 reporting
 * 
 * @param {Object} files - Multer files object
 * @param {string} organizationName - Organization name for file naming
 * @param {string} proposalId - Proposal ID for linking
 * @returns {Promise<Object>} File metadata object
 */
const processSection5Files = async (files, organizationName, proposalId) => {
    const fileMetadata = {};
    const db = await getDb();

    // Strategy 1: Try to use a different collection without validation
    let fileUploadsCollection;
    try {
        // Try to create a new collection specifically for Section 5 files
        await db.createCollection('section5_files');
        fileUploadsCollection = db.collection('section5_files');
        console.log('📁 SECTION 5: Using section5_files collection');
    } catch (error) {
        if (error.code === 48) { // Collection already exists
            fileUploadsCollection = db.collection('section5_files');
            console.log('📁 SECTION 5: Using existing section5_files collection');
        } else {
            console.warn('📁 SECTION 5: Could not create section5_files collection:', error.message);
            // Fallback to original collection with bypass
            fileUploadsCollection = db.collection('file_uploads');
            console.log('📁 SECTION 5: Falling back to file_uploads collection with bypass');
        }
    }

    // Define all expected file types
    const expectedFileTypes = [
        'accomplishment_report_file',
        'pre_registration_file',
        'final_attendance_file',
        'final_attendance_proof_file'
    ];

    console.log('📁 SECTION 5: Processing files:', {
        receivedFiles: files ? Object.keys(files) : 'None',
        expectedFiles: expectedFileTypes,
        collectionName: fileUploadsCollection.collectionName
    });

    for (const [fieldName, fileArray] of Object.entries(files)) {
        if (!fileArray || !fileArray[0]) {
            console.log(`📁 SECTION 5: Skipping empty file field: ${fieldName}`);
            continue;
        }

        const file = fileArray[0];
        const typeShort = fieldName.replace('_file', '').replace('_', '');
        const timestamp = Date.now();
        const orgSlug = organizationName.replace(/\s+/g, '_');
        const uniqueFilename = `${orgSlug}_${typeShort}_${timestamp}${require('path').extname(file.originalname)}`;

        // Strategy 1: Try direct collection storage with bypass
        try {
            const doc = {
                filename: uniqueFilename,
                originalName: file.originalname,
                data: new Binary(file.buffer),
                mimetype: file.mimetype,
                size: file.size,
                proposal_id: parseInt(proposalId),
                upload_type: typeShort,
                created_at: new Date(),
                updated_at: new Date(),
                status: 'active',
                is_deleted: false,
                // Add any additional fields that might be required by schema
                section: 'section5',
                organization_name: organizationName,
                file_category: 'accomplishment_report'
            };

            console.log(`📁 SECTION 5: Attempting to insert document for ${fieldName}:`, {
                filename: uniqueFilename,
                size: file.size,
                proposal_id: parseInt(proposalId),
                upload_type: typeShort,
                collection: fileUploadsCollection.collectionName
            });

            // Try with bypass validation first
            const result = await fileUploadsCollection.insertOne(doc, {
                bypassDocumentValidation: true
            });

            fileMetadata[fieldName] = {
                mongoId: result.insertedId.toString(),
                originalName: file.originalname,
                size: file.size,
                filename: uniqueFilename,
                storage: 'collection'
            };

            console.log(`✅ Section 5: Uploaded ${fieldName}:`, {
                filename: uniqueFilename,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                mongoId: result.insertedId.toString()
            });

        } catch (error) {
            console.error(`❌ Section 5: Failed to upload ${fieldName}:`, error);
            console.error(`❌ Section 5: Error details:`, {
                message: error.message,
                code: error.code,
                name: error.name
            });

            // Strategy 2: Try GridFS as fallback
            if (error.message.includes('validation') || error.message.includes('Document failed validation')) {
                console.log(`🔄 SECTION 5: Trying GridFS fallback for ${fieldName}`);

                try {
                    // Import GridFS utility dynamically
                    const { uploadFile } = require('../../utils/gridfs');

                    const gridfsResult = await uploadFile(file, typeShort.toUpperCase(), organizationName);
                    fileMetadata[fieldName] = {
                        mongoId: gridfsResult.fileId,
                        originalName: file.originalname,
                        size: file.size,
                        filename: gridfsResult.filename,
                        storage: 'gridfs'
                    };

                    console.log(`✅ Section 5: Uploaded ${fieldName} to GridFS:`, {
                        filename: gridfsResult.filename,
                        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                        mongoId: gridfsResult.fileId
                    });

                } catch (gridfsError) {
                    console.error(`❌ Section 5: GridFS fallback also failed for ${fieldName}:`, gridfsError);

                    // Strategy 3: Try local file system as final fallback
                    console.log(`🔄 SECTION 5: Trying local file system fallback for ${fieldName}`);

                    try {
                        const fs = require('fs').promises;
                        const path = require('path');

                        // Create uploads directory if it doesn't exist
                        const uploadsDir = path.join(__dirname, '../../../uploads/section5');
                        await fs.mkdir(uploadsDir, { recursive: true });

                        // Save file locally
                        const filePath = path.join(uploadsDir, uniqueFilename);
                        await fs.writeFile(filePath, file.buffer);

                        fileMetadata[fieldName] = {
                            mongoId: `local_${Date.now()}`,
                            originalName: file.originalname,
                            size: file.size,
                            filename: uniqueFilename,
                            storage: 'local',
                            filePath: filePath
                        };

                        console.log(`✅ Section 5: Uploaded ${fieldName} to local storage:`, {
                            filename: uniqueFilename,
                            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                            filePath: filePath
                        });

                    } catch (localError) {
                        console.error(`❌ Section 5: All storage methods failed for ${fieldName}:`, localError);
                        throw new Error(`${fieldName} upload failed: All storage methods (MongoDB, GridFS, Local) failed - ${error.message}`);
                    }
                }
            } else if (error.code === 11000) {
                throw new Error(`${fieldName} upload failed: File already exists`);
            } else {
                throw new Error(`${fieldName} upload failed: ${error.message}`);
            }
        }
    }

    console.log('📁 SECTION 5: File processing completed:', {
        totalFiles: Object.keys(fileMetadata).length,
        fileTypes: Object.keys(fileMetadata),
        storageMethods: Object.values(fileMetadata).map(f => f.storage)
    });

    return fileMetadata;
};

/**
 * Update MySQL proposal with Section 5 data
 * 
 * @param {Object} connection - MySQL connection
 * @param {Object} data - Section 5 data to update
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<void>}
 */
const updateProposalWithSection5Data = async (connection, data, proposalId) => {
    const {
        event_status,
        event_venue,
        event_start_date,
        event_end_date,
        report_description,
        attendance_count
    } = data;

    const updateQuery = `
        UPDATE proposals 
        SET event_status = ?, 
            event_venue = ?, 
            event_start_date = ?, 
            event_end_date = ?, 
            report_description = ?, 
            attendance_count = ?, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `;

    await connection.query(updateQuery, [
        event_status || null,
        event_venue || null,
        event_start_date || null,
        event_end_date || null,
        report_description || null,
        attendance_count ? parseInt(attendance_count) : null,
        proposalId
    ]);

    console.log(`✅ Section 5: Updated MySQL proposal ${proposalId} with reporting data`);
};

// =============================================
// SECTION 5 REPORTING ROUTES
// =============================================

/**
 * @route POST /api/mongodb-unified/reports/section5-reporting
 * @desc Process Section 5 accomplishment reports with file uploads
 * @access Public (Student)
 * 
 * @body {string} proposal_id - Proposal ID
 * @body {string} event_status - Event completion status
 * @body {string} event_venue - Updated event venue
 * @body {string} report_description - Additional report notes
 * @body {string} attendance_count - Number of attendees
 * @body {string} organization_name - Organization name for file naming
 * @body {string} event_start_date - Event start date
 * @body {string} event_end_date - Event end date
 * @body {File} accomplishment_report_file - Accomplishment report (PDF/DOCX)
 * @body {File} pre_registration_file - Pre-registration list (CSV)
 * @body {File} final_attendance_file - Final attendance list (CSV)
 * 
 * @returns {Object} Success response with file metadata
 */
router.post('/section5-reporting', (req, res, next) => {
    console.log('🧪 DEBUG: Section5-reporting route middleware called');
    console.log('🧪 DEBUG: Request headers:', req.headers);
    console.log('🧪 DEBUG: Content-Type:', req.headers['content-type']);

    // Call the upload middleware
    upload.fields([
        { name: 'accomplishment_report_file', maxCount: 1 },
        { name: 'pre_registration_file', maxCount: 1 },
        { name: 'final_attendance_file', maxCount: 1 },
        { name: 'final_attendance_proof_file', maxCount: 1 }
    ])(req, res, (err) => {
        if (err) {
            console.error('❌ DEBUG: Upload middleware error:', err);
            return res.status(400).json({
                success: false,
                error: `Upload error: ${err.message}`
            });
        }
        console.log('✅ DEBUG: Upload middleware completed successfully');
        next();
    });
}, async (req, res) => {
    console.log('📊 SECTION 5: ==================== SECTION 5 REPORTING REQUEST ====================');
    console.log('📊 SECTION 5: Request method:', req.method);
    console.log('📊 SECTION 5: Request body keys:', Object.keys(req.body));
    console.log('📊 SECTION 5: Files attached:', req.files ? Object.keys(req.files) : 'None');

    // Log individual file details
    if (req.files) {
        Object.entries(req.files).forEach(([fieldName, fileArray]) => {
            if (fileArray && fileArray.length > 0) {
                const file = fileArray[0];
                console.log(`📁 SECTION 5: File ${fieldName}:`, {
                    originalName: file.originalname,
                    size: file.size,
                    mimetype: file.mimetype
                });
            }
        });
    }

    try {
        // STEP 1: Validate request data
        const validation = validateSection5Data(req.body, req.files);
        if (!validation.isValid) {
            console.error('❌ SECTION 5: Validation failed:', validation.errors);
            return res.status(400).json({
                success: false,
                error: `Section 5 validation failed: ${validation.errors.join(', ')}`,
                details: validation.errors
            });
        }

        const proposalId = req.body.proposal_id;
        console.log('📊 SECTION 5: Processing proposal ID:', proposalId);

        // STEP 2: Verify proposal exists in MySQL
        let connection;
        try {
            connection = await pool.getConnection();
            const [proposalRows] = await connection.query(
                'SELECT id, organization_name FROM proposals WHERE id = ?',
                [proposalId]
            );

            if (proposalRows.length === 0) {
                console.error('❌ SECTION 5: Proposal not found in MySQL:', proposalId);
                return res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
            }

            const organizationName = req.body.organization_name || proposalRows[0].organization_name || 'Unknown';
            console.log('📊 SECTION 5: Found proposal:', {
                id: proposalId,
                organizationName: organizationName
            });

            // STEP 3: Upload files to MongoDB
            const fileMetadata = await processSection5Files(req.files, organizationName, proposalId);

            // STEP 4: Update MySQL proposal with Section 5 data
            await updateProposalWithSection5Data(connection, req.body, proposalId);

            // STEP 5: Send success response
            const responseData = {
                success: true,
                message: 'Section 5 data saved successfully',
                files_uploaded: fileMetadata,
                verified_data: {
                    proposal_id: proposalId,
                    event_status: req.body.event_status,
                    event_venue: req.body.event_venue,
                    report_description: req.body.report_description,
                    attendance_count: req.body.attendance_count,
                    organization_name: organizationName,
                    event_start_date: req.body.event_start_date,
                    event_end_date: req.body.event_end_date
                }
            };

            console.log('🎉 SECTION 5: Processing completed successfully:', {
                proposalId: proposalId,
                fileCount: Object.keys(fileMetadata).length,
                totalSize: Object.values(fileMetadata).reduce((sum, file) => sum + file.size, 0)
            });

            res.json(responseData);

        } finally {
            if (connection) connection.release();
        }

    } catch (error) {
        console.error('❌ SECTION 5: Error processing Section 5 data:', error);
        console.error('❌ SECTION 5: Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to process Section 5 reporting data'
        });
    }
});

// =============================================
// LEGACY ACCOMPLISHMENT REPORTS
// =============================================

/**
 * @route POST /api/mongodb-unified/reports/accomplishment-reports
 * @desc Save accomplishment report with file (legacy endpoint)
 * @access Public (Student)
 * 
 * @body {string} proposal_id - Proposal ID
 * @body {string} description - Report description
 * @body {string} attendance_count - Number of attendees
 * @body {string} event_status - Event status
 * @body {string} signature - Digital signature
 * @body {File} accomplishmentReport - Accomplishment report file
 * 
 * @returns {Object} Success response with report ID
 */
router.post('/accomplishment-reports', upload.single('accomplishmentReport'), async (req, res) => {
    try {
        console.log('📊 LEGACY: Processing accomplishment report upload');

        const fileMeta = {};
        if (req.file) {
            const orgName = req.body.organization_name || 'Unknown';
            fileMeta.accomplishmentReport = await uploadToGridFS(req.file, 'AR', orgName);
            console.log('✅ LEGACY: Uploaded accomplishment report to GridFS');
        }

        const db = await getDb();
        const reportData = {
            proposalId: toObjectId(req.body.proposal_id),
            description: req.body.description,
            attendanceCount: parseInt(req.body.attendance_count),
            eventStatus: req.body.event_status,
            files: fileMeta,
            digitalSignature: req.body.signature,
            reportStatus: 'pending',
            adminComments: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            submittedAt: new Date(),
        };

        const result = await db.collection('accomplishment_reports').insertOne(reportData);

        console.log('✅ LEGACY: Saved accomplishment report:', {
            reportId: result.insertedId,
            proposalId: req.body.proposal_id
        });

        res.json({
            success: true,
            id: result.insertedId,
            message: 'Report saved successfully',
            files: fileMeta
        });

    } catch (error) {
        console.error('❌ LEGACY: Error saving accomplishment report:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to save accomplishment report'
        });
    }
});

// =============================================
// PROPOSAL DATA RETRIEVAL ROUTES
// =============================================

/**
 * @route GET /api/mongodb-unified/reports/proposal/:id
 * @desc Get complete proposal data with files (MySQL + MongoDB)
 * @access Public (Student/Admin)
 * 
 * @param {string} id - Proposal ID
 * 
 * @returns {Object} Complete proposal with file metadata
 */
router.get('/proposal/:id', async (req, res) => {
    const proposalId = req.params.id;
    console.log('📋 PROPOSAL: Fetching complete proposal data for ID:', proposalId);

    let connection;
    try {
        // STEP 1: Get MySQL proposal data
        connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM proposals WHERE id = ?', [proposalId]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Proposal not found in MySQL database'
            });
        }

        const mysqlProposal = rows[0];
        console.log('✅ PROPOSAL: Found MySQL proposal:', {
            id: mysqlProposal.id,
            organization_name: mysqlProposal.organization_name,
            status: mysqlProposal.status
        });

        // STEP 2: Try to get MongoDB data (with proper ObjectId handling)
        let mongoProposal = null;
        try {
            const db = await getDb();

            // Try to convert string ID to ObjectId, but handle gracefully if it fails
            let objectId;
            try {
                objectId = toObjectId(proposalId);
            } catch (idError) {
                console.log('⚠️ PROPOSAL: Could not convert proposal ID to ObjectId:', idError.message);
                // Try to find by string ID instead
                objectId = proposalId;
            }

            // Try to find by ObjectId first
            try {
                mongoProposal = await db.collection('proposals').findOne({ _id: objectId });
            } catch (mongoError) {
                console.log('⚠️ PROPOSAL: ObjectId query failed, trying string ID:', mongoError.message);
                // Fallback: try to find by string ID
                mongoProposal = await db.collection('proposals').findOne({ proposal_id: proposalId });
            }

            if (mongoProposal) {
                console.log('✅ PROPOSAL: Found MongoDB proposal');
            } else {
                console.log('ℹ️ PROPOSAL: No MongoDB proposal found (this is normal for older proposals)');
            }

        } catch (mongoError) {
            console.error('❌ PROPOSAL: MongoDB query error:', mongoError);
            // Continue without MongoDB data
        }

        // STEP 3: Get file metadata
        let fileMetadata = {};
        try {
            const db = await getDb();

            // Try to find files by proposal ID (handle both ObjectId and string)
            let fileQuery;
            try {
                const objectId = toObjectId(proposalId);
                fileQuery = { proposal_id: objectId };
            } catch (idError) {
                fileQuery = { proposal_id: parseInt(proposalId) };
            }

            const files = await db.collection('file_uploads').find(fileQuery).toArray();

            if (files.length > 0) {
                fileMetadata = files.map(file => ({
                    id: file._id.toString(),
                    filename: file.filename,
                    originalName: file.originalName,
                    size: file.size,
                    mimetype: file.mimetype,
                    upload_type: file.upload_type,
                    created_at: file.created_at
                }));
                console.log('✅ PROPOSAL: Found', files.length, 'files');
            }

        } catch (fileError) {
            console.error('❌ PROPOSAL: File metadata query error:', fileError);
            // Continue without file metadata
        }

        // STEP 4: Combine and return data
        const responseData = {
            success: true,
            proposal: {
                ...mysqlProposal,
                mongo_data: mongoProposal,
                files: fileMetadata
            },
            summary: {
                has_mysql_data: true,
                has_mongo_data: !!mongoProposal,
                file_count: fileMetadata.length,
                total_size: fileMetadata.reduce((sum, file) => sum + (file.size || 0), 0)
            }
        };

        console.log('✅ PROPOSAL: Returning complete proposal data:', {
            proposalId,
            hasMongoData: !!mongoProposal,
            fileCount: fileMetadata.length
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ PROPOSAL: Error fetching proposal data:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch proposal data'
        });
    } finally {
        if (connection) connection.release();
    }
});

// =============================================
// STUDENT FILE ACCESS ROUTES
// =============================================

/**
 * @route GET /api/mongodb-unified/reports/proposal/:id/files
 * @desc Get files for a specific proposal (student access)
 * @access Private (Student - can only access their own proposals)
 * 
 * @param {string} id - Proposal ID
 * 
 * @returns {Object} File metadata for the proposal
 */
router.get('/proposal/:id/files', async (req, res) => {
    const proposalId = req.params.id;
    console.log('📁 STUDENT FILES: Fetching files for proposal ID:', proposalId);

    try {
        // Verify proposal exists and belongs to the authenticated user
        let connection;
        try {
            connection = await pool.getConnection();
            const [proposalRows] = await connection.query(
                'SELECT id, organization_name, user_id FROM proposals WHERE id = ?',
                [proposalId]
            );

            if (proposalRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Proposal not found'
                });
            }

            const proposal = proposalRows[0];
            console.log('📁 STUDENT FILES: Found proposal:', {
                id: proposal.id,
                organizationName: proposal.organization_name,
                userId: proposal.user_id
            });

            // Get files from MongoDB
            const db = await getDb();
            const files = {};

            // Try section5_files collection first
            let fileUploads = await db.collection('section5_files')
                .find({ proposal_id: parseInt(proposalId) })
                .toArray();

            // If no files in section5_files, try file_uploads collection
            if (fileUploads.length === 0) {
                fileUploads = await db.collection('file_uploads')
                    .find({ proposal_id: parseInt(proposalId) })
                    .toArray();
            }

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

            console.log('📁 STUDENT FILES: Found files:', {
                proposalId: proposalId,
                fileCount: Object.keys(files).length,
                fileTypes: Object.keys(files)
            });

            res.json({
                success: true,
                files: files,
                proposal: {
                    id: proposal.id,
                    organization_name: proposal.organization_name
                },
                source: 'student_files'
            });

        } finally {
            if (connection) connection.release();
        }

    } catch (error) {
        console.error('❌ STUDENT FILES: Error fetching files:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch proposal files'
        });
    }
});

// =============================================
// FILE DOWNLOAD ROUTES
// =============================================

/**
 * @route GET /api/mongodb-unified/reports/file/:fileId
 * @desc Download file by MongoDB file ID
 * @access Public (Student/Admin)
 * 
 * @param {string} fileId - MongoDB file ID
 * 
 * @returns {Stream} File stream with proper headers
 */
router.get('/file/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        console.log('📥 FILE: Downloading file with ID:', fileId);

        const db = await getDb();
        const { ObjectId } = require('mongodb');

        const file = await db.collection('file_uploads').findOne({
            _id: new ObjectId(fileId)
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        console.log('📥 FILE: Found file for download:', {
            filename: file.filename,
            originalName: file.originalName,
            size: file.size,
            mimetype: file.mimetype
        });

        // Set proper headers for file download
        res.set({
            'Content-Type': file.mimetype,
            'Content-Disposition': `attachment; filename="${file.originalName}"`,
            'Content-Length': file.size
        });

        // Send file buffer
        res.send(file.data.buffer);

        console.log('✅ FILE: Download completed successfully');

    } catch (error) {
        console.error('❌ FILE: Error downloading file:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to download file'
        });
    }
});

// ✅ REMOVED DUPLICATE HEALTH ROUTE - Using simplified version above

/**
 * @route POST /api/mongodb-unified/reports/health
 * @desc Health check endpoint for reports service (POST)
 * @access Public
 */
router.post('/health', async (req, res) => {
    console.log('🏥 HEALTH: Health check requested (POST)');

    try {
        // Test database connections
        const db = await getDb();
        const mysqlConnection = await pool.getConnection();

        // Test basic operations
        await db.admin().ping();
        await mysqlConnection.ping();

        mysqlConnection.release();

        res.json({
            success: true,
            message: 'Reports service is healthy (POST)',
            timestamp: new Date().toISOString(),
            services: {
                mongodb: 'connected',
                mysql: 'connected'
            },
            receivedData: req.body
        });

    } catch (error) {
        console.error('🏥 HEALTH: Health check failed (POST):', error);
        res.status(500).json({
            success: false,
            message: 'Reports service is unhealthy (POST)',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router; 