/**
 * Centralized Logging Configuration
 * Reduces redundant logs and improves performance
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const currentLogLevel = process.env.LOG_LEVEL ?
    LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] :
    (process.env.NODE_ENV === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.INFO);

// Rate limiting for repeated logs
const logRateLimit = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_LOGS_PER_WINDOW = 5;

/**
 * Rate-limited logging to prevent spam
 */
function rateLimitedLog(key, logFn, message, ...args) {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Clean old entries
    for (const [k, timestamps] of logRateLimit.entries()) {
        logRateLimit.set(k, timestamps.filter(t => t > windowStart));
        if (logRateLimit.get(k).length === 0) {
            logRateLimit.delete(k);
        }
    }

    // Check rate limit
    const timestamps = logRateLimit.get(key) || [];
    if (timestamps.length >= MAX_LOGS_PER_WINDOW) {
        return; // Skip this log
    }

    // Add timestamp and log
    timestamps.push(now);
    logRateLimit.set(key, timestamps);
    logFn(message, ...args);
}

/**
 * Smart logger that reduces redundancy
 */
const logger = {
    error: (message, ...args) => {
        if (currentLogLevel >= LOG_LEVELS.ERROR) {
            console.error(`❌ ${message}`, ...args);
        }
    },

    warn: (message, ...args) => {
        if (currentLogLevel >= LOG_LEVELS.WARN) {
            console.warn(`⚠️ ${message}`, ...args);
        }
    },

    info: (message, ...args) => {
        if (currentLogLevel >= LOG_LEVELS.INFO) {
            console.log(`ℹ️ ${message}`, ...args);
        }
    },

    debug: (message, ...args) => {
        if (currentLogLevel >= LOG_LEVELS.DEBUG) {
            console.log(`🔍 ${message}`, ...args);
        }
    },

    // Rate-limited versions
    errorRateLimited: (key, message, ...args) => {
        rateLimitedLog(key, logger.error, message, ...args);
    },

    warnRateLimited: (key, message, ...args) => {
        rateLimitedLog(key, logger.warn, message, ...args);
    },

    infoRateLimited: (key, message, ...args) => {
        rateLimitedLog(key, logger.info, message, ...args);
    },

    // Request logging with smart filtering
    request: (req, res, next) => {
        const start = Date.now();

        // Only log certain types of requests
        const shouldLog =
            req.method !== 'GET' ||
            req.path.includes('admin') ||
            req.path.includes('auth') ||
            req.path.includes('proposals') ||
            req.query.debug === 'true';

        if (shouldLog && currentLogLevel >= LOG_LEVELS.INFO) {
            console.log(`📥 ${req.method} ${req.path}`);
        }

        // Log response time for slow requests
        res.on('finish', () => {
            const duration = Date.now() - start;
            if (duration > 1000) { // Log slow requests (>1s)
                logger.warnRateLimited(
                    `slow_${req.path}`,
                    `Slow request: ${req.method} ${req.path} took ${duration}ms`
                );
            }
        });

        next();
    },

    // Database query logging
    query: (sql, params, duration) => {
        if (duration > 100) { // Only log slow queries
            logger.warnRateLimited(
                'slow_query',
                `Slow query (${duration}ms):`,
                sql.substring(0, 100) + (sql.length > 100 ? '...' : '')
            );
        }
    },

    // Auth logging (much less verbose)
    auth: {
        success: (userId, role) => {
            // Only log admin auths and first auth of the day per user
            const today = new Date().toDateString();
            const key = `auth_${userId}_${today}`;

            if (role === 'admin' || !logRateLimit.has(key)) {
                logger.infoRateLimited(key, `🔐 Auth: ${userId} (${role})`);
            }
        },

        failure: (reason, userId = 'unknown') => {
            logger.warnRateLimited(`auth_fail_${userId}`, `🔐 Auth failed: ${reason}`);
        }
    }
};

/**
 * Proposal operation logging (reduced verbosity)
 */
const proposalLogger = {
    created: (proposalId, userId) => {
        logger.info(`📝 Proposal created: ${proposalId} by user ${userId}`);
    },

    updated: (proposalId, field, oldValue, newValue) => {
        if (field === 'status' || field === 'proposal_status') {
            logger.info(`📋 Proposal ${proposalId} status: ${oldValue} → ${newValue}`);
        } else {
            logger.debug(`📝 Proposal ${proposalId} updated: ${field}`);
        }
    },

    fetched: (proposalId, method = 'unknown') => {
        // Only log if it's not a routine fetch
        if (method !== 'routine') {
            logger.debug(`📋 Proposal ${proposalId} fetched via ${method}`);
        }
    },

    error: (proposalId, operation, error) => {
        logger.error(`💥 Proposal ${proposalId} ${operation} failed:`, error.message);
    }
};

module.exports = {
    logger,
    proposalLogger,
    LOG_LEVELS,
    currentLogLevel
};
