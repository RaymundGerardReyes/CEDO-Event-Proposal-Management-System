"use client";

import { checkOAuthAuthentication } from '@/components/auth/GoogleOAuthButton';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OAuthSuccessPage() {
    const [status, setStatus] = useState('verifying');
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const verifyAuthAndRedirect = async () => {
            try {
                console.log('🔄 Verifying OAuth authentication...');

                // Check authentication status
                const authResult = await checkOAuthAuthentication();

                if (authResult.authenticated) {
                    console.log('✅ Authentication verified:', authResult.user.email);
                    setUser(authResult.user);
                    setStatus('success');

                    // Get redirect URL from query params or use default dashboard
                    const redirectTo = searchParams.get('redirect') || authResult.user.dashboard || '/dashboard';

                    // Wait a moment to show success message, then redirect
                    setTimeout(() => {
                        router.replace(redirectTo);
                    }, 2000);

                } else {
                    console.error('❌ Authentication verification failed');
                    setStatus('error');
                    setError('Authentication verification failed. Please try signing in again.');

                    // Redirect to sign-in page after showing error
                    setTimeout(() => {
                        router.replace('/sign-in');
                    }, 3000);
                }
            } catch (err) {
                console.error('Authentication verification error:', err);
                setStatus('error');
                setError('An error occurred while verifying your authentication.');

                setTimeout(() => {
                    router.replace('/sign-in');
                }, 3000);
            }
        };

        verifyAuthAndRedirect();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    {status === 'verifying' && (
                        <>
                            <div className="mx-auto h-12 w-12 text-blue-600">
                                <svg
                                    className="animate-spin h-12 w-12"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
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
                            </div>
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                                Verifying Authentication
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Please wait while we verify your Google sign-in...
                            </p>
                        </>
                    )}

                    {status === 'success' && user && (
                        <>
                            <div className="mx-auto h-12 w-12 text-green-600">
                                <svg
                                    className="h-12 w-12"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                                Sign-in Successful!
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Welcome back, {user.name}!
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Redirecting you to your dashboard...
                            </p>

                            {user.avatar && (
                                <div className="mt-4">
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="mx-auto h-16 w-16 rounded-full"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="mx-auto h-12 w-12 text-red-600">
                                <svg
                                    className="h-12 w-12"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                    />
                                </svg>
                            </div>
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                                Authentication Error
                            </h2>
                            <p className="mt-2 text-sm text-red-600">
                                {error || 'An error occurred during authentication.'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Redirecting you back to sign-in...
                            </p>
                        </>
                    )}
                </div>

                {status === 'success' && (
                    <div className="mt-8 space-y-6">
                        <div className="rounded-md bg-green-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-5 w-5 text-green-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">
                                        Authentication Successful
                                    </h3>
                                    <div className="mt-2 text-sm text-green-700">
                                        <p>Your Google account has been successfully linked to your CEDO account.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-8">
                        <button
                            onClick={() => router.replace('/sign-in')}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Return to Sign In
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 