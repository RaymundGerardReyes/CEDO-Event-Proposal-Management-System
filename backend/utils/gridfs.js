const mongoose = require('mongoose');
// Use the shared, already-authenticated MongoClient promise so GridFS always reuses
// the same credentials that the rest of the application relies on.
const { clientPromise } = require('../config/mongodb');

// Helper to lazily resolve the native DB instance from the shared connection with retry logic
const getNativeDb = async (maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 (GridFS Utility) Native DB connection attempt ${attempt}/${maxRetries}`);

            // Use the enhanced clientPromise which now includes retry logic
            const client = await clientPromise(); // Call as function since we exported the retry wrapper
            const db = client.db(); // default DB comes from the connection string

            // Test the connection by running a simple command with timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Database ping timeout after 10 seconds')), 10000);
            });

            const pingPromise = db.admin().ping();
            await Promise.race([pingPromise, timeoutPromise]);

            console.log('✅ (GridFS Utility) Native DB connection verified');
            return db;
        } catch (err) {
            console.error(`❌ (GridFS Utility) Connection attempt ${attempt} failed:`, err.message);

            if (attempt === maxRetries) {
                console.error('❌ (GridFS Utility) All connection attempts failed. Common solutions:');
                console.error('   1. Check if MongoDB is running: netstat -an | findstr :27017');
                console.error('   2. Verify credentials in MONGODB_URI');
                console.error('   3. Check firewall settings for port 27017');
                console.error('   4. If using VPN, try disabling it temporarily');
                console.error('   5. Try using 127.0.0.1 instead of localhost');
                throw err;
            }

            // Wait before retrying (exponential backoff)
            const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
            console.log(`⏳ (GridFS Utility) Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// ===============================================
// GRIDFS SHARED UTILITY
// ===============================================

let db;
let bucket;

// Initialise GridFS bucket once either:
//   a) the native MongoClient promise resolves, or
//   b) the mongoose connection opens (fallback for legacy code).
// The first to succeed wins, preventing double-initialisation.
const initialiseGridFS = async () => {
    if (bucket) return bucket; // already initialised

    console.log('🔧 (GridFS Utility) Starting GridFS initialization...');

    try {
        console.log('🔧 (GridFS Utility) Attempting native DB connection...');
        db = await getNativeDb();
        console.log('🔧 (GridFS Utility) Native DB connection successful, creating bucket...');
        bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'proposal_files' });
        console.log('✅ (GridFS Utility) GridFS bucket initialised via native MongoClient.');

        // Test the bucket by attempting a simple operation with timeout
        try {
            const testCollection = db.collection('proposal_files.files');
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('GridFS bucket test timeout after 5 seconds')), 5000);
            });

            const findPromise = testCollection.findOne({}, { limit: 1 });
            await Promise.race([findPromise, timeoutPromise]);
            console.log('✅ (GridFS Utility) GridFS bucket test successful');
        } catch (testError) {
            console.error('❌ (GridFS Utility) GridFS bucket test failed:', testError.message);
            throw testError;
        }

        return bucket;
    } catch (nativeErr) {
        console.warn('⚠️  (GridFS Utility) Native DB initialisation failed, falling back to mongoose event:', nativeErr.message);

        // Return a promise that resolves when mongoose connection is ready
        return new Promise((resolve, reject) => {
            const attachBucket = () => {
                try {
                    console.log('🔧 (GridFS Utility) Attempting mongoose fallback...');
                    if (!mongoose.connection.db) {
                        reject(new Error('Mongoose connection.db is not available'));
                        return;
                    }
                    db = mongoose.connection.db;
                    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'proposal_files' });
                    console.log('✅ (GridFS Utility) GridFS bucket initialised via mongoose connection.');
                    resolve(bucket);
                } catch (err) {
                    console.error('❌ (GridFS Utility) Mongoose fallback failed:', err);
                    reject(err);
                }
            };

            if (mongoose.connection.readyState === 1) {
                // Already connected
                attachBucket();
            } else {
                // Wait for connection with increased timeout
                const timeout = setTimeout(() => {
                    reject(new Error('Mongoose connection timeout after 30 seconds'));
                }, 30000); // Increased from 10 to 30 seconds

                mongoose.connection.once('open', () => {
                    clearTimeout(timeout);
                    attachBucket();
                });

                mongoose.connection.once('error', (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });
            }
        });
    }
};

// Kick-off initialisation (fire and forget)
initialiseGridFS().catch((err) => {
    console.error('❌ (GridFS Utility) GridFS initialisation failed:', err);
});

/**
 * Uploads a file buffer directly into GridFS and returns rich metadata.
 * Multer with memoryStorage provides the file object with `file.buffer`.
 *
 * @param {object} file - The file object from multer (must have .buffer, .originalname, .mimetype, .size).
 * @param {string} fileType - A type identifier for the file (e.g., 'gpoa', 'AR').
 * @param {string} organizationName - The name of the organization for pretty filename generation.
 * @param {string} proposalId - Optional proposal ID for linking files to proposals.
 * @returns {Promise<object>} A promise that resolves to the file's metadata.
 */
