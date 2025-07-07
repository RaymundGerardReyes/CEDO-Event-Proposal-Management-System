const express = require('express');
const router = express.Router();
const { pool } = require('../../config/db');
const { validateAdmin, validateToken } = require('../../middleware/auth');
const { handleErrors } = require('./middleware');

// Apply authentication middleware to all MySQL routes
router.use(validateToken, validateAdmin);

// ===============================================
// MYSQL STATUS AND DATA ENDPOINTS  
// ===============================================

/**
 * @route GET /api/admin/mysql/status
 * @desc Get MySQL connection status and basic info
 * @access Private (Admin)
 */
router.get('/status', async (req, res) => {
    try {
        const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [proposalCount] = await pool.query('SELECT COUNT(*) as count FROM proposals WHERE 1=1');

        res.json({
            status: 'Connected',
            totalUsers: userCount[0].count,
            totalProposals: proposalCount[0].count,
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
 * @route GET /api/admin/mysql/tables
 * @desc Get list of MySQL tables with record counts
 * @access Private (Admin)
 */
router.get('/tables', async (req, res) => {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        const tableList = [];

        for (const tableRow of tables) {
            const tableName = Object.values(tableRow)[0];
            try {
                const [countResult] = await pool.query(`SELECT COUNT(*) as count FROM ??`, [tableName]);
                tableList.push({
                    name: tableName,
                    count: countResult[0].count
                });
            } catch (error) {
                tableList.push({
                    name: tableName,
                    count: 0,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            tables: tableList
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route GET /api/admin/mysql/table/:name
 * @desc Get data from specific MySQL table
 * @access Private (Admin)
 */
router.get('/table/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(`SELECT * FROM ?? LIMIT ? OFFSET ?`, [name, limit, offset]);
        const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM ??`, [name]);

        res.json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total: countResult[0].total,
                pages: Math.ceil(countResult[0].total / limit)
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