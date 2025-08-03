const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Performance monitoring middleware - Single responsibility principle
const performanceMonitor = (req, res, next) => {
    try {
        const startTime = Date.now();
        req.startTime = startTime;

        // Hook into response finish event
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const size = res.get('Content-Length') || 0;

            // Log slow requests (>1000ms)
            if (duration > 1000) {
                console.warn(`🐌 Slow request: ${req.method} ${req.originalUrl} - ${duration}ms`);
            }

            // Add performance headers
            res.set('X-Response-Time', `${duration}ms`);
            res.set('X-Content-Size', size);
        });

        next();
    } catch (error) {
        next(error);
    }
};

// Compression middleware with optimized settings - Named function for clarity
const createCompressionMiddleware = () => {
    return compression({
        level: 6, // Compression level (1-9, 6 is optimal balance)
        threshold: 1024, // Only compress files larger than 1KB
        filter: (req, res) => {
            // Don't compress if the request includes a cache-busting query parameter
            if (req.headers['x-no-compression']) {
                return false;
            }

            // Fallback to standard filter function
            return compression.filter(req, res);
        }
    });
};

// Rate limiting configurations - Using named functions
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: message,
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// Different rate limits for different endpoints
const rateLimiters = {
    // General API rate limit
    general: createRateLimit(
        15 * 60 * 1000, // 15 minutes
        process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 requests per 15 minutes in production
        'Too many requests from this IP, please try again later.'
    ),

    // Auth endpoints (stricter)
    auth: createRateLimit(
        15 * 60 * 1000, // 15 minutes
        5, // 5 attempts per 15 minutes
        'Too many authentication attempts, please try again later.'
    ),

    // File upload endpoints (very strict)
    upload: createRateLimit(
        60 * 60 * 1000, // 1 hour
        10, // 10 uploads per hour
        'Upload limit exceeded, please try again later.'
    ),

    // Search/query endpoints (moderate)
    search: createRateLimit(
        1 * 60 * 1000, // 1 minute
        30, // 30 searches per minute
        'Search rate limit exceeded, please slow down.'
    ),

    // Data fetching for tables (more lenient)
    table: createRateLimit(
        1 * 60 * 1000, // 1 minute
        200, // 200 requests per minute
        'Too many data requests, please wait a moment.'
    )
};

// Cache control middleware - Named function
const createCacheControl = (maxAge = 3600) => {
    return (req, res, next) => {
        try {
            if (req.method === 'GET') {
                res.set('Cache-Control', `public, max-age=${maxAge}`);
                res.set('ETag', `"${Date.now()}"`);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Security and performance headers - Named function
const createSecurityHeaders = () => {
    return helmet({
        // Content Security Policy
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                scriptSrc: ["'self'"],
                connectSrc: ["'self'", process.env.FRONTEND_URL || "http://localhost:3000"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
            },
        },

        // Cross-Origin policies
        crossOriginEmbedderPolicy: false, // Disable for Google OAuth compatibility
        crossOriginResourcePolicy: { policy: "cross-origin" },

        // Security headers
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },

        // Remove potentially sensitive headers
        hidePoweredBy: true,

        // DNS prefetch control
        dnsPrefetchControl: { allow: true },

        // Frame options
        frameguard: { action: 'deny' },

        // MIME type sniffing
        noSniff: true,

        // XSS Protection
        xssFilter: true,
    });
};

// Request size limiting - Named function with error handling
const createRequestSizeLimit = (limit = '10mb') => {
    return (req, res, next) => {
        try {
            req.on('data', (chunk) => {
                const size = Buffer.byteLength(chunk);
                if (size > limit) {
                    return res.status(413).json({
                        error: 'Request entity too large',
                        maxSize: limit
                    });
                }
            });
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Database connection health check middleware - Named function
const createDbHealthCheck = () => {
    return (req, res, next) => {
        try {
            // Skip health check for non-critical routes
            if (req.path === '/health' || req.path === '/api/health') {
                return next();
            }

            // You can add database connection validation here if needed
            next();
        } catch (error) {
            next(error);
        }
    };
};

// Performance optimization bundle - Centralized exports
const performanceBundle = {
    // Core performance middlewares
    compression: createCompressionMiddleware(),
    monitor: performanceMonitor,
    security: createSecurityHeaders(),

    // Rate limiting
    rateLimiters,

    // Caching
    cache: createCacheControl,

    // Request handling
    requestSize: createRequestSizeLimit,
    dbHealth: createDbHealthCheck(),

    // Utility functions
    logPerformance: (label, startTime) => {
        try {
            const duration = Date.now() - startTime;
            if (duration > 100) {
                console.log(`⚡ ${label}: ${duration}ms`);
            }
        } catch (error) {
            console.error('Error in logPerformance:', error);
        }
    },

    // Memory usage monitoring
    memoryUsage: () => {
        try {
            const used = process.memoryUsage();
            return {
                rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
                heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
                heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
                external: Math.round(used.external / 1024 / 1024 * 100) / 100,
            };
        } catch (error) {
            console.error('Error in memoryUsage:', error);
            return { error: 'Unable to get memory usage' };
        }
    }
};

module.exports = performanceBundle; 