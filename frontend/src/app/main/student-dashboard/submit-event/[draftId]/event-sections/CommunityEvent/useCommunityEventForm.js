import { useCallback, useRef, useState } from 'react';
import { validateCommunityEventForm } from './communityEventValidation';
import { getInitialFormState } from './utils.js';

export function useCommunityEventForm({
    initialDraftData = {},
    handleInputChange,
    handleFileChange,
    disabled = false,
}) {
    const [formState, setFormState] = useState(() => getInitialFormState(initialDraftData));
    const [localValidationErrors, setLocalValidationErrors] = useState({});
    const [filePreviews, setFilePreviews] = useState({});
    const lastSavedRef = useRef(null);

    // Handlers
    const handleLocalInputChange = useCallback((e) => {
        if (disabled) return;
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
        if (localValidationErrors[name]) {
            setLocalValidationErrors(prev => ({ ...prev, [name]: undefined }));
        }
        if (handleInputChange) handleInputChange(e);
    }, [disabled, handleInputChange, localValidationErrors]);

    const handleDateChange = useCallback((fieldName, date) => {
        if (disabled || !date) return;
        setFormState(prev => ({ ...prev, [fieldName]: date }));
        if (localValidationErrors[fieldName]) {
            setLocalValidationErrors(prev => ({ ...prev, [fieldName]: undefined }));
        }
        if (handleInputChange) {
            handleInputChange({ target: { name: fieldName, value: date.toISOString() } });
        }
    }, [disabled, handleInputChange, localValidationErrors]);

    const handleRadioChange = useCallback((name, value) => {
        if (disabled) return;
        setFormState(prev => ({ ...prev, [name]: value }));
        if (localValidationErrors[name]) {
            setLocalValidationErrors(prev => ({ ...prev, [name]: undefined }));
        }
        if (handleInputChange) {
            handleInputChange({ target: { name, value } });
        }
    }, [disabled, handleInputChange, localValidationErrors]);

    const handleTargetAudienceChange = useCallback((audience, checked) => {
        if (disabled) return;
        setFormState(prev => {
            const currentAudiences = Array.isArray(prev.communityTargetAudience) ? prev.communityTargetAudience : [];
            const newAudiences = checked
                ? [...currentAudiences, audience]
                : currentAudiences.filter(item => item !== audience);
            return { ...prev, communityTargetAudience: newAudiences };
        });
        if (localValidationErrors.communityTargetAudience) {
            setLocalValidationErrors(prev => ({ ...prev, communityTargetAudience: undefined }));
        }
        if (handleInputChange) {
            const newAudiences = checked
                ? [...(formState.communityTargetAudience || []), audience]
                : (formState.communityTargetAudience || []).filter(item => item !== audience);
            handleInputChange({ target: { name: "communityTargetAudience", value: newAudiences } });
        }
    }, [disabled, handleInputChange, formState.communityTargetAudience, localValidationErrors]);

    const handleFileUpload = useCallback((e, fieldName) => {
        if (disabled) return;
        const file = e.target.files?.[0];
        if (!file) return;
        setFilePreviews(prev => ({ ...prev, [fieldName]: file.name }));
        setFormState(prev => ({ ...prev, [fieldName]: file }));
        if (handleFileChange) handleFileChange(e);
    }, [disabled, handleFileChange]);

    const removeFile = useCallback((fieldName) => {
        setFilePreviews(prev => ({ ...prev, [fieldName]: "" }));
        setFormState(prev => ({ ...prev, [fieldName]: null }));
        if (handleFileChange) handleFileChange({ target: { name: fieldName, files: [] } });
    }, [handleFileChange]);

    // Validation
    const validate = useCallback(() => {
        const errors = validateCommunityEventForm(formState);
        setLocalValidationErrors(errors);
        return errors;
    }, [formState]);

    return {
        formState,
        setFormState,
        localValidationErrors,
        setLocalValidationErrors,
        filePreviews,
        setFilePreviews,
        lastSavedRef,
        handleLocalInputChange,
        handleDateChange,
        handleRadioChange,
        handleTargetAudienceChange,
        handleFileUpload,
        removeFile,
        validate,
    };
} 