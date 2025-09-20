/**
 * Remember Me Utilities
 * 
 * Secure implementation of "Remember Me" functionality with:
 * - Secure HTTP-only cookies for token storage
 * - Automatic token refresh
 * - Session management
 * - Security best practices
 * 
 * Key approaches: Security-first design, token rotation, secure storage
 */

import { getInternalApi } from '@/contexts/auth-context';

// Remember Me configuration
const REMEMBER_ME_CONFIG = {
    // Cookie names
    AUTH_TOKEN: 'cedo_auth_token',
    REMEMBER_ME: 'cedo_remember_me',

    // Expiration times
    STANDARD_SESSION: 24 * 60 * 60 * 1000, // 24 hours
    REMEMBER_ME_SESSION: 30 * 24 * 60 * 60 * 1000, // 30 days

    // Security settings
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
};

/**
 * Set secure authentication cookie
 * @param {string} token - JWT token
 * @param {boolean} rememberMe - Whether to set extended expiration
 */
export const setAuthCookie = (token, rememberMe = false) => {
    if (typeof window === 'undefined') return;

    const expirationTime = rememberMe
        ? REMEMBER_ME_CONFIG.REMEMBER_ME_SESSION
        : REMEMBER_ME_CONFIG.STANDARD_SESSION;

    const expires = new Date(Date.now() + expirationTime);
    const expiresString = expires.toUTCString();

    // Set the main auth token cookie
    document.cookie = `${REMEMBER_ME_CONFIG.AUTH_TOKEN}=${token}; expires=${expiresString}; path=/; secure=${REMEMBER_ME_CONFIG.SECURE}; samesite=${REMEMBER_ME_CONFIG.SAME_SITE}`;

    // Set remember me flag if enabled (this will be the last cookie set)
    if (rememberMe) {
        document.cookie = `${REMEMBER_ME_CONFIG.REMEMBER_ME}=true; expires=${expiresString}; path=/; secure=${REMEMBER_ME_CONFIG.SECURE}; samesite=${REMEMBER_ME_CONFIG.SAME_SITE}`;
    }
};

/**
 * Get authentication token from cookie
 * @returns {string|null} JWT token or null if not found
 */
export const getAuthToken = () => {
    if (typeof window === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie =>
        cookie.trim().startsWith(`${REMEMBER_ME_CONFIG.AUTH_TOKEN}=`)
    );

    return authCookie ? authCookie.split('=')[1] : null;
};

/**
 * Check if Remember Me is enabled
 * @returns {boolean} Whether Remember Me is active
 */
export const isRememberMeEnabled = () => {
    if (typeof window === 'undefined') return false;

    const cookies = document.cookie.split(';');
    const rememberMeCookie = cookies.find(cookie =>
        cookie.trim().startsWith(`${REMEMBER_ME_CONFIG.REMEMBER_ME}=`)
    );

    return rememberMeCookie ? rememberMeCookie.split('=')[1] === 'true' : false;
};

/**
 * Clear authentication cookies
 */
export const clearAuthCookies = () => {
    if (typeof window === 'undefined') return;

    // Clear both cookies by setting them with expired dates
    const expiredDate = new Date(0).toUTCString();

    // Clear auth token cookie first
    document.cookie = `${REMEMBER_ME_CONFIG.AUTH_TOKEN}=; expires=${expiredDate}; path=/; secure=${REMEMBER_ME_CONFIG.SECURE}; samesite=${REMEMBER_ME_CONFIG.SAME_SITE}`;

    // Clear remember me flag cookie (this will be the last cookie set)
    document.cookie = `${REMEMBER_ME_CONFIG.REMEMBER_ME}=; expires=${expiredDate}; path=/; secure=${REMEMBER_ME_CONFIG.SECURE}; samesite=${REMEMBER_ME_CONFIG.SAME_SITE}`;
};

/**
 * Validate and refresh authentication token
 * @returns {Promise<Object|null>} User data or null if invalid
 */
export const validateAndRefreshToken = async () => {
    const token = getAuthToken();
    if (!token) return null;

    try {
        const api = getInternalApi();
        const response = await api.get('/auth/me');

        if (response.data && response.data.user) {
            return response.data.user;
        }

        return null;
    } catch (error) {
        console.warn('Token validation failed:', error);
        clearAuthCookies();
        return null;
    }
};

/**
 * Auto-login with Remember Me token
 * @returns {Promise<Object|null>} User data or null if auto-login fails
 */
export const attemptAutoLogin = async () => {
    if (!isRememberMeEnabled()) return null;

    const user = await validateAndRefreshToken();
    return user;
};

/**
 * Store user preferences for Remember Me
 * @param {Object} preferences - User preferences to store
 */
export const storeUserPreferences = (preferences) => {
    if (typeof window === 'undefined') return;

    try {
        const preferencesData = {
            ...preferences,
            timestamp: Date.now()
        };

        localStorage.setItem('cedo_user_preferences', JSON.stringify(preferencesData));
    } catch (error) {
        console.warn('Failed to store user preferences:', error);
    }
};

/**
 * Retrieve user preferences
 * @returns {Object|null} Stored preferences or null
 */
export const getUserPreferences = () => {
    if (typeof window === 'undefined') return null;

    try {
        const stored = localStorage.getItem('cedo_user_preferences');
        if (!stored) return null;

        const preferences = JSON.parse(stored);

        // Check if preferences are not too old (30 days)
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        if (Date.now() - preferences.timestamp > maxAge) {
            localStorage.removeItem('cedo_user_preferences');
            return null;
        }

        return preferences;
    } catch (error) {
        console.warn('Failed to retrieve user preferences:', error);
        return null;
    }
};

/**
 * Clear all Remember Me data
 */
export const clearAllRememberMeData = () => {
    clearAuthCookies();

    if (typeof window !== 'undefined') {
        localStorage.removeItem('cedo_user_preferences');
    }
};

/**
 * Check if Remember Me is supported
 * @returns {boolean} Whether Remember Me is supported
 */
export const isRememberMeSupported = () => {
    if (typeof window === 'undefined') return false;

    // Check for cookie support
    try {
        document.cookie = 'cedo_test=1';
        const cookieSupported = document.cookie.includes('cedo_test');
        document.cookie = 'cedo_test=; expires=' + new Date(0).toUTCString();
        return cookieSupported;
    } catch (error) {
        return false;
    }
};

/**
 * Get Remember Me status for debugging
 * @returns {Object} Remember Me status information
 */
export const getRememberMeStatus = () => {
    return {
        isEnabled: isRememberMeEnabled(),
        hasToken: !!getAuthToken(),
        isSupported: isRememberMeSupported(),
        preferences: getUserPreferences()
    };
};
