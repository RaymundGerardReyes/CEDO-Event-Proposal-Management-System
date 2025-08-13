// File: api-utils.js
// Purpose: Enhanced API utilities with robust error handling, retry logic, and proper fetch implementation.
// Key approaches: Retry mechanism, timeout handling, error classification, and fallback strategies.
// Refactor: Improved fetch implementation to resolve "Failed to fetch" errors in auth flow.

import { getAppConfig } from './utils';

// Configuration constants
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Error types for better error handling
 */
export const API_ERROR_TYPES = {
    NETWORK: 'NETWORK',
    TIMEOUT: 'TIMEOUT',
    CORS: 'CORS',
    SERVER: 'SERVER',
    CLIENT: 'CLIENT',
    UNKNOWN: 'UNKNOWN'
};

/**
 * Classify error type for better error handling
 * @param {Error} error - The error to classify
 * @returns {string} - Error type
 */
export function classifyError(error) {
    if (!error) return API_ERROR_TYPES.UNKNOWN;

    const message = error.message?.toLowerCase() || '';

    if (message.includes('failed to fetch') || message.includes('network error')) {
        return API_ERROR_TYPES.NETWORK;
    }

    if (message.includes('timeout') || message.includes('aborted')) {
        return API_ERROR_TYPES.TIMEOUT;
    }

    if (message.includes('cors') || message.includes('cross-origin')) {
        return API_ERROR_TYPES.CORS;
    }

    return API_ERROR_TYPES.UNKNOWN;
}

/**
 * Create a timeout promise
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} - Promise that rejects after timeout
 */
function createTimeout(ms) {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
    });
}

/**
 * Delay function for retry logic
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise} - Promise that resolves after delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Enhanced fetch with timeout, retry logic, and better error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Request timeout in milliseconds
 * @param {number} retries - Number of retries
 * @returns {Promise} - Fetch response
 */
export async function enhancedFetch(url, options = {}, timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES) {
    const config = getAppConfig();

    // Ensure URL is absolute
    if (!url.startsWith('http')) {
        url = `${config.backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    // Default fetch options
    const fetchOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
        delete fetchOptions.headers['Content-Type'];
    }

    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            // Create fetch promise with timeout
            const fetchPromise = fetch(url, fetchOptions);
            const timeoutPromise = createTimeout(timeout);

            // Race between fetch and timeout
            const response = await Promise.race([fetchPromise, timeoutPromise]);

            // Check if response is ok
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.response = response;

                // Don't retry on client errors (4xx)
                if (response.status >= 400 && response.status < 500) {
                    throw error;
                }

                // Retry on server errors (5xx)
                if (response.status >= 500) {
                    lastError = error;
                    if (attempt < retries) {
                        console.warn(`Attempt ${attempt + 1} failed with status ${response.status}, retrying...`);
                        await delay(RETRY_DELAY * (attempt + 1));
                        continue;
                    }
                }

                throw error;
            }

            return response;

        } catch (error) {
            lastError = error;
            const errorType = classifyError(error);

            // Don't retry on certain error types
            if (errorType === API_ERROR_TYPES.CORS || error.status >= 400) {
                throw error;
            }

            // Retry on network/timeout errors
            if (attempt < retries) {
                console.warn(`Attempt ${attempt + 1} failed: ${error.message}, retrying...`);
                await delay(RETRY_DELAY * (attempt + 1));
                continue;
            }

            // Final attempt failed
            console.error(`All ${retries + 1} attempts failed for ${url}:`, error);
            throw error;
        }
    }

    throw lastError;
}

/**
 * Enhanced fetch for JSON responses
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Request timeout in milliseconds
 * @param {number} retries - Number of retries
 * @returns {Promise<Object>} - Parsed JSON response
 */
export async function fetchJSON(url, options = {}, timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES) {
    try {
        const response = await enhancedFetch(url, options, timeout, retries);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Failed to fetch JSON from ${url}:`, error);
        throw error;
    }
}

/**
 * Enhanced fetch for text responses
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeout - Request timeout in milliseconds
 * @param {number} retries - Number of retries
 * @returns {Promise<string>} - Text response
 */
export async function fetchText(url, options = {}, timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES) {
    try {
        const response = await enhancedFetch(url, options, timeout, retries);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error(`Failed to fetch text from ${url}:`, error);
        throw error;
    }
}

/**
 * Enhanced loadConfig with better error handling
 * @returns {Promise<Object>} - Configuration object
 */
export async function loadConfigEnhanced() {
    const config = getAppConfig();

    try {
        const data = await fetchJSON('/api/config', {}, 5000, 2);

        // Validate config data
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid config response format');
        }

        // Merge with existing config
        const enhancedConfig = {
            ...config,
            ...data,
            // Ensure backendUrl is always set correctly
            backendUrl: data.backendUrl || config.backendUrl
        };

        console.log('✅ Config loaded successfully:', enhancedConfig);
        return enhancedConfig;

    } catch (error) {
        const errorType = classifyError(error);
        console.warn(`⚠️ Config load failed (${errorType}):`, error.message);

        // Return fallback config
        const fallbackConfig = {
            ...config,
            recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || '',
            timestamp: Date.now()
        };

        console.log('🔄 Using fallback config:', fallbackConfig);
        return fallbackConfig;
    }
}

