/**
 * [draftId] Layout Component - Simplified and Fixed
 * Purpose: Main layout wrapper for UUID-based proposal submission flow
 * Key approaches: Simplified error handling, proper context setup, reduced complexity
 * Refactor: Removed redundant error boundaries and simplified structure
 */

'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorDisplay from './components/ErrorDisplay';
import SubmitEventFlow from './components/SubmitEventFlow';

// Simplified error fallback component
function LayoutErrorFallback({ error, resetErrorBoundary }) {
    console.error('Layout Error Boundary caught an error:', error);

    return (
        <ErrorDisplay
            message="Layout initialization failed"
            details={error?.message || 'An unexpected error occurred'}
            actionLabel="Retry"
            actionHref="#"
        />
    );
}

// Simplified loading component
function LayoutLoading() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading proposal layout...</p>
            </div>
        </div>
    );
}

export default function DraftIdLayout({ children }) {
    return (
        <ErrorBoundary
            FallbackComponent={LayoutErrorFallback}
            onError={(error, errorInfo) => {
                console.error('Layout Error Boundary caught an error:', error, errorInfo);
            }}
        >
            <Suspense fallback={<LayoutLoading />}>
                <SubmitEventFlow>
                    {children}
                </SubmitEventFlow>
            </Suspense>
        </ErrorBoundary>
    );
}