const uploadToGridFS = async (file, fileType, organizationName = 'Unknown', proposalId = null) => {
    console.log('🔧 (GridFS Utility) uploadToGridFS called for file:', file.originalname);
    console.log('🔧 (GridFS Utility) Current bucket status:', bucket ? 'INITIALIZED' : 'NOT_INITIALIZED');

    if (!bucket) {
        console.log('🔧 (GridFS Utility) Bucket not initialized, calling initialiseGridFS...');
        try {
            // Lazily initialise if not done yet:
            await initialiseGridFS();
            console.log('🔧 (GridFS Utility) initialiseGridFS completed, bucket status:', bucket ? 'INITIALIZED' : 'STILL_NOT_INITIALIZED');
            if (!bucket) {
                throw new Error('GridFS bucket not initialised yet. Ensure MongoDB connection is established.');
            }
        } catch (initError) {
            console.error('❌ (GridFS Utility) Failed to initialize GridFS:', initError);
            throw new Error(`GridFS initialization failed: ${initError.message}`);
        }
    }

    console.log('✅ (GridFS Utility) Bucket is ready, proceeding with upload...');

    const extension = require('path').extname(file.originalname);
    const prettyFilename = `${organizationName.replace(/\s+/g, '')}_${fileType.toUpperCase()}${extension}`;

    // Enhanced metadata for better file tracking
    const metadata = {
        originalName: file.originalname,
        organizationName,
        fileType,
        uploadedAt: new Date(),
        fileSize: file.size,
        mimeType: file.mimetype
    };

    // Add proposalId to metadata if provided
    if (proposalId) {
        metadata.proposalId = proposalId.toString();
    }

    console.log('🔧 (GridFS Utility) Creating upload stream for:', prettyFilename);

    // Stream buffer into GridFS
    const fileDoc = await new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(prettyFilename, {
            contentType: file.mimetype,
            metadata: metadata
        });

        uploadStream.on('error', (err) => {
            console.error('❌ GridFS upload stream error:', err);
            reject(err);
        });

        // 🔧 FIX: The 'finish' event does not reliably return the file document.
        // We must query for it using the stream's ID after it completes to guarantee we get the data.
        uploadStream.on('finish', async () => {
            try {
                console.log('✅ GridFS upload stream finished, fetching file document...');
                // Find the file document in the 'proposal_files.files' collection
                const filesCollection = db.collection('proposal_files.files');
                const finishedFile = await filesCollection.findOne({ _id: uploadStream.id });

                if (!finishedFile) {
                    console.error('❌ GridFS file document not found after upload');
                    reject(new Error('File document not found after upload'));
                    return;
                }

                console.log('✅ GridFS file document found:', {
                    id: finishedFile._id,
                    filename: finishedFile.filename,
                    length: finishedFile.length
                });

                resolve(finishedFile);
            } catch (findErr) {
                console.error('❌ GridFS error finding uploaded file:', findErr);
                reject(findErr);
            }
        });

        // Write the buffer and signal end-of-stream
        console.log('🔧 (GridFS Utility) Writing buffer to upload stream...');
        uploadStream.end(file.buffer);
    });

    if (!fileDoc) {
        throw new Error(`Failed to find uploaded file in GridFS with ID after stream finished.`);
    }

    // Return comprehensive file metadata
    const fileMetadata = {
        filename: fileDoc.filename,
        originalName: file.originalname,
        size: fileDoc.length,
        mimeType: fileDoc.contentType,
        uploadedAt: fileDoc.uploadDate,
        gridFsId: fileDoc._id.toString(), // Ensure this is always a string
        bucketName: 'proposal_files',
        organizationName: organizationName,
        fileType: fileType
    };

    // Add proposalId if provided
    if (proposalId) {
        fileMetadata.proposalId = proposalId.toString();
    }

    console.log('✅ GridFS upload completed successfully:', {
        filename: fileMetadata.filename,
        gridFsId: fileMetadata.gridFsId,
        size: fileMetadata.size,
        fileType: fileType,
        organizationName: organizationName
    });

    return fileMetadata;
};

/**
 * Download a file from GridFS by its ID
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<Stream>} Download stream
 */
const downloadFromGridFS = async (fileId) => {
    if (!bucket) {
        await initialiseGridFS();
        if (!bucket) {
            throw new Error('GridFS bucket not initialised yet.');
        }
    }

    try {
        const objectId = new mongoose.Types.ObjectId(fileId);
        return bucket.openDownloadStream(objectId);
    } catch (error) {
        throw new Error(`Failed to download file from GridFS: ${error.message}`);
    }
};

/**
 * Get file metadata from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<object>} File metadata
 */
const getFileMetadata = async (fileId) => {
    if (!bucket) {
        await initialiseGridFS();
        if (!bucket) {
            throw new Error('GridFS bucket not initialised yet.');
        }
    }

    try {
        const objectId = new mongoose.Types.ObjectId(fileId);
        const filesCollection = db.collection('proposal_files.files');
        return await filesCollection.findOne({ _id: objectId });
    } catch (error) {
        throw new Error(`Failed to get file metadata: ${error.message}`);
    }
};

module.exports = {
    uploadToGridFS,
    downloadFromGridFS,
    getFileMetadata,
    // A getter to ensure the bucket is available before use in other files.
    getBucket: () => {
        if (!bucket) {
            console.warn("GridFS bucket accessed before it was fully initialised.");
        }
        return bucket;
    }
}; 