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

    if (!reqBody.proposal_id) {
        errors.push('proposal_id is required');
    }

    if (!reqBody.event_status) {
        errors.push('event_status is required');
    }

    if (!files || Object.keys(files).length === 0) {
        errors.push('At least one file is required');
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
    const fileUploadsCollection = db.collection('file_uploads');

    for (const [fieldName, fileArray] of Object.entries(files)) {
        if (!fileArray || !fileArray[0]) continue;

        const file = fileArray[0];
        const typeShort = fieldName.replace('_file', '').replace('_', '');
        const timestamp = Date.now();
        const orgSlug = organizationName.replace(/\s+/g, '_');
        const uniqueFilename = `${orgSlug}_${typeShort}_${timestamp}${require('path').extname(file.originalname)}`;

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
            };

            const result = await fileUploadsCollection.insertOne(doc);
            fileMetadata[fieldName] = {
                mongoId: result.insertedId.toString(),
                originalName: file.originalname,
                size: file.size,
                filename: uniqueFilename
            };

            console.log(`✅ Section 5: Uploaded ${fieldName}:`, {
                filename: uniqueFilename,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                mongoId: result.insertedId.toString()
            });

        } catch (error) {
            console.error(`❌ Section 5: Failed to upload ${fieldName}:`, error);
            throw new Error(`${fieldName} upload failed: ${error.message}`);
        }
    }

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
router.post('/section5-reporting', upload.fields([
    { name: 'accomplishment_report_file', maxCount: 1 },
    { name: 'pre_registration_file', maxCount: 1 },
    { name: 'final_attendance_file', maxCount: 1 },
]), async (req, res) => {
    console.log('📊 SECTION 5: ==================== SECTION 5 REPORTING REQUEST ====================');
    console.log('📊 SECTION 5: Request method:', req.method);
    console.log('📊 SECTION 5: Request body keys:', Object.keys(req.body));
    console.log('📊 SECTION 5: Files attached:', req.files ? Object.keys(req.files) : 'None');

    try {
        // STEP 1: Validate request data
        const validation = validateSection5Data(req.body, req.files);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: `Section 5 validation failed: ${validation.errors.join(', ')}`
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
                error: 'Proposal not found'
            });
        }

        const proposal = rows[0];
        console.log('📋 PROPOSAL: Found MySQL proposal:', {
            id: proposal.id,
            organizationName: proposal.organization_name,
            status: proposal.proposal_status
        });

        // STEP 2: Get MongoDB file metadata
        const db = await getDb();
        const files = {};
        const fileUploads = await db.collection('file_uploads')
            .find({ proposal_id: parseInt(proposalId) })
            .toArray();

        fileUploads.forEach((file) => {
            files[file.upload_type] = {
                id: file._id.toString(),
                filename: file.filename,
                originalName: file.originalName,
                size: file.size,
                mimetype: file.mimetype,
                created_at: file.created_at,
            };
        });

        console.log('📋 PROPOSAL: Found MongoDB files:', {
            fileCount: Object.keys(files).length,
            fileTypes: Object.keys(files)
        });

        res.json({
            success: true,
            proposal: proposal,
            files: files,
            has_files: Object.keys(files).length > 0
        });

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

module.exports = router; 