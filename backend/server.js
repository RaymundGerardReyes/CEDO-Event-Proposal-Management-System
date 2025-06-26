// Load environment variables from multiple possible locations
require('dotenv').config({ path: '.env' }); // Try backend/.env first
require('dotenv').config({ path: '../.env' }); // Then try root/.env

// Fallback environment variables for development
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_auth?authSource=admin';
}
// Force authentication for development to prevent unauthenticated connections
if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI.includes('@')) {
  console.log('⚠️  Forcing authenticated MongoDB URI for development...');
  process.env.MONGODB_URI = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_auth?authSource=admin';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'your-development-jwt-secret-key';
}
if (!process.env.GOOGLE_CLIENT_ID) {
  process.env.GOOGLE_CLIENT_ID = 'your-google-client-id';
}

// Essential environment check
console.log('\n✅ Environment Variables Loaded');
console.log(`🔑 GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? 'SET ✓' : '❌ MISSING'}`);
console.log(`🔑 JWT_SECRET: ${process.env.JWT_SECRET ? 'SET ✓' : '❌ MISSING'}`);
console.log(`🔑 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔑 MONGODB_URI: ${process.env.MONGODB_URI ? 'SET ✓' : '❌ MISSING'}`);
console.log(`🔍 MONGODB_URI (masked): ${process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@') : 'NOT_SET'}\n`);

const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const path = require("path")
const mysql = require('mysql2/promise');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

// Import MongoDB connection - ENABLED for hybrid setup
const { connectToMongo } = require("./config/mongodb")

// Import OAuth configuration
const { passport } = require('./config/oauth');

// Require database config and routes from the root backend directory
const { pool } = require("./config/db") // Path adjusted based on your structure
const authRoutes = require("./routes/auth") // Path adjusted based on your structure
const oauthRoutes = require("./routes/oauth") // New OAuth routes
const userRoutes = require("./routes/users") // Path adjusted based on your structure
const errorHandler = require("./middleware/error-handler")
const { ensureTablesExist } = require("./middleware/db-check")

// ✅ Import proposals routes
const proposalsRouter = require('./routes/proposals');  // MySQL-focused proposals
const mongoUnifiedRouter = require('./routes/mongodb-unified');  // Hybrid admin API ENABLED – now modular

// Initialize express app
const app = express()

// FIXED: Ensure PORT is not the same as MySQL port (3306)
// Use a different port like 5000 for your Express server
const PORT = 5000; // Explicitly set to 5000 to match Docker mapping

// Log environment variables (excluding sensitive ones)
console.log("Environment Configuration:")
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`- PORT: ${PORT}`)
console.log(`- DB_HOST/MYSQL_HOST: ${process.env.DB_HOST || process.env.MYSQL_HOST}`)
console.log(`- DB_PORT/MYSQL_PORT: ${process.env.DB_PORT || process.env.MYSQL_PORT}`)
console.log(`- DB_NAME/MYSQL_DATABASE: ${process.env.DB_NAME || process.env.MYSQL_DATABASE}`)
console.log(`- DB_USER/MYSQL_USER: ${process.env.DB_USER || process.env.MYSQL_USER}`)
console.log(`- FRONTEND_URL: ${process.env.FRONTEND_URL}`)
console.log(`- RECAPTCHA_SECRET_KEY: ${process.env.RECAPTCHA_SECRET_KEY ? "set" : "not set"}`)

// ✅ ENHANCED CORS CONFIGURATION FOR GOOGLE OAUTH
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
};

app.use(cors(corsOptions));

// ✅ Additional headers for Google OAuth compatibility
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Cookie and session middleware (must be before passport)
app.use(cookieParser());
app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  keys: [process.env.COOKIE_SECRET],
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
}));

// Passport middleware (must be after session middleware)
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json()) // Parses JSON bodies
app.use(morgan("dev")) // Logs HTTP requests in development mode
app.use(express.urlencoded({ extended: true }));

