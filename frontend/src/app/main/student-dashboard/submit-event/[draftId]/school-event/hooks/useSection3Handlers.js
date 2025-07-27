import { useCallback } from "react";
import { validateDateTime } from "../schoolEventUtils";

/**
 * Custom hook to manage Section 3 event handlers
 */
export const useSection3Handlers = ({
    disabled,
    localFormData,
    setLocalFormData,
    setFilePreviews,
    toast,
    userInteractionRef
}) => {

    const handleLocalInputChange = useCallback((e) => {
        if (disabled) return;
        const { name, value } = e.target;

        // Mark as user interaction to prevent useEffect sync loop
        userInteractionRef.current = true;

        // 🔧 2. REAL-TIME FEEDBACK: Validate on every time change.
        const updatedLocalFormData = { ...localFormData, [name]: value };
        const { event_start_date, event_end_date, event_start_time, event_end_time } = updatedLocalFormData;

        let validationError = null;
        if (name === 'event_start_time' || name === 'event_end_time') {
            validationError = validateDateTime(event_start_date, event_end_date, event_start_time, event_end_time);
        }

        if (validationError) {
            toast({
                title: "Invalid Time Range",
                description: validationError,
                variant: "destructive",
            });
        }

        setLocalFormData(prev => ({ ...prev, [name]: value }));
    }, [disabled, localFormData, toast, validateDateTime, setLocalFormData, userInteractionRef]);

    const handleDateChange = useCallback((fieldName, date) => {
        if (disabled || !date) return;

        // Mark as user interaction to prevent useEffect sync loop
        userInteractionRef.current = true;

        // 🔧 2. REAL-TIME FEEDBACK: Validate on every time change.
        const updatedLocalFormData = { ...localFormData, [fieldName]: date };
        const { event_start_date, event_end_date, event_start_time, event_end_time } = updatedLocalFormData;

        let validationError = null;
        if (fieldName === 'event_start_date') {
            validationError = validateDateTime(date, event_end_date, event_start_time, event_end_time);
        } else if (fieldName === 'event_end_date') {
            validationError = validateDateTime(event_start_date, date, event_start_time, event_end_time);
        }

        if (validationError) {
            toast({
                title: "Invalid Time Range",
                description: validationError,
                variant: "destructive",
            });
        }

        setLocalFormData(prev => ({ ...prev, [fieldName]: date }));
    }, [disabled, localFormData, toast, validateDateTime, setLocalFormData, userInteractionRef]);

    const handleTargetAudienceChange = useCallback((audience, checked) => {
        if (disabled) return;

        // Mark as user interaction to prevent useEffect sync loop
        userInteractionRef.current = true;

        setLocalFormData(prev => {
            const currentAudiences = Array.isArray(prev.school_target_audience) ? prev.school_target_audience : [];
            const newAudiences = checked
                ? [...currentAudiences, audience]
                : currentAudiences.filter(item => item !== audience);
            return { ...prev, school_target_audience: newAudiences };
        });
    }, [disabled, setLocalFormData, userInteractionRef]);

    const handleRadioChange = useCallback((name, value) => {
        if (disabled) return;

        // Mark as user interaction to prevent useEffect sync loop
        userInteractionRef.current = true;

        setLocalFormData(prev => ({ ...prev, [name]: value }));
    }, [disabled, setLocalFormData, userInteractionRef]);

    const handleFileUpload = useCallback((e, fieldName, formData) => {
        if (disabled) return;
        const file = e.target.files?.[0];
        if (!file) return;

        console.log('📎 FILE UPLOAD INITIATED:', {
            fieldName,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            proposalId: formData.proposalId || formData.id,
            organizationName: formData.organizationName
        });

        if (file.size > 10 * 1024 * 1024) { // 10MB
            console.log('❌ FILE UPLOAD REJECTED: File too large', {
                fileName: file.name,
                fileSize: file.size,
                maxSize: '10MB'
            });
            toast({
                title: "File too large",
                description: "Maximum file size is 10MB",
                variant: "destructive",
            });
            return;
        }

        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!validTypes.includes(file.type)) {
            console.log('❌ FILE UPLOAD REJECTED: Invalid file type', {
                fileName: file.name,
                fileType: file.type,
                validTypes
            });
            toast({
                title: "Invalid file type",
                description: "Only PDF, Word, and Excel files are allowed",
                variant: "destructive",
            });
            return;
        }

        // Mark as user interaction to prevent useEffect sync loop
        userInteractionRef.current = true;

        console.log('✅ FILE UPLOAD ACCEPTED: Updating local state', {
            fieldName,
            fileName: file.name,
            fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`
        });

        setFilePreviews(prev => {
            const updated = {
                ...prev,
                [fieldName]: file.name
            };
            console.log('📎 FILE PREVIEWS UPDATED:', updated);
            return updated;
        });

        setLocalFormData(prev => {
            const updated = {
                ...prev,
                [fieldName]: file,
                [`${fieldName}_name`]: file.name,
                [`${fieldName}_path`]: '' // Will be set by backend after upload
            };
            console.log('📎 LOCAL FORM DATA UPDATED with file:', {
                fieldName,
                hasFile: !!updated[fieldName],
                fileName: updated[fieldName]?.name,
                fileNameField: updated[`${fieldName}_name`],
                filePathField: updated[`${fieldName}_path`]
            });
            return updated;
        });
    }, [disabled, toast, setFilePreviews, setLocalFormData, userInteractionRef]);

    const handleFileRemoval = useCallback((fieldName) => {
        console.log('🗑️ FILE REMOVAL: Removing file', {
            fieldName,
            currentFileName: fieldName
        });

        const inputElement = document.getElementById(fieldName);
        if (inputElement) {
            inputElement.value = "";
            console.log('🗑️ FILE REMOVAL: Cleared input element value');
        }

        setFilePreviews(prev => {
            const updated = { ...prev, [fieldName]: "" };
            console.log('🗑️ FILE REMOVAL: Updated file previews:', updated);
            return updated;
        });

        setLocalFormData(prev => {
            const updated = { ...prev, [fieldName]: null };
            console.log('🗑️ FILE REMOVAL: Updated local form data - file removed');
            return updated;
        });

        console.log('🗑️ FILE REMOVAL: File removal completed');
    }, [setFilePreviews, setLocalFormData]);

    return {
        handleLocalInputChange,
        handleDateChange,
        handleTargetAudienceChange,
        handleRadioChange,
        handleFileUpload,
        handleFileRemoval
    };
}; 