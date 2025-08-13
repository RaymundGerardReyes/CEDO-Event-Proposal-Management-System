/**
 * Minimal Utils Index for Event Submission Flow
 * Purpose: Re-export essential functions after cleanup
 * Approach: Import from existing utilities and re-export for compatibility
 */

// Re-export step configuration functions
export {
    getCurrentStepIndex, getNextStep,
    getPreviousStep, getProgressPercentage, getStepByIndex,
    getStepByPath, isStepComplete, STEPS
} from './stepConfig';

// Re-export error handling functions
export {
    createErrorBoundaryConfig, handleHookError, resolveParams, safeFetch, safeJsonParse, withHookErrorHandling
} from './errorHandling';

// Re-export error handling functions from main utils
export { withErrorLogging } from '@/utils/logger';

// Simple error boundary config creator
export const createEventSubmissionErrorBoundaryConfig = (componentName) => ({
    onError: (error, errorInfo) => {
        console.error(`❌ ${componentName} Error Boundary caught error:`, error);
        console.error('Error Info:', errorInfo);
    },
    onReset: () => {
        console.log(`🔄 ${componentName} Error Boundary reset`);
    }
});



