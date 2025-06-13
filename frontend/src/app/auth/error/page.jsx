"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OAuthErrorPage() {
    const [errorDetails, setErrorDetails] = useState({
        error: 'Unknown Error',
        message: 'An unknown error occurred during authentication.',
        description: null
    });
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Extract error details from URL parameters
        const error = searchParams.get('error') || 'UNKNOWN_ERROR';
        const message = searchParams.get('message') || searchParams.get('description') || 'An error occurred during authentication.';
        const description = searchParams.get('description');

        // Map error codes to user-friendly messages
        const errorMessages = {
            'ACCOUNT_NOT_FOUND': {
                title: 'Account Not Found',
                message: 'Your Google account is not registered in our system. Please contact an administrator to create your account.',
                suggestion: 'Contact your system administrator to get your account set up.'
            },
            'EMAIL_NOT_VERIFIED': {
                title: 'Email Not Verified',
                message: 'Your Google email address has not been verified. Please verify your email with Google and try again.',
                suggestion: 'Go to your Google account settings and verify your email address.'
            },
            'SECURITY_ERROR': {
                title: 'Security Validation Failed',
                message: 'A security validation error occurred during authentication. This may be due to a potential security threat.',
                suggestion: 'Please try signing in again. If the problem persists, contact support.'
            },
            'OAUTH_ERROR': {
                title: 'Authentication Failed',
                message: 'Google authentication failed. This may be a temporary issue.',
                suggestion: 'Please try signing in again.'
            },
            'NO_USER': {
                title: 'Authentication Incomplete',
                message: 'Authentication was completed but no user data was received.',
                suggestion: 'Please try signing in again.'
            },
            'PROCESSING_ERROR': {
                title: 'Processing Error',
                message: 'An error occurred while processing your authentication.',
                suggestion: 'Please try signing in again. If the problem persists, contact support.'
            },
            'OAUTH_FAILURE': {
                title: 'OAuth Authentication Failed',
                message: 'The OAuth authentication process failed.',
                suggestion: 'Please try signing in again.'
            }
        };

        const errorInfo = errorMessages[error] || {
            title: 'Authentication Error',
            message: decodeURIComponent(message),
            suggestion: 'Please try signing in again.'
        };

        setErrorDetails({
            error: error,
            title: errorInfo.title,
            message: errorInfo.message,
            suggestion: errorInfo.suggestion,
            description: description ? decodeURIComponent(description) : null
        });

        console.error('OAuth Error:', {
            error,
            message,
            description
        });
    }, [searchParams]);

    const handleRetryLogin = () => {
        router.replace('/sign-in');
    };

    const handleContactSupport = () => {
        // You can customize this to your support email or contact form
        window.location.href = 'mailto:support@your-domain.com?subject=OAuth Authentication Error&body=' +
            encodeURIComponent(`I encountered an OAuth authentication error:\n\nError: ${errorDetails.error}\nMessage: ${errorDetails.message}\n\nPlease help me resolve this issue.`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 text-red-600">
                        <svg
                            className="h-16 w-16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>

                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        {errorDetails.title}
                    </h2>

                    <p className="mt-4 text-sm text-gray-600">
                        {errorDetails.message}
                    </p>

                    {errorDetails.description && (
                        <p className="mt-2 text-xs text-gray-500">
                            Details: {errorDetails.description}
                        </p>
                    )}

                    {errorDetails.suggestion && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                                <strong>Suggestion:</strong> {errorDetails.suggestion}
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-8 space-y-4">
                    <button
                        onClick={handleRetryLogin}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        Try Again
                    </button>

                    <button
                        onClick={handleContactSupport}
                        className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                        Contact Support
                    </button>
                </div>

                {/* Error Details for Debugging (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 p-4 bg-gray-100 border border-gray-300 rounded-md">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Information:</h3>
                        <div className="text-xs text-gray-600 space-y-1">
                            <p><strong>Error Code:</strong> {errorDetails.error}</p>
                            <p><strong>Message:</strong> {errorDetails.message}</p>
                            {errorDetails.description && (
                                <p><strong>Description:</strong> {errorDetails.description}</p>
                            )}
                            <p><strong>URL Parameters:</strong> {window.location.search}</p>
                        </div>
                    </div>
                )}

                {/* Common Error Solutions */}
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">Common Solutions:</h3>
                    <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                        <li>Make sure you're using the correct Google account</li>
                        <li>Ensure your Google account email is verified</li>
                        <li>Check that your account has been set up by an administrator</li>
                        <li>Try clearing your browser cookies and cache</li>
                        <li>Disable browser extensions that might interfere with authentication</li>
                    </ul>
                </div>
            </div>
        </div>
    );
} 