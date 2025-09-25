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

// Normalize NODE_ENV to lowercase
process.env.NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : 'development';

// PostgreSQL-only configuration
// Ensure PostgreSQL environment variables are set
if (!process.env.POSTGRES_HOST) {
  process.env.POSTGRES_HOST = 'localhost';
}
if (!process.env.POSTGRES_PORT) {
  process.env.POSTGRES_PORT = '5432';
}
if (!process.env.POSTGRES_DATABASE) {
  process.env.POSTGRES_DATABASE = 'cedo_auth';
}
if (!process.env.POSTGRES_USER) {
  process.env.POSTGRES_USER = 'postgres';
}
if (!process.env.POSTGRES_PASSWORD) {
  console.warn('⚠️  POSTGRES_PASSWORD not set - using default password');
  process.env.POSTGRES_PASSWORD = 'Raymund-Estaca01';
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
console.log(`🐘 POSTGRES_HOST: ${process.env.POSTGRES_HOST || 'localhost'}`);
console.log(`🐘 POSTGRES_DATABASE: ${process.env.POSTGRES_DATABASE || 'cedo_auth'}`);
console.log(`🐘 POSTGRES_USER: ${process.env.POSTGRES_USER || 'postgres'}`);

// Database environment variables debugging
console.log('\n🔍 Database Environment Variables:');
console.log(`🔑 DB_HOST: ${process.env.DB_HOST || 'NOT_SET'}`);
console.log(`🔑 POSTGRES_HOST: ${process.env.POSTGRES_HOST || 'NOT_SET'}`);
console.log(`🔑 POSTGRES_HOSTNAME: ${process.env.POSTGRES_HOSTNAME || 'NOT_SET'}`);
console.log(`🔑 DB_USER: ${process.env.DB_USER || 'NOT_SET'}`);
console.log(`🔑 POSTGRES_USER: ${process.env.POSTGRES_USER || 'NOT_SET'}`);
console.log(`🔑 POSTGRES_USERNAME: ${process.env.POSTGRES_USERNAME || 'NOT_SET'}`);
console.log(`🔑 DB_NAME: ${process.env.DB_NAME || 'NOT_SET'}`);
console.log(`🔑 POSTGRES_DATABASE: ${process.env.POSTGRES_DATABASE || 'NOT_SET'}`);
console.log(`🔑 POSTGRES_DB: ${process.env.POSTGRES_DB || 'NOT_SET'}`);
console.log(`🔑 POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD ? 'SET ✓' : '❌ MISSING'}`);
console.log(`🔑 DB_PASSWORD: ${process.env.DB_PASSWORD ? 'SET ✓' : '❌ MISSING'}\n`);

// ==============================
// Core Dependencies & Imports
// ==============================
const express = require("express")
const cors = require("cors")
const path = require("path")
const cookieParser = require("cookie-parser")
const cookieSession = require("cookie-session")
const morgan = require("morgan")
// postgresql import removed - using universal database manager
const bodyParser = require('body-parser')

// Import OAuth configuration
const { passport } = require('./config/oauth')

// ==============================
// Database & Configuration Imports
// ==============================
// Use PostgreSQL-only database manager
const { pool, getDatabaseType } = require("./config/database-postgresql-only")

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
const proposalsRouter = require('./routes/proposals');  // PostgreSQL-focused proposals
const configRouter = require('./routes/config'); // Public-facing config route

// Initialize express app
const app = express()

// Enable trust proxy so secure cookies work behind Render/Proxies
app.set('trust proxy', 1)

// ==============================
// Server Configuration
// ==============================
// FIXED: Ensure PORT is not the same as postgresql port (3306)
// Use a different port like 5000 for your Express server
// On Render, use the PORT environment variable, otherwise use 5000
const PORT = process.env.NODE_ENV === 'test' ? 0 : (process.env.PORT || 5000); // Use random port for tests

// Force PORT to 10000 for Render if not set or if it's 1000
if (process.env.RENDER === 'true' && (!process.env.PORT || process.env.PORT === '1000')) {
  process.env.PORT = '10000';
  console.log('🔧 Render detected: Setting PORT to 10000');
}

// ==============================
// Environment Variables Logging
// ==============================
// Log environment variables (excluding sensitive ones)
console.log("Environment Configuration:")
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`- PORT: ${PORT}`)
console.log(`- POSTGRES_HOST: ${process.env.POSTGRES_HOST}`)
console.log(`- POSTGRES_PORT: ${process.env.POSTGRES_PORT}`)
console.log(`- POSTGRES_DATABASE: ${process.env.POSTGRES_DATABASE}`)
console.log(`- POSTGRES_USER: ${process.env.POSTGRES_USER}`)
console.log(`- FRONTEND_URL: ${process.env.FRONTEND_URL}`)
console.log(`- RECAPTCHA_SECRET_KEY: ${process.env.RECAPTCHA_SECRET_KEY ? "set" : "not set"}`)

