'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { classifyError, ERROR_TYPES, handleError } from '@/utils/error-handler';
import logger, { LOG_CATEGORIES } from '@/utils/logger.js';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error using our centralized error handling
        const errorInfo = handleError(error, {
            boundary: 'global-error-boundary',
            component: 'ErrorBoundary',
            url: window.location.href
        });

        // Special handling for DOM manipulation errors
        if (error.message && error.message.includes('removeChild')) {
            logger.info('DOM manipulation error detected, attempting automatic recovery...', {
                errorType: ERROR_TYPES.DOM_MANIPULATION,
                recovery: 'automatic-cleanup'
            }, LOG_CATEGORIES.DOM);

            // Clean up any Google Sign-In related DOM elements that might be causing issues
            try {
                const googleContainers = document.querySelectorAll('[data-google-signin-container="true"]');
                googleContainers.forEach(container => {
                    if (container.parentNode) {
                        container.parentNode.removeChild(container);
                    }
                });

                // Also clean up any orphaned Google Sign-In elements
                const googleElements = document.querySelectorAll('[id*="google-signin"]');
                googleElements.forEach(element => {
                    if (element.parentNode && element.id.includes('isolated')) {
                        element.parentNode.removeChild(element);
                    }
                });

                logger.info('DOM cleanup completed, attempting automatic reset...', {
                    containersRemoved: googleContainers.length,
                    elementsRemoved: googleElements.length
                }, LOG_CATEGORIES.DOM);

                // Attempt automatic recovery after a brief delay
                setTimeout(() => {
                    logger.info('Executing automatic error boundary reset...', {}, LOG_CATEGORIES.SYSTEM);
                    reset();
                }, 1000);

            } catch (cleanupError) {
                logger.warn('Error during DOM cleanup:', {
                    cleanupError: cleanupError.message,
                    originalError: error.message
                }, LOG_CATEGORIES.DOM);
            }
        }
    }, [error, reset]);

    // Check if this is a DOM manipulation error
    const isDOMError = error.message && error.message.includes('removeChild');
    const errorType = classifyError(error);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {isDOMError ? 'Temporary Display Issue' : 'Something went wrong'}
                    </h1>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isDOMError
                            ? 'We detected a temporary display issue. The page will automatically refresh to fix this.'
                            : 'An unexpected error occurred. Please try refreshing the page.'
                        }
                    </p>

                    {process.env.NODE_ENV === 'development' && (
                        <details className="text-left">
                            <summary className="text-xs cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                Error Details (Development)
                            </summary>
                            <div className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32 space-y-1">
                                <div><strong>Type:</strong> {errorType}</div>
                                <div><strong>Message:</strong> {error.message}</div>
                                {error.stack && (
                                    <div><strong>Stack:</strong> {error.stack}</div>
                                )}
                            </div>
                        </details>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            onClick={() => {
                                logger.info('Manual error boundary reset triggered by user', {
                                    errorType,
                                    component: 'ErrorBoundary'
                                }, LOG_CATEGORIES.SYSTEM);
                                reset();
                            }}
                            className="flex-1"
                            variant={isDOMError ? "default" : "outline"}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>

                        <Button
                            onClick={() => {
                                logger.info('User navigated to home from error boundary', {
                                    errorType,
                                    component: 'ErrorBoundary'
                                }, LOG_CATEGORIES.NAVIGATION);
                                window.location.href = '/';
                            }}
                            variant="outline"
                            className="flex-1"
                        >
                            Go Home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 