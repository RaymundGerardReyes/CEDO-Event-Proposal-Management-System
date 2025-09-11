/**
 * GridFS Utility for MongoDB File Storage
 * Handles file uploads, downloads, and management in MongoDB GridFS
 */

const { MongoClient, GridFSBucket } = require('mongodb');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cedo_db';
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'cedo_db';
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

let mongoClient = null;
let gridFSBucket = null;
let isInitialized = false;
let connectionPromise = null;

// ============================================================================
// CONNECTION MANAGEMENT
// ============================================================================

/**
 * Initialize MongoDB connection and GridFS bucket
 * @returns {Promise<void>}
 */
async function initializeGridFS() {
    console.log('🔧 (GridFS Utility) Starting GridFS initialization...');

    if (isInitialized && mongoClient) {
        console.log('✅ (GridFS Utility) Already initialized');
        return;
    }

    try {
        // Create new client connection
        console.log('🔧 (GridFS Utility) Creating MongoDB client...');
        mongoClient = new MongoClient(MONGODB_URI, CONNECTION_OPTIONS);

        // Connect to MongoDB
        console.log('🔧 (GridFS Utility) Connecting to MongoDB...');
        await mongoClient.connect();

        // Get database
        const db = mongoClient.db(DATABASE_NAME);

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
 * Get the MongoDB client instance
 * @returns {MongoClient|null}
 */
function getMongoClient() {
    if (!isInitialized || !mongoClient) {
        console.warn('⚠️ (GridFS Utility) MongoDB client not initialized');
        return null;
    }
    return mongoClient;
}

/**
 * Close MongoDB connection
 * @returns {Promise<void>}
 */
async function closeConnection() {
    if (mongoClient) {
        try {
            await mongoClient.close();
            console.log('✅ (GridFS Utility) MongoDB connection closed');
        } catch (error) {
            console.error('❌ (GridFS Utility) Error closing MongoDB connection:', error.message);
        }
    }

    mongoClient = null;
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
 * @param {Object} filter - MongoDB filter object
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
        connected: mongoClient !== null,
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
    getMongoClient,
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