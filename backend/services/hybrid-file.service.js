/**
 * =============================================
 * HYBRID FILE SERVICE - postgresql + postgresql Integration
 * =============================================
 * 
 * This service handles hybrid file operations combining postgresql for metadata
 * and postgresql GridFS for file storage. It provides seamless integration
 * between relational and document databases for comprehensive file management.
 * 
 * @module services/hybrid-file.service
 * @author CEDO Development Team
 * @version 1.0.0
 * 
 * @description
 * Features:
 * - Hybrid postgresql + postgresql file storage
 * - File metadata synchronization
 * - Cross-database file operations
 * - File linking and relationship management
 * - Comprehensive error handling
 * - Data consistency validation
 */

const { pool, query } = require('../config/database-postgresql-only');
const { GridFSBucket } = require('postgresql');

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
 * Create file metadata record in postgresql
 * 
 * @param {Object} fileData - File metadata
 * @returns {Promise<Object>} Created record
 */
const createpostgresqlFileRecord = async (fileData) => {
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
        console.error('Error creating postgresql file record:', error);
        throw new Error(`Failed to create postgresql file record: ${error.message}`);
    }
};

/**
 * Get file metadata from postgresql
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Array>} File metadata records
 */
const getpostgresqlFileRecords = async (proposalId) => {
    try {
        const [records] = await pool.query(
            'SELECT * FROM proposal_files WHERE proposal_id = ? ORDER BY upload_date DESC',
            [proposalId]
        );

        return records;

    } catch (error) {
        console.error('Error getting postgresql file records:', error);
        throw new Error(`Failed to get postgresql file records: ${error.message}`);
    }
};

/**
 * Get postgresql file metadata
 * 
 * @param {string|number} proposalId - Proposal ID
 * @returns {Promise<Array>} postgresql file metadata
 */
const getpostgresqlFileMetadata = async (proposalId) => {
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
        console.error('Error getting postgresql file metadata:', error);
        return [];
    }
};

// =============================================
// HYBRID FILE UPLOAD FUNCTIONS
// =============================================

/**
 * Upload file with hybrid storage (postgresql + postgresql)
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

        // Upload to postgresql GridFS
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

                    // Create postgresql metadata record
                    const postgresqlRecord = await createpostgresqlFileRecord({
                        proposalId: metadata.proposalId,
                        fileType: metadata.fileType,
                        originalName: file.originalname,
                        storedName: uniqueFilename,
                        fileSize: file.size,
                        mimeType: file.mimetype,
                        uploadDate: new Date(),
                        organizationName: metadata.organizationName,
                        postgresqlFileId: fileId.toString()
                    });

                    console.log('✅ HYBRID: Successfully uploaded file with hybrid storage:', {
                        postgresqlFileId: fileId.toString(),
                        postgresqlRecordId: postgresqlRecord.id,
                        filename: uniqueFilename
                    });

                    resolve({
                        success: true,
                        postgresqlFileId: fileId.toString(),
                        postgresqlRecordId: postgresqlRecord.id,
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

        // Get postgresql records
        const postgresqlRecords = await getpostgresqlFileRecords(proposalId);

        // Get postgresql metadata
        const postgresqlFiles = await getpostgresqlFileMetadata(proposalId);

        // Combine and match records
        const combinedFiles = [];

        // Process postgresql records
        postgresqlRecords.forEach(postgresqlRecord => {
            const postgresqlFile = postgresqlFiles.find(mf => mf.id === postgresqlRecord.postgresql_file_id);

            combinedFiles.push({
                id: postgresqlRecord.id,
                postgresqlFileId: postgresqlRecord.postgresql_file_id,
                fileType: postgresqlRecord.file_type,
                originalName: postgresqlRecord.original_name,
                storedName: postgresqlRecord.stored_name,
                fileSize: postgresqlRecord.file_size,
                mimeType: postgresqlRecord.mime_type,
                uploadDate: postgresqlRecord.upload_date,
                organizationName: postgresqlRecord.organization_name,
                postgresqlMetadata: postgresqlFile || null,
                source: 'hybrid'
            });
        });

        // Add postgresql-only files (if any)
        postgresqlFiles.forEach(postgresqlFile => {
            const exists = combinedFiles.some(cf => cf.postgresqlFileId === postgresqlFile.id);
            if (!exists) {
                combinedFiles.push({
                    id: null,
                    postgresqlFileId: postgresqlFile.id,
                    fileType: postgresqlFile.fileType,
                    originalName: postgresqlFile.originalName,
                    storedName: postgresqlFile.filename,
                    fileSize: postgresqlFile.size,
                    mimeType: postgresqlFile.mimetype,
                    uploadDate: postgresqlFile.uploadDate,
                    organizationName: postgresqlFile.organizationName,
                    postgresqlMetadata: postgresqlFile,
                    source: 'postgresql-only'
                });
            }
        });

        console.log('✅ HYBRID: Successfully retrieved hybrid files:', {
            proposalId: proposalId,
            totalFiles: combinedFiles.length,
            postgresqlFiles: postgresqlRecords.length,
            postgresqlFiles: postgresqlFiles.length
        });

        return {
            files: combinedFiles,
            summary: {
                total: combinedFiles.length,
                postgresqlFiles: postgresqlRecords.length,
                postgresqlFiles: postgresqlFiles.length,
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
 * @param {string} postgresqlFileId - postgresql file ID
 * @returns {Promise<Object>} File stream and metadata
 */
