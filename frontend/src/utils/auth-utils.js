/**
 * Authentication Utilities
 * Centralized token extraction and validation
 */

/**
 * Extract authentication token from multiple sources
 * @returns {string|null} - Authentication token or null if not found
 */
export const getAuthToken = () => {
    if (typeof window === 'undefined') return null;

    let token = null;

    // Method 1: Try localStorage first
    token = localStorage.getItem('cedo_token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('token');

    // Method 2: Try cookies with multiple possible names
    if (!token && typeof document !== 'undefined') {
        const cookieNames = ['cedo_token', 'cedo_auth_token', 'auth_token', 'token', 'authToken'];
        for (const cookieName of cookieNames) {
            const cookieValue = document.cookie
                .split('; ')
                .find(row => row.startsWith(`${cookieName}=`))
                ?.split('=')[1];
            if (cookieValue && cookieValue.trim() !== '') {
                token = cookieValue.trim();
                break;
            }
        }
    }

    // Method 3: Try sessionStorage as fallback
    if (!token) {
        token = sessionStorage.getItem('cedo_token') ||
            sessionStorage.getItem('authToken') ||
            sessionStorage.getItem('token');
    }

    return token;
};

/**
 * Validate token format
 * @param {string} token - Token to validate
 * @returns {boolean} - True if token format is valid
 */
export const isValidToken = (token) => {
    if (!token || typeof token !== 'string') return false;

    // Basic JWT format check (should contain dots and be reasonably long)
    return token.includes('.') && token.length > 10;
};

/**
 * Get user information from localStorage
 * @returns {object|null} - User object or null if not found
 */
export const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;

    try {
        const userInfo = localStorage.getItem('cedo_user');
        return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
        console.warn('Failed to parse user info:', error);
        return null;
    }
};

/**
 * Check if user has admin privileges
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = () => {
    const user = getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'head_admin');
};

/**
 * Create authenticated headers for API requests
 * @param {object} additionalHeaders - Additional headers to include
 * @returns {object} - Headers object with authentication
 */
export const createAuthHeaders = (additionalHeaders = {}) => {
    const token = getAuthToken();

    if (!token) {
        console.warn('No authentication token found');
        return additionalHeaders;
    }

    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, */*',
        ...additionalHeaders
    };
};

/**
 * Debug authentication state
 * @returns {object} - Debug information about authentication
 */
export const getAuthDebugInfo = () => {
    if (typeof window === 'undefined') return { error: 'Not in browser environment' };

    const token = getAuthToken();
    const user = getCurrentUser();

    return {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        user: user ? { email: user.email, role: user.role } : null,
        isAdmin: isAdmin(),
        localStorage: {
            cedo_token: !!localStorage.getItem('cedo_token'),
            cedo_user: !!localStorage.getItem('cedo_user'),
            authToken: !!localStorage.getItem('authToken'),
            token: !!localStorage.getItem('token')
        },
        sessionStorage: {
            cedo_token: !!sessionStorage.getItem('cedo_token'),
            authToken: !!sessionStorage.getItem('authToken'),
            token: !!sessionStorage.getItem('token')
        },
        cookies: document.cookie.split('; ').filter(cookie =>
            cookie.includes('token') || cookie.includes('auth')
        )
    };
};