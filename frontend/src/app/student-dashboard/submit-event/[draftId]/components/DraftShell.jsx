'use client'

import { DraftProvider } from '@/contexts/draft-context'
import { useEffect, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { EnhancedProgressBar, MobileProgressBar } from '../../components'
import { STEPS, createEventSubmissionErrorBoundaryConfig, getCurrentStepIndex, handleHookError } from '../utils'

// 🔧 ERROR FALLBACK COMPONENT: Centralized error handling
function ErrorFallback({ error, resetErrorBoundary }) {
    console.error('DraftShell Error:', error)

    useEffect(() => {
        // Auto-recover from hooks errors using shared utility
        return handleHookError(error, resetErrorBoundary);
    }, [error, resetErrorBoundary])

    // Check if it's a context error
    const isContextError = error.message.includes('useDraftContext must be used within a DraftProvider');

    return (
        <div className="p-4 text-center">
            <h2 className="text-lg font-semibold mb-2">
                {isContextError ? 'Context Error' : 'Loading...'}
            </h2>
            <p className="text-gray-600">
                {isContextError
                    ? 'Draft context is not available. Please refresh the page.'
                    : 'Initializing form...'
                }
            </p>
            {isContextError && (
                <button
                    onClick={resetErrorBoundary}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            )}
        </div>
    )
}

// 🔧 PROPS STABILIZATION: Prevent rapid re-renders
function useStableProps(draft, pathname) {
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

    return { stableDraft, stablePathname }
}

// 🔧 MAIN COMPONENT: DraftShell with improved organization
export default function DraftShell({ draft, pathname, children }) {
    // 🔧 STABLE PROPS: Use custom hook for prop stabilization
    const { stableDraft, stablePathname } = useStableProps(draft, pathname)

    // 🔧 CURRENT STEP: Use shared utility for step calculation
    const currentStepIndex = getCurrentStepIndex(stablePathname)

    // 🔧 ERROR BOUNDARY CONFIG: Use shared configuration
    const errorBoundaryConfig = createEventSubmissionErrorBoundaryConfig('DraftShell')

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={errorBoundaryConfig.onError}
            onReset={errorBoundaryConfig.onReset}
        >
            <DraftProvider initialDraft={stableDraft}>
                {/* 🔧 ENHANCED PROGRESS BAR */}
                <div className="mb-8">
                    {/* Desktop Enhanced Progress Bar */}
                    <div className="hidden sm:block">
                        <EnhancedProgressBar
                            steps={STEPS}
                            currentStepIndex={currentStepIndex}
                            showProgressPercentage={true}
                            showStepNumbers={true}
                            animated={true}
                        />
                    </div>

                    {/* Mobile Progress Bar */}
                    <div className="sm:hidden">
                        <MobileProgressBar
                            steps={STEPS}
                            currentStepIndex={currentStepIndex}
                        />
                    </div>
                </div>
                {/* 🔧 WRAP CHILDREN WITH CONTEXT AWARE COMPONENT */}
                <div className="draft-context-wrapper">
                    {children}
                </div>
            </DraftProvider>
        </ErrorBoundary>
    )
}