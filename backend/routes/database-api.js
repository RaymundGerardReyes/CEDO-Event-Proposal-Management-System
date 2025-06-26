const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const mongoose = require('mongoose');
const { getDatabase, connectToMongo } = require('../config/mongodb');

// ===============================================
// UNIFIED DATABASE API ENDPOINTS
// ===============================================

// ===============================================
// MYSQL CRUD OPERATIONS
// ===============================================

// GET all records from a MySQL table
router.get('/mysql/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const [rows] = await pool.query('SELECT * FROM ?? LIMIT ? OFFSET ?', [table, limit, offset]);
        const [countResult] = await pool.query('SELECT COUNT(*) as total FROM ??', [table]);
        const total = countResult[0].total;

        res.json({
            success: true,
            data: rows,
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

// GET single record from MySQL table by ID
router.get('/mysql/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;

        const [rows] = await pool.query('SELECT * FROM ?? WHERE id = ?', [table, id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST - Create new record in MySQL table
router.post('/mysql/:table', async (req, res) => {
    try {
        const { table } = req.params;
        const data = req.body;

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No data provided'
            });
        }

        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');

        const query = `INSERT INTO ?? (${keys.join(', ')}) VALUES (${placeholders})`;
        const [result] = await pool.query(query, [table, ...values]);

        res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                ...data
            },
            message: 'Record created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT - Update record in MySQL table
router.put('/mysql/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;
        const data = req.body;

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No data provided'
            });
        }

        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map(key => `${key} = ?`).join(', ');

        const query = `UPDATE ?? SET ${setClause} WHERE id = ?`;
        const [result] = await pool.query(query, [table, ...values, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        res.json({
            success: true,
            message: 'Record updated successfully',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE record from MySQL table
router.delete('/mysql/:table/:id', async (req, res) => {
    try {
        const { table, id } = req.params;

        const [result] = await pool.query('DELETE FROM ?? WHERE id = ?', [table, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Record not found'
            });
        }

        res.json({
            success: true,
            message: 'Record deleted successfully',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===============================================
// MONGODB CRUD OPERATIONS
// ===============================================

// GET all documents from MongoDB collection
router.get('/mongodb/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const db = mongoose.connection.db;
        const mongoCollection = db.collection(collection);

        const [documents, total] = await Promise.all([
            mongoCollection.find({}).skip(skip).limit(limit).toArray(),
            mongoCollection.countDocuments({})
        ]);

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

// GET single document from MongoDB collection by ID
router.get('/mongodb/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;

        const db = mongoose.connection.db;
        const mongoCollection = db.collection(collection);

        const document = await mongoCollection.findOne({
            _id: new mongoose.Types.ObjectId(id)
        });

        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        res.json({
            success: true,
            data: document
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST - Create new document in MongoDB collection
router.post('/mongodb/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const data = req.body;

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No data provided'
            });
        }

        data.createdAt = new Date();
        data.updatedAt = new Date();

        const db = mongoose.connection.db;
        const mongoCollection = db.collection(collection);

        const result = await mongoCollection.insertOne(data);

        res.status(201).json({
            success: true,
            data: {
                _id: result.insertedId,
                ...data
            },
            message: 'Document created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT - Update document in MongoDB collection
router.put('/mongodb/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;
        const data = req.body;

        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No data provided'
            });
        }

        data.updatedAt = new Date();

        const db = mongoose.connection.db;
        const mongoCollection = db.collection(collection);

        const result = await mongoCollection.updateOne(
            { _id: new mongoose.Types.ObjectId(id) },
            { $set: data }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        res.json({
            success: true,
            message: 'Document updated successfully',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE document from MongoDB collection
router.delete('/mongodb/:collection/:id', async (req, res) => {
    try {
        const { collection, id } = req.params;

        const db = mongoose.connection.db;
        const mongoCollection = db.collection(collection);

        const result = await mongoCollection.deleteOne({
            _id: new mongoose.Types.ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }

        res.json({
            success: true,
            message: 'Document deleted successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===============================================
// UTILITY ENDPOINTS
// ===============================================

// Get database schema information
router.get('/schema/mysql', async (req, res) => {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        const schema = {};

        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            const [columns] = await pool.query('DESCRIBE ??', [tableName]);
            schema[tableName] = columns.map(col => ({
                name: col.Field,
                type: col.Type,
                nullable: col.Null === 'YES',
                key: col.Key,
                default: col.Default
            }));
        }

        res.json({
            success: true,
            schema
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.get('/schema/mongodb', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        const schema = {};
        for (const collection of collections) {
            const sampleDoc = await db.collection(collection.name).findOne();
            if (sampleDoc) {
                schema[collection.name] = Object.keys(sampleDoc).map(key => ({
                    name: key,
                    type: typeof sampleDoc[key],
                    sample: sampleDoc[key]
                }));
            } else {
                schema[collection.name] = [];
            }
        }

        res.json({
            success: true,
            schema
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Data sync between databases
router.post('/sync/mysql-to-mongodb', async (req, res) => {
    try {
        const { sourceTable, targetCollection } = req.body;

        if (!sourceTable || !targetCollection) {
            return res.status(400).json({
                success: false,
                error: 'sourceTable and targetCollection are required'
            });
        }

        // Get data from MySQL
        const [rows] = await pool.query('SELECT * FROM ??', [sourceTable]);

        if (rows.length === 0) {
            return res.json({
                success: true,
                message: 'No data to sync',
                count: 0
            });
        }

        // Insert into MongoDB
        const db = mongoose.connection.db;
        const collection = db.collection(targetCollection);

        const documentsToInsert = rows.map(row => ({
            ...row,
            syncedAt: new Date(),
            syncedFrom: 'mysql'
        }));

        const result = await collection.insertMany(documentsToInsert);

        res.json({
            success: true,
            message: `Synced ${result.insertedCount} records from MySQL table '${sourceTable}' to MongoDB collection '${targetCollection}'`,
            insertedCount: result.insertedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/sync/mongodb-to-mysql', async (req, res) => {
    try {
        const { sourceCollection, targetTable, fieldMapping } = req.body;

        if (!sourceCollection || !targetTable) {
            return res.status(400).json({
                success: false,
                error: 'sourceCollection and targetTable are required'
            });
        }

        // Get data from MongoDB
        const db = mongoose.connection.db;
        const collection = db.collection(sourceCollection);
        const documents = await collection.find({}).toArray();

        if (documents.length === 0) {
            return res.json({
                success: true,
                message: 'No data to sync',
                count: 0
            });
        }

        // Get MySQL table structure
        const [columns] = await pool.query('DESCRIBE ??', [targetTable]);
        const columnNames = columns.map(col => col.Field);

        let insertedCount = 0;
        for (const doc of documents) {
            try {
                // Filter document fields to match MySQL table columns
                const filteredData = {};
                for (const column of columnNames) {
                    if (column === 'id') continue; // Skip auto-increment ID

                    // Use field mapping if provided
                    const sourceField = fieldMapping && fieldMapping[column] ? fieldMapping[column] : column;

                    if (doc[sourceField] !== undefined) {
                        filteredData[column] = doc[sourceField];
                    }
                }

                // Add sync metadata
                if (columnNames.includes('synced_at')) {
                    filteredData.synced_at = new Date();
                }
                if (columnNames.includes('synced_from')) {
                    filteredData.synced_from = 'mongodb';
                }

                if (Object.keys(filteredData).length > 0) {
                    const keys = Object.keys(filteredData);
                    const values = Object.values(filteredData);
                    const placeholders = keys.map(() => '?').join(', ');

                    const query = `INSERT INTO ?? (${keys.join(', ')}) VALUES (${placeholders})`;
                    await pool.query(query, [targetTable, ...values]);
                    insertedCount++;
                }
            } catch (error) {
                console.error(`Error inserting document ${doc._id}:`, error.message);
            }
        }

        res.json({
            success: true,
            message: `Synced ${insertedCount} documents from MongoDB collection '${sourceCollection}' to MySQL table '${targetTable}'`,
            insertedCount
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 