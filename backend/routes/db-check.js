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
        const usersTables = await query(
            `SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'users'`
        )

        // Check if audit_logs table exists
        const auditLogsTables = await query(
            `SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'audit_logs'`
        )

        // Check if proposals table exists
        const proposalsTables = await query(
            `SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'proposals'`
        )

        // Check if reviews table exists
        const reviewsTables = await query(
            `SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'reviews'`
        )

        // Check organization tables
        const organizationsTables = await query(
            `SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'organizations'`
        )

        const organizationTypesTables = await query(
            `SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'organization_types'`
        )

        const organizationTypeLinksTables = await query(
            `SELECT table_name 
             FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_name = 'organization_type_links'`
        )

        res.json({
            status: "success",
            database: dbName,
            tables: {
                users: usersTables.rows.length > 0,
                audit_logs: auditLogsTables.rows.length > 0,
                proposals: proposalsTables.rows.length > 0,
                reviews: reviewsTables.rows.length > 0,
                organizations: organizationsTables.rows.length > 0,
                organization_types: organizationTypesTables.rows.length > 0,
                organization_type_links: organizationTypeLinksTables.rows.length > 0,
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
