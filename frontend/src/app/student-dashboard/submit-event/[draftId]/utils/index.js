/**
 * Utils Index for Event Submission Flow - Refactored
 * Purpose: Re-export from shared utilities to eliminate redundancy
 * Approach: Single source of truth from shared utilities
 */

// Re-export all utilities from shared location
export {

    // Error handling
    createErrorBoundaryConfig, createFallbackProposalData,
    // Fallback utilities
    createFallbackState, generateFallbackUuid,
    // Step configuration
    getCurrentStepIndex, getNextStep, getPreviousStep, getProgressPercentage,
    getStepByIndex, getStepByPath, handleHookError, isStepComplete, resolveParams, safeFetch, safeJsonParse, STEP_CONFIG, STEPS
} from '../../shared/utils';

// Re-export logger for direct access
export { default as logger } from '@/utils/logger';

// Legacy compatibility - redirect to shared utilities
export const createEventSubmissionErrorBoundaryConfig = createErrorBoundaryConfig;



