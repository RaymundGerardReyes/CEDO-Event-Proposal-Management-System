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
  process.env.MONGODB_URI = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin';
}
// Force authentication for development to prevent unauthenticated connections
if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI.includes('@')) {
  console.log('⚠️  Forcing authenticated MongoDB URI for development...');
  process.env.MONGODB_URI = 'mongodb://cedo_admin:Raymund-Estaca01@localhost:27017/cedo_db?authSource=admin';
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
const connectionManager = require('./utils/connection-manager')

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
const profileRoutes = require("./routes/profile")

// ==============================
// Route Imports - Core Application Features
// ==============================
const proposalsRouter = require('./routes/proposals');  // MySQL-focused proposals
const mongoUnifiedRouter = require('./routes/mongodb-unified');  // Hybrid admin API ENABLED – now modular
const configRouter = require('./routes/config'); // Public-facing config route

// Initialize express app
const app = express()

// ==============================
// Server Configuration
// ==============================
// FIXED: Ensure PORT is not the same as MySQL port (3306)
// Use a different port like 5000 for your Express server
const PORT = process.env.NODE_ENV === 'test' ? 0 : (process.env.PORT || 5000); // Use random port for tests

// ==============================
// Environment Variables Logging
// ==============================
// Log environment variables (excluding sensitive ones)
console.log("Environment Configuration:")
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`- PORT: ${PORT}`)
console.log(`- MYSQL_HOST: ${process.env.MYSQL_HOST}`)
console.log(`- MYSQL_PORT: ${process.env.MYSQL_PORT}`)
console.log(`- MYSQL_DATABASE: ${process.env.MYSQL_DATABASE}`)
console.log(`- MYSQL_USER: ${process.env.MYSQL_USER}`)
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
// Request logging moved to optimized logger
app.use(require('./config/logging').logger.request);

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

// ✅ FIXED: Enhanced session configuration with proper error handling
app.use(cookieSession({
  name: 'cedo-session',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  keys: [process.env.COOKIE_SECRET || process.env.JWT_SECRET || 'fallback-secret'],
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  signed: true
}));

// ✅ FIXED: Session error handling middleware
// Request logging moved to optimized logger
app.use(require('./config/logging').logger.request);

app.use((req, res, next) => {
  // Ensure session exists
  if (!req.session) {
    req.session = {};
  }

  // Add session destroy method if it doesn't exist
  if (!req.session.destroy) {
    req.session.destroy = (callback) => {
      req.session = null;
      if (callback) callback();
    };
  }

  next();
});

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
// Request Logging Middleware
// ==============================
// Add request logging middleware
// Request logging moved to optimized logger
app.use(require('./config/logging').logger.request);

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  next();
});

// ==============================
// Global State
// ==============================
let isDbConnected = false; // Global flag for DB status
let isMongoConnected = false; // Global flag for MongoDB status
// Connection manager is already initialized as singleton

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

