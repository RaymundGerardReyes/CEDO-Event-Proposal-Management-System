const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const multer = require('multer');
const { ObjectId, Binary } = require('mongodb');

// Centralised connections / utils
const { getDb } = require('../../config/mongodb');
const { pool } = require('../../config/db');
const { uploadToGridFS, getBucket } = require('../../utils/gridfs');

// Ensure uploads directory exists (used by legacy /files/:filename route)
const uploadsDir = path.join(__dirname, '../../uploads/files');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// In-memory multer storage (used by most endpoints)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Safely convert arbitrary value to ObjectId when possible
const toObjectId = (value) => {
    if (value instanceof ObjectId) return value;
    const str = String(value);
    return ObjectId.isValid(str) && str.length === 24 ? new ObjectId(str) : str;
};

module.exports = {
    // external libs / connections
    getDb,
    pool,
    uploadToGridFS,
    getBucket,
    ObjectId,
    Binary,
    // handy util values
    path,
    fs,
    fsPromises,
    uploadsDir,
    upload,
    toObjectId,
}; 