/**
 * =============================================
 * MONGODB UNIFIED ROUTES - File Management
 * =============================================
 * 
 * This module handles all file upload, download, and management operations
 * for proposal documents. It uses GridFS for efficient file storage and
 * provides metadata management for file tracking.
 * 
 * @module routes/mongodb-unified/proposal-files
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - GridFS file uploads with metadata
 * - File download with proper headers
 * - File metadata management
 * - Cross-platform file handling
 * - File validation and error handling
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const {
    getDb,
    upload,
    uploadToGridFS,
    path,
    fs,
    fsPromises,
    uploadsDir,
    pool,
    query,
    validateProposalId,
    createErrorResponse,
    createSuccessResponse
} = require('./helpers');

// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================

/**
 * Validate file upload request
 * 
 * @param {Object} reqBody - Request body
 * @param {Object} files - Uploaded files
 * @returns {Object} Validation result
 */
const validateFileUpload = (reqBody, files) => {
    const errors = [];

    if (!reqBody.proposal_id) {
        errors.push('proposal_id is required');
    }

    if (!files || Object.keys(files).length === 0) {
        errors.push('No files uploaded');
    }

    const validFileTypes = ['gpoaFile', 'proposalFile', 'accomplishmentReport'];
    const uploadedTypes = Object.keys(files || {});

    for (const fileType of uploadedTypes) {
        if (!validFileTypes.includes(fileType)) {
            errors.push(`Invalid file type: ${fileType}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Process file uploads to GridFS
 * 
 * @param {Object} files - Multer files object
 * @param {string} organizationName - Organization name for file naming
 * @param {string} proposalId - Proposal ID for linking
 * @returns {Promise<Object>} File metadata object
 */
const processFileUploads = async (files, organizationName, proposalId) => {
    const fileMetadata = {};
    const uploadPromises = [];

    // Process each file type
    for (const [fileType, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
            const file = fileArray[0];
            console.log(`📎 Processing ${fileType} upload:`, {
                originalName: file.originalname,
                size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                mimetype: file.mimetype
            });

            try {
                const metadata = await uploadToGridFS(file, fileType, organizationName, proposalId);
                fileMetadata[fileType] = metadata;
                console.log(`✅ ${fileType} uploaded successfully:`, {
                    filename: metadata.filename,
                    gridFsId: metadata.gridFsId,
                    size: metadata.size
                });
            } catch (error) {
                console.error(`❌ ${fileType} upload failed:`, error);
                throw new Error(`${fileType} upload failed: ${error.message}`);
            }
        }
    }

    return fileMetadata;
};

/**
 * Create file metadata record in MongoDB
 * 
 * @param {string} proposalId - Proposal ID
 * @param {string} organizationName - Organization name
 * @param {Object} fileMetadata - File upload metadata
 * @returns {Promise<Object>} Created record
 */
const createFileMetadataRecord = async (proposalId, organizationName, fileMetadata) => {
    const db = await getDb();

    const record = {
        proposalId: proposalId,
        organizationName: organizationName,
        files: fileMetadata,
        uploadedAt: new Date(),
        updatedAt: new Date(),
        fileCount: Object.keys(fileMetadata).length,
        totalSize: Object.values(fileMetadata).reduce((sum, file) => sum + file.size, 0)
    };

    const result = await db.collection('proposal_files').insertOne(record);
    console.log('✅ File metadata record created:', {
        recordId: result.insertedId,
        proposalId: proposalId,
        fileCount: record.fileCount,
        totalSize: `${(record.totalSize / 1024 / 1024).toFixed(2)} MB`
    });

    return { ...record, _id: result.insertedId };
};

// =============================================
// FILE UPLOAD ROUTES
// =============================================

/**
 * @route POST /api/mongodb-unified/proposals/files
 * @desc Upload files for a proposal with GridFS storage
 * @access Public (Student)
 * 
 * @body {string} proposal_id - Proposal ID to link files to
 * @body {string} organization_name - Organization name for file naming
 * @body {File} gpoaFile - GPOA document (optional)
 * @body {File} proposalFile - Proposal document (optional)
 * @body {File} accomplishmentReport - Accomplishment report (optional)
 * 
 * @returns {Object} Success response with file metadata
 */
router.post(
    '/proposals/files',
    upload.fields([
        { name: 'gpoaFile', maxCount: 1 },
        { name: 'proposalFile', maxCount: 1 },
        { name: 'accomplishmentReport', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            console.log('📁 FILE UPLOAD: ==================== FILE UPLOAD REQUEST ====================');
            console.log('📁 FILE UPLOAD: Request method:', req.method);
            console.log('📁 FILE UPLOAD: Request body keys:', Object.keys(req.body));
            console.log('📁 FILE UPLOAD: Files attached:', req.files ? Object.keys(req.files) : 'None');

            // STEP 1: Validate request
            const validation = validateFileUpload(req.body, req.files);
            if (!validation.isValid) {
                const errorResponse = createErrorResponse(
                    `File upload validation failed: ${validation.errors.join(', ')}`,
                    400
                );
                return res.status(400).json(errorResponse);
            }

            const proposalId = validateProposalId(req.body.proposal_id);
            if (!proposalId) {
                const errorResponse = createErrorResponse('Invalid proposal ID', 400);
                return res.status(400).json(errorResponse);
            }

            // STEP 2: Verify proposal exists
            const proposalResult = await query(
                'SELECT id, organization_name FROM proposals WHERE id = $1',
                [proposalId]
            );

            if (proposalResult.rows.length === 0) {
                const errorResponse = createErrorResponse(`Proposal with ID ${proposalId} not found`, 404);
                return res.status(404).json(errorResponse);
            }

            const organizationName = req.body.organization_name || proposalResult.rows[0].organization_name || 'Unknown';
            console.log('📁 FILE UPLOAD: Processing files for proposal:', {
                proposalId: proposalId,
                organizationName: organizationName,
                fileCount: Object.keys(req.files).length
            });

            // STEP 3: Upload files to GridFS
            const fileMetadata = await processFileUploads(req.files, organizationName, proposalId.toString());

            // STEP 4: Create metadata record
            const metadataRecord = await createFileMetadataRecord(proposalId.toString(), organizationName, fileMetadata);

            // STEP 5: Send success response
            const responseData = createSuccessResponse({
                id: metadataRecord._id,
                files: fileMetadata,
                fileUploads: Object.keys(fileMetadata).reduce((acc, key) => {
                    acc[key] = {
                        success: true,
                        filename: fileMetadata[key].filename,
                        mongoId: fileMetadata[key].gridFsId,
                        size: fileMetadata[key].size
                    };
                    return acc;
                }, {}),
                metadata: {
                    proposalId: proposalId,
                    organizationName: organizationName,
                    fileCount: metadataRecord.fileCount,
                    totalSize: metadataRecord.totalSize,
                    uploadedAt: metadataRecord.uploadedAt
                }
            }, 'Files uploaded successfully');

            console.log('🎉 FILE UPLOAD: Upload completed successfully:', {
                proposalId: proposalId,
                fileCount: metadataRecord.fileCount,
                totalSize: `${(metadataRecord.totalSize / 1024 / 1024).toFixed(2)} MB`
            });

            res.json(responseData);

        } catch (error) {
            console.error('❌ FILE UPLOAD: Error uploading files:', {
                error: error.message,
                stack: error.stack,
                requestBody: req.body,
                files: req.files ? Object.keys(req.files) : []
            });

            const errorResponse = createErrorResponse(
                error.message,
                500,
                'Check server logs for more information'
            );
            res.status(500).json(errorResponse);
        }
    }
);

// =============================================
// FILE DOWNLOAD ROUTES
// =============================================

/**
 * @route GET /api/mongodb-unified/proposals/download/:proposalId/:fileType
 * @desc Download a specific file from GridFS
 * @access Public (Student/Admin)
 * 
 * @param {string} proposalId - Proposal ID
 * @param {string} fileType - Type of file to download (gpoa, proposal, etc.)
 * 
 * @returns {Stream} File stream with proper headers
 */
router.get('/proposals/download/:proposalId/:fileType', async (req, res) => {
    try {
        const { proposalId, fileType } = req.params;
        console.log('📥 FILE DOWNLOAD: Downloading file:', { proposalId, fileType });

        // Validate parameters
        const validatedProposalId = validateProposalId(proposalId);
        if (!validatedProposalId) {
            const errorResponse = createErrorResponse('Invalid proposal ID', 400);
            return res.status(400).json(errorResponse);
        }

        const validFileTypes = ['gpoa', 'proposal', 'accomplishmentReport'];
        if (!validFileTypes.includes(fileType)) {
            const errorResponse = createErrorResponse(`Invalid file type: ${fileType}`, 400);
            return res.status(400).json(errorResponse);
        }

        // Get file metadata from MongoDB
        const db = await getDb();
        const fileRecord = await db.collection('proposal_files').findOne({
            proposalId: proposalId.toString(),
            [`files.${fileType}`]: { $exists: true }
        });

        if (!fileRecord || !fileRecord.files[fileType]) {
            const errorResponse = createErrorResponse(`File not found: ${fileType} for proposal ${proposalId}`, 404);
            return res.status(404).json(errorResponse);
        }

        const fileInfo = fileRecord.files[fileType];
        console.log('📥 FILE DOWNLOAD: Found file metadata:', {
            filename: fileInfo.filename,
            size: fileInfo.size,
            gridFsId: fileInfo.gridFsId
        });

        // Download from GridFS
        const { getBucket } = require('../../utils/gridfs');
        const bucket = await getBucket();

        const downloadStream = bucket.openDownloadStream(fileInfo.gridFsId);

        // Set proper headers
        res.setHeader('Content-Type', fileInfo.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName || fileInfo.filename}"`);
        res.setHeader('Content-Length', fileInfo.size);

        // Stream file to response
        downloadStream.pipe(res);

        downloadStream.on('error', (error) => {
            console.error('❌ FILE DOWNLOAD: Stream error:', error);
            if (!res.headersSent) {
                const errorResponse = createErrorResponse('File download failed', 500);
                res.status(500).json(errorResponse);
            }
        });

        downloadStream.on('end', () => {
            console.log('✅ FILE DOWNLOAD: Download completed successfully');
        });

    } catch (error) {
        console.error('❌ FILE DOWNLOAD: Error downloading file:', error);

        if (!res.headersSent) {
            const errorResponse = createErrorResponse(
                error.message,
                500,
                'Check server logs for more information'
            );
            res.status(500).json(errorResponse);
        }
    }
});

