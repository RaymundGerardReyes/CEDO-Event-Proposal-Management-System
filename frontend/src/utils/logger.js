/**
 * Frontend Logger Utility - SIMPLIFIED VERSION
 * 
 * Purpose: Centralized logging system for frontend application
 * Approach: Simple, robust logging without console overrides to avoid conflicts
 */

// 🔧 LOG LEVELS: Define log levels for consistent categorization
export const LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    CRITICAL: 'critical'
};

// 🔧 LOG CATEGORIES: Categorize logs for better filtering and analysis
export const LOG_CATEGORIES = {
    AUTH: 'authentication',
    API: 'api',
    FORM: 'form',
    NAVIGATION: 'navigation',
    STATE: 'state',
    STORAGE: 'storage',
    UPLOAD: 'upload',
    DOM: 'dom',
    NETWORK: 'network',
    VALIDATION: 'validation',
    SYSTEM: 'system'
};

// 🔧 LOGGER CONFIGURATION: Simplified logger without console overrides
class Logger {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.isProduction = process.env.NODE_ENV === 'production';
        this.logQueue = [];
        this.isProcessing = false;
        this.maxQueueSize = 100;
        this.isInitialized = false;

        // Store original console methods before any overrides
        this.originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };
    }

    // 🔧 INITIALIZATION: Safe initialization
    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        // Only setup console overrides in development and only if not already overridden
        if (this.isDevelopment && typeof window !== 'undefined') {
            this.setupConsoleOverrides();
        }
    }

    // 🔧 CORE LOGGING METHODS: Main logging interface
    debug(message, data = {}, category = LOG_CATEGORIES.SYSTEM) {
        this.log(LOG_LEVELS.DEBUG, message, data, category);
    }

    info(message, data = {}, category = LOG_CATEGORIES.SYSTEM) {
        this.log(LOG_LEVELS.INFO, message, data, category);
    }

    warn(message, data = {}, category = LOG_CATEGORIES.SYSTEM) {
        this.log(LOG_LEVELS.WARN, message, data, category);
    }

    error(message, error = null, data = {}, category = LOG_CATEGORIES.SYSTEM) {
        this.log(LOG_LEVELS.ERROR, message, { ...data, error }, category);
    }

    critical(message, error = null, data = {}, category = LOG_CATEGORIES.SYSTEM) {
        this.log(LOG_LEVELS.CRITICAL, message, { ...data, error }, category);
    }

    // 🔧 MAIN LOG METHOD: Centralized logging logic
    log(level, message, data = {}, category = LOG_CATEGORIES.SYSTEM) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                category,
                data,
                url: typeof window !== 'undefined' ? window.location.href : 'server',
                userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
            };

            // Add to queue for processing
            this.addToQueue(logEntry);

            // Development: Immediate console output
            if (this.isDevelopment) {
                this.outputToConsole(logEntry);
            }

            // Production: Send to error reporting service
            if (this.isProduction && (level === LOG_LEVELS.ERROR || level === LOG_LEVELS.CRITICAL)) {
                this.sendToErrorReporting(logEntry);
            }
        } catch (err) {
            // Fallback to original console to avoid infinite loops
            this.originalConsole.error('Logger error:', err);
        }
    }

    // 🔧 QUEUE MANAGEMENT: Handle log queuing for performance
    addToQueue(logEntry) {
        try {
            this.logQueue.push(logEntry);

            // Prevent memory leaks by limiting queue size
            if (this.logQueue.length > this.maxQueueSize) {
                this.logQueue.shift();
            }

            // Process queue if not already processing
            if (!this.isProcessing) {
                this.processQueue();
            }
        } catch (err) {
            this.originalConsole.error('Queue error:', err);
        }
    }

    // 🔧 CONSOLE OVERRIDES: Safe console overrides
    setupConsoleOverrides() {
        if (typeof window === 'undefined') return;

        // Only override if not already overridden
        if (console.log.toString().includes('[LOGGER]')) return;

        // Use stored original console methods
        const originalConsole = this.originalConsole;

        // Safe override that doesn't cause infinite loops
        console.log = (...args) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            originalConsole.log(`[LOGGER] ${message}`);
            this.addToQueue({
                timestamp: new Date().toISOString(),
                level: LOG_LEVELS.INFO,
                message,
                category: LOG_CATEGORIES.SYSTEM,
                data: {},
                url: typeof window !== 'undefined' ? window.location.href : 'server',
                userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
            });
        };

        console.info = (...args) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            originalConsole.info(`[LOGGER] ${message}`);
            this.addToQueue({
                timestamp: new Date().toISOString(),
                level: LOG_LEVELS.INFO,
                message,
                category: LOG_CATEGORIES.SYSTEM,
                data: {},
                url: typeof window !== 'undefined' ? window.location.href : 'server',
                userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
            });
        };

        console.warn = (...args) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            originalConsole.warn(`[LOGGER] ${message}`);
            this.addToQueue({
                timestamp: new Date().toISOString(),
                level: LOG_LEVELS.WARN,
                message,
                category: LOG_CATEGORIES.SYSTEM,
                data: {},
                url: typeof window !== 'undefined' ? window.location.href : 'server',
                userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
            });
        };

        console.error = (...args) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            originalConsole.error(`[LOGGER] ${message}`);
            this.addToQueue({
                timestamp: new Date().toISOString(),
                level: LOG_LEVELS.ERROR,
                message,
                category: LOG_CATEGORIES.SYSTEM,
                data: {},
                url: typeof window !== 'undefined' ? window.location.href : 'server',
                userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
            });
        };

        console.debug = (...args) => {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            originalConsole.debug(`[LOGGER] ${message}`);
            this.addToQueue({
                timestamp: new Date().toISOString(),
                level: LOG_LEVELS.DEBUG,
                message,
                category: LOG_CATEGORIES.SYSTEM,
                data: {},
                url: typeof window !== 'undefined' ? window.location.href : 'server',
                userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server'
            });
        };
    }

    // 🔧 OUTPUT TO CONSOLE: Safe console output using stored original methods
    outputToConsole(logEntry) {
        try {
            const { level, message, data, category } = logEntry;
            const timestamp = new Date().toLocaleTimeString();
            const prefix = `[${timestamp}] [${category.toUpperCase()}]`;

            // Use stored original console methods to avoid circular references
            const originalConsole = this.originalConsole;

            switch (level) {
                case LOG_LEVELS.DEBUG:
                    originalConsole.debug(`${prefix} ${message}`, data);
                    break;
                case LOG_LEVELS.INFO:
                    originalConsole.info(`${prefix} ${message}`, data);
                    break;
                case LOG_LEVELS.WARN:
                    originalConsole.warn(`${prefix} ${message}`, data);
                    break;
                case LOG_LEVELS.ERROR:
                    originalConsole.error(`${prefix} ${message}`, data);
                    break;
                case LOG_LEVELS.CRITICAL:
                    originalConsole.error(`🚨 ${prefix} ${message}`, data);
                    break;
                default:
                    originalConsole.log(`${prefix} ${message}`, data);
            }
        } catch (err) {
            // Fallback to original console
            this.originalConsole.error('Logger output error:', err);
        }
    }

    // 🔧 QUEUE PROCESSING: Process log queue
    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        try {
            while (this.logQueue.length > 0) {
                const logEntry = this.logQueue.shift();
                await this.processLogEntry(logEntry);
            }
        } catch (err) {
            this.originalConsole.error('Queue processing error:', err);
        } finally {
            this.isProcessing = false;
        }
    }

    // 🔧 LOG ENTRY PROCESSING: Process individual log entries
    async processLogEntry(logEntry) {
        try {
            if (this.isProduction) {
                await this.handleProductionLog(logEntry);
            }
        } catch (err) {
            this.originalConsole.error('Log entry processing error:', err);
        }
    }

    // 🔧 PRODUCTION LOG HANDLING: Handle production logs
    async handleProductionLog(logEntry) {
        try {
            if (logEntry.level === LOG_LEVELS.ERROR || logEntry.level === LOG_LEVELS.CRITICAL) {
                await this.sendToErrorReporting(logEntry);
            }
        } catch (err) {
            this.originalConsole.error('Production log handling error:', err);
        }
    }

    // 🔧 ERROR REPORTING: Send errors to reporting service
    async sendToErrorReporting(logEntry) {
        try {
            // Placeholder for error reporting service integration
            // In production, this would send to Sentry, LogRocket, etc.
            this.originalConsole.error('Error reporting:', logEntry);
        } catch (err) {
            this.originalConsole.error('Error reporting failed:', err);
        }
    }

    // 🔧 UTILITY METHODS: Helper methods for common logging patterns
    logApiCall(url, method, status, duration, data = {}) {
        const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
        const message = `${method} ${url} - ${status} (${duration}ms)`;

        this.log(level, message, {
            url,
            method,
            status,
            duration,
            ...data
        }, LOG_CATEGORIES.API);
    }

    logFormAction(action, formData = {}, data = {}) {
        this.info(`Form ${action}`, {
            action,
            formData,
            ...data
        }, LOG_CATEGORIES.FORM);
    }

    logNavigation(from, to, data = {}) {
        this.info(`Navigation: ${from} → ${to}`, {
            from,
            to,
            ...data
        }, LOG_CATEGORIES.NAVIGATION);
    }

    logStateChange(component, state, data = {}) {
        this.debug(`State change in ${component}`, {
            component,
            state,
            ...data
        }, LOG_CATEGORIES.STATE);
    }

    logStorageAction(action, key, data = {}) {
        this.debug(`Storage ${action}: ${key}`, {
            action,
            key,
            ...data
        }, LOG_CATEGORIES.STORAGE);
    }

    logAuthAction(action, data = {}) {
        this.info(`Auth ${action}`, {
            action,
            ...data
        }, LOG_CATEGORIES.AUTH);
    }

    logNetworkError(error, context = {}) {
        this.error('Network error', error, context, LOG_CATEGORIES.NETWORK);
    }

    logValidationError(field, value, message, data = {}) {
        this.warn(`Validation error for ${field}`, {
            field,
            value,
            message,
            ...data
        }, LOG_CATEGORIES.VALIDATION);
    }

    logDomError(error, context = {}) {
        this.error('DOM error', error, context, LOG_CATEGORIES.DOM);
    }
}

// 🔧 SINGLETON INSTANCE: Create and export singleton logger instance
const logger = new Logger();

// Initialize logger when module is loaded
if (typeof window !== 'undefined') {
    // Initialize on next tick to avoid initialization issues
    setTimeout(() => logger.initialize(), 0);
}

export default logger;

