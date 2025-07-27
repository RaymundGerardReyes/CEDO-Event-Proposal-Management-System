import {
    consolidateFormData,
    handleFormDataRecovery,
    validateCompleteFormData
} from "@/utils/form-data-recovery";
import { useCallback } from "react";
import { saveSchoolEventData, validateDateTime } from "../schoolEventUtils";

/**
 * Custom hook to manage Section 3 save functionality
 */
export const useSection3Save = ({
    localFormData,
    formData,
    localStorageFormData,
    isInitialMount,
    isSaving,
    setIsSaving,
    handleInputChange,
    toast
}) => {

    const handleSaveData = useCallback(async (isExplicitUserAction = false) => {
        console.log('💾 SAVE DATA: Starting save process', {
            isInitialMount,
            isSaving,
            nodeEnv: process.env.NODE_ENV,
            isExplicitUserAction
        });

        // 🔧 CRITICAL FIX: Prevent auto-save during initial mount, but allow explicit user actions
        if (isInitialMount && process.env.NODE_ENV !== 'test' && !isExplicitUserAction) {
            console.log('🔧 ANTI-AUTO-APPROVAL: Save blocked during initial mount period (auto-save only)');
            return false;
        }

        // Prevent duplicate saves
        if (isSaving) {
            console.log('💾 SAVE DATA: Save already in progress, skipping duplicate call');
            return false;
        }

        setIsSaving(true);
        console.log('💾 SAVE DATA: Save process initiated, isSaving set to true');

        // 🔧 INCREASED TIMEOUT: 25 seconds instead of 15 to allow for slower connections
        const saveTimeout = setTimeout(() => {
            console.error('💾 SAVE DATA: Save process timed out after 25 seconds');
            setIsSaving(false);
        }, 25000);

        try {
            console.log('=== 💾 SAVE VALIDATION DEBUG ===');
            console.log('💾 Local form data:', localFormData);

            // 🔧 ENHANCED DATA RECOVERY: Use comprehensive recovery utilities
            let completeFormData;

            try {
                // Attempt to consolidate and recover form data
                completeFormData = await consolidateFormData(localFormData, formData, localStorageFormData);
                console.log('✅ Form data consolidation successful');
            } catch (recoveryError) {
                console.error('❌ Form data consolidation failed:', recoveryError);

                // Show user-friendly recovery message
                const recoveryResult = await handleFormDataRecovery({
                    currentFormData: formData,
                    localStorageFormData,
                    showUserMessage: true,
                    toast
                });

                if (!recoveryResult.isValid) {
                    toast({
                        title: "Missing Organization Data",
                        description: "Please complete Section 2 (Organization Information) first, then return to Section 3. Required fields: Organization Name, Contact Email, Contact Name, and Organization Type.",
                        variant: "destructive",
                    });
                    return false;
                }

                // Use recovered data
                completeFormData = {
                    ...recoveryResult.data,
                    ...localFormData
                };
            }

            // 🔧 ENHANCED VALIDATION: Validate complete form data
            const validationResult = validateCompleteFormData(completeFormData);

            if (!validationResult.isValid) {
                console.error('❌ Form validation failed:', validationResult.errors);
                toast({
                    title: "Validation Failed",
                    description: validationResult.errors.join(', '),
                    variant: "destructive",
                });
                return false;
            }

            if (validationResult.warnings.length > 0) {
                console.warn('⚠️ Form validation warnings:', validationResult.warnings);
            }

            // Validate required Section 3 fields
            const requiredFields = {
                schoolEventName: localFormData.schoolEventName,
                schoolVenue: localFormData.schoolVenue,
                schoolStartDate: localFormData.schoolStartDate,
                schoolEndDate: localFormData.schoolEndDate,
                schoolTimeStart: localFormData.schoolTimeStart,
                schoolTimeEnd: localFormData.schoolTimeEnd,
                schoolEventType: localFormData.schoolEventType,
                schoolEventMode: localFormData.schoolEventMode,
                schoolReturnServiceCredit: localFormData.schoolReturnServiceCredit,
            };

            const missingFields = Object.entries(requiredFields).filter(([key, value]) => {
                let isEmpty = false;

                if (key.includes('Date')) {
                    if (!value) {
                        isEmpty = true;
                    } else if (value instanceof Date) {
                        isEmpty = isNaN(value.getTime());
                    } else {
                        isEmpty = isNaN(Date.parse(value));
                    }
                } else {
                    isEmpty = !value || (typeof value === 'string' && value.trim() === '');
                }

                return isEmpty;
            });

            if (missingFields.length > 0) {
                const fieldNameMap = {
                    schoolEventName: 'Event Name',
                    schoolVenue: 'Venue',
                    schoolStartDate: 'Start Date',
                    schoolEndDate: 'End Date',
                    schoolTimeStart: 'Start Time',
                    schoolTimeEnd: 'End Time',
                    schoolEventType: 'Event Type',
                    schoolEventMode: 'Event Mode',
                    schoolReturnServiceCredit: 'Return Service Credit'
                };

                const readableFieldNames = missingFields.map(([key]) => fieldNameMap[key] || key).join(', ');

                toast({
                    title: "Missing Required Fields",
                    description: `Please fill in: ${readableFieldNames}`,
                    variant: "destructive",
                });
                return false;
            }

            // 🔧 3. SUBMISSION GATE: Enforce date/time rules before saving to the database.
            const dateTimeError = validateDateTime(
                localFormData.schoolStartDate,
                localFormData.schoolEndDate,
                localFormData.schoolTimeStart,
                localFormData.schoolTimeEnd
            );

            if (dateTimeError) {
                toast({
                    title: "Invalid Date & Time",
                    description: dateTimeError,
                    variant: "destructive",
                });
                return false;
            }

            if (!localFormData.schoolTargetAudience || localFormData.schoolTargetAudience.length === 0) {
                toast({
                    title: "Missing Target Audience",
                    description: "Please select at least one target audience",
                    variant: "destructive",
                });
                return false;
            }

            console.log('✅ All validations passed, calling API...');

            // 🔧 BACKEND HEALTH CHECK: Quick check if backend is running
            try {
                const backendUrl = process.env.API_URL || 'http://localhost:5000';
                const healthCheck = await fetch(`${backendUrl}/api/health`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000) // 5 second timeout for health check
                });
                if (!healthCheck.ok) {
                    throw new Error('Backend health check failed');
                }
                console.log('✅ Backend health check passed');
            } catch (healthError) {
                console.warn('⚠️ Backend health check failed:', healthError.message);
                // Continue anyway, the main API call will handle the error
            }

            // 🔧 RETRY MECHANISM: Try up to 3 times with exponential backoff
            let result = null;
            let lastError = null;
            const maxRetries = 3;

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`💾 SAVE DATA: Attempt ${attempt}/${maxRetries} - Starting API call...`);

                    // 🔧 INCREASED TIMEOUT: 20 seconds for the API call (was 10 seconds)
                    const apiTimeout = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error(`API call timed out after 20 seconds (attempt ${attempt})`)), 20000);
                    });

                    // Save to database with complete data and timeout protection
                    const savePromise = saveSchoolEventData(completeFormData);
                    result = await Promise.race([savePromise, apiTimeout]);

                    console.log(`💾 SAVE DATA: Attempt ${attempt} successful:`, result);
                    break; // Success, exit retry loop
                } catch (error) {
                    lastError = error;
                    console.warn(`💾 SAVE DATA: Attempt ${attempt} failed:`, error.message);

                    if (attempt < maxRetries) {
                        // Exponential backoff: wait 1s, 2s, 4s between retries
                        const backoffDelay = Math.pow(2, attempt - 1) * 1000;
                        console.log(`💾 SAVE DATA: Waiting ${backoffDelay}ms before retry...`);
                        await new Promise(resolve => setTimeout(resolve, backoffDelay));
                    }
                }
            }

            if (!result) {
                throw lastError || new Error('All save attempts failed');
            }

            console.log('💾 SAVE DATA: Final save result from API:', result);

            // 🔄 PROPAGATING proposal id + pending status to parent
            if (result?.id) {
                console.log('💾 SAVE DATA: 🔄 PROPAGATING proposal id + pending status to parent:', result.id)
                try {
                    handleInputChange({
                        target: {
                            name: '__PROPOSAL_ID_RECOVERY__',
                            value: {
                                id: result.id,
                                proposalId: result.id,
                                organization_id: result.id,
                                proposalStatus: 'pending',
                            },
                        },
                    })
                    console.log('✅ SAVE DATA: Successfully propagated proposal ID to parent');
                } catch (e) {
                    console.warn('⚠️ SAVE DATA: Unable to propagate proposal id/status:', e)
                }
            }

            console.log('✅ SAVE DATA: Save process completed successfully');
            toast({
                title: "Data Saved Successfully",
                description: `School event data has been saved to the database. ID: ${result.id}`,
                variant: "default",
            });

            return true;
        } catch (error) {
            // 🔧 ENHANCED ERROR LOGGING: More detailed error information
            console.error('❌ SAVE DATA: Error saving school event data:', {
                error: error,
                message: error?.message,
                name: error?.name,
                stack: error?.stack,
                toString: error?.toString(),
                formDataKeys: Object.keys(completeFormData || {}),
                hasFiles: {
                    gpoa: !!(completeFormData?.schoolGPOAFile),
                    proposal: !!(completeFormData?.schoolProposalFile)
                }
            });

            // 🔧 ADDITIONAL DEBUG: Log the raw error object
            console.error('❌ SAVE DATA: Raw error object:', error);
            console.error('❌ SAVE DATA: Error type:', typeof error);
            console.error('❌ SAVE DATA: Error keys:', Object.keys(error || {}));

            // Show more helpful error messages based on error type
            let userFriendlyMessage = "Failed to save data to database";

            // 🔧 BETTER ERROR MESSAGE EXTRACTION
            if (error?.message) {
                if (error.message.includes('Validation failed:')) {
                    const fieldMatches = error.message.match(/(\w+):/g);
                    if (fieldMatches) {
                        const fields = fieldMatches.map(match => match.replace(':', ''));
                        userFriendlyMessage = `Please check these fields: ${fields.join(', ')}`;
                    }
                } else if (error.message.includes('Network error')) {
                    userFriendlyMessage = "Cannot connect to server. Please check if the backend is running.";
                } else if (error.message.includes('timed out')) {
                    userFriendlyMessage = "Request timed out. Please check your connection and try again.";
                } else if (error.message.includes('Failed to fetch')) {
                    userFriendlyMessage = "Cannot connect to server. Please check if the backend is running.";
                } else if (error.message.includes('API call timed out')) {
                    userFriendlyMessage = "Server is taking too long to respond. Please check your connection and try again.";
                } else if (error.message.includes('All save attempts failed')) {
                    userFriendlyMessage = "Multiple save attempts failed. Please check your connection and try again.";
                } else {
                    userFriendlyMessage = error.message;
                }
            } else if (error?.toString) {
                userFriendlyMessage = error.toString();
            }

            toast({
                title: "Save Failed",
                description: userFriendlyMessage,
                variant: "destructive",
            });

            // 🔧 GRACEFUL DEGRADATION: Return false instead of throwing
            // This allows the navigation to proceed even if save fails
            console.log('💾 SAVE DATA: Save failed, but allowing graceful degradation');
            return false;
        } finally {
            console.log('💾 SAVE DATA: Save process finished, setting isSaving to false');
            clearTimeout(saveTimeout);
            setIsSaving(false);
        }
    }, [localFormData, toast, formData, isSaving, localStorageFormData, isInitialMount, validateDateTime, handleInputChange, setIsSaving]);

    return {
        handleSaveData
    };
}; 