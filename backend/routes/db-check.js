const express = require("express")
const router = express.Router()
const pool = require("../config/db")

// Simple health check endpoint
router.get("/db-check", async (req, res) => {
    try {
        // Test database connection
        const connection = await pool.getConnection()
        connection.release()

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
        const connection = await pool.getConnection()

        // Get database name
        const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || "cedo_auth"

        // Check if users table exists
        const [usersTables] = await connection.query(
            `
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `,
            [dbName],
        )

        // Check if access_logs table exists
        const [accessLogsTables] = await connection.query(
            `
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'access_logs'
    `,
            [dbName],
        )

        // Check if proposals table exists
        const [proposalsTables] = await connection.query(
            `
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'proposals'
    `,
            [dbName],
        )

        // Check if reviews table exists
        const [reviewsTables] = await connection.query(
            `
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'reviews'
    `,
            [dbName],
        )

        connection.release()

        res.json({
            status: "success",
            database: dbName,
            tables: {
                users: usersTables.length > 0,
                access_logs: accessLogsTables.length > 0,
                proposals: proposalsTables.length > 0,
                reviews: reviewsTables.length > 0,
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
