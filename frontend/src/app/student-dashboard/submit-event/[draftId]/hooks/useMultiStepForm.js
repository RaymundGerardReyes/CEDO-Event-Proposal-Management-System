/**
 * useMultiStepForm Hook
 * Shared logic for multi-step form management
 * 
 * Key approaches: Step navigation, form state management,
 * localStorage persistence, and validation handling
 */

import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// Step configuration
export const STEPS = [
    {
        name: "Overview",
        description: "Start your proposal",
        path: '/overview',
        index: 0
    },
    {
        name: "Event Type",
        description: "Choose event type",
        path: '/event-type',
        index: 1
    },
    {
        name: "Organization",
        description: "Organization details",
        path: '/organization',
        index: 2
    },
    {
        name: "Event Details",
        description: "Event information",
        path: '/school-event',
        alternativePaths: ['/community-event'],
        index: 3
    },
    {
        name: "Reporting",
        description: "Submit report",
        path: '/reporting',
        index: 4
    }
];

export function useMultiStepForm(draftId) {
    const router = useRouter();
    const { toast } = useToast();

    // State management
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Get current step based on pathname
    const getCurrentStepIndex = useCallback(() => {
        if (typeof window === 'undefined') return 0;

        const pathname = window.location.pathname;
        const path = pathname.toLowerCase();

        for (const step of STEPS) {
            if (path.includes(step.path)) {
                return step.index;
            }
            if (step.alternativePaths) {
                for (const altPath of step.alternativePaths) {
                    if (path.includes(altPath)) {
                        return step.index;
                    }
                }
            }
        }
        return 0;
    }, []);

    // Update current step when pathname changes
    useEffect(() => {
        setCurrentStep(getCurrentStepIndex());
    }, [getCurrentStepIndex]);

    // Load event type from localStorage on component mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const eventTypeSelection = localStorage.getItem('eventTypeSelection');
                const selectedEventType = localStorage.getItem('selectedEventType');

                if (eventTypeSelection) {
                    const parsed = JSON.parse(eventTypeSelection);
                    if (parsed.eventType) {
                        setFormData(prev => ({
                            ...prev,
                            eventType: parsed.eventType,
                            selectedEventType: parsed.eventType
                        }));
                        console.log('✅ Loaded event type from localStorage:', parsed.eventType);
                    }
                } else if (selectedEventType) {
                    setFormData(prev => ({
                        ...prev,
                        eventType: selectedEventType,
                        selectedEventType: selectedEventType
                    }));
                    console.log('✅ Loaded event type from localStorage (fallback):', selectedEventType);
                }
            } catch (error) {
                console.error('❌ Error loading event type from localStorage:', error);
            }
        }
    }, []);

    // Handle form data changes
    const handleInputChange = useCallback((event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    }, [validationErrors]);

    // Navigation functions
    const goToStep = useCallback((stepIndex) => {
        if (stepIndex >= 0 && stepIndex < STEPS.length) {
            const step = STEPS[stepIndex];
            router.push(`/student-dashboard/submit-event/${draftId}${step.path}`);
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

    // Event type selection handler
    const handleEventTypeSelect = useCallback(async (eventType) => {
        console.log('🚀 handleEventTypeSelect called with eventType:', eventType);

        try {
            setLoading(true);

            // Update form data with selected event type
            setFormData(prev => ({
                ...prev,
                eventType: eventType,
                selectedEventType: eventType
            }));

            // Save to localStorage for persistence
            if (typeof window !== 'undefined') {
                const eventTypeData = {
                    eventType: eventType,
                    selectedEventType: eventType,
                    draftId: draftId,
                    timestamp: Date.now()
                };

                localStorage.setItem('eventTypeSelection', JSON.stringify(eventTypeData));
                localStorage.setItem('selectedEventType', eventType);

                // Update existing form data if it exists
                const existingFormData = localStorage.getItem('eventProposalFormData');
                if (existingFormData) {
                    const parsed = JSON.parse(existingFormData);
                    const updatedFormData = {
                        ...parsed,
                        eventType: eventType,
                        selectedEventType: eventType
                    };
                    localStorage.setItem('eventProposalFormData', JSON.stringify(updatedFormData));
                }
            }

            // Show success message
            toast({
                title: "Event Type Saved",
                description: `Your selection has been saved successfully.`,
                variant: "default",
            });

            // Navigate based on event type
            if (eventType === 'school-based') {
                router.push(`/student-dashboard/submit-event/${draftId}/school-event`);
            } else if (eventType === 'community-based') {
                router.push(`/student-dashboard/submit-event/${draftId}/community-event`);
            } else {
                goToNextStep();
            }
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
    }, [draftId, goToNextStep, toast, router]);

    // Organization section handlers
    const handleOrganizationNext = useCallback(() => {
        const eventType = formData.eventType;
        console.log('🔍 handleOrganizationNext - eventType:', eventType);

        if (eventType === 'community-based') {
            router.push(`/student-dashboard/submit-event/${draftId}/community-event`);
        } else {
            router.push(`/student-dashboard/submit-event/${draftId}/school-event`);
        }
    }, [formData.eventType, draftId, router]);

    // Progress calculation
    const progressPercentage = Math.round(((currentStep + 1) / STEPS.length) * 100);

    // Navigation functions with localStorage persistence
    const nextStep = useCallback(() => {
        if (currentStep < STEPS.length - 1) {
            const nextStepIndex = currentStep + 1;
            setCurrentStep(nextStepIndex);
            if (typeof window !== 'undefined') {
                localStorage.setItem('current_step', nextStepIndex.toString());
            }
            goToNextStep();
        }
    }, [currentStep, goToNextStep]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            const prevStepIndex = currentStep - 1;
            setCurrentStep(prevStepIndex);
            if (typeof window !== 'undefined') {
                localStorage.setItem('current_step', prevStepIndex.toString());
            }
            goToPreviousStep();
        }
    }, [currentStep, goToPreviousStep]);

    const updateFormData = useCallback((newData) => {
        setFormData(prev => {
            const updated = { ...prev, ...newData };
            if (typeof window !== 'undefined') {
                localStorage.setItem('form_data', JSON.stringify(updated));
            }
            return updated;
        });
    }, []);

    const validateStep = useCallback((stepIndex) => {
        // Basic validation logic
        const step = STEPS[stepIndex];
        const errors = {};

        // Add validation logic here based on step
        if (stepIndex === 1 && !formData.eventType) {
            errors.eventType = 'Event type is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // Load from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedStep = localStorage.getItem('current_step');
            const savedFormData = localStorage.getItem('form_data');

            if (savedStep) {
                setCurrentStep(parseInt(savedStep, 10));
            }

            if (savedFormData) {
                try {
                    setFormData(JSON.parse(savedFormData));
                } catch (error) {
                    console.error('Error parsing saved form data:', error);
                }
            }
        }
    }, []);

    // Save formData to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && Object.keys(formData).length > 0) {
            localStorage.setItem('form_data', JSON.stringify(formData));
        }
    }, [formData]);

    // Save currentStep to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('current_step', currentStep.toString());
        }
    }, [currentStep]);

    return {
        currentStep,
        formData,
        validationErrors,
        loading,
        progressPercentage,
        nextStep,
        prevStep,
        updateFormData,
        validateStep,
        handleInputChange,
        goToStep,
        goToNextStep,
        goToPreviousStep,
        handleEventTypeSelect,
        handleOrganizationNext,
        hasValidationErrors: Object.keys(validationErrors).length > 0
    };
}