// ==============================
// CORS Configuration
// ==============================
// ✅ ENHANCED CORS CONFIGURATION FOR GOOGLE OAUTH
// Support comma-separated multiple origins via ALLOWED_ORIGINS or fallback FRONTEND_URL or localhost:3000
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000'
const allowedOrigins = allowedOriginsEnv.split(',').map(s => s.trim()).filter(Boolean)
console.log(`- ALLOWED_ORIGINS: ${allowedOrigins.join(', ')}`)

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser or same-origin requests
    if (!origin) return callback(null, true)
    // Match exact origin or wildcard "*"
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    // Also allow http->https downgrade for local testing if schemes differ
    const normalized = origin.replace('https://', 'http://').replace('http://', 'https://')
    if (allowedOrigins.includes(normalized)) {
      return callback(null, true)
    }
    console.warn(`CORS blocked origin: ${origin}`)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'Origin', 'X-Requested-With'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight early
app.options('*', cors(corsOptions))

// Global timeout middleware
app.use((req, res, next) => {
  // Set timeout for all requests
  req.setTimeout(30000); // 30 second timeout
  res.setTimeout(30000); // 30 second timeout
  next();
});

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

// Lightweight connectivity ping for frontend readiness checks
app.get('/api/ping', (req, res) => {
  res.status(200).json({ ok: true, ts: Date.now() })
})

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
// Configure body parser with increased limits for large file uploads
// Only parse JSON for non-multipart requests
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
    express.json({ limit: '50mb' })(req, res, next);
  } else {
    next();
  }
});

// Parse URL-encoded data (only for non-multipart requests)
app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    next(); // Skip URL-encoded parsing for multipart requests
  } else {
    express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
  }
});
app.use(morgan("dev")) // Logs HTTP requests in development mode

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
// Connection manager is already initialized as singleton

// ==============================
// Database Connection Testing
// ==============================
// Test DB connection
async function testConnection() {
  if (!pool) {
    console.error("postgresql connection failed: Database pool is undefined after require.")
    throw new Error("Database pool is undefined");
  }

  try {
    await pool.query("SELECT 1")
    console.log("✅ postgresql database connected successfully")
    isDbConnected = true; // Set global flag
    return true;
  } catch (err) {
    console.error("❌ postgresql connection failed:", err.message)
    console.warn("\n⚠️ WARNING: DATABASE CONNECTION FAILED. Continuing in demo mode.")
    console.warn("API routes requiring the database will not work.")
    isDbConnected = false; // Set global flag
    return false;
  }
}

// ==============================
// Health Check & Monitoring Endpoints
// ==============================

// Root route for Render health checks and general access
app.get('/', (req, res) => {
  // Set timeout for this route
  req.setTimeout(5000); // 5 second timeout

  res.json({
    status: 'OK',
    message: 'CEDO Backend API is running',
    timestamp: new Date().toISOString(),
    database: getDatabaseType(),
    dbConnected: isDbConnected,
    environment: process.env.NODE_ENV,
    port: PORT
  });
});

