/**
 * Custom Logging Utility
 * Environment-aware logging with consistent formatting
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Log categories for structured logging
export const LOG_CATEGORIES = {
    API: 'API',
    AUTH: 'AUTH',
    DOM: 'DOM',
    NAVIGATION: 'NAVIGATION',
    SYSTEM: 'SYSTEM',
    USER: 'USER',
    COMPONENT: 'COMPONENT',
    HOOK: 'HOOK',
    PERFORMANCE: 'PERFORMANCE',
    ERROR: 'ERROR',
    NETWORK: 'NETWORK',
    VALIDATION: 'VALIDATION',
    UPLOAD: 'UPLOAD',
    STORAGE: 'STORAGE',
    STATE: 'STATE'
};

const logger = {
    log: (message, ...optionalParams) => {
        if (isDevelopment) {
            console.log(`[LOG] ${message}`, ...optionalParams);
        }
    },

    info: (message, data = {}, category = LOG_CATEGORIES.SYSTEM) => {
        if (isDevelopment) {
            console.log(`[INFO] [${category}] ${message}`, data);
        }
    },

    debug: (message, ...optionalParams) => {
        if (isDevelopment) {
            console.log(`[DEBUG] ${message}`, ...optionalParams);
        }
    },

    warn: (message, data = {}, category = LOG_CATEGORIES.SYSTEM) => {
        if (isDevelopment) {
            console.warn(`[WARN] [${category}] ${message}`, data);
        }
    },

    error: (message, error = null, ...optionalParams) => {
        console.error(`[ERROR] ${message}`, ...optionalParams);

        if (error) {
            console.error('Error details:', error);
        }
    },

    api: {
        request: (method, url, data = null) => {
            if (isDevelopment) {
                console.log(`[API REQUEST] ${method.toUpperCase()} ${url}`, data ? { data } : '');
            }
        },

        response: (method, url, status, data = null) => {
            if (isDevelopment) {
                console.log(`[API RESPONSE] ${method.toUpperCase()} ${url} - ${status}`, data ? { data } : '');
            }
        },

        error: (method, url, error) => {
            console.error(`[API ERROR] ${method.toUpperCase()} ${url}`, error);
        }
    }
};

// Override console methods for production security
if (isProduction) {
    console.log = function () { };
    console.warn = function () { };
} else {
    console.log = console.log;
    console.warn = console.warn;
    console.error = console.error;
}

export default logger;