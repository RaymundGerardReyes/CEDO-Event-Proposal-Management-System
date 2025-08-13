/**
 * Error Handling Utilities for Event Submission Flow
 * 
 * Purpose: Centralized error handling for hooks and components
 * Key approaches: Error classification, logging, recovery mechanisms,
 * and cleanup management
 */

import logger from '@/utils/logger';

/**
 * handleHookError - Comprehensive hook error handling utility
 * 
 * @param {Error|null} error - The error object to handle
 * @param {Function|null} resetFunction - Function to call for recovery
 * @param {string} componentName - Optional component name for context
 * @returns {Function} Cleanup function to be called when component unmounts
 */
export function handleHookError(error, resetFunction, componentName = 'Unknown') {
    // Handle null/undefined errors gracefully
    if (!error) {
        logger.warn('handleHookError called with null/undefined error', {}, 'system');
        return () => {
            // No-op cleanup for null errors
        };
    }

    // Create error context with metadata
    const errorContext = {
        context: 'hook-error',
        component: componentName,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        errorType: classifyError(error)
    };

    // Log the error with appropriate level based on classification
    if (errorContext.errorType === 'validation-error') {
        logger.warn('Validation error in hook', {
            error: error.message,
            ...errorContext
        }, 'validation');
    } else if (errorContext.errorType === 'context-error') {
        logger.info('Recoverable hook error detected', {
            errorType: errorContext.errorType,
            error: error.message,
            ...errorContext
        }, 'system');
    } else {
        logger.error('Hook error occurred', error, errorContext, 'system');
    }

    // Handle error recovery based on error type
    if (shouldAttemptRecovery(error, errorContext.errorType)) {
        if (typeof resetFunction === 'function') {
            try {
                resetFunction();
            } catch (resetError) {
                logger.error('Reset function failed', resetError, {
                    originalError: error.message,
                    ...errorContext
                }, 'system');
            }
        } else {
            logger.warn('Reset function not provided for hook error', {
                error: error.message,
                ...errorContext
            }, 'system');
        }
    }

    // Return cleanup function
    return function cleanup() {
        try {
            logger.info('Hook error cleanup completed', {
                error: error.message,
                ...errorContext
            }, 'system');
        } catch (cleanupError) {
            // Silently handle cleanup errors to prevent cascading failures
            console.warn('Cleanup logging failed:', cleanupError);
        }
    };
}

/**
 * Classify error type for appropriate handling
 * 
 * @param {Error} error - The error to classify
 * @returns {string} Error classification
 */
function classifyError(error) {
    if (!error || !error.message) {
        return 'unknown-error';
    }

    const message = error.message.toLowerCase();
    const name = error.name?.toLowerCase() || '';

    // Context errors (recoverable)
    if (message.includes('used within') || message.includes('context') || message.includes('provider')) {
        return 'context-error';
    }

    // Network errors
    if (name.includes('network') || message.includes('network') || message.includes('fetch')) {
        return 'network-error';
    }

    // Validation errors
    if (name.includes('validation') || message.includes('validation') || message.includes('invalid')) {
        return 'validation-error';
    }

    // Critical errors (non-recoverable)
    if (error.critical || name.includes('critical') || message.includes('critical')) {
        return 'critical-error';
    }

    // Default classification
    return 'general-error';
}

/**
 * Determine if recovery should be attempted
 * 
 * @param {Error} error - The error object
 * @param {string} errorType - The classified error type
 * @returns {boolean} Whether recovery should be attempted
 */
function shouldAttemptRecovery(error, errorType) {
    // Don't attempt recovery for critical errors
    if (errorType === 'critical-error') {
        return false;
    }

    // Don't attempt recovery if error has noRecovery flag
    if (error.noRecovery) {
        return false;
    }

    // Attempt recovery for context errors and general errors
    return ['context-error', 'general-error', 'validation-error'].includes(errorType);
}

/**
 * Create a higher-order function that wraps hooks with error handling
 * 
 * @param {Function} hookFunction - The hook function to wrap
 * @param {string} hookName - Name of the hook for logging
 * @returns {Function} Wrapped hook function with error handling
 */
export function withHookErrorHandling(hookFunction, hookName = 'UnknownHook') {
    return function wrappedHook(...args) {
        try {
            return hookFunction(...args);
        } catch (error) {
            // Handle the error and return a fallback value
            const cleanup = handleHookError(error, null, hookName);

            // Return a safe fallback
            return {
                error,
                isLoading: false,
                data: null,
                cleanup
            };
        }
    };
}

