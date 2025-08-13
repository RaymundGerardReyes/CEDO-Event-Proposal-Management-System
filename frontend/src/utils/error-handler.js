/**
 * Error Handler Utility
 * 
 * Purpose: Centralized error classification and handling system
 * Approach: Comprehensive error categorization with recovery strategies
 */

import logger, { LOG_CATEGORIES } from './logger.js';

// 🔧 ERROR TYPES: Comprehensive error categorization
export const ERROR_TYPES = {
    NETWORK: 'network',
    VALIDATION: 'validation',
    AUTHENTICATION: 'authentication',
    AUTHORIZATION: 'authorization',
    STATE_MACHINE: 'state_machine',
    FORM_PERSISTENCE: 'form_persistence',
    FILE_UPLOAD: 'file_upload',
    DOM_MANIPULATION: 'dom_manipulation',
    API_ERROR: 'api_error',
    UNKNOWN: 'unknown'
};

// 🔧 ERROR SEVERITY: Error severity levels for prioritization
export const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// 🔧 ERROR CLASSIFICATION: Categorize errors based on message, name, and context
export function classifyError(error) {
    if (!error) return ERROR_TYPES.UNKNOWN;

    const message = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';

    // Network errors
    if (message.includes('network') ||
        message.includes('fetch') ||
        message.includes('connection') ||
        message.includes('timeout') ||
        name.includes('network') ||
        stack.includes('fetch') ||
        stack.includes('xmlhttprequest')) {
        return ERROR_TYPES.NETWORK;
    }

    // Validation errors
    if (message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('required') ||
        message.includes('format') ||
        name.includes('validation') ||
        name.includes('typeerror')) {
        return ERROR_TYPES.VALIDATION;
    }

    // Authentication errors
    if (message.includes('auth') ||
        message.includes('token') ||
        message.includes('unauthorized') ||
        message.includes('forbidden') ||
        name.includes('auth')) {
        return ERROR_TYPES.AUTHENTICATION;
    }

    // Authorization errors
    if (message.includes('permission') ||
        message.includes('access denied') ||
        message.includes('insufficient privileges')) {
        return ERROR_TYPES.AUTHORIZATION;
    }

    // DOM manipulation errors
    if (message.includes('removechild') ||
        message.includes('appendchild') ||
        message.includes('not found') ||
        message.includes('null reference') ||
        name.includes('typeerror') ||
        stack.includes('dom')) {
        return ERROR_TYPES.DOM_MANIPULATION;
    }

    // File upload errors
    if (message.includes('file') ||
        message.includes('upload') ||
        message.includes('size') ||
        message.includes('format')) {
        return ERROR_TYPES.FILE_UPLOAD;
    }

    // API errors
    if (message.includes('api') ||
        message.includes('server') ||
        message.includes('500') ||
        message.includes('400') ||
        message.includes('404')) {
        return ERROR_TYPES.API_ERROR;
    }

    // State machine errors
    if (message.includes('state') ||
        message.includes('transition') ||
        message.includes('invalid state')) {
        return ERROR_TYPES.STATE_MACHINE;
    }

    // Form persistence errors
    if (message.includes('form') ||
        message.includes('persist') ||
        message.includes('storage')) {
        return ERROR_TYPES.FORM_PERSISTENCE;
    }

    return ERROR_TYPES.UNKNOWN;
}

// 🔧 ERROR HANDLING: Centralized error handling with recovery strategies
export function handleError(error, context = {}) {
    const errorType = classifyError(error);
    const severity = determineSeverity(error, errorType);

    const errorInfo = {
        type: errorType,
        severity,
        message: error.message || 'Unknown error',
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        context: {
            boundary: context.boundary || 'unknown',
            component: context.component || 'unknown',
            ...context
        }
    };

    // Log the error with appropriate category
    logger.error(`Error handled: ${errorInfo.message}`, error, {
        errorType: errorInfo.type,
        severity: errorInfo.severity,
        context: errorInfo.context
    }, getLogCategory(errorType));

    // Apply recovery strategies based on error type
    applyRecoveryStrategy(errorInfo);

    return errorInfo;
}

// 🔧 SEVERITY DETERMINATION: Determine error severity based on type and context
function determineSeverity(error, errorType) {
    // Critical errors that require immediate attention
    if (errorType === ERROR_TYPES.AUTHENTICATION &&
        error.message?.includes('token expired')) {
        return ERROR_SEVERITY.CRITICAL;
    }

    // High severity errors
    if (errorType === ERROR_TYPES.NETWORK ||
        errorType === ERROR_TYPES.API_ERROR ||
        errorType === ERROR_TYPES.AUTHENTICATION) {
        return ERROR_SEVERITY.HIGH;
    }

    // Medium severity errors
    if (errorType === ERROR_TYPES.VALIDATION ||
        errorType === ERROR_TYPES.DOM_MANIPULATION ||
        errorType === ERROR_TYPES.FILE_UPLOAD) {
        return ERROR_SEVERITY.MEDIUM;
    }

    // Low severity errors
    if (errorType === ERROR_TYPES.FORM_PERSISTENCE ||
        errorType === ERROR_TYPES.STATE_MACHINE) {
        return ERROR_SEVERITY.LOW;
    }

    return ERROR_SEVERITY.MEDIUM;
}