// Enhanced health check endpoint with detailed service status
app.get("/health", async (req, res) => {
  try {
    // Get health status from connection manager
    const healthStatus = await connectionManager.healthCheck();

    // Get detailed health information
    const healthInfo = {
      status: "ok",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      services: {
        mysql: {
          status: healthStatus.services.mysql.status,
          message: healthStatus.services.mysql.message,
          responseTime: healthStatus.services.mysql.responseTime || 0
        },
        mongodb: {
          status: healthStatus.services.mongodb.status,
          message: healthStatus.services.mongodb.message,
          responseTime: healthStatus.services.mongodb.responseTime || 0
        }
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    };

    // Determine overall health status
    const allServicesHealthy = healthStatus.services.mysql.status === 'healthy' || healthStatus.services.mongodb.status === 'healthy';
    const statusCode = allServicesHealthy ? 200 : 503; // 503 if no databases available

    res.status(statusCode).json(healthInfo);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
});

// Add a database check endpoint
app.get("/api/db-check", async (req, res) => {
  try {
    const healthStatus = await connectionManager.healthCheck();
    const mysqlStatus = healthStatus.services.mysql;

    if (mysqlStatus.status === 'healthy') {
      res.status(200).json({
        status: "connected",
        message: "Database connection successful",
        timestamp: new Date().toISOString(),
        responseTime: mysqlStatus.responseTime || 0
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Database connection failed",
        error: mysqlStatus.message,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
// API Route Mounting
// ==============================

// ** Authentication & User Management Routes **
app.use("/api/auth", authRoutes)  // ✅ Mount auth routes at /api/auth to match frontend expectations
app.use("/auth", authRoutes)     // ✅ Also mount at /auth for compatibility with legacy or alternate frontend calls
app.use("/auth/oauth", oauthRoutes) // OAuth routes (no /api prefix for OAuth callback compatibility)
app.use("/auth", oauthRoutes) // Also mount on /auth for backwards compatibility
app.use("/api/users", userRoutes)

// ** Draft Management **
// ✅ New drafts router - MUST BE BEFORE PROPOSALS ROUTE
const draftsRouter = require('./routes/drafts');
app.use('/api', draftsRouter);

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
app.use('/api/profile', profileRoutes);

// ** Dashboard Statistics **
// Dashboard routes for user statistics
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);

// ** File Upload Support **
// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// ** Testing & Debug Routes **
// ✅ Test MongoDB router (for debugging)
const testMongoDBRouter = require('./routes/test-mongodb');
app.use('/api', testMongoDBRouter);

// ** Config API Route **
// ✅ Public-facing config route for frontend (e.g., reCAPTCHA site key)
app.use("/api/config", configRouter);

// ==============================
// Centralized Error Handling for Unhandled Routes
// ==============================
// Based on best practices from web search results

// 1. Centralized Error Handling Middleware for API routes
app.use('/api/*', (req, res, next) => {
  const error = new Error('API route not found');
  error.status = 404;
  next(error);
});

// 2. Centralized Error Handling Middleware for all other routes
// Request logging moved to optimized logger
app.use(require('./config/logging').logger.request);

app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// 3. Global Error Handler Middleware
app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';

  // Log error for debugging
  console.error(`Error ${status}: ${message}`);

  // Return appropriate response based on request type
  if (req.path.startsWith('/api/')) {
    // API routes return JSON
    res.status(status).json({
      error: {
        message: message,
        status: status,
        path: req.path
      }
    });
  } else {
    // Non-API routes return HTML or redirect
    if (process.env.NODE_ENV === 'production') {
      // In production, serve the frontend for SPA routing
      res.status(status);
      if (status === 404) {
        res.sendFile(path.resolve(__dirname, "../frontend", "build", "index.html"));
      } else {
        res.send(`<h1>${status} - ${message}</h1>`);
      }
    } else {
      // In development, return simple error page
      res.status(status).send(`<h1>${status} - ${message}</h1>`);
    }
  }
});

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
// Server Initialization Logic
// ==============================
async function startServer() {
  console.log('🚀 Starting server initialization...');

  // Step 1: Initialize connections using ConnectionManager
  console.log('📋 Step 1: Initializing database connections...');
  try {
    await connectionManager.initialize();
    isDbConnected = connectionManager.isMysqlConnected;
    isMongoConnected = connectionManager.isMongoConnected;

    console.log('✅ Connection initialization complete');
    console.log(`   MySQL: ${isDbConnected ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`   MongoDB: ${isMongoConnected ? '✅ Connected' : '❌ Disconnected'}`);
  } catch (error) {
    console.warn('⚠️ Connection initialization failed:', error.message);
    console.warn('💡 Server will run in demo mode without database features');
    isDbConnected = false;
    isMongoConnected = false;
  }

  // Step 3: Initialize dependent services (with proper error handling)
  console.log('📋 Step 3: Initializing dependent services...');

  // Initialize data-sync service only if databases are available
  if (connectionManager.isMysqlConnected || connectionManager.isMongoConnected) {
    try {
      const dataSyncService = require('./services/data-sync.service');
      if (typeof dataSyncService.initialize === 'function') {
        await dataSyncService.initialize();
        console.log('✅ Data-sync service ready');
      } else {
        console.warn('⚠️ Data-sync service not available or missing initialize method');
      }
    } catch (error) {
      console.warn('⚠️ WARNING: Data-sync service initialization failed:', error.message);
      console.warn('⚠️ Continuing without full data-sync capabilities...');
    }
  } else {
    console.warn('⚠️ SKIPPING data-sync service initialization (no databases connected)');
  }

  // Step 4: Check database tables ONLY if connected
  console.log('📋 Step 4: Checking database tables...');
  if (connectionManager.isMysqlConnected) {
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

  // Step 5: Start the HTTP server
  console.log('📋 Step 5: Starting HTTP server...');

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      const actualPort = server.address().port;
      console.log(`✅ Server running on port ${actualPort} in ${process.env.NODE_ENV} mode`);
      console.log("🎉 Server initialization complete! Ready to accept requests.");

      // Log service status
      console.log('\n📊 Service Status:');
      console.log(`   MySQL: ${connectionManager.isMysqlConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   MongoDB: ${connectionManager.isMongoConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`   Health Check: http://localhost:${actualPort}/health`);
      console.log(`   API Health: http://localhost:${actualPort}/api/health`);
      console.log('');

      resolve(server);
    });

    // Add timeout configurations to prevent hanging requests
    server.timeout = 30000; // Reduced to 30 seconds for faster failure detection
    server.keepAliveTimeout = 35000; // 35 seconds keep-alive timeout
    server.headersTimeout = 36000; // 36 seconds headers timeout

    // Add request logging middleware
    // Request logging moved to optimized logger
app.use(require('./config/logging').logger.request);

app.use((req, res, next) => {
      const start = Date.now();
      console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);

      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`📤 ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
      });

      next();
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use.`);
        // In test environment, don't exit the process
        if (process.env.NODE_ENV === 'test') {
          console.warn('⚠️ Test environment: Not exiting process due to port conflict');
          reject(error);
        } else {
          process.exit(1);
        }
      } else {
        console.error("❌ Server error:", error);
        if (process.env.NODE_ENV === 'test') {
          reject(error);
        } else {
          process.exit(1);
        }
      }
    });

    // Add timeout error handling with better logging
    server.on('timeout', (socket) => {
      console.warn('⚠️ Request timeout - closing socket');
      console.warn('⚠️ This may indicate a slow database query or external API call');
      socket.destroy();
    });
  });
}

// ==============================
// Server Startup
// ==============================
// Initialize server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error("❌ A critical error occurred during server startup:", err);
    process.exit(1);
  });
}

module.exports = { app, startServer, pool, testConnection };

