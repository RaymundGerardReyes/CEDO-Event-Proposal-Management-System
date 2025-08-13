/**
 * Utility functions for authentication handling
 */

// Global flag to prevent multiple simultaneous auth checks
let authCheckInProgress = false;
let lastAuthCheck = 0;
const AUTH_CHECK_COOLDOWN = 30000; // 30 seconds between checks

/**
 * Check if user is authenticated by validating token presence
 * @returns {boolean} True if user has a valid token
 */
export function isAuthenticated() {
    const token = getToken();
    return !!(token && typeof token === 'string' && token.length >= 10);
}

/**
 * Get authentication token from cookies or localStorage
 * @returns {string|null} The authentication token or null if not found
 */
export function getToken() {
    if (typeof document !== 'undefined') {
        // Try to get token from cookies first
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith('cedo_token='));
        if (cookieValue) {
            const token = cookieValue.split('=')[1];
            if (token && token.length > 0) {
                return token;
            }
        }

        // Fallback to localStorage
        return localStorage.getItem('cedo_token') || localStorage.getItem('authToken');
    }
    return null;
}

/**
 * Clear all authentication data from browser storage
 */
export function clearAuthData() {
    if (typeof window !== 'undefined') {
        // Clear localStorage
        localStorage.removeItem('cedo_user');

        // Clear cookies
        document.cookie = 'cedo_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';

        // Clear any other auth-related data
        sessionStorage.removeItem('auth_state');

        // Reset auth check flags
        authCheckInProgress = false;
        lastAuthCheck = 0;

        console.log('🧹 Auth data cleared from browser storage');
    }
}

/**
 * Check if current user token is valid by making a test API call
 */
export async function validateCurrentToken() {
    // Prevent multiple simultaneous checks
    if (authCheckInProgress) {
        console.log('🔒 Auth check already in progress, skipping');
        return { valid: false, reason: 'CHECK_IN_PROGRESS' };
    }

    // Check cooldown period
    const now = Date.now();
    if (now - lastAuthCheck < AUTH_CHECK_COOLDOWN) {
        console.log('⏰ Auth check cooldown active, skipping');
        return { valid: false, reason: 'COOLDOWN' };
    }

    authCheckInProgress = true;
    lastAuthCheck = now;

    try {
        // Check if we have a token first
        let hasToken = false;
        if (typeof document !== 'undefined') {
            const cookieValue = document.cookie.split("; ").find((row) => row.startsWith("cedo_token="));
            if (cookieValue) {
                const token = cookieValue.split("=")[1];
                hasToken = token && token.length > 0;
            }
        }

        if (!hasToken) {
            console.log('🔍 No token found, skipping validation');
            return { valid: false, reason: 'NO_TOKEN' };
        }

        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Reduced to 5 seconds

        const response = await fetch('/api/auth/me', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Token validation successful');
            return { valid: true, user: data.user };
        } else if (response.status === 401) {
            const errorText = await response.text();
            if (errorText.includes('User account not found') || errorText.includes('USER_NOT_FOUND')) {
                // User not found in database - clear auth data
                clearAuthData();
                return { valid: false, reason: 'USER_NOT_FOUND' };
            }
            return { valid: false, reason: 'INVALID_TOKEN' };
        } else {
            return { valid: false, reason: 'API_ERROR' };
        }
    } catch (error) {
        console.error('Error validating token:', error);
        if (error.name === 'AbortError') {
            return { valid: false, reason: 'TIMEOUT' };
        }
        return { valid: false, reason: 'NETWORK_ERROR' };
    } finally {
        authCheckInProgress = false;
    }
}

/**
 * Handle invalid user token by clearing data and redirecting
 */
export function handleInvalidUserToken() {
    clearAuthData();

    // Show a toast notification if available
    if (typeof window !== 'undefined' && window.__cedoToast) {
        window.__cedoToast({
            title: 'Session Expired',
            description: 'Your account was not found. Please sign in again.',
            variant: 'destructive',
        });
    }

    // Redirect to sign-in page
    if (typeof window !== 'undefined') {
        window.location.href = '/sign-in';
    }
}

/**
 * Initialize auth validation on page load
 * Simplified to prevent multiple API calls
 */
export function initializeAuthValidation() {
    if (typeof window !== 'undefined') {
        // Only run once per page load to prevent multiple calls
        if (window.__authValidationRun) {
            console.log('🔄 Auth validation already initialized, skipping');
            return;
        }
        window.__authValidationRun = true;

        // Add a small delay to prevent immediate API calls
        setTimeout(() => {
            validateCurrentToken().then(({ valid, reason }) => {
                console.log(`🔍 Auth validation result: ${valid ? 'valid' : 'invalid'} (${reason})`);
                if (!valid && reason === 'USER_NOT_FOUND') {
                    handleInvalidUserToken();
                }
            });
        }, 2000); // Increased delay to 2 seconds
    }
} 