// =============================================
// FILE METADATA ROUTES
// =============================================

/**
 * @route GET /api/mongodb-unified/proposals/files/:proposalId
 * @desc Get file metadata for a proposal
 * @access Public (Student/Admin)
 * 
 * @param {string} proposalId - Proposal ID
 * 
 * @returns {Object} File metadata for the proposal
 */
router.get('/proposals/files/:proposalId', async (req, res) => {
    try {
        const { proposalId } = req.params;
        console.log('📋 FILE METADATA: Getting file metadata for proposal:', proposalId);

        // Validate proposal ID
        const validatedProposalId = validateProposalId(proposalId);
        if (!validatedProposalId) {
            const errorResponse = createErrorResponse('Invalid proposal ID', 400);
            return res.status(400).json(errorResponse);
        }

        // Get file metadata from MongoDB
        const db = await getDb();
        const fileRecord = await db.collection('proposal_files').findOne({
            proposalId: proposalId.toString()
        });

        if (!fileRecord) {
            const responseData = createSuccessResponse({
                files: {},
                proposalId: proposalId,
                hasFiles: false
            }, 'No files found for this proposal');
            return res.json(responseData);
        }

        const responseData = createSuccessResponse({
            files: fileRecord.files,
            proposalId: proposalId,
            hasFiles: Object.keys(fileRecord.files).length > 0,
            metadata: {
                organizationName: fileRecord.organizationName,
                uploadedAt: fileRecord.uploadedAt,
                updatedAt: fileRecord.updatedAt,
                fileCount: fileRecord.fileCount,
                totalSize: fileRecord.totalSize
            }
        }, 'File metadata retrieved successfully');

        console.log('✅ FILE METADATA: Retrieved metadata:', {
            proposalId: proposalId,
            fileCount: fileRecord.fileCount,
            hasFiles: Object.keys(fileRecord.files).length > 0
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ FILE METADATA: Error getting file metadata:', error);

        const errorResponse = createErrorResponse(
            error.message,
            500,
            'Check server logs for more information'
        );
        res.status(500).json(errorResponse);
    }
});

/**
 * @route GET /api/mongodb-unified/proposals/file-info/:proposalId/:fileType
 * @desc Get specific file information
 * @access Public (Student/Admin)
 * 
 * @param {string} proposalId - Proposal ID
 * @param {string} fileType - Type of file
 * 
 * @returns {Object} Specific file information
 */
router.get('/proposals/file-info/:proposalId/:fileType', async (req, res) => {
    try {
        const { proposalId, fileType } = req.params;
        console.log('📋 FILE INFO: Getting file info:', { proposalId, fileType });

        // Validate parameters
        const validatedProposalId = validateProposalId(proposalId);
        if (!validatedProposalId) {
            const errorResponse = createErrorResponse('Invalid proposal ID', 400);
            return res.status(400).json(errorResponse);
        }

        // Get file metadata from MongoDB
        const db = await getDb();
        const fileRecord = await db.collection('proposal_files').findOne({
            proposalId: proposalId.toString(),
            [`files.${fileType}`]: { $exists: true }
        });

        if (!fileRecord || !fileRecord.files[fileType]) {
            const errorResponse = createErrorResponse(`File not found: ${fileType} for proposal ${proposalId}`, 404);
            return res.status(404).json(errorResponse);
        }

        const fileInfo = fileRecord.files[fileType];
        const responseData = createSuccessResponse({
            fileInfo: fileInfo,
            proposalId: proposalId,
            fileType: fileType
        }, 'File information retrieved successfully');

        console.log('✅ FILE INFO: Retrieved file info:', {
            proposalId: proposalId,
            fileType: fileType,
            filename: fileInfo.filename,
            size: fileInfo.size
        });

        res.json(responseData);

    } catch (error) {
        console.error('❌ FILE INFO: Error getting file info:', error);

        const errorResponse = createErrorResponse(
            error.message,
            500,
            'Check server logs for more information'
        );
        res.status(500).json(errorResponse);
    }
});

module.exports = router; 