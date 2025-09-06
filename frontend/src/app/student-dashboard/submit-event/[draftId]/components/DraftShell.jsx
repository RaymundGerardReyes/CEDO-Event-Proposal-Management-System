/**
 * DraftShell Component
 * 
 * Purpose: Wrapper component for UUID-based draft proposal flow
 * Approach: Provides draft context, layout structure, and proposal management
 * Coverage: Draft initialization, error handling, loading states, and child component rendering
 * 
 * Key Features:
 * - UUID-based draft management
 * - Proposal data context
 * - Error boundary and loading states
 * - Responsive layout structure
 */

'use client';

import { useProposalFlow } from '../hooks/useProposalFlow';

export default function DraftShell({
    children,
    proposalUuid,
    onProposalUpdate,
    currentStepIndex = 0,
    currentStep = null
}) {
    const {
        proposalData,
        loading,
        error,
        initializeProposal
    } = useProposalFlow(proposalUuid);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading proposal data...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <h3 className="text-red-800 font-semibold mb-2">Error Loading Proposal</h3>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                    <button
                        onClick={initializeProposal}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Main content wrapper
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Draft header */}
            <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Draft Proposal
                        </h2>
                        <p className="text-sm text-gray-500">
                            UUID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                {proposalUuid}
                            </span>
                        </p>
                        {currentStep && (
                            <p className="text-xs text-gray-400 mt-1">
                                Step {currentStepIndex + 1}: {currentStep.name}
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {proposalData?.status || 'Draft'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div className="p-6">
                {children}
            </div>

            {/* Development debug info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
                    <div className="text-xs text-gray-500 space-y-1">
                        <div>UUID: {proposalUuid}</div>
                        <div>Status: {proposalData?.status}</div>
                        {currentStep && (
                            <div>Step: {currentStep.name} ({currentStepIndex + 1})</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
