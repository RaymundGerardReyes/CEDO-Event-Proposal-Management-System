/**
 * Consolidated API Utility
 * 
 * Purpose: Single, clean API utility that replaces redundant fetch utilities
 * Replaces: robustFetch.js (merged functionality)
 */

import logger from './logger';

/**
 * Constructs a proper API URL by handling cases where API_URL already includes /api
 * @param {string} [endpoint=''] - The API endpoint (e.g., '/profile', '/events/approved')
 * @returns {string} - The complete API URL
 */
export function getApiUrl(endpoint = '') {
    // Get base URL from environment variables
    let backendUrl = process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        'http://localhost:5000';

    // Remove trailing /api if present to prevent double /api/ in URLs
    const baseUrl = backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl;

    // If no endpoint provided, just return the base URL
    if (!endpoint) {
        return baseUrl;
    }

    // Normalize endpoint - ensure it starts with /api if it's an API endpoint
    let normalizedEndpoint = endpoint;
    if (!endpoint.startsWith('/api') && !endpoint.startsWith('/auth') && !endpoint.startsWith('/health')) {
        normalizedEndpoint = `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    }

    // Construct final URL
    const finalUrl = `${baseUrl}${normalizedEndpoint}`;

    logger.debug(`API URL Construction: ${backendUrl} + ${endpoint} = ${finalUrl}`);
    return finalUrl;
}

/**
 * Get the base backend URL without /api suffix
 * @returns {string} - Base backend URL
 */
export function getBackendUrl() {
    let backendUrl = process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_URL ||
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        'http://localhost:5000';

    // Remove trailing /api if present
    return backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl;
}

/**
 * Get authentication token from cookies or localStorage
 * @returns {string|null} - Authentication token
 */
export function getAuthToken() {
    if (typeof document !== 'undefined') {
        // ✅ FIX: Look for multiple possible cookie names that backend sets
        const cookieNames = ['cedo_token', 'cedo_auth_token'];

        for (const cookieName of cookieNames) {
            const cookieValue = document.cookie.split('; ').find(row => row.startsWith(`${cookieName}=`));
            if (cookieValue) {
                return cookieValue.split('=')[1];
            }
        }

        // Fallback to localStorage
        return localStorage.getItem('cedo_token') || localStorage.getItem('cedo_auth_token') || localStorage.getItem('authToken');
    }
    return null;
}

/**
 * Enhanced fetch with retry logic, error handling, and logging
 * @param {string} url - The URL to fetch
 * @param {object} fetchOptions - Fetch options (method, headers, body, etc.)
 * @param {object} options - { maxRetries, timeout, showToast, toast }
 * @returns {Promise<Response>}
 */
export async function robustFetch(url, fetchOptions = {}, options = {}) {
    const {
        maxRetries = 1,
        timeout = 15000,
        showToast = true,
        toast,
        context = 'API Request'
    } = options;

    let attempt = 0;
    let lastError = null;

    logger.info(`${context}: Attempting request to ${url}`, {
        method: fetchOptions.method || 'GET',
        attempt: attempt + 1,
        maxRetries
    });

    while (attempt <= maxRetries) {
        try {
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, timeout);

            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            logger.info(`${context}: Response received`, {
                status: response.status,
                statusText: response.statusText,
                url: url
            });

            if (!response.ok) {
                let errorText = '';
                try {
                    errorText = await response.text();
                } catch (e) {
                    errorText = '[Could not read response body]';
                }

                // Provide specific error messages based on status code
                let userFriendlyMessage = 'A network or server error occurred.';
                if (response.status === 404) {
                    userFriendlyMessage = 'The requested resource was not found.';
                } else if (response.status === 401) {
                    // Check for specific user not found error
                    if (errorText.includes('User account not found') || errorText.includes('USER_NOT_FOUND')) {
                        userFriendlyMessage = 'Your account was not found. Please sign in again.';
                        // Clear invalid authentication data
                        if (typeof window !== 'undefined') {
                            localStorage.removeItem('cedo_user');
                            document.cookie = 'cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
                            // Redirect to sign-in page
                            window.location.href = '/sign-in';
                        }
                    } else {
                        userFriendlyMessage = 'Authentication required. Please sign in again.';
                    }
                } else if (response.status === 403) {
                    userFriendlyMessage = 'Access denied. You do not have permission to perform this action.';
                } else if (response.status === 408) {
                    userFriendlyMessage = 'Request timeout. Please try again.';
                } else if (response.status >= 500) {
                    userFriendlyMessage = 'Server error. Please try again later.';
                }

                const error = new Error(`API response not ok: ${response.status} ${response.statusText} - ${errorText}`);
                error.status = response.status;
                error.statusText = response.statusText;
                error.userMessage = userFriendlyMessage;

                // Show toast notification if enabled
                if (showToast && toast) {
                    toast({
                        title: "Error",
                        description: userFriendlyMessage,
                        variant: "destructive",
                    });
                }

                logger.error(`${context}: Request failed`, error, {
                    url,
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });

                throw error;
            }

            return response;

        } catch (error) {
            lastError = error;
            attempt++;

            // Handle abort errors (timeout)
            if (error.name === 'AbortError') {
                logger.warn(`${context}: Request timeout`, { url, attempt });
                if (showToast && toast) {
                    toast({
                        title: "Timeout",
                        description: "Request timed out. Please try again.",
                        variant: "destructive",
                    });
                }
            }

            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                logger.error(`${context}: Network error`, error, { url, attempt });
                if (showToast && toast) {
                    toast({
                        title: "Network Error",
                        description: "Please check your internet connection and try again.",
                        variant: "destructive",
                    });
                }
            }

            if (attempt > maxRetries) {
                logger.error(`${context}: Request failed after ${maxRetries} attempts`, lastError, { url });
                throw lastError;
            }

            // Wait before retrying (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Utility function to make API requests with proper error handling
 * @param {string} endpoint - The API endpoint (e.g., '/profile', '/events/approved')
 * @param {Object} options - Fetch options
 * @param {Object} fetchOptions - Additional fetch options
 * @returns {Promise<Object>} - Response data
 */
export const apiRequest = async (endpoint, options = {}, fetchOptions = {}) => {
    const url = getApiUrl(endpoint);
    const token = getAuthToken();

    const defaultHeaders = {
        'Cache-Control': 'no-cache',
    };

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    try {
        logger.info(`API Request: ${options.method || 'GET'} ${url}`);

        const response = await robustFetch(url, {
            credentials: 'include',
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
        }, fetchOptions);

        logger.info(`API Response: ${response.status} ${response.statusText}`);

        // Try to parse JSON response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return await response.text();
        }

    } catch (error) {
        logger.error(`API Request failed: ${endpoint}`, error, {
            endpoint,
            method: options.method || 'GET'
        });
        throw error;
    }
};

/**
 * Convenience methods for common HTTP operations
 */
export const api = {
    get: (endpoint, options = {}) => apiRequest(endpoint, { method: 'GET', ...options }),
    post: (endpoint, data, options = {}) => apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options
    }),
    put: (endpoint, data, options = {}) => apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options
    }),
    patch: (endpoint, data, options = {}) => apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
        ...options
    }),
    delete: (endpoint, options = {}) => apiRequest(endpoint, { method: 'DELETE', ...options }),

    // File upload helper
    upload: (endpoint, formData, options = {}) => apiRequest(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
            // Don't set Content-Type for FormData, let browser set it with boundary
            ...options.headers
        },
        ...options
    })
}; 