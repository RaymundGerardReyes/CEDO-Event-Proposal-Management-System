'use client'

import { ErrorBoundary } from 'react-error-boundary';
import ErrorDisplay from './components/ErrorDisplay';

/**
 * Error Boundary for Event Submission Flow
 * Purpose: Catch and handle errors in the submit-event flow
 * Approach: Use ErrorDisplay component for consistent error UI
 */

function ErrorFallback({ error, resetErrorBoundary }) {
    console.error('Submit Event Error Boundary caught error:', error);

    return (
        <ErrorDisplay
            message="Something went wrong with the event submission"
            details={`Error: ${error.message}`}
            actionLabel="Try Again"
            actionHref="#"
        />
    );
}

export default function SubmitEventErrorBoundary({ children }) {
    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={(error, errorInfo) => {
                console.error('Submit Event Error:', error);
                console.error('Error Info:', errorInfo);
            }}
            onReset={() => {
                console.log('Submit Event Error Boundary reset');
            }}
        >
            {children}
        </ErrorBoundary>
    );
}








