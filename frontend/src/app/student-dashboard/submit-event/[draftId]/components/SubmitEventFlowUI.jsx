/**
 * SubmitEventFlowUI Components
 * 
 * Purpose: Reusable UI components extracted from SubmitEventFlow
 * Approach: Component extraction for better maintainability and reusability
 * Coverage: Loading, error, header, and debug components
 * 
 * Key Benefits:
 * - ✅ Single Responsibility Principle: Each component has one focus
 * - ✅ Reusability: Components can be used across different parts of the app
 * - ✅ Testability: Isolated components are easier to test
 * - ✅ Maintainability: Changes to UI don't affect business logic
 * - ✅ Performance: Memoized components prevent unnecessary re-renders
 */

import { memo } from 'react';
import { STEPS } from '../utils';

// ✅ EXTRACTED: Loading Spinner Component
export const LoadingSpinner = memo(() => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"
                role="status"
                aria-label="Loading"
            />
            <p className="text-gray-600">Initializing proposal...</p>
        </div>
    </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

// ✅ EXTRACTED: Error Display Component
export const ErrorDisplay = memo(({ error, onRetry, title = "Error Initializing Proposal" }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-red-800 font-semibold mb-2">{title}</h3>
                <p className="text-red-600 text-sm">{error}</p>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                >
                    Retry
                </button>
            )}
        </div>
    </div>
));

ErrorDisplay.displayName = 'ErrorDisplay';

// ✅ EXTRACTED: Proposal Header Component
export const ProposalHeader = memo(({
    proposalUuid,
    currentStep,
    currentStepIndex,
    proposalData,
    title = "Event Proposal Submission"
}) => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {title}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        UUID: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {proposalUuid}
                        </span>
                    </p>
                    {currentStep && (
                        <p className="text-gray-500 text-sm mt-1">
                            Step {currentStepIndex + 1} of {STEPS.length}: {currentStep.name}
                        </p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="text-sm font-medium text-gray-900">
                        {proposalData?.status || 'Unknown'}
                    </p>
                </div>
            </div>
        </div>
    </div>
));

ProposalHeader.displayName = 'ProposalHeader';

// ✅ EXTRACTED: Debug Panel Component
export const DebugPanel = memo(({
    proposalUuid,
    currentStep,
    currentStepIndex,
    pathname,
    proposalData,
    className = "fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs"
}) => (
    <div className={className}>
        <div>UUID: {proposalUuid}</div>
        <div>Status: {proposalData?.status}</div>
        <div>Step: {currentStep?.name} ({currentStepIndex + 1}/{STEPS.length})</div>
        <div>Path: {pathname}</div>
    </div>
));

DebugPanel.displayName = 'DebugPanel';

// ✅ EXTRACTED: Step Progress Component
export const StepProgress = memo(({ currentStepIndex, totalSteps, steps = STEPS }) => (
    <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
                Step {currentStepIndex + 1} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
                {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% Complete
            </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
            <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
            />
        </div>
        <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
                <div
                    key={step.name}
                    className={`text-xs ${index <= currentStepIndex
                            ? 'text-blue-600 font-medium'
                            : 'text-gray-400'
                        }`}
                >
                    {step.name}
                </div>
            ))}
        </div>
    </div>
));

StepProgress.displayName = 'StepProgress';

// ✅ EXTRACTED: Content Container Component
export const ContentContainer = memo(({
    children,
    isOverviewPage,
    className = ""
}) => (
    <div className={`${isOverviewPage ? '' : 'max-w-7xl mx-auto px-6 py-8'} ${className}`}>
        {children}
    </div>
));

ContentContainer.displayName = 'ContentContainer';

// ✅ EXTRACTED: Grid Layout Component
export const GridLayout = memo(({
    children,
    leftColumn,
    rightColumn,
    className = "grid grid-cols-1 lg:grid-cols-3 gap-8"
}) => (
    <div className={className}>
        <div className="lg:col-span-2">
            {leftColumn}
        </div>
        <div className="lg:col-span-1">
            {rightColumn}
        </div>
    </div>
));

GridLayout.displayName = 'GridLayout';



