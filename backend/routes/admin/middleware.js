const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const logger = require('../../utils/logger');

// Configure file storage for proposal attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/proposals');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `proposal-${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, and XLSX files are allowed.'));
        }
    },
});

// Error handler middleware for admin routes
const handleErrors = (err, req, res, next) => {
    logger.error(`Admin API Error: ${err.message}`, { stack: err.stack });
    if (err.name === 'ValidationError') {
        return res.status(400).json({ success: false, error: err.message });
    }
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ success: false, error: 'Unauthorized access' });
    }
    res.status(500).json({
        success: false,
        error: 'An unexpected error occurred',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
};

module.exports = { upload, handleErrors }; 