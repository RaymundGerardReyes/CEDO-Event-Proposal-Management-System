const express = require("express")
const router = express.Router()
const { pool, query } = require("../config/database")

// Simple health check endpoint
router.get("/db-check", async (req, res) => {
    try {
        // Test database connection using the promise-based pool
        await pool.query("SELECT 1")

        res.json({
            status: "success",
            message: "Database connection is healthy.",
        })
    } catch (error) {
        console.error("Database health check failed:", error)
        res.status(500).json({
            status: "error",
            message: "Database connection failed",
            error: error.message,
        })
    }
})

// Check if tables exist
router.get("/tables-check", async (req, res) => {
    try {
        // Get database name
        const dbName = process.env.MYSQL_DATABASE || "cedo_auth"

        // Check if users table exists
        const [usersTables] = await pool.query(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
            [dbName],
        )

        // Check if access_logs table exists
        const [accessLogsTables] = await pool.query(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'access_logs'`,
            [dbName],
        )

        // Check if proposals table exists
        const [proposalsTables] = await pool.query(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'proposals'`,
            [dbName],
        )

        // Check if reviews table exists
        const [reviewsTables] = await pool.query(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reviews'`,
            [dbName],
        )

        // Check organization tables
        const [organizationsTables] = await pool.query(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'organizations'`,
            [dbName],
        )

        const [organizationTypesTables] = await pool.query(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'organization_types'`,
            [dbName],
        )

        const [organizationTypeLinksTables] = await pool.query(
            `SELECT TABLE_NAME 
             FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'organization_type_links'`,
            [dbName],
        )

        res.json({
            status: "success",
            database: dbName,
            tables: {
                users: usersTables.length > 0,
                access_logs: accessLogsTables.length > 0,
                proposals: proposalsTables.length > 0,
                reviews: reviewsTables.length > 0,
                organizations: organizationsTables.length > 0,
                organization_types: organizationTypesTables.length > 0,
                organization_type_links: organizationTypeLinksTables.length > 0,
            },
        })
    } catch (error) {
        console.error("Tables check failed:", error)
        res.status(500).json({
            status: "error",
            message: "Tables check failed",
            error: error.message,
        })
    }
})

// Initialize database tables if they don't exist
router.post("/init-tables", async (req, res) => {
    try {
        // Run the database initialization script
        const initDb = require("../scripts/init-db")
        await initDb.main()

        res.json({
            status: "success",
            message: "Database tables initialized successfully.",
        })
    } catch (error) {
        console.error("Database initialization failed:", error)
        res.status(500).json({
            status: "error",
            message: "Database initialization failed",
            error: error.message,
        })
    }
})

module.exports = router
