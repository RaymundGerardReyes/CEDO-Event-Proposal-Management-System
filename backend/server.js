// ==============================
// Backend Server Main Entry Point
// CEDO Google Auth Application
// ==============================
// This is the main server file that initializes and configures the Express.js application
// Handles database connections, middleware setup, route mounting, and server startup

// ==============================
// Environment Configuration
// ==============================
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

// ==============================
// Core Dependencies & Imports
// ==============================
const express = require("express")
const cors = require("cors")
const path = require("path")
const cookieParser = require("cookie-parser")
const cookieSession = require("cookie-session")
const morgan = require("morgan")
const mysql = require('mysql2/promise')
const bodyParser = require('body-parser')

// Import OAuth configuration
const { passport } = require('./config/oauth')

// ==============================
// Database & Configuration Imports
// ==============================
const { pool } = require("./config/db")
const { connectToMongo } = require('./config/mongodb')

// ==============================
// Middleware Imports
// ==============================
const errorHandler = require("./middleware/error-handler")
const { ensureTablesExist } = require("./middleware/db-check")

// ==============================
// Route Imports - Authentication & User Management
// ==============================
const authRoutes = require("./routes/auth")
const oauthRoutes = require("./routes/oauth")
const userRoutes = require("./routes/users")

// ==============================
// Route Imports - Core Application Features
// ==============================
const proposalsRouter = require('./routes/proposals');  // MySQL-focused proposals
const mongoUnifiedRouter = require('./routes/mongodb-unified');  // Hybrid admin API ENABLED – now modular

// Initialize express app
const app = express()

// ==============================
// Server Configuration
// ==============================
// FIXED: Ensure PORT is not the same as MySQL port (3306)
// Use a different port like 5000 for your Express server
const PORT = 5000; // Explicitly set to 5000 to match Docker mapping

// ==============================
// Environment Variables Logging
// ==============================
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

// ==============================
// CORS Configuration
// ==============================
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

// ==============================
// Session & Authentication Middleware
// ==============================
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

// ==============================
// General Middleware Setup
// ==============================
app.use(express.json()) // Parses JSON bodies
app.use(morgan("dev")) // Logs HTTP requests in development mode
app.use(express.urlencoded({ extended: true }));

// ==============================
// Global State
// ==============================
let isDbConnected = false; // Global flag for DB status

// ==============================
// Database Connection Testing
// ==============================
// Test DB connection
async function testConnection() {
  if (!pool) {
    console.error("MySQL connection failed: Database pool is undefined after require.")
    throw new Error("Database pool is undefined");
  }

  try {
    await pool.query("SELECT 1")
    console.log("✅ MySQL database connected successfully")
    isDbConnected = true; // Set global flag
    return true;
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message)
    console.warn("\n⚠️ WARNING: DATABASE CONNECTION FAILED. Continuing in demo mode.")
    console.warn("API routes requiring the database will not work.")
    isDbConnected = false; // Set global flag
    return false;
  }
}

// ==============================
// Health Check & Monitoring Endpoints
// ==============================

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

// ==============================
// Server Initialization Logic
// ==============================
async function startServer() {
  console.log('🚀 Starting server initialization...');

  // Step 1: Test MySQL connection
  console.log('📋 Step 1: Testing MySQL connection...');
  await testConnection(); // This will set the global isDbConnected flag

  // Step 2: Test MongoDB connection
  console.log('📋 Step 2: Testing MongoDB connection...');
  try {
    await connectToMongo();
  } catch (err) {
    // Error is already logged in connectToMongo, just add a warning here
    console.warn('⚠️ WARNING: MONGODB CONNECTION FAILED. Continuing in demo mode.');
  }

  // Step 2.5: Initialize dependent services
  console.log('📋 Step 2.5: Initializing data-sync service...');
  const dataSyncService = require('./services/data-sync.service');
  dataSyncService.initialize();
  console.log('✅ Data-sync service ready');

  // Step 3: Check database tables ONLY if connected
  console.log('📋 Step 3: Checking database tables...');
  if (isDbConnected) {
    try {
      await ensureTablesExist();
      console.log('✅ Database tables verified.');
    } catch (err) {
      console.error('❌ Failed to ensure database tables exist:', err.message);
      // Log the error but don't crash the server.
    }
  } else {
    console.warn('⚠️ SKIPPING database table check (not connected).');
  }

  // Step 4: Start the HTTP server
  console.log('📋 Step 4: Starting HTTP server...');
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    console.log("🎉 Server initialization complete! Ready to accept requests.");
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use.`);
      process.exit(1);
    } else {
      console.error("❌ Server error:", error);
      process.exit(1);
    }
  });

  return server;
}

// ==============================
// Request Logging Middleware
// ==============================
// Add request logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  next();
});

// ==============================
// API Route Mounting
// ==============================

// ** Authentication & User Management Routes **
app.use("/api/auth", authRoutes)  // ✅ Mount auth routes at /api/auth to match frontend expectations
app.use("/auth/oauth", oauthRoutes) // OAuth routes (no /api prefix for OAuth callback compatibility)
app.use("/auth", oauthRoutes) // Also mount on /auth for backwards compatibility
app.use("/api/users", userRoutes)

// ** Core Application Routes **
app.use("/api/events", require("./routes/events"))
app.use("/api/proposals", proposalsRouter)  // ✅ SINGLE PROPOSALS ROUTER - MySQL focused
app.use("/api/reviews", require("./routes/reviews"))
app.use("/api/reports", require("./routes/reports"))
app.use("/api/compliance", require("./routes/compliance"))

// ** Organization Management **
const organizationRoutes = require('./routes/organizations');
app.use('/api/organizations', organizationRoutes);

// ** Hybrid MongoDB+MySQL API Routes **
// ✅ Hybrid MongoDB+MySQL API on separate path for admin features - ENABLED
app.use('/api/mongodb-unified', mongoUnifiedRouter);

// ** Admin Dashboard Routes **
// ✅ Admin Dashboard Route
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// ** Database API Routes **
// ✅ Database API Routes
const databaseApiRoutes = require('./routes/database-api');
app.use('/api/db', databaseApiRoutes);

// ** Profile Management **
// Profile routes
const profileRoutes = require('./routes/profile');
app.use('/api/profile', profileRoutes);

// ** File Upload Support **
// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// ** Draft Management **
// ✅ New drafts router
const draftsRouter = require('./routes/drafts');
app.use('/api', draftsRouter);

// ** Testing & Debug Routes **
// ✅ Test MongoDB router (for debugging)
const testMongoDBRouter = require('./routes/test-mongodb');
app.use('/api', testMongoDBRouter);

// ==============================
// Error Handling Middleware
// ==============================
// Error handling middleware
// This should be the last middleware added
app.use(errorHandler)

// ==============================
// Production Static File Serving
// ==============================
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

// ==============================
// Server Startup
// ==============================
// Initialize server
startServer().catch(err => {
  console.error("❌ A critical error occurred during server startup:", err);
  process.exit(1);
});

module.exports = { app, startServer, pool };

