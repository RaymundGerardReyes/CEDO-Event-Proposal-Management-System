/**
 * Shared Step Configuration for Event Submission Flow
 * Purpose: Centralize step definitions and progress tracking logic
 * Approach: Single source of truth for step configuration across components
 */

import { Calendar, CheckCircle, FileText, Users } from 'lucide-react';

// 🔧 STEP CONFIGURATION: Centralized step definitions
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

// 🔧 STEP ARRAY: Ordered array for progress tracking
export const STEPS = [
    STEP_CONFIG.OVERVIEW,
    STEP_CONFIG.EVENT_TYPE,
    STEP_CONFIG.ORGANIZATION,
    STEP_CONFIG.EVENT_DETAILS,
    STEP_CONFIG.REPORTING
];

// 🔧 UTILITY FUNCTIONS: Progress tracking helpers
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