// Test DB connection
async function testConnection() {
  // Explicitly check if pool was successfully imported and is not undefined
  // This helps catch issues in config/db.js itself if it fails before exporting
  if (!pool) {
    console.error("MySQL connection failed: Database pool is undefined after require.")
    console.log("\nTroubleshooting tips:")
    console.log("Ensure backend/config/db.js is correctly setting up and exporting the pool.")
    // If pool isn't even defined, we cannot proceed
    throw new Error("Database pool is undefined");
  }

  try {
    // Use pool.query from the promise-based pool
    await pool.query("SELECT 1") // Simple query to test the connection
    console.log("✅ MySQL database connected successfully")
    return true;
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message) // Log the specific error message
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
      throw err;
    } else {
      console.warn(
        "Continuing in development mode despite database connection failure. API routes requiring the DB will fail.",
      )
      throw err;
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

// Start server with proper async initialization
async function startServer() {
  try {
    console.log('🚀 Starting server initialization...');

    // Step 1: Test MySQL connection
    console.log('📋 Step 1: Testing MySQL connection...');
    await testConnection();

    // Step 2: Initialize MongoDB connection
    console.log('📋 Step 2: Initializing MongoDB connection...');
    await connectToMongo();
    console.log('✅ MongoDB connection established');

    // Step 2.5: Initialize data-sync service
    console.log('📋 Step 2.5: Initializing data-sync service...');
    const dataSyncService = require('./services/data-sync.service');
    // The service will use the shared connection automatically
    console.log('✅ Data-sync service ready');

    // Step 3: Ensure database tables exist
    console.log('📋 Step 3: Checking database tables...');
    await ensureTablesExist();
    console.log('✅ Database tables verified');

    // Step 4: Start the HTTP server
    console.log('📋 Step 4: Starting HTTP server...');
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV} mode`)
      console.log(`📊 API base URL: http://localhost:${PORT}/api`)
      console.log(`📊 MySQL Proposals API: http://localhost:${PORT}/api/proposals`)
      console.log(`📊 Hybrid Admin API: http://localhost:${PORT}/api/mongodb-unified`)

      if (process.env.NODE_ENV === "development") {
        console.log("\n📋 Configured API Routes:")
        console.log(`- /api/auth: Authentication & User management`)
        console.log(`- /api/users: User data access`)
        console.log(`- /api/proposals: Main proposal management (MySQL)`)
        console.log(`- /api/mongodb-unified: Hybrid admin API (MySQL + MongoDB files)`)
        console.log(`- /api/organizations: Organization management`)
        console.log(`- /health: Server health check endpoint`)
        console.log(`- /api/db-check: Database connection check endpoint`)
        console.log("\n🎉 Server initialization complete! Ready to accept requests.")
      }
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use. This could be because:`)
        console.error(`1. Another instance of your app is already running`)
        console.error(`2. Another application is using port ${PORT}`)
        console.error(`3. If ${PORT} is 3306, MySQL is likely using this port`)
        process.exit(1)
      } else {
        console.error("❌ Server error:", error)
        process.exit(1)
      }
    });

  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    process.exit(1);
  }
}

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  next();
});

// Define routes
app.use("/api/auth", authRoutes)  // ✅ Mount auth routes at /api/auth to match frontend expectations
app.use("/auth/oauth", oauthRoutes) // OAuth routes (no /api prefix for OAuth callback compatibility)
app.use("/auth", oauthRoutes) // Also mount on /auth for backwards compatibility
app.use("/api/events", require("./routes/events"))
app.use("/api/users", userRoutes)
app.use("/api/proposals", proposalsRouter)  // ✅ SINGLE PROPOSALS ROUTER - MySQL focused
app.use("/api/reviews", require("./routes/reviews"))
app.use("/api/reports", require("./routes/reports"))
app.use("/api/compliance", require("./routes/compliance"))
const organizationRoutes = require('./routes/organizations');
app.use('/api/organizations', organizationRoutes);

// ✅ Hybrid MongoDB+MySQL API on separate path for admin features - ENABLED
app.use('/api/mongodb-unified', mongoUnifiedRouter);

// ✅ Admin Dashboard Route
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// ✅ Database API Routes
const databaseApiRoutes = require('./routes/database-api');
app.use('/api/db', databaseApiRoutes);

// Profile routes
const profileRoutes = require('./routes/profile');
app.use('/api/profile', profileRoutes);

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// ✅ New drafts router
const draftsRouter = require('./routes/drafts');
app.use('/api', draftsRouter);

// ✅ Test MongoDB router (for debugging)
const testMongoDBRouter = require('./routes/test-mongodb');
app.use('/api', testMongoDBRouter);

// Error handling middleware
// This should be the last middleware added
app.use(errorHandler)

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

// Initialize server
startServer();

module.exports = app // Export the express app instance (useful for testing)