// 🔧 LOG CATEGORY MAPPING: Map error types to logger categories
function getLogCategory(errorType) {
    const categoryMap = {
        [ERROR_TYPES.NETWORK]: LOG_CATEGORIES.NETWORK,
        [ERROR_TYPES.AUTHENTICATION]: LOG_CATEGORIES.AUTH,
        [ERROR_TYPES.VALIDATION]: LOG_CATEGORIES.VALIDATION,
        [ERROR_TYPES.DOM_MANIPULATION]: LOG_CATEGORIES.DOM,
        [ERROR_TYPES.API_ERROR]: LOG_CATEGORIES.API,
        [ERROR_TYPES.FILE_UPLOAD]: LOG_CATEGORIES.UPLOAD,
        [ERROR_TYPES.FORM_PERSISTENCE]: LOG_CATEGORIES.STORAGE,
        [ERROR_TYPES.STATE_MACHINE]: LOG_CATEGORIES.STATE
    };

    return categoryMap[errorType] || LOG_CATEGORIES.SYSTEM;
}

// 🔧 RECOVERY STRATEGIES: Apply appropriate recovery strategies
function applyRecoveryStrategy(errorInfo) {
    switch (errorInfo.type) {
        case ERROR_TYPES.DOM_MANIPULATION:
            applyDomErrorRecovery(errorInfo);
            break;
        case ERROR_TYPES.AUTHENTICATION:
            applyAuthErrorRecovery(errorInfo);
            break;
        case ERROR_TYPES.NETWORK:
            applyNetworkErrorRecovery(errorInfo);
            break;
        case ERROR_TYPES.VALIDATION:
            applyValidationErrorRecovery(errorInfo);
            break;
        default:
            applyGenericErrorRecovery(errorInfo);
    }
}

// 🔧 DOM ERROR HANDLING: Handle DOM manipulation errors
function applyDomErrorRecovery(errorInfo) {
    logger.info('Applying DOM error recovery strategy', {
        errorType: errorInfo.type,
        recovery: 'dom-cleanup'
    }, LOG_CATEGORIES.DOM);

    // Clean up Google Sign-In related DOM elements
    if (typeof window !== 'undefined') {
        try {
            const googleContainers = document.querySelectorAll('[data-google-signin-container="true"]');
            googleContainers.forEach(container => {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            });

            const googleElements = document.querySelectorAll('[id*="google-signin"]');
            googleElements.forEach(element => {
                if (element.parentNode && element.id.includes('isolated')) {
                    element.parentNode.removeChild(element);
                }
            });

            logger.info('DOM cleanup completed', {
                containersRemoved: googleContainers.length,
                elementsRemoved: googleElements.length
            }, LOG_CATEGORIES.DOM);
        } catch (cleanupError) {
            logger.warn('Error during DOM cleanup:', {
                cleanupError: cleanupError.message,
                originalError: errorInfo.message
            }, LOG_CATEGORIES.DOM);
        }
    }
}

// 🔧 AUTH ERROR HANDLING: Handle authentication errors
function applyAuthErrorRecovery(errorInfo) {
    logger.info('Applying authentication error recovery strategy', {
        errorType: errorInfo.type,
        recovery: 'auth-redirect'
    }, LOG_CATEGORIES.AUTH);

    // Redirect to login page for authentication errors
    if (typeof window !== 'undefined' &&
        errorInfo.message?.includes('token expired')) {
        setTimeout(() => {
            window.location.href = '/auth/sign-in';
        }, 2000);
    }
}

// 🔧 NETWORK ERROR HANDLING: Handle network errors
function applyNetworkErrorRecovery(errorInfo) {
    logger.info('Applying network error recovery strategy', {
        errorType: errorInfo.type,
        recovery: 'retry-strategy'
    }, LOG_CATEGORIES.NETWORK);

    // Could implement retry logic here
    // For now, just log the error
}

// 🔧 VALIDATION ERROR HANDLING: Handle validation errors
function applyValidationErrorRecovery(errorInfo) {
    logger.info('Applying validation error recovery strategy', {
        errorType: errorInfo.type,
        recovery: 'user-notification'
    }, LOG_CATEGORIES.VALIDATION);

    // Could show user-friendly error messages here
}

// 🔧 GENERIC ERROR HANDLING: Handle unknown or generic errors
function applyGenericErrorRecovery(errorInfo) {
    logger.info('Applying generic error recovery strategy', {
        errorType: errorInfo.type,
        recovery: 'fallback'
    }, LOG_CATEGORIES.SYSTEM);
}

// 🔧 SPECIALIZED ERROR HANDLERS: Specific error type handlers
export function handleApiError(error, context = {}) {
    return handleError(error, { ...context, boundary: 'api' });
}

export function handleDomError(error, context = {}) {
    return handleError(error, { ...context, boundary: 'dom' });
}

export function handleNetworkError(error, context = {}) {
    return handleError(error, { ...context, boundary: 'network' });
}

export function handleValidationError(error, context = {}) {
    return handleError(error, { ...context, boundary: 'validation' });
}

// 🔧 ERROR LOGGING: Simplified error logging
export function logError(error, context = {}) {
    const errorInfo = handleError(error, context);
    return errorInfo;
}

// 🔧 RETRY UTILITY: Retry function with exponential backoff
export async function withRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (attempt === maxRetries) {
                logger.error(`Function failed after ${maxRetries} attempts`, error, {
                    attempts: attempt,
                    maxRetries
                }, LOG_CATEGORIES.SYSTEM);
                throw error;
            }

            const waitTime = delay * Math.pow(2, attempt - 1);
            logger.warn(`Function failed, retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})`, {
                error: error.message,
                attempt,
                maxRetries,
                waitTime
            }, LOG_CATEGORIES.SYSTEM);

            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    throw lastError;
}
