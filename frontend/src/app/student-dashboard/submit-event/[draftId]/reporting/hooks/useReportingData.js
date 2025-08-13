/**
 * Custom Hook for Reporting Data Management
 * Purpose: Centralized state management for reporting functionality
 * Approach: Comprehensive state management with error handling and validation
 */

import { useToast } from '@/hooks/use-toast';
import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for managing reporting data
 * @param {Object} initialData - Initial data for the reporting form
 * @returns {Object} Reporting data state and operations
 */
export const useReportingData = (initialData = {}) => {
    const { toast } = useToast();

    // State management
    const [formData, setFormData] = useState({
        eventName: '',
        completionDetails: '',
        outcomeReporting: '',
        accomplishmentReportFile: null,
        ...initialData
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Computed values
    const isProposalApproved = initialData.proposalStatus === 'approved';
    const isFormComplete = formData.eventName && formData.completionDetails && formData.outcomeReporting;
    const hasValidationErrors = Object.keys(validationErrors).length > 0;
    const eventDetails = {
        name: formData.eventName,
        completionDetails: formData.completionDetails,
        outcomeReporting: formData.outcomeReporting,
        file: formData.accomplishmentReportFile
    };

    const progress = {
        eventName: formData.eventName ? 25 : 0,
        completionDetails: formData.completionDetails ? 50 : 0,
        outcomeReporting: formData.outcomeReporting ? 75 : 0,
        file: formData.accomplishmentReportFile ? 100 : 0
    };

    const canSubmit = isFormComplete && !hasValidationErrors && isProposalApproved;

    // Actions
    const updateFormData = useCallback((updates) => {
        setFormData(prev => ({ ...prev, ...updates }));
        setError(null);
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            Object.keys(updates).forEach(key => {
                if (newErrors[key]) delete newErrors[key];
            });
            return newErrors;
        });
    }, []);

    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.eventName?.trim()) {
            errors.eventName = 'Event name is required';
        }

        if (!formData.completionDetails?.trim()) {
            errors.completionDetails = 'Event completion details are required';
        }

        if (!formData.outcomeReporting?.trim()) {
            errors.outcomeReporting = 'Outcome reporting is required';
        }

        if (!formData.accomplishmentReportFile) {
            errors.accomplishmentReportFile = 'Accomplishment report file is required';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const submitReport = useCallback(async () => {
        if (!validateForm()) {
            toast({
                title: "Validation Error",
                description: "Please fix the errors in the form",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('proposal_id', initialData.mysqlId || initialData.draftId);
            formDataToSend.append('event_name', formData.eventName);
            formDataToSend.append('completion_details', formData.completionDetails);
            formDataToSend.append('outcome_reporting', formData.outcomeReporting);

            if (formData.accomplishmentReportFile) {
                formDataToSend.append('accomplishmentReport', formData.accomplishmentReportFile);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/mongodb-unified/reports/accomplishment-reports`, {
                method: 'POST',
                body: formDataToSend
            });

            const result = await response.json();

            if (result.success) {
                setSubmitSuccess(true);
                toast({
                    title: "Success",
                    description: "Accomplishment report submitted successfully",
                    variant: "default",
                });

                // Update localStorage
                localStorage.setItem('current_report_status', 'pending');
                localStorage.setItem('submission_timestamp', new Date().toISOString());

            } else {
                throw new Error(result.message || 'Failed to submit report');
            }

        } catch (err) {
            // ✅ FIX: Improved error logging with detailed information
            const errorDetails = {
                message: err?.message || 'Unknown error',
                name: err?.name || 'Error',
                stack: err?.stack || 'No stack trace',
                type: typeof err,
                context: 'submitReport'
            };

            console.error('Error submitting report:', errorDetails);
            console.error('Raw error object:', err);
            setError(err?.message || 'Failed to submit report');
            toast({
                title: "Error",
                description: err.message || "Failed to submit accomplishment report",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, initialData, toast]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const resetForm = useCallback(() => {
        setFormData({
            eventName: '',
            completionDetails: '',
            outcomeReporting: '',
            accomplishmentReportFile: null
        });
        setValidationErrors({});
        setError(null);
        setSaveSuccess(false);
        setSubmitSuccess(false);
    }, []);

    // Auto-save functionality
    useEffect(() => {
        if (!isFormComplete || isSubmitting) return;

        const timeoutId = setTimeout(async () => {
            setIsSaving(true);
            try {
                // Save to localStorage for now
                localStorage.setItem('reporting_form_data', JSON.stringify(formData));
                setSaveSuccess(true);
            } catch (err) {
                // ✅ FIX: Improved error logging for auto-save
                const errorDetails = {
                    message: err?.message || 'Unknown error',
                    name: err?.name || 'Error',
                    context: 'autoSave'
                };
                console.error('Error auto-saving:', errorDetails);
            } finally {
                setIsSaving(false);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [formData, isFormComplete, isSubmitting]);

    // Load saved data on mount
    useEffect(() => {
        const savedData = localStorage.getItem('reporting_form_data');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (err) {
                // ✅ FIX: Improved error logging for loading saved data
                const errorDetails = {
                    message: err?.message || 'Unknown error',
                    name: err?.name || 'Error',
                    context: 'loadSavedData'
                };
                console.error('Error loading saved data:', errorDetails);
            }
        }
    }, []);

    return {
        // State
        formData,
        isLoading,
        isSaving,
        isSubmitting,
        error,
        validationErrors,
        saveSuccess,
        submitSuccess,

        // Computed values
        isProposalApproved,
        isFormComplete,
        hasValidationErrors,
        eventDetails,
        progress,
        canSubmit,

        // Actions
        updateFormData,
        submitReport,
        clearError,
        resetForm,
        validateForm
    };
}; 