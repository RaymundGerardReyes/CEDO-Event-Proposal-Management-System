'use client'
import Stepper from '@/components/Stepper'
import { DraftContext } from '@/context/draft-context'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }) {
    console.error('DraftShell Error:', error)

    useEffect(() => {
        // Auto-recover from hooks errors
        if (error?.message?.includes('hook')) {
            const timer = setTimeout(() => {
                console.log('Auto-recovering from hooks error...')
                resetErrorBoundary()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [error, resetErrorBoundary])

    return (
        <div className="p-4 text-center">
            <h2 className="text-lg font-semibold mb-2">Loading...</h2>
            <p className="text-gray-600">Initializing form...</p>
        </div>
    )
}

export default function DraftShell({ draft, pathname, children }) {
    // Stabilize props to prevent rapid re-renders
    const [stableDraft, setStableDraft] = useState(draft)
    const [stablePathname, setStablePathname] = useState(pathname)

    useEffect(() => {
        if (draft && JSON.stringify(draft) !== JSON.stringify(stableDraft)) {
            setStableDraft(draft)
        }
    }, [draft, stableDraft])

    useEffect(() => {
        if (pathname !== stablePathname) {
            setStablePathname(pathname)
        }
    }, [pathname, stablePathname])

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={(error, errorInfo) => {
                console.error('DraftShell caught error:', error, errorInfo)
            }}
            onReset={() => {
                console.log('DraftShell error boundary reset')
            }}
        >
            <DraftContext.Provider value={stableDraft}>
                <Stepper pathname={stablePathname} />
                {children}
            </DraftContext.Provider>
        </ErrorBoundary>
    )
}