'use client'

import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Safe serializer to avoid circular JSON errors and DOM nodes
function safeSerialize(value) {
    try {
        const seen = new WeakSet();
        const replacer = (_key, val) => {
            if (typeof val === 'function') return '[Function]';
            if (typeof Element !== 'undefined' && val instanceof Element) return '[DOM Element]';
            if (val && typeof val === 'object') {
                if (seen.has(val)) return '[Circular]';
                seen.add(val);
            }
            return val;
        };
        return JSON.stringify(value, replacer);
    } catch (_) {
        try {
            return String(value);
        } catch (__) {
            return '[Unserializable]';
        }
    }
}

// Router hooks error fallback
function RouterErrorFallback({ error, resetErrorBoundary }) {
    // ✅ FIX: Proper error logging with detailed information
    const errorDetails = {
        message: error?.message || 'Unknown router error',
        name: error?.name || 'Error',
        stack: error?.stack || 'No stack trace',
        type: typeof error,
        stringified: error?.toString() || 'Cannot convert to string'
    };

    console.error('Router hooks error:', safeSerialize(errorDetails));
    console.error('Raw error message:', errorDetails.message);

    useEffect(() => {
        // Auto-recovery for hooks-related errors
        if (error?.message?.includes('hook') || error?.message?.includes('render')) {
            console.log('🔄 Auto-recovering from router hooks error...')
            const timer = setTimeout(resetErrorBoundary, 100)
            return () => clearTimeout(timer)
        }
    }, [error, resetErrorBoundary])

    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
            </div>
        </div>
    )
}

// Stabilized wrapper with delayed mounting
function StabilizedWrapper({ children }) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        // Delay mounting to ensure Next.js router is fully initialized
        const timer = setTimeout(() => {
            setIsMounted(true)
        }, 50)

        return () => clearTimeout(timer)
    }, [])

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing...</p>
                </div>
            </div>
        )
    }

    return children
}

// Main stabilizer component
export default function RouterStabilizer({ children }) {
    return (
        <ErrorBoundary
            FallbackComponent={RouterErrorFallback}
            onError={(error, errorInfo) => {
                // ✅ FIX: Enhanced error logging with complete details
                const errorDetails = {
                    message: error?.message || 'Unknown error',
                    name: error?.name || 'Error',
                    stack: error?.stack || 'No stack trace',
                    isHooksError: error?.message?.includes('hook') || false,
                    isRenderError: error?.message?.includes('render') || false,
                    componentStack: errorInfo?.componentStack || 'No component stack'
                };

                console.error('RouterStabilizer caught error:', safeSerialize(errorDetails));
                console.error('Raw error message:', error?.message || String(error));
                // Only log the component stack string to avoid circular structures
                if (errorInfo?.componentStack) {
                    console.error('Component stack:', errorInfo.componentStack);
                }
            }}
            onReset={() => {
                console.log('RouterStabilizer reset - attempting recovery')
            }}
        >
            <StabilizedWrapper>
                {children}
            </StabilizedWrapper>
        </ErrorBoundary>
    )
} 