// Enhanced health check endpoint with detailed service status
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    const startTime = Date.now();
    let dbStatus = 'unknown';
    let dbMessage = 'Database service not available';
    let dbResponseTime = 0;

    try {
      const result = await pool.query('SELECT NOW() as current_time, version() as version');
      dbStatus = 'healthy';
      dbMessage = 'Database connection successful';
      dbResponseTime = Date.now() - startTime;
    } catch (dbError) {
      dbStatus = 'unhealthy';
      dbMessage = `Database connection failed: ${dbError.message}`;
      dbResponseTime = Date.now() - startTime;
    }

    // Get detailed health information
    const healthInfo = {
      status: "ok",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      services: {
        database: {
          type: getDatabaseType(),
          status: dbStatus,
          message: dbMessage,
          responseTime: dbResponseTime
        },
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
      }
    };

    // Determine overall health status
    const allServicesHealthy = dbStatus === 'healthy';
    const statusCode = allServicesHealthy ? 200 : 503; // 503 if database not available

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
    // Test database connection directly
    const startTime = Date.now();
    let dbStatus = 'unknown';
    let dbMessage = 'Database service not available';
    let dbResponseTime = 0;

    try {
      const result = await pool.query('SELECT NOW() as current_time, version() as version');
      dbStatus = 'healthy';
      dbMessage = 'Database connection successful';
      dbResponseTime = Date.now() - startTime;
    } catch (dbError) {
      dbStatus = 'unhealthy';
      dbMessage = `Database connection failed: ${dbError.message}`;
      dbResponseTime = Date.now() - startTime;
    }

    if (dbStatus === 'healthy') {
      res.status(200).json({
        status: "connected",
        message: "Database connection successful",
        databaseType: getDatabaseType(),
        timestamp: new Date().toISOString(),
        responseTime: dbResponseTime
      });
    } else {
      res.status(500).json({
        status: "error",
        message: "Database connection failed",
        databaseType: getDatabaseType(),
        error: dbMessage,
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
    const tables = ["users", "audit_logs", "proposals", "reviews"]
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
app.use("/api/proposals", proposalsRouter)  // ✅ SINGLE PROPOSALS ROUTER - postgresql focused
app.use("/api/reviews", require("./routes/reviews"))
app.use("/api/reports", require("./routes/reports"))
app.use("/api/compliance", require("./routes/compliance"))

// ** Organization Management **
const organizationRoutes = require('./routes/organizations');
app.use('/api/organizations', organizationRoutes);

// ** PostgreSQL API Routes **
// ✅ PostgreSQL-only API routes

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
// ✅ PostgreSQL-only testing routes

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
    if (process.env.NODE_ENV === 'production' && process.env.RENDER !== "true") {
      // Local production - serve the frontend for SPA routing
      res.status(status);
      if (status === 404) {
        res.sendFile(path.resolve(__dirname, "../frontend", ".next", "index.html"));
      } else {
        res.send(`<h1>${status} - ${message}</h1>`);
      }
    } else {
      // Render deployment or development - return JSON for API errors
      res.status(status).json({
        error: message,
        status: status,
        timestamp: new Date().toISOString()
      });
    }
  }
});

// ==============================
// Production Static File Serving
// ==============================
// NOTE: In Render deployment, frontend and backend are separate services
// Backend should NOT serve frontend files - this causes 404 errors
// Frontend is served by a separate Render service
if (process.env.NODE_ENV === "production" && process.env.RENDER === "true") {
  // Render deployment - backend only serves API
  console.log("🚀 Render deployment detected - backend serving API only");
} else if (process.env.NODE_ENV === "production") {
  // Local production build - serve frontend files
  console.log("🏠 Local production build - serving frontend files");
  app.use(express.static(path.join(__dirname, "../frontend/.next")))

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend", ".next", "index.html"))
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
    // Initialize PostgreSQL connection
    const { query } = require('./config/database-postgresql-only');
    await query('SELECT 1'); // Test connection
    isDbConnected = true;

    console.log('✅ PostgreSQL connection initialized');
    console.log(`   ${getDatabaseType()}: ✅ Connected`);
  } catch (error) {
    console.warn('⚠️ PostgreSQL connection failed:', error.message);
    console.warn('💡 Server will run in demo mode without database features');
    isDbConnected = false;
  }

  // Step 3: Initialize dependent services (with proper error handling)
  console.log('📋 Step 3: Initializing dependent services...');

  // Initialize data-sync service only if database is available
  if (isDbConnected) {
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

  // Step 5: Start the HTTP server
  console.log('📋 Step 5: Starting HTTP server...');

  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      const actualPort = server.address().port;
      console.log(`✅ Server running on port ${actualPort} in ${process.env.NODE_ENV} mode`);
      console.log("🎉 Server initialization complete! Ready to accept requests.");

      // Log service status
      console.log('\n📊 Service Status:');
      console.log(`   ${getDatabaseType()}: ${isDbConnected ? '✅ Connected' : '❌ Disconnected'}`);
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

