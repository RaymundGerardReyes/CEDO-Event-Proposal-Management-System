require('dotenv').config();
const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const path = require("path")

// Require database config and routes from the root backend directory
const { pool } = require("./config/db") // Path adjusted based on your structure
const authRoutes = require("./routes/auth") // Path adjusted based on your structure
const userRoutes = require("./routes/users") // Path adjusted based on your structure
const proposalRoutes = require("./routes/proposals") // Path adjusted based on your structure
const errorHandler = require("./middleware/error-handler")
const { ensureTablesExist } = require("./middleware/db-check")

// Initialize express app
const app = express()

// FIXED: Ensure PORT is not the same as MySQL port (3306)
// Use a different port like 5000 for your Express server
const PORT = 5000; // Explicitly set to 5000 to match Docker mapping

// Log environment variables (excluding sensitive ones)
console.log("Environment Configuration:")
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`- PORT: ${PORT}`)
console.log(`- DB_HOST/MYSQL_HOST: ${process.env.DB_HOST || process.env.MYSQL_HOST || "not set"}`)
console.log(`- DB_PORT/MYSQL_PORT: ${process.env.DB_PORT || process.env.MYSQL_PORT || "3306 (default)"}`)
console.log(`- DB_NAME/MYSQL_DATABASE: ${process.env.DB_NAME || process.env.MYSQL_DATABASE || "not set"}`)
console.log(`- DB_USER/MYSQL_USER: ${process.env.DB_USER || process.env.MYSQL_USER || "not set"}`)
console.log(`- FRONTEND_URL: ${process.env.FRONTEND_URL || "not set"}`)
console.log(`- GOOGLE_CLIENT_ID_BACKEND: ${process.env.GOOGLE_CLIENT_ID_BACKEND ? "set" : "not set"}`)
console.log(`- RECAPTCHA_SECRET_KEY: ${process.env.RECAPTCHA_SECRET_KEY ? "set" : "not set"}`)

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow requests from your frontend
    credentials: true,
  }),
) // Enables CORS for all origins (adjust in production)
app.use(express.json()) // Parses JSON bodies
app.use(morgan("dev")) // Logs HTTP requests in development mode

// Test DB connection
async function testConnection() {
  // Explicitly check if pool was successfully imported and is not undefined
  // This helps catch issues in config/db.js itself if it fails before exporting
  if (!pool) {
    console.error("MySQL connection failed: Database pool is undefined after require.")
    console.log("\nTroubleshooting tips:")
    console.log("Ensure backend/config/db.js is correctly setting up and exporting the pool.")
    // If pool isn't even defined, we cannot proceed
    return // FIXED: Added return to prevent further execution
  }

  try {
    // Use pool.query from the promise-based pool
    await pool.query("SELECT 1") // Simple query to test the connection
    console.log("MySQL database connected successfully")
  } catch (err) {
    console.error("MySQL connection failed:", err.message) // Log the specific error message
    console.log("\nTroubleshooting tips:")
    console.log("1. Make sure MySQL server is running.")
    console.log(
      "2. Check your MySQL credentials (DB_HOST/MYSQL_HOST, DB_USER/MYSQL_USER, DB_PASSWORD/MYSQL_PASSWORD) in the .env file.",
    )
    console.log(
      `3. Ensure the database "${process.env.DB_NAME || process.env.MYSQL_DATABASE || "cedo_auth"}" exists (run 'npm run init-db').`,
    )
    console.log('4. If using "localhost", try using "127.0.0.1" instead in .env.')
    console.log("5. Check your MySQL user privileges (needs SELECT on the database).")
    console.log("6. In Docker, make sure the service name matches the hostname (e.g., 'mysql').")
    console.log("7. See the full error details above for more clues.")

    // Exit only in production or if database is critical and cannot connect at all
    // Keeping it running in dev might allow you to fix and hot-reload,
    // but routes interacting with the DB will fail.
    // A more robust app might defer starting the server until the DB is ready.
    if (process.env.NODE_ENV === "production") {
      console.error("Exiting process due to critical database connection failure in production.")
      process.exit(1)
    } else {
      console.warn(
        "Continuing in development mode despite database connection failure. API routes requiring the DB will fail.",
      )
    }
  }
}

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  })
})

