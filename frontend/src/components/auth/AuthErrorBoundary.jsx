/**
 * Authentication Error Boundary
 * Purpose: Catch and handle authentication-related errors
 * Approach: Comprehensive error handling with user-friendly messages
 */

"use client";

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Component } from 'react';

class AuthErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorType: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            errorType: this.classifyError(error)
        };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error for debugging
        console.error('🚨 AuthErrorBoundary caught an error:', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            errorInfo
        });

        this.setState({ errorInfo });
    }

    classifyError(error) {
        const message = error.message?.toLowerCase() || '';
        const stack = error.stack?.toLowerCase() || '';

        if (message.includes('network') || message.includes('fetch') || stack.includes('network')) {
            return 'NETWORK_ERROR';
        }
        if (message.includes('timeout') || message.includes('aborted')) {
            return 'TIMEOUT_ERROR';
        }
        if (message.includes('authentication') || message.includes('auth') || message.includes('login')) {
            return 'AUTH_ERROR';
        }
        if (message.includes('recaptcha') || message.includes('captcha')) {
            return 'CAPTCHA_ERROR';
        }
        if (message.includes('server') || message.includes('500')) {
            return 'SERVER_ERROR';
        }
        if (message.includes('permission') || message.includes('access')) {
            return 'PERMISSION_ERROR';
        }
        return 'UNKNOWN_ERROR';
    }

    getErrorMessage() {
        const { errorType, error } = this.state;

        switch (errorType) {
            case 'NETWORK_ERROR':
                return {
                    title: 'Connection Error',
                    description: 'Unable to connect to the server. Please check your internet connection and try again.',
                    action: 'Retry Connection'
                };
            case 'TIMEOUT_ERROR':
                return {
                    title: 'Request Timeout',
                    description: 'The server is taking too long to respond. Please try again.',
                    action: 'Try Again'
                };
            case 'AUTH_ERROR':
                return {
                    title: 'Authentication Error',
                    description: 'There was a problem with the sign-in process. Please try again.',
                    action: 'Retry Sign-In'
                };
            case 'CAPTCHA_ERROR':
                return {
                    title: 'CAPTCHA Error',
                    description: 'There was a problem with the CAPTCHA verification. Please refresh the page and try again.',
                    action: 'Refresh Page'
                };
            case 'SERVER_ERROR':
                return {
                    title: 'Server Error',
                    description: 'The server encountered an error. Please try again later.',
                    action: 'Try Again Later'
                };
            case 'PERMISSION_ERROR':
                return {
                    title: 'Access Denied',
                    description: 'You do not have permission to access this resource.',
                    action: 'Go Home'
                };
            default:
                return {
                    title: 'Unexpected Error',
                    description: error?.message || 'An unexpected error occurred. Please try again.',
                    action: 'Try Again'
                };
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null, errorType: null });
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            const errorMessage = this.getErrorMessage();

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <CardTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
                                {errorMessage.title}
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">
                                {errorMessage.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Error Details</AlertTitle>
                                <AlertDescription className="text-xs font-mono">
                                    {this.state.error?.message || 'Unknown error'}
                                </AlertDescription>
                            </Alert>

                            <div className="flex flex-col space-y-2">
                                <Button
                                    onClick={this.handleRetry}
                                    className="w-full"
                                    variant="default"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {errorMessage.action}
                                </Button>

                                <Button
                                    onClick={this.handleGoHome}
                                    className="w-full"
                                    variant="outline"
                                >
                                    <Home className="mr-2 h-4 w-4" />
                                    Go to Home
                                </Button>
                            </div>

                            {process.env.NODE_ENV === 'development' && (
                                <details className="mt-4 text-xs">
                                    <summary className="cursor-pointer text-gray-500 dark:text-gray-400">
                                        Debug Information
                                    </summary>
                                    <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600 dark:text-gray-400">
                                        {JSON.stringify({
                                            error: this.state.error?.message,
                                            stack: this.state.error?.stack,
                                            componentStack: this.state.errorInfo?.componentStack,
                                            errorType: this.state.errorType
                                        }, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AuthErrorBoundary; 