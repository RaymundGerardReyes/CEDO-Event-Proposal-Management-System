/**
 * Constructs a proper API URL by handling cases where API_URL already includes /api
 * @param {string} [endpoint=''] - The API endpoint (e.g., '/events/approved')
 * @returns {string} - The complete API URL
 */
export function getApiUrl(endpoint = '') {
    const backendUrl = process.env.API_URL || 'http://localhost:5000'

    // Handle API_URL that might already include /api
    const baseUrl = backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl

    // If no endpoint provided, just return the base URL
    if (!endpoint) {
        return baseUrl;
    }

    // Ensure endpoint starts with /api
    const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`

    return `${baseUrl}${apiEndpoint}`
}

/**
 * Utility function to make API requests with proper error handling
 */
export const apiRequest = async (endpoint, options = {}) => {
    const url = getApiUrl(endpoint);

    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}; 