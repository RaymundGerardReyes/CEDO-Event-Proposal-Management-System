'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error for debugging
        console.error('Global Error Boundary caught:', error);

        // Special handling for DOM manipulation errors
        if (error.message && error.message.includes('removeChild')) {
            console.log('DOM manipulation error detected, attempting automatic recovery...');

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

                console.log('DOM cleanup completed, attempting automatic reset...');

                // Attempt automatic recovery after a brief delay
                setTimeout(() => {
                    reset();
                }, 1000);

            } catch (cleanupError) {
                console.warn('Error during DOM cleanup:', cleanupError.message);
            }
        }
    }, [error, reset]);

    // Check if this is a DOM manipulation error
    const isDOMError = error.message && error.message.includes('removeChild');

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
                            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                                {error.message}
                            </pre>
                        </details>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            onClick={reset}
                            className="flex-1"
                            variant={isDOMError ? "default" : "outline"}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                        </Button>

                        <Button
                            onClick={() => window.location.href = '/'}
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