/**
 * GridFS Utility for postgresql File Storage
 * Handles file uploads, downloads, and management in postgresql GridFS
 */

const { postgresqlClient, GridFSBucket } = require('postgresql');
const postgresqlose = require('postgresqlose');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const postgresql_URI = process.env.postgresql_URI || 'postgresql://localhost:27017/cedo_db';
const DATABASE_NAME = process.env.postgresql_DATABASE || 'cedo_db';
const BUCKET_NAME = 'uploads';

// Connection options
const CONNECTION_OPTIONS = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 30000,
    maxPoolSize: 10,
    minPoolSize: 1,
};

// ============================================================================
// GLOBAL STATE
// ============================================================================

let postgresqlClient = null;
let gridFSBucket = null;
let isInitialized = false;
let connectionPromise = null;

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Initialize postgresql connection and GridFS bucket
 * @returns {Promise<void>}
 */
async function initializeGridFS() {
    console.log('🔧 (GridFS Utility) Starting GridFS initialization...');

    if (isInitialized && postgresqlClient) {
        console.log('✅ (GridFS Utility) Already initialized');
        return;
    }

    try {
        // Create new client connection
        console.log('🔧 (GridFS Utility) Creating postgresql client...');
        postgresqlClient = new postgresqlClient(postgresql_URI, CONNECTION_OPTIONS);

        // Connect to postgresql
        console.log('🔧 (GridFS Utility) Connecting to postgresql...');
        await postgresqlClient.connect();

        // Get database
        const db = postgresqlClient.db(DATABASE_NAME);

        // Create GridFS bucket
        console.log('🔧 (GridFS Utility) Creating GridFS bucket...');
        gridFSBucket = new GridFSBucket(db, { bucketName: BUCKET_NAME });

        // Test the connection
        await db.admin().ping();

        isInitialized = true;
        console.log('✅ (GridFS Utility) GridFS initialized successfully');

    } catch (error) {
        console.error('❌ (GridFS Utility) GridFS initialization failed:', error.message);
        throw new Error(`GridFS initialization failed: ${error.message}`);
    }
}

/**
 * Get the GridFS bucket instance
 * @returns {GridFSBucket|null}
 */
function getGridFSBucket() {
    if (!isInitialized || !gridFSBucket) {
        console.warn('⚠️ (GridFS Utility) GridFS not initialized');
        return null;
    }
    return gridFSBucket;
}

/**
 * Get the postgresql client instance
 * @returns {postgresqlClient|null}
 */
function getpostgresqlClient() {
    if (!isInitialized || !postgresqlClient) {
        console.warn('⚠️ (GridFS Utility) postgresql client not initialized');
        return null;
    }
    return postgresqlClient;
}

/**
 * Close postgresql connection
 * @returns {Promise<void>}
 */
async function closeConnection() {
    if (postgresqlClient) {
        try {
            await postgresqlClient.close();
            console.log('✅ (GridFS Utility) postgresql connection closed');
        } catch (error) {
            console.error('❌ (GridFS Utility) Error closing postgresql connection:', error.message);
        }
    }

    postgresqlClient = null;
    gridFSBucket = null;
    isInitialized = false;
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Upload a file to GridFS
 * @param {Buffer|ReadableStream} fileBuffer - File content
 * @param {string} filename - Original filename
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Upload result with fileId
 */
async function uploadFile(fileBuffer, filename, metadata = {}) {
    try {
        if (!isInitialized) {
            await initializeGridFS();
        }

        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS bucket not available');
        }

        console.log('📁 (GridFS Utility) Starting file upload:', {
            filename,
            size: Buffer.isBuffer(fileBuffer) ? `${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB` : 'stream',
            metadata: Object.keys(metadata)
        });

        // Create upload stream
        const uploadStream = bucket.openUploadStream(filename, {
            metadata: {
                ...metadata,
                uploadDate: new Date(),
                originalName: filename
            }
        });


        // Write file to stream with robust error handling
        let streamEnded = false;
        function safeEnd() {
            if (!streamEnded) {
                try {
                    uploadStream.end();
                    streamEnded = true;
                    console.log('📁 (GridFS Utility) Stream ended safely');
                } catch (err) {
                    console.error('❌ (GridFS Utility) Error ending stream:', err.message);
                }
            }
        }

        if (Buffer.isBuffer(fileBuffer)) {
            try {
                console.log('📁 (GridFS Utility) Writing buffer to stream...');
                uploadStream.write(fileBuffer);
                safeEnd();
                console.log('📁 (GridFS Utility) Buffer written and stream ended');
            } catch (err) {
                console.error('❌ (GridFS Utility) Error writing buffer to stream:', err.message);
                safeEnd();
                throw err;
            }
        } else {
            // Handle readable stream
            console.log('📁 (GridFS Utility) Piping stream to upload...');
            fileBuffer.on('error', (err) => {
                console.error('❌ (GridFS Utility) Readable stream error:', err.message);
                safeEnd();
            });
            uploadStream.on('error', (err) => {
                if (!streamEnded) {
                    console.error('❌ (GridFS Utility) Upload stream error (pipe):', err.message);
                    safeEnd();
                }
            });
            fileBuffer.pipe(uploadStream);
        }

        return new Promise((resolve, reject) => {
            uploadStream.on('finish', () => {
                console.log('✅ (GridFS Utility) Upload completed successfully:', {
                    fileId: uploadStream.id.toString(),
                    filename: uploadStream.filename
                });
                resolve({
                    fileId: uploadStream.id,
                    filename: uploadStream.filename,
                    metadata: uploadStream.options.metadata
                });
            });

            uploadStream.on('error', (error) => {
                console.error('❌ (GridFS Utility) Upload stream error:', error);
                reject(new Error(`Upload failed: ${error.message}`));
            });

            // 🔧 ADDITIONAL SAFETY: Add timeout to prevent infinite hanging
            const timeout = setTimeout(() => {
                console.error('❌ (GridFS Utility) Upload timeout after 30 seconds');
                reject(new Error('Upload timeout after 30 seconds'));
            }, 30000);

            uploadStream.on('finish', () => {
                clearTimeout(timeout);
            });

            uploadStream.on('error', () => {
                clearTimeout(timeout);
            });
        });

    } catch (error) {
        console.error('❌ (GridFS Utility) Upload failed:', error.message);
        throw error;
    }
}

