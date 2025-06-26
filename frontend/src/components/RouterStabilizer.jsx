'use client'

import { useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Router hooks error fallback
function RouterErrorFallback({ error, resetErrorBoundary }) {
    console.error('Router hooks error:', error)

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
                console.error('RouterStabilizer caught error:', {
                    error: error.message,
                    isHooksError: error.message.includes('hook'),
                    componentStack: errorInfo.componentStack
                })
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