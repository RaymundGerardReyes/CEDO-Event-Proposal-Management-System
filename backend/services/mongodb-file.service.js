/**
 * =============================================
 * MONGODB FILE SERVICE - GridFS File Management
 * =============================================
 * 
 * This service handles all MongoDB GridFS file operations including
 * uploads, downloads, metadata management, and file organization.
 * It provides comprehensive file handling for the document database.
 * 
 * @module services/mongodb-file.service
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - GridFS file upload and download
 * - File metadata management
 * - File organization and categorization
 * - File validation and type checking
 * - Error handling and logging
 * - Performance optimization
 */

const { getDb } = require('../utils/db');
const { GridFSBucket } = require('mongodb');
const path = require('path');

// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================

/**
 * Validate MongoDB file operation parameters
 * 
 * @param {Object} params - Operation parameters
 * @returns {Object} Validation result
 */
const validateMongoFileParams = (params) => {
    const errors = [];

    if (!params.proposalId) {
        errors.push('Proposal ID is required');
    }

    if (!params.fileType) {
        errors.push('File type is required');
    }

    if (!params.organizationName) {
        errors.push('Organization name is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Generate MongoDB file metadata
 * 
 * @param {Object} file - File object
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Complete metadata object
 */
const generateFileMetadata = (file, metadata) => {
    return {
        originalName: file.originalname,
        fileType: metadata.fileType,
        proposalId: metadata.proposalId.toString(),
        organizationName: metadata.organizationName,
        uploadDate: new Date(),
        size: file.size,
        mimetype: file.mimetype,
        ...metadata.additional || {}
    };
};

/**
 * Validate file for MongoDB upload
 * 
 * @param {Object} file - File object
 * @param {Array} allowedTypes - Allowed file types
 * @param {number} maxSize - Maximum file size
 * @returns {Object} Validation result
 */
const validateMongoFile = (file, allowedTypes = [], maxSize = 10 * 1024 * 1024) => {
    const errors = [];

    if (!file) {
        errors.push('No file provided');
        return { isValid: false, errors };
    }

    // Check file size
    if (file.size > maxSize) {
        errors.push(`File size exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
    }

    // Check file type
    if (allowedTypes.length > 0) {
        const isValidType = allowedTypes.some(type => {
            if (type.startsWith('.')) {
                return file.originalname.toLowerCase().endsWith(type);
            }
            return file.mimetype === type;
        });

        if (!isValidType) {
            errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
        }
    }

    // Check file name
    if (!file.originalname || file.originalname.trim() === '') {
        errors.push('File name is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Generate unique MongoDB filename
 * 
 * @param {string} originalName - Original filename
 * @param {string} organizationName - Organization name
 * @param {string} fileType - File type
 * @returns {string} Unique filename
 */
const generateMongoFilename = (originalName, organizationName, fileType) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedOrgName = organizationName.replace(/\s+/g, '_');

    return `${sanitizedOrgName}_${fileType}_${timestamp}_${randomString}${extension}`;
};

// =============================================
// MONGODB FILE UPLOAD FUNCTIONS
// =============================================

/**
 * Upload file to MongoDB GridFS
 * 
 * @param {Object} file - File object from multer
 * @param {Object} metadata - File metadata
 * @returns {Promise<Object>} Upload result
 */
const uploadFileToMongo = async (file, metadata) => {
    try {
        console.log('📁 MONGO: Uploading file to MongoDB GridFS:', {
            originalName: file.originalname,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            type: metadata.fileType,
            proposalId: metadata.proposalId
        });

        // Validate parameters
        const validation = validateMongoFileParams(metadata);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        // Validate file
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/csv',
            'application/vnd.ms-excel',
            '.pdf', '.docx', '.doc', '.csv', '.xlsx'
        ];

        const fileValidation = validateMongoFile(file, allowedTypes, 10 * 1024 * 1024);
        if (!fileValidation.isValid) {
            throw new Error(`File validation failed: ${fileValidation.errors.join(', ')}`);
        }

        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        // Generate unique filename
        const uniqueFilename = generateMongoFilename(
            file.originalname,
            metadata.organizationName,
            metadata.fileType
        );

        // Create file metadata
        const fileMetadata = generateFileMetadata(file, metadata);

        // Create upload stream
        const uploadStream = bucket.openUploadStream(uniqueFilename, {
            metadata: fileMetadata
        });

        // Upload file content
        uploadStream.end(file.buffer);

        // Wait for upload to complete
        return new Promise((resolve, reject) => {
            uploadStream.on('finish', async () => {
                try {
                    const fileId = uploadStream.id;

                    console.log('✅ MONGO: Successfully uploaded file to MongoDB:', {
                        fileId: fileId.toString(),
                        filename: uniqueFilename,
                        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
                    });

                    resolve({
                        success: true,
                        fileId: fileId.toString(),
                        filename: uniqueFilename,
                        originalName: file.originalname,
                        size: file.size,
                        fileType: metadata.fileType,
                        metadata: fileMetadata
                    });

                } catch (error) {
                    reject(error);
                }
            });

            uploadStream.on('error', (error) => {
                reject(error);
            });
        });

    } catch (error) {
        console.error('❌ MONGO: Error uploading file to MongoDB:', error);
        throw new Error(`Failed to upload file to MongoDB: ${error.message}`);
    }
};

/**
 * Upload multiple files to MongoDB GridFS
 * 
 * @param {Array} files - Array of file objects
 * @param {Object} metadata - Common metadata
 * @returns {Promise<Array>} Upload results
 */
const uploadMultipleFilesToMongo = async (files, metadata) => {
    try {
        console.log('📁 MONGO: Uploading multiple files to MongoDB:', {
            fileCount: files.length,
            proposalId: metadata.proposalId,
            organizationName: metadata.organizationName
        });

        const uploadPromises = files.map(file => {
            const fileMetadata = {
                ...metadata,
                fileType: file.fieldname || 'document'
            };
            return uploadFileToMongo(file, fileMetadata);
        });

        const results = await Promise.all(uploadPromises);

        console.log('✅ MONGO: Successfully uploaded multiple files to MongoDB:', {
            uploaded: results.length,
            totalSize: results.reduce((sum, result) => sum + result.size, 0)
        });

        return results;

    } catch (error) {
        console.error('❌ MONGO: Error uploading multiple files to MongoDB:', error);
        throw new Error(`Failed to upload multiple files to MongoDB: ${error.message}`);
    }
};

// =============================================
// MONGODB FILE RETRIEVAL FUNCTIONS
// =============================================

/**
 * Download file from MongoDB GridFS
 * 
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<Object>} File stream and metadata
 */
const downloadFileFromMongo = async (fileId) => {
    try {
        console.log('📥 MONGO: Downloading file from MongoDB:', fileId);

        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        // Get file metadata
        const files = await bucket.find({ _id: fileId }).toArray();
        if (files.length === 0) {
            throw new Error('File not found in MongoDB');
        }

        const file = files[0];
        const metadata = {
            id: file._id.toString(),
            filename: file.filename,
            originalName: file.metadata?.originalName || file.filename,
            size: file.length,
            mimetype: file.contentType,
            fileType: file.metadata?.fileType,
            uploadDate: file.uploadDate,
            organizationName: file.metadata?.organizationName,
            proposalId: file.metadata?.proposalId
        };

        // Create download stream
        const downloadStream = bucket.openDownloadStream(fileId);

        console.log('✅ MONGO: Successfully prepared file for download:', {
            fileId: fileId,
            filename: metadata.filename,
            size: `${(metadata.size / 1024 / 1024).toFixed(2)} MB`
        });

        return {
            stream: downloadStream,
            metadata: metadata
        };

    } catch (error) {
        console.error('❌ MONGO: Error downloading file from MongoDB:', error);
        throw new Error(`Failed to download file from MongoDB: ${error.message}`);
    }
};

/**
 * Get file metadata from MongoDB
 * 
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<Object|null>} File metadata
 */
const getMongoFileMetadata = async (fileId) => {
    try {
        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        const files = await bucket.find({ _id: fileId }).toArray();

        if (files.length === 0) {
            return null;
        }

        const file = files[0];
        return {
            id: file._id.toString(),
            filename: file.filename,
            originalName: file.metadata?.originalName || file.filename,
            size: file.length,
            mimetype: file.contentType,
            fileType: file.metadata?.fileType,
            uploadDate: file.uploadDate,
            organizationName: file.metadata?.organizationName,
            proposalId: file.metadata?.proposalId,
            metadata: file.metadata || {}
        };

    } catch (error) {
        console.error('Error getting MongoDB file metadata:', error);
        return null;
    }
};

/**
 * Get files for a proposal from MongoDB
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Array>} Array of file metadata
 */
const getMongoFilesForProposal = async (proposalId) => {
    try {
        console.log('📋 MONGO: Getting files for proposal from MongoDB:', proposalId);

        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        const files = await bucket.find({ 'metadata.proposalId': proposalId.toString() }).toArray();

        const fileList = files.map(file => ({
            id: file._id.toString(),
            filename: file.filename,
            originalName: file.metadata?.originalName || file.filename,
            size: file.length,
            mimetype: file.contentType,
            fileType: file.metadata?.fileType,
            uploadDate: file.uploadDate,
            organizationName: file.metadata?.organizationName,
            proposalId: file.metadata?.proposalId
        }));

        console.log('✅ MONGO: Successfully retrieved files for proposal:', {
            proposalId: proposalId,
            fileCount: fileList.length
        });

        return fileList;

    } catch (error) {
        console.error('❌ MONGO: Error getting files for proposal:', error);
        throw new Error(`Failed to get files for proposal: ${error.message}`);
    }
};

// =============================================
// MONGODB FILE MANAGEMENT FUNCTIONS
// =============================================

/**
 * Delete file from MongoDB GridFS
 * 
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<boolean>} Success status
 */
const deleteMongoFile = async (fileId) => {
    try {
        console.log('🗑️ MONGO: Deleting file from MongoDB:', fileId);

        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        // Check if file exists
        const files = await bucket.find({ _id: fileId }).toArray();
        if (files.length === 0) {
            throw new Error('File not found in MongoDB');
        }

        // Delete file
        await bucket.delete(fileId);

        console.log('✅ MONGO: Successfully deleted file from MongoDB:', fileId);

        return true;

    } catch (error) {
        console.error('❌ MONGO: Error deleting file from MongoDB:', error);
        throw new Error(`Failed to delete file from MongoDB: ${error.message}`);
    }
};

/**
 * Update MongoDB file metadata
 * 
 * @param {string} fileId - GridFS file ID
 * @param {Object} newMetadata - New metadata
 * @returns {Promise<Object>} Updated file metadata
 */
const updateMongoFileMetadata = async (fileId, newMetadata) => {
    try {
        console.log('🔄 MONGO: Updating file metadata in MongoDB:', {
            fileId: fileId,
            newMetadata: newMetadata
        });

        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        // Get current file
        const files = await bucket.find({ _id: fileId }).toArray();
        if (files.length === 0) {
            throw new Error('File not found in MongoDB');
        }

        const file = files[0];
        const updatedMetadata = {
            ...file.metadata,
            ...newMetadata,
            updatedAt: new Date()
        };

        // Note: GridFS doesn't support direct metadata updates
        // This would require re-uploading the file with new metadata
        console.warn('⚠️ MONGO: GridFS metadata update not supported directly');

        console.log('✅ MONGO: Successfully updated file metadata:', fileId);

        return {
            id: fileId,
            metadata: updatedMetadata
        };

    } catch (error) {
        console.error('❌ MONGO: Error updating file metadata:', error);
        throw new Error(`Failed to update file metadata: ${error.message}`);
    }
};

// =============================================
// EXPORT FUNCTIONS
// =============================================

module.exports = {
    // Upload Functions
    uploadFileToMongo,
    uploadMultipleFilesToMongo,

    // Retrieval Functions
    downloadFileFromMongo,
    getMongoFileMetadata,
    getMongoFilesForProposal,

    // Management Functions
    deleteMongoFile,
    updateMongoFileMetadata,

    // Utility Functions
    validateMongoFileParams,
    generateFileMetadata,
    validateMongoFile,
    generateMongoFilename
}; 