// Add a database check endpoint
app.get("/api/db-check", async (req, res) => {
  try {
    await pool.query("SELECT 1")
    res.status(200).json({
      status: "connected",
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      timestamp: new Date().toISOString(),
    })
  }
})

// Tables check endpoint
app.get("/api/tables-check", async (req, res) => {
  try {
    const { tableExists } = require("./middleware/db-check")
    const tables = ["users", "access_logs", "proposals", "reviews"]
    const results = {}

    for (const table of tables) {
      results[table] = await tableExists(table)
    }

    res.json({
      status: "success",
      message: "Tables check completed.",
      tables: results,
    })
  } catch (error) {
    console.error("Tables check failed:", error)
    res.status(500).json({
      status: "error",
      message: "Tables check failed.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Create tables endpoint
app.post("/api/create-tables", async (req, res) => {
  try {
    await ensureTablesExist()
    res.json({
      status: "success",
      message: "Tables created or already exist.",
    })
  } catch (error) {
    console.error("Tables creation failed:", error)
    res.status(500).json({
      status: "error",
      message: "Tables creation failed.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    })
  }
})

// Run database connection test immediately on server start
// FIXED: Wrap in try/catch to prevent unhandled promise rejections
try {
  testConnection()
} catch (error) {
  console.error("Error during database connection test:", error)
}

// Define routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/proposals", proposalRoutes)
app.use("/api/reviews", require("./routes/reviews"))
app.use("/api/reports", require("./routes/reports"))
app.use("/api/compliance", require("./routes/compliance"))

// Error handling middleware
// This should be the last middleware added
app.use(errorHandler)

// Check and create tables on startup
// FIXED: Wrap in try/catch to prevent unhandled promise rejections
try {
  ; (async () => {
    try {
      console.log("Checking and creating database tables if needed...")
      await ensureTablesExist()
      console.log("Database tables check completed")
    } catch (error) {
      console.error("Error during database tables check:", error)
      console.log("Application will continue, but some features may not work correctly")
    }
  })()
} catch (error) {
  console.error("Error starting database check:", error)
}

// Serve static assets in production
// Assumes 'backend' and 'frontend' are sibling directories
if (process.env.NODE_ENV === "production") {
  // Serve the frontend's build folder
  app.use(express.static(path.join(__dirname, "../frontend/build"))) // Path from backend/ to frontend/build

  // For any other GET request not handled by the API, serve the frontend's index.html
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", "build", "index.html")) // Path from backend/ to index.html
  })
}

// Start server
// FIXED: Wrap in try/catch to prevent unhandled errors during server startup
try {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
    console.log(`API base URL: http://localhost:${PORT}/api`)

    if (process.env.NODE_ENV === "development") {
      // Listing routes can be helpful in dev
      console.log("\nConfigured API Routes:")
      console.log(`- /api/auth: Authentication & User management via Auth`)
      console.log(`- /api/users: User data access`)
      console.log(`- /api/proposals: Proposal management`)
      console.log(`- /health: Server health check endpoint`)
      console.log(`- /api/db-check: Database connection check endpoint`)
      // Add other routes here
      console.log("\nAccess the API endpoints using tools like Postman or your frontend application.")
    }
  })

  // Handle server errors
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. This could be because:`)
      console.error(`1. Another instance of your app is already running`)
      console.error(`2. Another application is using port ${PORT}`)
      console.error(`3. If ${PORT} is 3306, MySQL is likely using this port`)
      process.exit(1)
    } else {
      console.error("Server error:", error)
      process.exit(1)
    }
  })
} catch (error) {
  console.error("Error starting server:", error)
  process.exit(1)
}

module.exports = app // Export the express app instance (useful for testing)
