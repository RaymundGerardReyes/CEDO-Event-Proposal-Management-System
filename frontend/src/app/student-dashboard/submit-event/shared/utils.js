/**
 * Shared Utilities for Submit Event Flow
 * Purpose: Consolidated utility functions to eliminate redundancy
 * Approach: Single source of truth for common functionality
 */

import { Calendar, CheckCircle, FileText, Users } from 'lucide-react';

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

export const STEP_CONFIG = {
    OVERVIEW: {
        name: "Overview",
        icon: <FileText className="h-5 w-5" />,
        description: "Start your proposal",
        path: '/overview',
        index: 0
    },
    EVENT_TYPE: {
        name: "Event Type",
        icon: <Calendar className="h-5 w-5" />,
        description: "Choose event type",
        path: '/event-type',
        index: 1
    },
    ORGANIZATION: {
        name: "Organization",
        icon: <Users className="h-5 w-5" />,
        description: "Organization details",
        path: '/organization',
        index: 2
    },
    EVENT_DETAILS: {
        name: "Event Details",
        icon: <Calendar className="h-5 w-5" />,
        description: "Event information",
        path: '/school-event',
        alternativePaths: ['/community-event'],
        index: 3
    },
    REPORTING: {
        name: "Reporting",
        icon: <CheckCircle className="h-5 w-5" />,
        description: "Submit report",
        path: '/reporting',
        index: 4
    }
};

export const STEPS = [
    STEP_CONFIG.OVERVIEW,
    STEP_CONFIG.EVENT_TYPE,
    STEP_CONFIG.ORGANIZATION,
    STEP_CONFIG.EVENT_DETAILS,
    STEP_CONFIG.REPORTING
];

// ============================================================================
// STEP UTILITIES
// ============================================================================

export const getCurrentStepIndex = (pathname) => {
    if (!pathname) return 0;

    const path = pathname.toLowerCase();

    for (const step of STEPS) {
        if (path.includes(step.path)) {
            return step.index;
        }
        // Check alternative paths for event details
        if (step.alternativePaths) {
            for (const altPath of step.alternativePaths) {
                if (path.includes(altPath)) {
                    return step.index;
                }
            }
        }
    }

    return 0; // Default to overview
};

export const getStepByIndex = (index) => {
    return STEPS[index] || STEPS[0];
};

export const getStepByPath = (pathname) => {
    const index = getCurrentStepIndex(pathname);
    return getStepByIndex(index);
};

export const getProgressPercentage = (currentIndex) => {
    return Math.round(((currentIndex + 1) / STEPS.length) * 100);
};

export const isStepComplete = (currentIndex, targetIndex) => {
    return currentIndex >= targetIndex;
};

export const getNextStep = (currentIndex) => {
    const nextIndex = Math.min(currentIndex + 1, STEPS.length - 1);
    return getStepByIndex(nextIndex);
};

export const getPreviousStep = (currentIndex) => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    return getStepByIndex(prevIndex);
};

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export const createErrorBoundaryConfig = (componentName) => ({
    onError: (error, errorInfo) => {
        console.error(`❌ ${componentName} Error Boundary caught error:`, error);
        console.error('Error Info:', errorInfo);
    },
    onReset: () => {
        console.log(`🔄 ${componentName} Error Boundary reset`);
    }
});

export const handleHookError = (error, resetFunction, componentName = 'Unknown') => {
    if (!error) {
        console.warn('handleHookError called with null/undefined error');
        return () => { };
    }

    const errorContext = {
        context: 'hook-error',
        component: componentName,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        errorType: classifyError(error)
    };

    console.error('Hook error occurred:', error, errorContext);

    if (shouldAttemptRecovery(error, errorContext.errorType)) {
        if (typeof resetFunction === 'function') {
            try {
                resetFunction();
            } catch (resetError) {
                console.error('Reset function failed:', resetError);
            }
        }
    }

    return function cleanup() {
        try {
            console.log('Hook error cleanup completed');
        } catch (cleanupError) {
            console.warn('Cleanup logging failed:', cleanupError);
        }
    };
};