/**
 * Download a file from GridFS
 * @param {ObjectId} fileId - GridFS file ID
 * @returns {Promise<ReadableStream>} File stream
 */
async function downloadFile(fileId) {
    try {
        if (!isInitialized) {
            await initializeGridFS();
        }

        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS bucket not available');
        }

        const downloadStream = bucket.openDownloadStream(fileId);

        return downloadStream;

    } catch (error) {
        console.error('❌ (GridFS Utility) Download failed:', error.message);
        throw error;
    }
}

/**
 * Get file metadata from GridFS
 * @param {ObjectId} fileId - GridFS file ID
 * @returns {Promise<Object>} File metadata
 */
async function getFileMetadata(fileId) {
    try {
        if (!isInitialized) {
            await initializeGridFS();
        }

        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS bucket not available');
        }

        const files = bucket.find({ _id: fileId }).toArray();
        const file = files[0];

        if (!file) {
            throw new Error('File not found');
        }

        return {
            fileId: file._id,
            filename: file.filename,
            length: file.length,
            uploadDate: file.uploadDate,
            metadata: file.metadata
        };

    } catch (error) {
        console.error('❌ (GridFS Utility) Get metadata failed:', error.message);
        throw error;
    }
}

/**
 * Delete a file from GridFS
 * @param {ObjectId} fileId - GridFS file ID
 * @returns {Promise<void>}
 */
async function deleteFile(fileId) {
    try {
        if (!isInitialized) {
            await initializeGridFS();
        }

        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS bucket not available');
        }

        await bucket.delete(fileId);
        console.log('✅ (GridFS Utility) File deleted successfully');

    } catch (error) {
        console.error('❌ (GridFS Utility) Delete failed:', error.message);
        throw error;
    }
}

/**
 * List all files in GridFS
 * @param {Object} filter - postgresql filter object
 * @returns {Promise<Array>} Array of file metadata
 */
async function listFiles(filter = {}) {
    try {
        if (!isInitialized) {
            await initializeGridFS();
        }

        const bucket = getGridFSBucket();
        if (!bucket) {
            throw new Error('GridFS bucket not available');
        }

        const files = await bucket.find(filter).toArray();

        return files.map(file => ({
            fileId: file._id,
            filename: file.filename,
            length: file.length,
            uploadDate: file.uploadDate,
            metadata: file.metadata
        }));

    } catch (error) {
        console.error('❌ (GridFS Utility) List files failed:', error.message);
        throw error;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if GridFS is available
 * @returns {boolean}
 */
function isAvailable() {
    return isInitialized && gridFSBucket !== null;
}

/**
 * Get connection status
 * @returns {Object}
 */
function getStatus() {
    return {
        initialized: isInitialized,
        connected: postgresqlClient !== null,
        bucketAvailable: gridFSBucket !== null
    };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Connection management
    initializeGridFS,
    getGridFSBucket,
    getpostgresqlClient,
    closeConnection,

    // File operations
    uploadFile,
    downloadFile,
    getFileMetadata,
    deleteFile,
    listFiles,

    // Utility functions
    isAvailable,
    getStatus
}; 