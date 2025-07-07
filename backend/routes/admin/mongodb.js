const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { validateAdmin, validateToken } = require('../../middleware/auth');
const { handleErrors } = require('./middleware');

// Apply authentication middleware to all MongoDB routes
router.use(validateToken, validateAdmin);

// ===============================================
// MONGODB STATUS AND DATA ENDPOINTS
// ===============================================

/**
 * @route GET /api/admin/mongodb/status  
 * @desc Get MongoDB connection status and basic info
 * @access Private (Admin)
 */
router.get('/status', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({
                status: 'Disconnected',
                error: 'MongoDB connection not ready',
                timestamp: new Date().toISOString()
            });
        }

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        res.json({
            status: 'Connected',
            totalCollections: collections.length,
            collections: collections.map(c => c.name),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @route GET /api/admin/mongodb/collections
 * @desc Get list of MongoDB collections with document counts
 * @access Private (Admin)
 */
router.get('/collections', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({
                success: false,
                error: 'MongoDB connection not ready'
            });
        }

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionList = [];

        for (const collection of collections) {
            try {
                const count = await db.collection(collection.name).countDocuments();
                collectionList.push({
                    name: collection.name,
                    count: count
                });
            } catch (error) {
                collectionList.push({
                    name: collection.name,
                    count: 0,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            collections: collectionList
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route GET /api/admin/mongodb/collection/:name
 * @desc Get data from specific MongoDB collection
 * @access Private (Admin)
 */
router.get('/collection/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (mongoose.connection.readyState !== 1) {
            return res.status(500).json({
                success: false,
                error: 'MongoDB connection not ready'
            });
        }

        const db = mongoose.connection.db;
        const collection = db.collection(name);

        const documents = await collection.find({}).skip(skip).limit(limit).toArray();
        const total = await collection.countDocuments();

        res.json({
            success: true,
            data: documents,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Apply error handler to all routes
router.use(handleErrors);

module.exports = router; 