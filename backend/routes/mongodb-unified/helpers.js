/**
 * =============================================
 * MONGODB UNIFIED ROUTES - Shared Helpers
 * =============================================
 * 
 * This module provides shared utilities and configurations for all
 * MongoDB unified routes. It centralizes database connections,
 * file upload configurations, and common helper functions.
 * 
 * @module routes/mongodb-unified/helpers
 * @author CEDO Development Team
 * @version 1.0.0
 */

const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const multer = require('multer');
const { ObjectId, Binary } = require('mongodb');

// =============================================
// DATABASE CONNECTIONS
// =============================================

/**
 * MongoDB database connection
 * @type {Function}
 */
const { getDb } = require('../../config/mongodb');

/**
 * MySQL database connection pool
 * @type {Object}
 */
const { pool } = require('../../config/db');

// =============================================
// FILE UPLOAD UTILITIES
// =============================================

/**
 * GridFS upload utility for MongoDB file storage
 * @type {Function}
 */
const { uploadFile, getBucket } = require('../../utils/gridfs');

/**
 * Ensure uploads directory exists for legacy file routes
 * @type {string}
 */
const uploadsDir = path.join(__dirname, '../../uploads/files');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Multer configuration for file uploads
 * Uses memory storage for GridFS processing
 * @type {Object}
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit
        files: 5 // Maximum 5 files per request
    },
    fileFilter: (req, file, cb) => {
        // Allow common document formats
        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv',
            'text/plain',
            'image/jpeg',
            'image/png'
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, JPG, PNG`));
        }
    }
});

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Safely convert arbitrary value to ObjectId when possible
 * 
 * @param {any} value - The value to convert
 * @returns {ObjectId|string} ObjectId if valid, original string otherwise
 * 
 * @example
 * const id = toObjectId('507f1f77bcf86cd799439011'); // Returns ObjectId
 * const invalid = toObjectId('invalid-id'); // Returns 'invalid-id'
 */
const toObjectId = (value) => {
    if (value instanceof ObjectId) return value;
    const str = String(value);
    return ObjectId.isValid(str) && str.length === 24 ? new ObjectId(str) : str;
};

/**
 * Validate and sanitize proposal ID (supports both numeric IDs and UUIDs)
 * 
 * @param {any} proposalId - The proposal ID to validate
 * @returns {string|null} Valid proposal ID or null
 * 
 * @example
 * const id = validateProposalId('123'); // Returns '123'
 * const uuid = validateProposalId('c723880e-f29f-45b8-a146-02ff79ab73e6'); // Returns UUID
 * const invalid = validateProposalId('abc'); // Returns null
 */
const validateProposalId = (proposalId) => {
    if (!proposalId) return null;

    const str = String(proposalId).trim();

    // Check if it's a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(str)) {
        return str;
    }

    // Check if it's a valid numeric ID
    const parsed = parseInt(str);
    if (!isNaN(parsed) && parsed > 0) {
        return str;
    }

    return null;
};

/**
 * Create standardized error response
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} details - Additional error details
 * @returns {Object} Standardized error response
 * 
 * @example
 * const error = createErrorResponse('File not found', 404, { fileId: '123' });
 */
const createErrorResponse = (message, statusCode = 500, details = null) => ({
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    ...(details && { details })
});

/**
 * Create standardized success response
 * 
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Standardized success response
 * 
 * @example
 * const response = createSuccessResponse({ id: '123' }, 'File uploaded successfully');
 */
const createSuccessResponse = (data, message = 'Operation completed successfully') => ({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
});

// =============================================
// MODULE EXPORTS
// =============================================

module.exports = {
    // Database connections
    getDb,
    pool,

    // File upload utilities
    getBucket,
    upload,
    uploadsDir,
    uploadFile,

    // MongoDB utilities
    ObjectId,
    Binary,
    toObjectId,

    // File system utilities
    path,
    fs,
    fsPromises,

    // Validation utilities
    validateProposalId,

    // Response utilities
    createErrorResponse,
    createSuccessResponse
}; 