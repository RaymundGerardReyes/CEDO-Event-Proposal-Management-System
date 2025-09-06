/**
 * useSubmitEventFlow Custom Hook
 * 
 * Purpose: Encapsulate all SubmitEventFlow logic for reusability and testing
 * Approach: Custom hook pattern for shared logic across components
 * Coverage: State management, navigation, error handling, and performance optimization
 * 
 * Key Benefits:
 * - ✅ Reusable logic across different components
 * - ✅ Easier testing with isolated business logic
 * - ✅ Better separation of concerns
 * - ✅ Performance optimization with memoization
 * - ✅ Centralized error handling
 */

import { useParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { createFallbackState, getCurrentStepIndex, resolveParams, STEPS } from '../../shared/utils';
import { useProposalFlow } from './useProposalFlow';

export const useSubmitEventFlow = (customParams) => {
    try {
        // ✅ DESTRUCTURING: Clean parameter handling with error handling
        const resolvedParams = resolveParams(customParams, useParams());
        const { draftId } = resolvedParams || {};
        const pathname = usePathname();

        // ✅ HOOK INTEGRATION: Use existing proposal flow hook with error handling
        let proposalFlow;
        try {
            proposalFlow = useProposalFlow(draftId);
        } catch (proposalError) {
            console.error('useProposalFlow Error:', proposalError);
            // Return fallback state using shared utility
            return {
                ...createFallbackState(),
                draftId,
                pathname,
                error: 'Failed to initialize proposal flow'
            };
        }

        // ✅ MEMOIZED: Expensive computations
        const currentStepIndex = useMemo(() => getCurrentStepIndex(pathname), [pathname]);
        const currentStep = useMemo(() => STEPS[currentStepIndex], [currentStepIndex]);

        // ✅ CUSTOM LOGIC: Page detection with memoization
        const pageInfo = useMemo(() => ({
            isOverviewPage: pathname.includes('/overview'),
            isEventTypePage: pathname.includes('/event-type'),
            isOrganizationPage: pathname.includes('/organization'),
            isEventDetailsPage: pathname.includes('/event-details'),
            isReportingPage: pathname.includes('/reporting'),
            currentPath: pathname
        }), [pathname]);

        // ✅ LAYOUT CONFIGURATION: Memoized layout settings
        const layoutConfig = useMemo(() => ({
            showHeader: !pageInfo.isOverviewPage,
            showDebugPanel: !pageInfo.isOverviewPage,
            containerClass: pageInfo.isOverviewPage ? '' : 'max-w-7xl mx-auto px-6 py-8',
            gridLayout: !pageInfo.isOverviewPage
        }), [pageInfo.isOverviewPage]);

        // ✅ ERROR HANDLING: Centralized error management
        const errorHandlers = useMemo(() => ({
            handleRetry: () => {
                if (proposalFlow.error) {
                    proposalFlow.initializeProposal();
                }
            },
            handleError: (error) => {
                console.error('SubmitEventFlow Error:', error);
                // Could integrate with error reporting service here
            }
        }), [proposalFlow.error, proposalFlow.initializeProposal]);

        // ✅ PERFORMANCE OPTIMIZATION: Memoized callbacks
        const handleProposalUpdate = useCallback((updates) => {
            proposalFlow.handleProposalUpdate(updates);
        }, [proposalFlow.handleProposalUpdate]);

        // ✅ STATE VALIDATION: Ensure data integrity
        const isValidState = useMemo(() => {
            return proposalFlow.proposalUuid &&
                proposalFlow.proposalData &&
                !proposalFlow.loading &&
                !proposalFlow.error;
        }, [proposalFlow.proposalUuid, proposalFlow.proposalData, proposalFlow.loading, proposalFlow.error]);

        // ✅ RETURN: Comprehensive hook interface
        return {
            // Core state
            draftId,
            pathname,
            currentStepIndex,
            currentStep,

            // Proposal flow state
            proposalUuid: proposalFlow.proposalUuid,
            proposalData: proposalFlow.proposalData,
            loading: proposalFlow.loading,
            error: proposalFlow.error,

            // Actions
            initializeProposal: proposalFlow.initializeProposal,
            handleProposalUpdate,

            // Page information
            pageInfo,
            layoutConfig,

            // Error handling
            errorHandlers,

            // Validation
            isValidState,

            // Computed values
            totalSteps: STEPS.length,
            currentStepNumber: currentStepIndex + 1,
            isLastStep: currentStepIndex === STEPS.length - 1,
            isFirstStep: currentStepIndex === 0
        };
    } catch (error) {
        console.error('useSubmitEventFlow Error:', error);
        // Return safe fallback state using shared utility
        return {
            ...createFallbackState(),
            error: 'Failed to initialize submit event flow'
        };
    }
};



