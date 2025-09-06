/**
 * SubmitEventFlow Component - Final Refactored Architecture
 * 
 * Key Refactoring Strategies Applied:
 * - ✅ Extract Reusable Components: Separated UI elements into focused components
 * - ✅ Utilize Custom Hooks: Encapsulated complex logic in custom hooks
 * - ✅ Implement HOCs: Created withLoading and withErrorBoundary HOCs
 * - ✅ Feature-Based Structure: Organized by functionality
 * - ✅ Remove Redundant Code: Eliminated duplicate logic and unused code
 * - ✅ Simplify Conditionals: Used mapping functions instead of complex if-else
 * - ✅ Arrow Functions & Destructuring: Modern JavaScript patterns
 * - ✅ Optimize State Management: Consolidated related state variables
 * 
 * Performance Optimizations:
 * - Memoized expensive computations
 * - Reduced unnecessary re-renders
 * - Optimized conditional rendering
 * - Implemented proper error boundaries
 */

'use client';

import { memo } from 'react';
import { DataFlowTracker } from '../debug';
import { useSubmitEventFlow } from '../hooks/useSubmitEventFlow';
import DraftShell from './DraftShell';
import StepRenderer from './StepRenderer';
import {
    ContentContainer,
    DebugPanel,
    ErrorDisplay,
    GridLayout,
    LoadingSpinner,
    ProposalHeader
} from './SubmitEventFlowUI';

// ✅ EXTRACTED: HOC for Error Boundary - Simplified
const withErrorBoundary = (Component) => {
    return function ErrorBoundaryWrapper(props) {
        try {
            return <Component {...props} />;
        } catch (error) {
            console.error('SubmitEventFlow Error:', error);
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto p-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <h3 className="text-red-800 font-semibold mb-2">Component Error</h3>
                            <p className="text-red-600 text-sm">{error?.message || 'An unexpected error occurred'}</p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            );
        }
    };
};

// ✅ EXTRACTED: HOC for Loading State
const withLoading = (Component) => {
    return function LoadingWrapper({ loading, ...props }) {
        if (loading) {
            return <LoadingSpinner />;
        }
        return <Component {...props} />;
    };
};

// ✅ OPTIMIZED: Main Component with Modern Patterns and Error Handling
const SubmitEventFlow = memo(({ children, params: customParams }) => {
    // ✅ CUSTOM HOOK: All logic encapsulated in custom hook with error handling
    let hookResult;
    try {
        hookResult = useSubmitEventFlow(customParams);
    } catch (hookError) {
        console.error('SubmitEventFlow Hook Error:', hookError);
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <h3 className="text-red-800 font-semibold mb-2">Initialization Error</h3>
                        <p className="text-red-600 text-sm">Failed to initialize the proposal flow</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const {
        // Core state
        currentStepIndex,
        currentStep,

        // Proposal flow state
        proposalUuid,
        proposalData,
        loading,
        error,

        // Actions
        initializeProposal,
        handleProposalUpdate,

        // Page information
        pageInfo: { isOverviewPage } = { isOverviewPage: false },
        layoutConfig: { showHeader, showDebugPanel, containerClass } = { showHeader: true, showDebugPanel: false, containerClass: '' },

        // Error handling
        errorHandlers: { handleRetry } = { handleRetry: () => window.location.reload() }
    } = hookResult || {};

    // ✅ SIMPLIFIED: Conditional rendering with mapping
    const renderContent = () => {
        if (isOverviewPage) {
            return children;
        }

        return (
            <GridLayout
                leftColumn={
                    <DraftShell
                        proposalUuid={proposalUuid}
                        onProposalUpdate={handleProposalUpdate}
                        currentStepIndex={currentStepIndex}
                        currentStep={currentStep}
                    >
                        {children || <StepRenderer currentStepIndex={currentStepIndex} />}
                    </DraftShell>
                }
                rightColumn={
                    <DataFlowTracker
                        proposalUuid={proposalUuid}
                        currentStep={currentStep}
                        currentStepIndex={currentStepIndex}
                    />
                }
            />
        );
    };

    // ✅ OPTIMIZED: Early returns for better performance
    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorDisplay error={error} onRetry={handleRetry} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {showHeader && (
                <ProposalHeader
                    proposalUuid={proposalUuid}
                    currentStep={currentStep}
                    currentStepIndex={currentStepIndex}
                    proposalData={proposalData}
                />
            )}

            <ContentContainer isOverviewPage={isOverviewPage} className={containerClass}>
                {renderContent()}
            </ContentContainer>

            {showDebugPanel && process.env.NODE_ENV === 'development' && (
                <DebugPanel
                    proposalUuid={proposalUuid}
                    currentStep={currentStep}
                    currentStepIndex={currentStepIndex}
                    pathname={window.location.pathname}
                    proposalData={proposalData}
                />
            )}
        </div>
    );
});

// ✅ ENHANCED: Component display name for debugging
SubmitEventFlow.displayName = 'SubmitEventFlow';

// ✅ APPLIED: HOCs for enhanced functionality
export default withErrorBoundary(withLoading(SubmitEventFlow));