function classifyError(error) {
    if (!error || !error.message) {
        return 'unknown-error';
    }

    const message = error.message.toLowerCase();
    const name = error.name?.toLowerCase() || '';

    if (message.includes('used within') || message.includes('context') || message.includes('provider')) {
        return 'context-error';
    }

    if (name.includes('network') || message.includes('network') || message.includes('fetch')) {
        return 'network-error';
    }

    if (name.includes('validation') || message.includes('validation') || message.includes('invalid')) {
        return 'validation-error';
    }

    if (error.critical || name.includes('critical') || message.includes('critical')) {
        return 'critical-error';
    }

    return 'general-error';
}

function shouldAttemptRecovery(error, errorType) {
    if (errorType === 'critical-error') {
        return false;
    }

    if (error.noRecovery) {
        return false;
    }

    return ['context-error', 'general-error', 'validation-error'].includes(errorType);
}

// ============================================================================
// PARAMETER RESOLUTION
// ============================================================================

export function resolveParams(params, fallbackFn) {
    if (!params) {
        return fallbackFn ? fallbackFn() : {};
    }

    // Check if params is a Promise (Next.js 15+)
    if (params && typeof params.then === 'function') {
        try {
            const React = require('react');
            return React.use(params);
        } catch (error) {
            console.error('Error resolving params Promise:', error);
            return fallbackFn ? fallbackFn() : {};
        }
    }

    // If params is already an object, return it directly
    if (typeof params === 'object' && params !== null) {
        return params;
    }

    // Fallback to provided function
    return fallbackFn ? fallbackFn() : {};
}

// ============================================================================
// SAFE API UTILITIES
// ============================================================================

export async function safeJsonParse(response, context = 'api-response', metadata = {}) {
    try {
        const contentType = typeof response?.headers?.get === 'function'
            ? (response.headers.get('content-type') || '')
            : '';

        if (contentType.toLowerCase().includes('text/html')) {
            try {
                const previewText = await (typeof response.clone === 'function' ? response.clone() : response).text();
                console.warn(`Received HTML error response for ${context}`, {
                    status: response.status,
                    statusText: response.statusText,
                    context,
                    responsePreview: previewText.substring(0, 200),
                    ...metadata
                });
            } catch (_) {
                // ignore preview failures
            }
            throw new Error(`Server returned HTML error page (${response.status} ${response.statusText})`);
        }

        const result = await response.json();
        return result;
    } catch (jsonError) {
        if (jsonError.message && jsonError.message.includes('Unexpected token <')) {
            try {
                const responseText = await (typeof response.clone === 'function' ? response.clone() : response).text();

                if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
                    console.warn(`Received HTML error response for ${context}`, {
                        status: response.status,
                        statusText: response.statusText,
                        context,
                        responsePreview: responseText.substring(0, 200),
                        ...metadata
                    });

                    throw new Error(`Server returned HTML error page (${response.status} ${response.statusText})`);
                }

                console.error(`Received malformed response for ${context}`, {
                    status: response.status,
                    statusText: response.statusText,
                    context,
                    responsePreview: responseText.substring(0, 200),
                    ...metadata
                });

                throw new Error(`Server returned malformed response (${response.status} ${response.statusText})`);
            } catch (textError) {
                throw jsonError;
            }
        }

        throw jsonError;
    }
}

export async function safeFetch(url, options = {}, context = 'api-call', metadata = {}) {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            try {
                const errorData = await safeJsonParse(response, `${context}-error`, metadata);
                throw new Error(errorData.error || `HTTP ${response.status}`);
            } catch (parseError) {
                throw parseError;
            }
        }

        return await safeJsonParse(response, context, metadata);
    } catch (error) {
        console.error(`Error in ${context}`, error, {
            url,
            context,
            ...metadata
        });
        throw error;
    }
}

// ============================================================================
// FALLBACK UTILITIES
// ============================================================================

export const createFallbackState = () => ({
    draftId: null,
    pathname: '',
    currentStepIndex: 0,
    currentStep: STEPS[0],
    proposalUuid: null,
    proposalData: null,
    loading: false,
    error: 'Failed to initialize',
    initializeProposal: () => { },
    handleProposalUpdate: () => { },
    pageInfo: { isOverviewPage: false },
    layoutConfig: { showHeader: true, showDebugPanel: false, containerClass: '' },
    errorHandlers: { handleRetry: () => window.location.reload() },
    isValidState: false,
    totalSteps: STEPS.length,
    currentStepNumber: 1,
    isLastStep: false,
    isFirstStep: true
});

export const createFallbackProposalData = () => ({
    status: 'draft',
    form_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
});

export const generateFallbackUuid = () =>
    `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
