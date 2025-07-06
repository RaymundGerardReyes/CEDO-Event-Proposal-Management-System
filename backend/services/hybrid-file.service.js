/**
 * =============================================
 * HYBRID FILE SERVICE - MySQL + MongoDB Integration
 * =============================================
 * 
 * This service handles hybrid file operations combining MySQL for metadata
 * and MongoDB GridFS for file storage. It provides seamless integration
 * between relational and document databases for comprehensive file management.
 * 
 * @module services/hybrid-file.service
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - Hybrid MySQL + MongoDB file storage
 * - File metadata synchronization
 * - Cross-database file operations
 * - File linking and relationship management
 * - Comprehensive error handling
 * - Data consistency validation
 */

const { pool } = require('../config/db');
const { getDb } = require('../utils/db');
const { GridFSBucket } = require('mongodb');

// =============================================
// SHARED UTILITY FUNCTIONS
// =============================================

/**
 * Validate hybrid file operation parameters
 * 
 * @param {Object} params - Operation parameters
 * @returns {Object} Validation result
 */
const validateHybridFileParams = (params) => {
    const errors = [];

    if (!params.proposalId) {
        errors.push('Proposal ID is required');
    }

    if (!params.organizationName) {
        errors.push('Organization name is required');
    }

    if (!params.fileType) {
        errors.push('File type is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Create file metadata record in MySQL
 * 
 * @param {Object} fileData - File metadata
 * @returns {Promise<Object>} Created record
 */
const createMySQLFileRecord = async (fileData) => {
    try {
        const [result] = await pool.query(
            `INSERT INTO proposal_files (
        proposal_id, file_type, original_name, stored_name,
        file_size, mime_type, upload_date, organization_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                fileData.proposalId,
                fileData.fileType,
                fileData.originalName,
                fileData.storedName,
                fileData.fileSize,
                fileData.mimeType,
                fileData.uploadDate,
                fileData.organizationName
            ]
        );

        return {
            id: result.insertId,
            ...fileData
        };

    } catch (error) {
        console.error('Error creating MySQL file record:', error);
        throw new Error(`Failed to create MySQL file record: ${error.message}`);
    }
};

/**
 * Get file metadata from MySQL
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Array>} File metadata records
 */
const getMySQLFileRecords = async (proposalId) => {
    try {
        const [records] = await pool.query(
            'SELECT * FROM proposal_files WHERE proposal_id = ? ORDER BY upload_date DESC',
            [proposalId]
        );

        return records;

    } catch (error) {
        console.error('Error getting MySQL file records:', error);
        throw new Error(`Failed to get MySQL file records: ${error.message}`);
    }
};

/**
 * Get MongoDB file metadata
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Array>} MongoDB file metadata
 */
const getMongoFileMetadata = async (proposalId) => {
    try {
        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        const files = await bucket.find({ 'metadata.proposalId': proposalId.toString() }).toArray();

        return files.map(file => ({
            id: file._id.toString(),
            filename: file.filename,
            originalName: file.metadata?.originalName || file.filename,
            size: file.length,
            mimetype: file.contentType,
            fileType: file.metadata?.fileType,
            uploadDate: file.uploadDate,
            organizationName: file.metadata?.organizationName
        }));

    } catch (error) {
        console.error('Error getting MongoDB file metadata:', error);
        return [];
    }
};

// =============================================
// HYBRID FILE UPLOAD FUNCTIONS
// =============================================

/**
 * Upload file with hybrid storage (MySQL + MongoDB)
 * 
 * @param {Object} file - File object from multer
 * @param {Object} metadata - File metadata
 * @returns {Promise<Object>} Upload result
 */
const uploadHybridFile = async (file, metadata) => {
    try {
        console.log('📁 HYBRID: Uploading file with hybrid storage:', {
            originalName: file.originalname,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            type: metadata.fileType,
            proposalId: metadata.proposalId
        });

        // Validate parameters
        const validation = validateHybridFileParams(metadata);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = require('path').extname(file.originalname);
        const baseName = require('path').basename(file.originalname, extension);
        const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
        const uniqueFilename = `${metadata.organizationName.replace(/\s+/g, '_')}_${metadata.fileType}_${timestamp}_${randomString}${extension}`;

        // Upload to MongoDB GridFS
        const uploadStream = bucket.openUploadStream(uniqueFilename, {
            metadata: {
                originalName: file.originalname,
                fileType: metadata.fileType,
                proposalId: metadata.proposalId.toString(),
                organizationName: metadata.organizationName,
                uploadDate: new Date(),
                size: file.size,
                mimetype: file.mimetype
            }
        });

        // Upload file content
        uploadStream.end(file.buffer);

        // Wait for upload to complete
        return new Promise((resolve, reject) => {
            uploadStream.on('finish', async () => {
                try {
                    const fileId = uploadStream.id;

                    // Create MySQL metadata record
                    const mysqlRecord = await createMySQLFileRecord({
                        proposalId: metadata.proposalId,
                        fileType: metadata.fileType,
                        originalName: file.originalname,
                        storedName: uniqueFilename,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                        uploadDate: new Date(),
                        organizationName: metadata.organizationName,
                        mongoFileId: fileId.toString()
                    });

                    console.log('✅ HYBRID: Successfully uploaded file with hybrid storage:', {
                        mongoFileId: fileId.toString(),
                        mysqlRecordId: mysqlRecord.id,
                        filename: uniqueFilename
                    });

                    resolve({
                        success: true,
                        mongoFileId: fileId.toString(),
                        mysqlRecordId: mysqlRecord.id,
                        filename: uniqueFilename,
                        originalName: file.originalname,
                        size: file.size,
                        fileType: metadata.fileType
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
        console.error('❌ HYBRID: Error uploading file with hybrid storage:', error);
        throw new Error(`Failed to upload file with hybrid storage: ${error.message}`);
    }
};

/**
 * Upload multiple files with hybrid storage
 * 
 * @param {Array} files - Array of file objects
 * @param {Object} metadata - Common metadata
 * @returns {Promise<Array>} Upload results
 */
const uploadMultipleHybridFiles = async (files, metadata) => {
    try {
        console.log('📁 HYBRID: Uploading multiple files with hybrid storage:', {
            fileCount: files.length,
            proposalId: metadata.proposalId,
            organizationName: metadata.organizationName
        });

        const uploadPromises = files.map(file => {
            const fileMetadata = {
                ...metadata,
                fileType: file.fieldname || 'document'
            };
            return uploadHybridFile(file, fileMetadata);
        });

        const results = await Promise.all(uploadPromises);

        console.log('✅ HYBRID: Successfully uploaded multiple files:', {
            uploaded: results.length,
            totalSize: results.reduce((sum, result) => sum + result.size, 0)
        });

        return results;

    } catch (error) {
        console.error('❌ HYBRID: Error uploading multiple files:', error);
        throw new Error(`Failed to upload multiple files: ${error.message}`);
    }
};

// =============================================
// HYBRID FILE RETRIEVAL FUNCTIONS
// =============================================

/**
 * Get hybrid file data for a proposal
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} Combined file data
 */
const getHybridFilesForProposal = async (proposalId) => {
    try {
        console.log('📋 HYBRID: Getting hybrid files for proposal:', proposalId);

        // Get MySQL records
        const mysqlRecords = await getMySQLFileRecords(proposalId);

        // Get MongoDB metadata
        const mongoFiles = await getMongoFileMetadata(proposalId);

        // Combine and match records
        const combinedFiles = [];

        // Process MySQL records
        mysqlRecords.forEach(mysqlRecord => {
            const mongoFile = mongoFiles.find(mf => mf.id === mysqlRecord.mongo_file_id);

            combinedFiles.push({
                id: mysqlRecord.id,
                mongoFileId: mysqlRecord.mongo_file_id,
                fileType: mysqlRecord.file_type,
                originalName: mysqlRecord.original_name,
                storedName: mysqlRecord.stored_name,
                fileSize: mysqlRecord.file_size,
                mimeType: mysqlRecord.mime_type,
                uploadDate: mysqlRecord.upload_date,
                organizationName: mysqlRecord.organization_name,
                mongoMetadata: mongoFile || null,
                source: 'hybrid'
            });
        });

        // Add MongoDB-only files (if any)
        mongoFiles.forEach(mongoFile => {
            const exists = combinedFiles.some(cf => cf.mongoFileId === mongoFile.id);
            if (!exists) {
                combinedFiles.push({
                    id: null,
                    mongoFileId: mongoFile.id,
                    fileType: mongoFile.fileType,
                    originalName: mongoFile.originalName,
                    storedName: mongoFile.filename,
                    fileSize: mongoFile.size,
                    mimeType: mongoFile.mimetype,
                    uploadDate: mongoFile.uploadDate,
                    organizationName: mongoFile.organizationName,
                    mongoMetadata: mongoFile,
                    source: 'mongodb-only'
                });
            }
        });

        console.log('✅ HYBRID: Successfully retrieved hybrid files:', {
            proposalId: proposalId,
            totalFiles: combinedFiles.length,
            mysqlFiles: mysqlRecords.length,
            mongoFiles: mongoFiles.length
        });

        return {
            files: combinedFiles,
            summary: {
                total: combinedFiles.length,
                mysqlFiles: mysqlRecords.length,
                mongoFiles: mongoFiles.length,
                totalSize: combinedFiles.reduce((sum, file) => sum + file.fileSize, 0)
            }
        };

    } catch (error) {
        console.error('❌ HYBRID: Error getting hybrid files:', error);
        throw new Error(`Failed to get hybrid files: ${error.message}`);
    }
};

/**
 * Download hybrid file
 * 
 * @param {string} mongoFileId - MongoDB file ID
 * @returns {Promise<Object>} File stream and metadata
 */
const downloadHybridFile = async (mongoFileId) => {
    try {
        console.log('📥 HYBRID: Downloading hybrid file:', mongoFileId);

        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        // Get file metadata
        const files = await bucket.find({ _id: mongoFileId }).toArray();
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
            organizationName: file.metadata?.organizationName
        };

        // Create download stream
        const downloadStream = bucket.openDownloadStream(mongoFileId);

        console.log('✅ HYBRID: Successfully prepared file for download:', {
            fileId: mongoFileId,
            filename: metadata.filename,
            size: `${(metadata.size / 1024 / 1024).toFixed(2)} MB`
        });

        return {
            stream: downloadStream,
            metadata: metadata
        };

    } catch (error) {
        console.error('❌ HYBRID: Error downloading hybrid file:', error);
        throw new Error(`Failed to download hybrid file: ${error.message}`);
    }
};

// =============================================
// HYBRID FILE MANAGEMENT FUNCTIONS
// =============================================

/**
 * Delete hybrid file
 * 
 * @param {string} mongoFileId - MongoDB file ID
 * @param {string|number} mysqlRecordId - MySQL record ID
 * @returns {Promise<boolean>} Success status
 */
const deleteHybridFile = async (mongoFileId, mysqlRecordId) => {
    try {
        console.log('🗑️ HYBRID: Deleting hybrid file:', {
            mongoFileId: mongoFileId,
            mysqlRecordId: mysqlRecordId
        });

        // Delete from MongoDB GridFS
        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });
        await bucket.delete(mongoFileId);

        // Delete from MySQL
        if (mysqlRecordId) {
            await pool.query('DELETE FROM proposal_files WHERE id = ?', [mysqlRecordId]);
        }

        console.log('✅ HYBRID: Successfully deleted hybrid file');

        return true;

    } catch (error) {
        console.error('❌ HYBRID: Error deleting hybrid file:', error);
        throw new Error(`Failed to delete hybrid file: ${error.message}`);
    }
};

/**
 * Sync hybrid file data
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Object>} Sync result
 */
const syncHybridFileData = async (proposalId) => {
    try {
        console.log('🔄 HYBRID: Syncing file data for proposal:', proposalId);

        // Get both MySQL and MongoDB data
        const mysqlRecords = await getMySQLFileRecords(proposalId);
        const mongoFiles = await getMongoFileMetadata(proposalId);

        const syncResult = {
            proposalId: proposalId,
            mysqlRecords: mysqlRecords.length,
            mongoFiles: mongoFiles.length,
            orphanedMysql: [],
            orphanedMongo: [],
            synced: []
        };

        // Find orphaned MySQL records (no corresponding MongoDB file)
        mysqlRecords.forEach(mysqlRecord => {
            const mongoFile = mongoFiles.find(mf => mf.id === mysqlRecord.mongo_file_id);
            if (!mongoFile) {
                syncResult.orphanedMysql.push(mysqlRecord);
            } else {
                syncResult.synced.push({
                    mysqlRecord: mysqlRecord,
                    mongoFile: mongoFile
                });
            }
        });

        // Find orphaned MongoDB files (no corresponding MySQL record)
        mongoFiles.forEach(mongoFile => {
            const mysqlRecord = mysqlRecords.find(mr => mr.mongo_file_id === mongoFile.id);
            if (!mysqlRecord) {
                syncResult.orphanedMongo.push(mongoFile);
            }
        });

        console.log('✅ HYBRID: Successfully synced file data:', {
            proposalId: proposalId,
            synced: syncResult.synced.length,
            orphanedMysql: syncResult.orphanedMysql.length,
            orphanedMongo: syncResult.orphanedMongo.length
        });

        return syncResult;

    } catch (error) {
        console.error('❌ HYBRID: Error syncing file data:', error);
        throw new Error(`Failed to sync file data: ${error.message}`);
    }
};

// =============================================
// EXPORT FUNCTIONS
// =============================================

module.exports = {
    // Upload Functions
    uploadHybridFile,
    uploadMultipleHybridFiles,

    // Retrieval Functions
    getHybridFilesForProposal,
    downloadHybridFile,

    // Management Functions
    deleteHybridFile,
    syncHybridFileData,

    // Utility Functions
    validateHybridFileParams,
    createMySQLFileRecord,
    getMySQLFileRecords,
    getMongoFileMetadata
}; 