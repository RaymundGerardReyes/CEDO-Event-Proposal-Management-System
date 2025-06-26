"use client";

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

/**
 * Google OAuth Button Component
 * Implements secure OAuth 2.0 flow with the backend server
 * Following best practices from the documentation
 */
export default function GoogleOAuthButton({
    onSuccess,
    onError,
    className = "",
    disabled = false,
    redirectUrl = null,
    children = "Sign in with Google"
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { handleGoogleLogin } = useAuth();

    // Clear any existing error when component mounts or props change
    useEffect(() => {
        setError(null);
    }, [disabled]);

    /**
     * Initiate OAuth flow by redirecting to backend OAuth endpoint
     * This follows the secure server-side OAuth flow pattern
     */
    const handleOAuthLogin = useCallback(async () => {
        if (disabled || isLoading) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('🚀 Initiating Google OAuth flow...');

            // Construct the OAuth initiation URL
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const currentUrl = window.location.origin;
            const finalRedirectUrl = redirectUrl || currentUrl;

            // Add redirect URL as query parameter for the backend to store
            const oauthUrl = `${backendUrl}/auth/google?redirect_url=${encodeURIComponent(finalRedirectUrl)}`;

            console.log('OAuth URL:', oauthUrl);
            console.log('Redirect URL:', finalRedirectUrl);

            // Redirect to backend OAuth initiation endpoint
            // The backend will handle:
            // 1. CSRF state generation and validation
            // 2. Secure redirect to Google OAuth
            // 3. Callback processing
            // 4. JWT token generation
            // 5. Secure cookie setting
            // 6. Final redirect back to frontend
            window.location.href = oauthUrl;

        } catch (err) {
            console.error('OAuth initiation error:', err);
            setError('Failed to initiate Google sign-in. Please try again.');
            setIsLoading(false);

            if (onError) {
                onError(err);
            }
        }
    }, [disabled, isLoading, redirectUrl, onError]);

    /**
     * Handle OAuth success callback (called when user returns from OAuth)
     * This would typically be handled by a dedicated callback page
     */
    const handleOAuthCallback = useCallback(async () => {
        try {
            console.log('🔄 Processing OAuth callback...');

            // Get current user info from the backend to verify authentication
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const response = await fetch(`${backendUrl}/auth/oauth/me`, {
                credentials: 'include', // Important: Include cookies for authentication
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ OAuth authentication successful:', data.user.email);

                if (onSuccess) {
                    onSuccess(data.user);
                }

                // Redirect to appropriate dashboard
                const dashboardUrl = data.user.dashboard || '/dashboard';
                router.push(dashboardUrl);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Authentication verification failed');
            }
        } catch (err) {
            console.error('OAuth callback processing error:', err);
            setError('Authentication verification failed. Please try signing in again.');

            if (onError) {
                onError(err);
            }
        } finally {
            setIsLoading(false);
        }
    }, [onSuccess, onError, router]);

    // Check for OAuth callback parameters in URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const authSuccess = urlParams.get('auth_success');
        const authError = urlParams.get('auth_error');

        if (authSuccess === 'true') {
            handleOAuthCallback();
        } else if (authError) {
            setError(decodeURIComponent(authError));
            setIsLoading(false);
        }
    }, [handleOAuthCallback]);

    const handleGoogleResponse = async (response) => {
        try {
            console.log('Raw Google response:', response);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: response.credential || response.access_token })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Authentication failed');
            }

            const data = await res.json();
            console.log('Auth response:', data);

            if (!data.token) {
                throw new Error('No token received from server');
            }

            // Store token and user data
            localStorage.setItem('authToken', data.token);
            // Update application state
        } catch (error) {
            console.error('Authentication error:', error);
            // Show user-friendly error message
        }
    };

    return (
        <div className="google-oauth-container">
            <button
                onClick={handleGoogleResponse}
                disabled={disabled || isLoading}
                className={`
          google-oauth-button
          inline-flex items-center justify-center
          px-4 py-2 border border-transparent
          text-sm font-medium rounded-md
          text-white bg-blue-600 hover:bg-blue-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
                aria-label="Sign in with Google"
                type="button"
            >
                {isLoading ? (
                    <>
                        <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Signing in...
                    </>
                ) : (
                    <>
                        <svg
                            className="w-5 h-5 mr-2"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {children}
                    </>
                )}
            </button>

            {error && (
                <div
                    className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2"
                    role="alert"
                >
                    <strong>Authentication Error:</strong> {error}
                </div>
            )}
        </div>
    );
}

/**
 * Utility function to check if user is authenticated via OAuth
 * Can be used in other components to verify authentication status
 */
export async function checkOAuthAuthentication() {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/auth/oauth/me`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            return { authenticated: true, user: data.user };
        } else {
            return { authenticated: false, user: null };
        }
    } catch (error) {
        console.error('Authentication check error:', error);
        return { authenticated: false, user: null };
    }
}

/**
 * Utility function to logout user from OAuth session
 */
export async function logoutOAuth() {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const response = await fetch(`${backendUrl}/auth/oauth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            console.log('✅ OAuth logout successful');
            return { success: true };
        } else {
            throw new Error('Logout failed');
        }
    } catch (error) {
        console.error('OAuth logout error:', error);
        return { success: false, error: error.message };
    }
} 