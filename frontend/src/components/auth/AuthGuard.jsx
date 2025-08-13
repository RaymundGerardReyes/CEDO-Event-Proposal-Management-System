/**
 * AuthGuard Component
 * 
 * Provides authentication validation and proper error handling for protected routes.
 * This component ensures users are properly authenticated before accessing dashboard content.
 */

"use client";

import { getToken } from '@/utils/auth-utils';
import logger from '@/utils/logger';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

/**
 * AuthGuard wrapper component that validates authentication before rendering children
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @param {Array<string>} props.allowedRoles - Array of roles allowed to access this route
 * @param {string} props.redirectTo - Route to redirect to if not authenticated (default: '/auth/sign-in')
 * @param {boolean} props.showLoading - Whether to show loading state (default: true)
 * @param {React.ReactNode} props.fallback - Custom fallback component while checking auth
 */
export default function AuthGuard({
    children,
    allowedRoles = [],
    redirectTo = '/auth/sign-in',
    showLoading = true,
    fallback = null
}) {
    const router = useRouter();
    const [authState, setAuthState] = useState({
        isLoading: true,
        isAuthenticated: false,
        user: null,
        error: null
    });

    useEffect(() => {
        const validateAuthentication = async () => {
            try {
                logger.info('AuthGuard', 'Starting authentication validation');

                // Check for token
                const token = getToken();
                if (!token) {
                    logger.warn('AuthGuard', 'No authentication token found', {
                        redirectTo,
                        currentPath: window.location.pathname
                    });

                    setAuthState({
                        isLoading: false,
                        isAuthenticated: false,
                        user: null,
                        error: 'No authentication token found'
                    });

                    // Redirect to sign-in
                    router.replace(redirectTo);
                    return;
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
                    throw new Error(`Authentication validation failed: ${response.status}`);
                }

                const userData = await response.json();

                if (!userData.success || !userData.user) {
                    throw new Error('Invalid user data received from authentication endpoint');
                }

                const user = userData.user;

                // Check role-based access if roles are specified
                if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                    logger.warn('AuthGuard', 'User role not authorized for this route', {
                        userRole: user.role,
                        allowedRoles,
                        userId: user.id,
                        currentPath: window.location.pathname
                    });

                    setAuthState({
                        isLoading: false,
                        isAuthenticated: true,
                        user,
                        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`
                    });

                    // Redirect to appropriate dashboard based on user role
                    const dashboardRoute = getDashboardForRole(user.role);
                    router.replace(dashboardRoute);
                    return;
                }

                logger.info('AuthGuard', 'Authentication validation successful', {
                    userId: user.id,
                    userRole: user.role,
                    userEmail: user.email
                });

                setAuthState({
                    isLoading: false,
                    isAuthenticated: true,
                    user,
                    error: null
                });

            } catch (error) {
                logger.error('AuthGuard', error, {
                    currentPath: window.location.pathname,
                    redirectTo,
                    allowedRoles
                });

                setAuthState({
                    isLoading: false,
                    isAuthenticated: false,
                    user: null,
                    error: error.message || 'Authentication validation failed'
                });

                // Redirect to sign-in on authentication failure
                router.replace(redirectTo);
            }
        };

        validateAuthentication();
    }, [allowedRoles, redirectTo, router]);

    // Helper function to get dashboard route based on role
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

    // Show loading state
    if (authState.isLoading) {
        if (fallback) {
            return fallback;
        }

        if (showLoading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-600">Verifying authentication...</p>
                    </div>
                </div>
            );
        }

        return null;
    }

    // Show error state
    if (authState.error && !authState.isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
                    <p className="text-gray-600 mb-4">{authState.error}</p>
                    <button
                        onClick={() => router.replace(redirectTo)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Go to Sign In
                    </button>
                </div>
            </div>
        );
    }

    // Show role access denied
    if (authState.error && authState.isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-yellow-600 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">{authState.error}</p>
                    <button
                        onClick={() => router.replace(getDashboardForRole(authState.user?.role))}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Go to Your Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Render children if authenticated and authorized
    if (authState.isAuthenticated && !authState.error) {
        return children;
    }

    // Fallback
    return null;
}
