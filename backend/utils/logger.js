/**
 * Enhanced Logger Utility
 *
 * Purpose: Centralized logging system for backend application with error categorization
 * Approach: Winston-based logging with request tracking, error categorization, and production monitoring
 *
 * @module utils/logger
 * @requires winston
 */

const winston = require("winston")
const path = require("path")

// 🔧 LOG LEVELS: Define log levels for consistent categorization
const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    CRITICAL: 'critical'
};

// 🔧 LOG CATEGORIES: Categorize logs for better filtering and analysis
const LOG_CATEGORIES = {
    AUTH: 'authentication',
    API: 'api',
    DATABASE: 'database',
    VALIDATION: 'validation',
    FILE: 'file',
    EMAIL: 'email',
    SYSTEM: 'system',
    SECURITY: 'security',
    PERFORMANCE: 'performance'
};

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
)

// Create logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: logFormat,
    defaultMeta: { service: "cedo-api" },
    transports: [
        // Write logs to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(
                    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? "\n" + info.stack : ""}`,
                ),
            ),
        }),

        // Write all logs to file
        new winston.transports.File({
            filename: path.join(__dirname, "../logs/error.log"),
            level: "error",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: path.join(__dirname, "../logs/combined.log"),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
})

// 🔧 ENHANCED LOGGING METHODS: Categorized logging methods
logger.debug = (message, data = {}, category = LOG_CATEGORIES.SYSTEM) => {
    logger.log('debug', message, { ...data, category });
};

logger.info = (message, data = {}, category = LOG_CATEGORIES.SYSTEM) => {
    logger.log('info', message, { ...data, category });
};

logger.warn = (message, data = {}, category = LOG_CATEGORIES.SYSTEM) => {
    logger.log('warn', message, { ...data, category });
};

logger.error = (message, error = null, data = {}, category = LOG_CATEGORIES.SYSTEM) => {
    logger.log('error', message, {
        ...data,
        category,
        error: error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : null
    });
};

logger.critical = (message, error = null, data = {}, category = LOG_CATEGORIES.SYSTEM) => {
    logger.log('error', `🚨 CRITICAL: ${message}`, {
        ...data,
        category,
        severity: 'critical',
        error: error ? {
            message: error.message,
            stack: error.stack,
            name: error.name
        } : null
    });
};

// 🔧 CATEGORIZED LOGGING METHODS: Specialized logging for different areas
logger.auth = (action, data = {}) => {
    logger.info(`Auth ${action}`, { action, ...data }, LOG_CATEGORIES.AUTH);
};

logger.api = (method, url, status, duration, data = {}) => {
    const level = status >= 400 ? 'error' : 'info';
    const message = `${method} ${url} - ${status} (${duration}ms)`;
    logger.log(level, message, {
        method,
        url,
        status,
        duration,
        ...data
    }, LOG_CATEGORIES.API);
};

logger.database = (action, data = {}) => {
    logger.debug(`Database ${action}`, { action, ...data }, LOG_CATEGORIES.DATABASE);
};

logger.validation = (field, value, message, data = {}) => {
    logger.warn(`Validation error: ${field}`, {
        field,
        value,
        message,
        ...data
    }, LOG_CATEGORIES.VALIDATION);
};

logger.file = (action, filename, data = {}) => {
    logger.info(`File ${action}: ${filename}`, {
        action,
        filename,
        ...data
    }, LOG_CATEGORIES.FILE);
};

logger.email = (action, recipient, data = {}) => {
    logger.info(`Email ${action}`, {
        action,
        recipient,
        ...data
    }, LOG_CATEGORIES.EMAIL);
};

logger.security = (event, data = {}) => {
    logger.warn(`Security event: ${event}`, {
        event,
        ...data
    }, LOG_CATEGORIES.SECURITY);
};

logger.performance = (operation, duration, data = {}) => {
    const level = duration > 1000 ? 'warn' : 'debug';
    logger.log(level, `${operation} took ${duration}ms`, {
        operation,
        duration,
        ...data
    }, LOG_CATEGORIES.PERFORMANCE);
};

// 🔧 REQUEST LOGGING MIDDLEWARE: Enhanced request logging with categorization
logger.requestLogger = (req, res, next) => {
    const start = Date.now()

    res.on("finish", () => {
        const duration = Date.now() - start
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`

        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration,
            ip: req.ip,
            userId: req.user?.id,
            userAgent: req.get('User-Agent'),
            referer: req.get('Referer')
        };

        if (res.statusCode >= 400) {
            logger.warn(message, logData, LOG_CATEGORIES.API);
        } else {
            logger.info(message, logData, LOG_CATEGORIES.API);
        }
    })

    next()
}

// 🔧 ERROR LOGGING MIDDLEWARE: Enhanced error logging
logger.errorLogger = (err, req, res, next) => {
    const errorData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userId: req.user?.id,
        userAgent: req.get('User-Agent'),
        body: req.body,
        query: req.query,
        params: req.params
    };

    // Categorize errors based on type
    let category = LOG_CATEGORIES.SYSTEM;
    if (err.name === 'ValidationError') {
        category = LOG_CATEGORIES.VALIDATION;
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        category = LOG_CATEGORIES.AUTH;
    } else if (err.code && err.code.startsWith('ER_')) {
        category = LOG_CATEGORIES.DATABASE;
    }

    logger.error(`Request error: ${err.message}`, err, errorData, category);
    next(err);
};

// 🔧 SECURITY LOGGING: Log security-related events
logger.securityEvent = (event, details = {}) => {
    logger.warn(`Security event: ${event}`, {
        event,
        timestamp: new Date().toISOString(),
        ...details
    }, LOG_CATEGORIES.SECURITY);
};

// 🔧 PERFORMANCE LOGGING: Log performance metrics
logger.performanceMetric = (operation, duration, metadata = {}) => {
    const level = duration > 5000 ? 'warn' : duration > 1000 ? 'info' : 'debug';
    logger.log(level, `${operation} completed in ${duration}ms`, {
        operation,
        duration,
        ...metadata
    }, LOG_CATEGORIES.PERFORMANCE);
};

// 🔧 DATABASE LOGGING: Log database operations
logger.databaseOperation = (operation, table, duration, metadata = {}) => {
    logger.debug(`Database ${operation} on ${table}`, {
        operation,
        table,
        duration,
        ...metadata
    }, LOG_CATEGORIES.DATABASE);
};

// 🔧 VALIDATION LOGGING: Log validation errors
logger.validationError = (field, value, message, context = {}) => {
    logger.warn(`Validation failed: ${field}`, {
        field,
        value,
        message,
        ...context
    }, LOG_CATEGORIES.VALIDATION);
};

module.exports = logger