/**
 * Create error boundary configuration for components
 * 
 * @param {string} componentName - Name of the component
 * @returns {Object} Error boundary configuration
 */
export function createErrorBoundaryConfig(componentName) {
    return {
        onError: (error, errorInfo) => {
            logger.error(`${componentName} Error Boundary caught error`, error, {
                component: componentName,
                errorInfo,
                timestamp: new Date().toISOString()
            }, 'system');
        },
        onReset: () => {
            logger.info(`${componentName} Error Boundary reset`, {
                component: componentName,
                timestamp: new Date().toISOString()
            }, 'system');
        }
    };
}

/**
 * Safely resolve Next.js params with React.use() for Next.js 15+ compatibility
 * 
 * @param {Promise|Object} params - The params Promise or object
 * @param {Function} fallbackFn - Fallback function to get params (e.g., useParams)
 * @returns {Object} Resolved params object
 */
export function resolveParams(params, fallbackFn) {
    if (!params) {
        return fallbackFn ? fallbackFn() : {};
    }

    // Check if params is a Promise (Next.js 15+)
    if (params && typeof params.then === 'function') {
        // Use React.use() to unwrap the Promise - NO try/catch around React.use()
        const React = require('react');
        return React.use(params);
    }

    // If params is already an object, return it directly
    if (typeof params === 'object' && params !== null) {
        return params;
    }

    // Fallback to provided function
    return fallbackFn ? fallbackFn() : {};
}

/**
 * Safely parse JSON response with HTML error detection
 * 
 * @param {Response} response - Fetch response object
 * @param {string} context - Context for error logging (e.g., 'debug-info', 'debug-log')
 * @param {Object} metadata - Additional metadata for logging
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function safeJsonParse(response, context = 'api-response', metadata = {}) {
    try {
        // Detect HTML by Content-Type first to avoid JSON parsing on HTML pages
        const contentType = typeof response?.headers?.get === 'function'
            ? (response.headers.get('content-type') || '')
            : '';

        if (contentType.toLowerCase().includes('text/html')) {
            // Read a clone to avoid consuming the original stream for callers
            try {
                const previewText = await (typeof response.clone === 'function' ? response.clone() : response).text();
                logger.warn(`Received HTML error response for ${context}`, {
                    status: response.status,
                    statusText: response.statusText,
                    context,
                    responsePreview: previewText.substring(0, 200),
                    ...metadata
                }, 'system');
            } catch (_) {
                // ignore preview failures
            }
            throw new Error(`Server returned HTML error page (${response.status} ${response.statusText})`);
        }

        // Try to parse JSON response
        const result = await response.json();
        return result;
    } catch (jsonError) {
        // Check if it's an HTML response error
        if (jsonError.message && jsonError.message.includes('Unexpected token <')) {
            try {
                // Get the response text to analyze
                const responseText = await (typeof response.clone === 'function' ? response.clone() : response).text();

                // Check if it's an HTML error page
                if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
                    logger.warn(`Received HTML error response for ${context}`, {
                        status: response.status,
                        statusText: response.statusText,
                        context,
                        responsePreview: responseText.substring(0, 200),
                        ...metadata
                    }, 'system');

                    throw new Error(`Server returned HTML error page (${response.status} ${response.statusText})`);
                }

                // If it's not HTML, it might be other malformed content
                logger.error(`Received malformed response for ${context}`, {
                    status: response.status,
                    statusText: response.statusText,
                    context,
                    responsePreview: responseText.substring(0, 200),
                    ...metadata
                }, 'system');

                throw new Error(`Server returned malformed response (${response.status} ${response.statusText})`);
            } catch (textError) {
                // If we can't even read the response text, throw the original JSON error
                throw jsonError;
            }
        }

        // Re-throw the original JSON parsing error
        throw jsonError;
    }
}

/**
 * Enhanced fetch wrapper with HTML response detection
 * 
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {string} context - Context for error logging
 * @param {Object} metadata - Additional metadata for logging
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function safeFetch(url, options = {}, context = 'api-call', metadata = {}) {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            // Try to parse JSON error response
            try {
                const errorData = await safeJsonParse(response, `${context}-error`, metadata);
                throw new Error(errorData.error || `HTTP ${response.status}`);
            } catch (parseError) {
                // If parsing fails, throw the parse error
                throw parseError;
            }
        }

        // Parse successful JSON response
        return await safeJsonParse(response, context, metadata);
    } catch (error) {
        logger.error(`Error in ${context}`, error, {
            url,
            context,
            ...metadata
        }, 'system');
        throw error;
    }
}
