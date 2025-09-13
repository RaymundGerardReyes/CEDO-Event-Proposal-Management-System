/**
 * Optimized Authentication Middleware
 * Reduces log verbosity while maintaining security
 */

const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Cache for recently validated users (simple in-memory cache)
const userCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Helper to create standardized errors
 */
function createError(message, status = 401) {
    const error = new Error(message);
    error.status = status;
    return error;
}

/**
 * Optimized token validation middleware with reduced logging
 */
const validateTokenOptimized = async (req, res, next) => {
    const startTime = Date.now();

    try {
        // Quick API key check (admin bypass)
        const apiKey = req.headers["x-api-key"];
        if (apiKey === process.env.ADMIN_API_KEY) {
            req.user = {
                id: "api-key-admin",
                role: "admin",
                is_approved: true,
            };
            return next();
        }

        // Extract token
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return next(createError("No token provided"));
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return next(createError("Invalid token format"));
        }

        // JWT verification
        const jwtSecret = process.env.JWT_SECRET_DEV || process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('❌ JWT secret not configured');
            return next(createError("Server configuration error", 500));
        }

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            // Only log unexpected JWT errors
            if (err.name !== "TokenExpiredError" && err.name !== "JsonWebTokenError") {
                console.warn('🔐 Unexpected JWT error:', err.message);
            }
            const msg = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
            return next(createError(msg));
        }

        // Extract user ID
        const userId = decoded.userId || decoded.id || (decoded.user && decoded.user.id);
        if (!userId) {
            return next(createError("Invalid token payload"));
        }

        // Check cache first
        const cacheKey = `user_${userId}`;
        const cached = userCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            req.user = cached.user;
            return next();
        }

        // Database query (only if not cached)
        const [users] = await pool.query(
            "SELECT id, email, role, name, organization, organization_type, avatar, is_approved FROM users WHERE id = ?",
            [userId]
        );

        if (!users.length) {
            // Clear cache for this user
            userCache.delete(cacheKey);

            // Only log this occasionally to avoid spam
            const now = Date.now();
            const lastLogKey = `user_not_found_${userId}`;
            const lastLog = userCache.get(lastLogKey);

            if (!lastLog || (now - lastLog) > 60000) { // Log once per minute max
                console.warn('🔐 User not found in database:', userId);
                userCache.set(lastLogKey, now);
            }

            const error = createError("User account not found. Please sign in again.");
            error.code = "USER_NOT_FOUND";
            return next(error);
        }

        const user = users[0];

        if (!user.is_approved) {
            return next(createError("Account not approved"));
        }

        // Cache the user
        userCache.set(cacheKey, {
            user,
            timestamp: Date.now()
        });

        req.user = user;

        // Only log slow requests or errors
        const duration = Date.now() - startTime;
        if (duration > 100) { // Only log if auth takes more than 100ms
            console.warn(`🐌 Slow auth for user ${userId}: ${duration}ms`);
        }

        next();
    } catch (err) {
        console.error('💥 Auth middleware error:', err.message);
        return next(createError("Authentication failed", 500));
    }
};

/**
 * Clean up expired cache entries periodically
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of userCache.entries()) {
        if (typeof value === 'object' && value.timestamp && (now - value.timestamp) > CACHE_DURATION) {
            userCache.delete(key);
        } else if (typeof value === 'number' && (now - value) > 60000) {
            // Clean up log timestamps older than 1 minute
            userCache.delete(key);
        }
    }
}, 60000); // Clean every minute

/**
 * Development logging middleware (separate from auth)
 */
const developmentLogger = (req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        // Only log interesting requests, not every single one
        const isInteresting =
            req.method !== 'GET' ||
            req.path.includes('admin') ||
            req.path.includes('auth') ||
            req.query.debug === 'true';

        if (isInteresting) {
            console.log(`🔍 ${req.method} ${req.path} - User: ${req.user?.email || 'anonymous'} (${req.user?.role || 'no-role'})`);
        }
    }
    next();
};

module.exports = {
    validateToken: validateTokenOptimized,
    developmentLogger,
    clearUserCache: (userId) => {
        if (userId) {
            userCache.delete(`user_${userId}`);
        } else {
            userCache.clear();
        }
    }
};
