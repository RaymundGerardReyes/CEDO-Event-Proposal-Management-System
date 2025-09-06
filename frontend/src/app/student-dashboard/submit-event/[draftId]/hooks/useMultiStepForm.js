/**
 * useMultiStepForm Hook (Refactored)
 * Centralized multi-step form management with improved step rendering
 * 
 * Key approaches: Unified step detection, centralized form state,
 * proper page integration, and robust navigation handling
 */

import { useToast } from '@/hooks/use-toast';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// 🔧 UNIFIED STEP CONFIGURATION
export const STEPS = [
    {
        name: "Overview",
        description: "Start your proposal",
        path: '/overview',
        index: 0,
        component: 'overview'
    },
    {
        name: "Event Type",
        description: "Choose event type",
        path: '/event-type',
        index: 1,
        component: 'event-type'
    },
    {
        name: "Organization",
        description: "Organization details",
        path: '/organization',
        index: 2,
        component: 'organization'
    },
    {
        name: "Event Details",
        description: "Event information",
        path: '/school-event',
        alternativePaths: ['/community-event'],
        index: 3,
        component: 'event-details'
    },
    {
        name: "Reporting",
        description: "Submit report",
        path: '/reporting',
        index: 4,
        component: 'reporting'
    }
];

export function useMultiStepForm(draftId) {
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    // 🔧 UNIFIED STATE MANAGEMENT
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // 🔧 IMPROVED STEP DETECTION
    const getCurrentStepIndex = useCallback((path) => {
        if (!path) return 0;

        const normalizedPath = path.toLowerCase();

        for (const step of STEPS) {
            // Check primary path
            if (normalizedPath.includes(step.path)) {
                return step.index;
            }
            // Check alternative paths
            if (step.alternativePaths) {
                for (const altPath of step.alternativePaths) {
                    if (normalizedPath.includes(altPath)) {
                        return step.index;
                    }
                }
            }
        }

        // Default to overview if no match found
        return 0;
    }, []);

    // 🔧 CENTRALIZED FORM DATA MANAGEMENT
    const loadFormData = useCallback(() => {
        if (typeof window === 'undefined') return {};

        try {
            const data = {};

            // Load from unified storage
            const unifiedData = localStorage.getItem('eventProposalFormData');
            if (unifiedData) {
                Object.assign(data, JSON.parse(unifiedData));
            }

            // Load event type specifically
            const eventTypeData = localStorage.getItem('eventTypeSelection');
            if (eventTypeData) {
                const eventType = JSON.parse(eventTypeData);
                data.eventType = eventType.eventType;
                data.selectedEventType = eventType.selectedEventType;
            }

            // Load current step
            const savedStep = localStorage.getItem('current_step');
            if (savedStep) {
                data.currentStep = parseInt(savedStep, 10);
            }

            console.log('✅ Loaded form data:', data);
            return data;
        } catch (error) {
            console.error('❌ Error loading form data:', error);
            return {};
        }
    }, []);

    const saveFormData = useCallback((data) => {
        if (typeof window === 'undefined') return;

        try {
            // Save to unified storage
            localStorage.setItem('eventProposalFormData', JSON.stringify(data));

            // Save current step separately
            if (data.currentStep !== undefined) {
                localStorage.setItem('current_step', data.currentStep.toString());
            }

            console.log('✅ Saved form data:', data);
        } catch (error) {
            console.error('❌ Error saving form data:', error);
        }
    }, []);

    // 🔧 INITIALIZATION
    useEffect(() => {
        if (!isInitialized && draftId) {
            const loadedData = loadFormData();
            setFormData(loadedData);

            // Set current step based on pathname
            const stepIndex = getCurrentStepIndex(pathname);
            setCurrentStep(stepIndex);

            setIsInitialized(true);
            console.log('✅ useMultiStepForm initialized:', { stepIndex, pathname, draftId });
        }
    }, [draftId, pathname, isInitialized, loadFormData, getCurrentStepIndex]);

    // 🔧 PATHNAME CHANGE HANDLER
    useEffect(() => {
        if (isInitialized) {
            const newStepIndex = getCurrentStepIndex(pathname);
            if (newStepIndex !== currentStep) {
                setCurrentStep(newStepIndex);
                setFormData(prev => {
                    const updated = { ...prev, currentStep: newStepIndex };
                    saveFormData(updated);
                    return updated;
                });
                console.log('🔄 Step changed:', { from: currentStep, to: newStepIndex, pathname });
            }
        }
    }, [pathname, isInitialized, currentStep, getCurrentStepIndex, saveFormData]);

    // 🔧 UNIFIED INPUT HANDLER
    const handleInputChange = useCallback((event) => {
        const { name, value, type, checked } = event.target;
        const inputValue = type === 'checkbox' ? checked : value;

        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: inputValue
            };
            saveFormData(updated);
            return updated;
        });

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [validationErrors, saveFormData]);

    // 🔧 IMPROVED NAVIGATION
    const goToStep = useCallback((stepIndex) => {
        if (stepIndex >= 0 && stepIndex < STEPS.length) {
            const step = STEPS[stepIndex];
            const targetPath = `/student-dashboard/submit-event/${draftId}${step.path}`;

            console.log('🎯 Navigating to step:', { stepIndex, step: step.name, path: targetPath });
            router.push(targetPath);
        }
    }, [draftId, router]);

    const goToNextStep = useCallback(() => {
        if (currentStep < STEPS.length - 1) {
            goToStep(currentStep + 1);
        }
    }, [currentStep, goToStep]);

    const goToPreviousStep = useCallback(() => {
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        }
    }, [currentStep, goToStep]);

    // 🔧 ENHANCED EVENT TYPE HANDLER
    const handleEventTypeSelect = useCallback(async (eventType) => {
        console.log('🚀 handleEventTypeSelect called with eventType:', eventType);

        try {
            setLoading(true);

            // Update form data
            const updatedData = {
                ...formData,
                eventType: eventType,
                selectedEventType: eventType
            };
            setFormData(updatedData);

            // Save to localStorage
            saveFormData(updatedData);

            // Save event type specifically
            if (typeof window !== 'undefined') {
                const eventTypeData = {
                    eventType: eventType,
                    selectedEventType: eventType,
                    draftId: draftId,
                    timestamp: Date.now()
                };
                localStorage.setItem('eventTypeSelection', JSON.stringify(eventTypeData));
            }

            toast({
                title: "Event Type Saved",
                description: `Your selection has been saved successfully.`,
                variant: "default",
            });

            // Navigate to organization (next step)
            goToNextStep();
        } catch (error) {
            console.error('Failed to save event type:', error);
            toast({
                title: "Error",
                description: "Failed to save event type selection. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [formData, draftId, goToNextStep, toast, saveFormData]);

    // 🔧 ORGANIZATION NAVIGATION HANDLER
    const handleOrganizationNext = useCallback(() => {
        const eventType = formData.eventType;
        console.log('🔍 handleOrganizationNext - eventType:', eventType);

        if (eventType === 'community-based') {
            router.push(`/student-dashboard/submit-event/${draftId}/community-event`);
        } else {
            router.push(`/student-dashboard/submit-event/${draftId}/school-event`);
        }
    }, [formData.eventType, draftId, router]);

    // 🔧 PROGRESS CALCULATION
    const progressPercentage = Math.round(((currentStep + 1) / STEPS.length) * 100);

    // 🔧 VALIDATION
    const validateStep = useCallback((stepIndex) => {
        const step = STEPS[stepIndex];
        const errors = {};

        // Step-specific validation
        switch (stepIndex) {
            case 1: // Event Type
                if (!formData.eventType) {
                    errors.eventType = 'Event type is required';
                }
                break;
            case 2: // Organization
                if (!formData.organizationName) {
                    errors.organizationName = 'Organization name is required';
                }
                break;
            // Add more validation as needed
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // 🔧 FORM DATA UPDATE
    const updateFormData = useCallback((newData) => {
        setFormData(prev => {
            const updated = { ...prev, ...newData };
            saveFormData(updated);
            return updated;
        });
    }, [saveFormData]);

    // 🔧 RESET FUNCTION
    const resetForm = useCallback(() => {
        setFormData({});
        setValidationErrors({});
        setCurrentStep(0);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('eventProposalFormData');
            localStorage.removeItem('eventTypeSelection');
            localStorage.removeItem('current_step');
        }
    }, []);

    return {
        // State
        currentStep,
        formData,
        validationErrors,
        loading,
        isInitialized,

        // Computed values
        progressPercentage,
        currentStepData: STEPS[currentStep],
        totalSteps: STEPS.length,

        // Navigation
        goToStep,
        goToNextStep,
        goToPreviousStep,
        nextStep: goToNextStep,
        prevStep: goToPreviousStep,

        // Form handling
        handleInputChange,
        updateFormData,
        validateStep,
        resetForm,

        // Event handlers
        handleEventTypeSelect,
        handleOrganizationNext,

        // Utilities
        hasValidationErrors: Object.keys(validationErrors).length > 0,
        isStepComplete: (stepIndex) => currentStep >= stepIndex,
        getStepByIndex: (index) => STEPS[index] || STEPS[0]
    };
}