const downloadHybridFile = async (postgresqlFileId) => {
    try {
        console.log('📥 HYBRID: Downloading hybrid file:', postgresqlFileId);

        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });

        // Get file metadata
        const files = await bucket.find({ _id: postgresqlFileId }).toArray();
        if (files.length === 0) {
            throw new Error('File not found in postgresql');
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
        const downloadStream = bucket.openDownloadStream(postgresqlFileId);

        console.log('✅ HYBRID: Successfully prepared file for download:', {
            fileId: postgresqlFileId,
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
 * @param {string} postgresqlFileId - postgresql file ID
 * @param {string|number} postgresqlRecordId - postgresql record ID
 * @returns {Promise<boolean>} Success status
 */
const deleteHybridFile = async (postgresqlFileId, postgresqlRecordId) => {
    try {
        console.log('🗑️ HYBRID: Deleting hybrid file:', {
            postgresqlFileId: postgresqlFileId,
            postgresqlRecordId: postgresqlRecordId
        });

        // Delete from postgresql GridFS
        const db = await getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'proposal_files' });
        await bucket.delete(postgresqlFileId);

        // Delete from postgresql
        if (postgresqlRecordId) {
            await pool.query('DELETE FROM proposal_files WHERE id = ?', [postgresqlRecordId]);
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

        // Get both postgresql and postgresql data
        const postgresqlRecords = await getpostgresqlFileRecords(proposalId);
        const postgresqlFiles = await getpostgresqlFileMetadata(proposalId);

        const syncResult = {
            proposalId: proposalId,
            postgresqlRecords: postgresqlRecords.length,
            postgresqlFiles: postgresqlFiles.length,
            orphanedpostgresql: [],
            orphanedpostgresql: [],
            synced: []
        };

        // Find orphaned postgresql records (no corresponding postgresql file)
        postgresqlRecords.forEach(postgresqlRecord => {
            const postgresqlFile = postgresqlFiles.find(mf => mf.id === postgresqlRecord.postgresql_file_id);
            if (!postgresqlFile) {
                syncResult.orphanedpostgresql.push(postgresqlRecord);
            } else {
                syncResult.synced.push({
                    postgresqlRecord: postgresqlRecord,
                    postgresqlFile: postgresqlFile
                });
            }
        });

        // Find orphaned postgresql files (no corresponding postgresql record)
        postgresqlFiles.forEach(postgresqlFile => {
            const postgresqlRecord = postgresqlRecords.find(mr => mr.postgresql_file_id === postgresqlFile.id);
            if (!postgresqlRecord) {
                syncResult.orphanedpostgresql.push(postgresqlFile);
            }
        });

        console.log('✅ HYBRID: Successfully synced file data:', {
            proposalId: proposalId,
            synced: syncResult.synced.length,
            orphanedpostgresql: syncResult.orphanedpostgresql.length,
            orphanedpostgresql: syncResult.orphanedpostgresql.length
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
    createpostgresqlFileRecord,
    getpostgresqlFileRecords,
    getpostgresqlFileMetadata
}; 