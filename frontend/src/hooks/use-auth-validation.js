/**
 * Authentication validation hook
 * 
 * Provides authentication state and validation logic that can be used across components.
 * This hook centralizes authentication logic and provides consistent error handling.
 */

import { getToken } from '@/utils/auth-utils';
import logger from '@/utils/logger';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for authentication validation
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.allowedRoles - Array of roles allowed for this context
 * @param {boolean} options.requireAuth - Whether authentication is required (default: true)
 * @param {string} options.redirectTo - Where to redirect if not authenticated
 * @returns {Object} Authentication state and methods
 */
export function useAuthValidation(options = {}) {
    const {
        allowedRoles = [],
        requireAuth = true,
        redirectTo = '/auth/sign-in'
    } = options;

    const router = useRouter();
    const [authState, setAuthState] = useState({
        isLoading: true,
        isAuthenticated: false,
        user: null,
        error: null,
        hasValidRole: true
    });

    /**
     * Validate user authentication and role access
     */
    const validateAuth = useCallback(async () => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            logger.info('useAuthValidation', 'Starting authentication validation');

            // Check for token
            const token = getToken();
            if (!token) {
                if (requireAuth) {
                    logger.warn('useAuthValidation', 'No authentication token found', {
                        requireAuth,
                        redirectTo,
                        currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
                    });

                    setAuthState({
                        isLoading: false,
                        isAuthenticated: false,
                        user: null,
                        error: 'Authentication required',
                        hasValidRole: false
                    });

                    return { isAuthenticated: false, shouldRedirect: true };
                } else {
                    // Auth not required, allow access
                    setAuthState({
                        isLoading: false,
                        isAuthenticated: false,
                        user: null,
                        error: null,
                        hasValidRole: true
                    });

                    return { isAuthenticated: false, shouldRedirect: false };
                }
            }

            // Validate token with backend
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Authentication validation failed: ${response.status} ${response.statusText}`);
            }

            const userData = await response.json();

            if (!userData.success || !userData.user) {
                throw new Error('Invalid user data received from authentication endpoint');
            }

            const user = userData.user;

            // Check role-based access if roles are specified
            const hasValidRole = allowedRoles.length === 0 || allowedRoles.includes(user.role);

            if (!hasValidRole) {
                logger.warn('useAuthValidation', 'User role not authorized', {
                    userRole: user.role,
                    allowedRoles,
                    userId: user.id,
                    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
                });

                setAuthState({
                    isLoading: false,
                    isAuthenticated: true,
                    user,
                    error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
                    hasValidRole: false
                });

                return { isAuthenticated: true, shouldRedirect: true, user, hasValidRole: false };
            }

            logger.info('useAuthValidation', 'Authentication validation successful', {
                userId: user.id,
                userRole: user.role,
                userEmail: user.email,
                hasValidRole
            });

            setAuthState({
                isLoading: false,
                isAuthenticated: true,
                user,
                error: null,
                hasValidRole: true
            });

            return { isAuthenticated: true, shouldRedirect: false, user, hasValidRole: true };

        } catch (error) {
            logger.error('useAuthValidation', error, {
                currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
                redirectTo,
                allowedRoles,
                requireAuth
            });

            setAuthState({
                isLoading: false,
                isAuthenticated: false,
                user: null,
                error: error.message || 'Authentication validation failed',
                hasValidRole: false
            });

            return { isAuthenticated: false, shouldRedirect: requireAuth, error: error.message };
        }
    }, [allowedRoles, requireAuth, redirectTo]);

    /**
     * Redirect user to appropriate location based on authentication state
     */
    const handleRedirect = useCallback((authResult) => {
        if (!authResult.shouldRedirect) return;

        if (!authResult.isAuthenticated) {
            // Redirect to sign-in
            router.replace(redirectTo);
        } else if (authResult.user && !authResult.hasValidRole) {
            // Redirect to appropriate dashboard based on user role
            const dashboardRoute = getDashboardForRole(authResult.user.role);
            router.replace(dashboardRoute);
        }
    }, [router, redirectTo]);

    /**
     * Helper function to get dashboard route based on role
     */
    const getDashboardForRole = (role) => {
        switch (role) {
            case 'admin':
            case 'head_admin':
            case 'manager':
                return '/admin-dashboard';
            case 'student':
            case 'partner':
            case 'reviewer':
                return '/student-dashboard';
            default:
                return '/student-dashboard';
        }
    };

    /**
     * Refresh authentication state
     */
    const refreshAuth = useCallback(async () => {
        const result = await validateAuth();
        handleRedirect(result);
        return result;
    }, [validateAuth, handleRedirect]);

    /**
     * Check if user has specific role
     */
    const hasRole = useCallback((role) => {
        return authState.user?.role === role;
    }, [authState.user]);

    /**
     * Check if user has any of the specified roles
     */
    const hasAnyRole = useCallback((roles) => {
        return roles.includes(authState.user?.role);
    }, [authState.user]);

    // Initial validation on mount
    useEffect(() => {
        validateAuth().then(handleRedirect);
    }, [validateAuth, handleRedirect]);

    return {
        // State
        ...authState,

        // Methods
        refreshAuth,
        hasRole,
        hasAnyRole,
        validateAuth,

        // Computed values
        isAdmin: hasRole('admin') || hasRole('head_admin') || hasRole('manager'),
        isStudent: hasRole('student'),
        isPartner: hasRole('partner'),
        isReviewer: hasRole('reviewer'),

        // Helper
        getDashboardForRole
    };
}
