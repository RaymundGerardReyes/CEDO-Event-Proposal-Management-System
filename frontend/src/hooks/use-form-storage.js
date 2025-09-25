/**
 * useFormStorage Hook
 * 
 * Custom hook for form data persistence with:
 * - Automatic localStorage synchronization
 * - File upload handling
 * - Debounced auto-save
 * - Data recovery and validation
 * - UUID-based storage isolation
 * 
 * Key approaches: Performance optimization, comprehensive error handling,
 * user experience enhancement, and data integrity
 */

import {
    cleanupExpiredData,
    cleanupOldFormData,
    clearAllFormData,
    createFormDataBackup,
    exportFormData,
    generateFormStorageKey,
    getDetailedStorageInfo,
    getStorageStats,
    importFormData,
    loadFormData,
    removeFormData,
    restoreFileFromDataUrl,
    saveFileData,
    saveFormData
} from '@/utils/storage-utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Custom hook for form storage management
 * @param {string} uuid - Form UUID
 * @param {string} stepName - Step name (e.g., 'organization', 'eventInformation')
 * @param {Object} options - Configuration options
 */
export function useFormStorage(uuid, stepName, options = {}) {
    const {
        debounceDelay = 500,
        autoSave = true,
        backupEnabled = true,
        onSave = null,
        onLoad = null,
        onError = null
    } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [storageError, setStorageError] = useState(null);

    const saveTimeoutRef = useRef(null);
    const lastDataRef = useRef(null);

    // Generate storage key
    const storageKey = useMemo(() => {
        return uuid && stepName ? generateFormStorageKey(uuid, stepName) : null;
    }, [uuid, stepName]);

    // Save data with debouncing
    const saveData = useCallback(async (data) => {
        if (!storageKey || !autoSave) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout for debounced save
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                setIsSaving(true);
                setStorageError(null);

                // Check if data has changed
                const dataString = JSON.stringify(data);
                if (lastDataRef.current === dataString) {
                    return; // No changes, skip save
                }

                const success = saveFormData(uuid, stepName, data);

                if (success) {
                    lastDataRef.current = dataString;
                    setLastSaved(new Date());
                    setStorageError(null); // Clear any previous errors

                    // Create backup if enabled
                    if (backupEnabled) {
                        try {
                            createFormDataBackup(uuid, data);
                        } catch (backupError) {
                            console.warn('Failed to create backup:', backupError);
                            // Don't fail the main save operation for backup failures
                        }
                    }

                    // Call onSave callback
                    if (onSave) {
                        onSave(data, success);
                    }
                } else {
                    // Get detailed storage info to understand the failure
                    const storageInfo = getDetailedStorageInfo();
                    console.warn('Storage save failed', { storageInfo });

                    // Check if it's a storage quota issue
                    const error = new Error('Failed to save data to localStorage - storage may be full or blocked');
                    error.type = 'storage_quota_error';
                    error.storageInfo = storageInfo;
                    throw error;
                }
            } catch (error) {
                console.error('Save error:', error);

                // Get detailed storage info for debugging
                let storageInfo = {};
                try {
                    storageInfo = getDetailedStorageInfo();
                } catch (infoError) {
                    console.warn('Failed to get storage info:', infoError);
                    storageInfo = { error: 'Failed to get storage info' };
                }
                console.error('Storage info at error time:', storageInfo);

                // Provide more specific error messages based on error type
                let errorMessage = error.message;
                let errorType = 'unknown';
                let shouldAutoRetry = false;

                if (error.type === 'storage_quota_error') {
                    errorMessage = 'Storage quota exceeded. Attempting to free up space...';
                    errorType = 'quota_exceeded';
                    shouldAutoRetry = true;
                } else if (error.name === 'QuotaExceededError') {
                    errorMessage = 'Browser storage is full. Attempting to free up space...';
                    errorType = 'quota_exceeded';
                    shouldAutoRetry = true;
                } else if (error.name === 'SecurityError') {
                    errorMessage = 'Storage access blocked by browser. Please check your browser settings.';
                    errorType = 'security_error';
                } else if (error.message && error.message.includes('Failed to save data to localStorage')) {
                    errorMessage = 'Failed to save data to localStorage. Storage may be full or blocked.';
                    errorType = 'storage_failure';
                    shouldAutoRetry = true;
                }

                // Add storage info to error message for better debugging
                if (storageInfo.totalSize && storageInfo.maxSize) {
                    const usagePercent = ((storageInfo.totalSize / storageInfo.maxSize) * 100).toFixed(1);
                    errorMessage += ` (Storage usage: ${usagePercent}%)`;
                }

                setStorageError(errorMessage);

                // Auto-retry with cleanup for quota issues
                if (shouldAutoRetry && errorType === 'quota_exceeded') {
                    console.log('🔄 Attempting automatic retry with cleanup...');

                    // Wait a bit before retrying to allow cleanup to complete
                    setTimeout(async () => {
                        try {
                            const retrySuccess = await retrySave(data);
                            if (retrySuccess) {
                                setStorageError(null);
                                console.log('✅ Auto-retry successful');
                            } else {
                                setStorageError('Failed to save data even after clearing storage. Please clear browser data manually.');
                            }
                        } catch (retryError) {
                            console.error('❌ Auto-retry failed:', retryError);
                            setStorageError('Failed to save data even after clearing storage. Please clear browser data manually.');
                        }
                    }, 1000);
                }

                if (onError) {
                    onError({
                        ...error,
                        type: errorType,
                        storageInfo,
                        originalMessage: error.message,
                        shouldAutoRetry
                    }, 'save');
                }
            } finally {
                setIsSaving(false);
            }
        }, debounceDelay);
    }, [storageKey, uuid, stepName, autoSave, debounceDelay, backupEnabled, onSave, onError]);

    // Load data from storage
    const loadData = useCallback(async () => {
        if (!storageKey) return null;

        try {
            setIsLoading(true);
            setStorageError(null);

            const data = loadFormData(uuid, stepName);

            if (data) {
                // Handle file restoration
                const restoredData = await restoreFilesInData(data);
                lastDataRef.current = JSON.stringify(restoredData);

                // Call onLoad callback
                if (onLoad) {
                    onLoad(restoredData);
                }

                return restoredData;
            }

            return null;
        } catch (error) {
            console.error('Load error:', error);
            setStorageError(error.message);

            if (onError) {
                onError(error, 'load');
            }

            return null;
        } finally {
            setIsLoading(false);
        }
    }, [storageKey, uuid, stepName, onLoad, onError]);

    // Remove data from storage
    const removeData = useCallback(() => {
        if (!storageKey) return false;

        try {
            const success = removeFormData(uuid, stepName);
            if (success) {
                lastDataRef.current = null;
                setLastSaved(null);
            }
            return success;
        } catch (error) {
            console.error('Remove error:', error);
            setStorageError(error.message);
            return false;
        }
    }, [storageKey, uuid, stepName]);

    // Clear all form data
    const clearAllData = useCallback(() => {
        if (!uuid) return false;

        try {
            const success = clearAllFormData(uuid);
            if (success) {
                lastDataRef.current = null;
                setLastSaved(null);
            }
            return success;
        } catch (error) {
            console.error('Clear all error:', error);
            setStorageError(error.message);
            return false;
        }
    }, [uuid]);

    // Export form data
    const exportData = useCallback(() => {
        if (!uuid) return null;
        return exportFormData(uuid);
    }, [uuid]);

    // Import form data
    const importData = useCallback((exportedData) => {
        return importFormData(exportedData);
    }, []);

    // Get storage statistics
    const getStats = useCallback(() => {
        return getStorageStats();
    }, []);

    // Get detailed storage information for debugging
    const getDebugInfo = useCallback(() => {
        return getDetailedStorageInfo();
    }, []);

    // Clear storage and retry save
    const retrySave = useCallback(async (data) => {
        try {
            console.log('🔄 Retrying save with aggressive cleanup...');

            // Clear all form data to free up space
            clearAllFormData(uuid);

            // Also clear any other localStorage data that might be taking up space
            try {
                const keysToRemove = [];
                const now = Date.now();
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours

                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key) {
                        // Remove old form data, drafts, backups, and temporary data
                        if (key.includes('form-') ||
                            key.includes('draft-') ||
                            key.includes('backup-') ||
                            key.includes('eventForm:') ||
                            key.includes('file_') ||
                            key.includes('temp_') ||
                            key.includes('cache_')) {

                            // Check if data is old
                            try {
                                const stored = localStorage.getItem(key);
                                if (stored) {
                                    const parsed = JSON.parse(stored);
                                    const age = now - (parsed.timestamp || 0);

                                    if (age > maxAge || !parsed.timestamp) {
                                        keysToRemove.push(key);
                                    }
                                } else {
                                    keysToRemove.push(key);
                                }
                            } catch {
                                // If we can't parse it, remove it
                                keysToRemove.push(key);
                            }
                        }
                    }
                }

                console.log(`🗑️ Found ${keysToRemove.length} items to remove`);

                keysToRemove.forEach(key => {
                    try {
                        localStorage.removeItem(key);
                        console.log(`🗑️ Removed: ${key}`);
                    } catch (removeError) {
                        console.warn(`Failed to remove ${key}:`, removeError);
                    }
                });

                // Also try to clear any other old data
                try {
                    // Clear expired data
                    cleanupExpiredData();
                    cleanupOldFormData();
                } catch (cleanupError) {
                    console.warn('Failed to cleanup expired data:', cleanupError);
                }

            } catch (cleanupError) {
                console.warn('Failed to perform aggressive cleanup:', cleanupError);
            }

            // Wait a bit for cleanup to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            // Get storage info after cleanup
            const storageInfo = getDetailedStorageInfo();
            console.log('📊 Storage info after cleanup:', storageInfo);

            // Try to save again
            const success = saveFormData(uuid, stepName, data);
            if (success) {
                setStorageError(null);
                setLastSaved(new Date());
                console.log('✅ Retry save successful');
                return true;
            }
            console.log('❌ Retry save failed - saveFormData returned false');
            return false;
        } catch (error) {
            console.error('❌ Retry save failed:', error);
            setStorageError('Failed to save data even after clearing storage');
            return false;
        }
    }, [uuid, stepName]);

    // Restore files from data URLs in the data
    const restoreFilesInData = async (data) => {
        if (!data) return data;

        const restoredData = { ...data };

        // Handle file fields (common patterns)
        const fileFields = ['gpoaFile', 'projectProposalFile', 'attendanceSheet'];

        for (const field of fileFields) {
            if (data[field] && typeof data[field] === 'object' && data[field].dataUrl) {
                try {
                    const restoredFile = await restoreFileFromDataUrl(data[field]);
                    if (restoredFile) {
                        restoredData[field] = restoredFile;
                    }
                } catch (error) {
                    console.warn(`Failed to restore file for field ${field}:`, error);
                }
            }
        }

        return restoredData;
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        // State
        isLoading,
        isSaving,
        lastSaved,
        storageError,

        // Actions
        saveData,
        loadData,
        removeData,
        clearAllData,
        exportData,
        importData,
        getStats,
        getDebugInfo,
        retrySave,

        // Utilities
        storageKey,
        isSupported: !!storageKey
    };
}

/**
 * Hook for file storage management
 * @param {string} uuid - Form UUID
 * @param {string} stepName - Step name
 */
export function useFileStorage(uuid, stepName) {
    const [uploadedFiles, setUploadedFiles] = useState({});
    const [fileErrors, setFileErrors] = useState({});

    // Save file data
    const saveFile = useCallback((fieldName, file, dataUrl) => {
        try {
            const fileData = saveFileData(file, dataUrl);
            if (fileData) {
                setUploadedFiles(prev => ({
                    ...prev,
                    [fieldName]: fileData
                }));

                // Save to form storage
                saveFormData(uuid, stepName, { [fieldName]: fileData });
                return true;
            }
            return false;
        } catch (error) {
            console.error('File save error:', error);
            setFileErrors(prev => ({
                ...prev,
                [fieldName]: error.message
            }));
            return false;
        }
    }, [uuid, stepName]);

    // Remove file
    const removeFile = useCallback((fieldName) => {
        setUploadedFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[fieldName];
            return newFiles;
        });

        setFileErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    // Clear all files
    const clearAllFiles = useCallback(() => {
        setUploadedFiles({});
        setFileErrors({});
    }, []);

    return {
        uploadedFiles,
        fileErrors,
        saveFile,
        removeFile,
        clearAllFiles
    };
}

/**
 * Hook for form validation with storage
 * @param {string} uuid - Form UUID
 * @param {string} stepName - Step name
 * @param {Object} validationRules - Validation rules
 */
export function useFormValidation(uuid, stepName, validationRules = {}) {
    const [validationErrors, setValidationErrors] = useState({});
    const [isValid, setIsValid] = useState(false);

    // Validate form data
    const validateData = useCallback((data) => {
        const errors = {};

        // Apply validation rules
        Object.entries(validationRules).forEach(([field, rules]) => {
            const value = data[field];

            if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
                errors[field] = `${rules.label || field} is required`;
            }

            if (value && rules.pattern && !rules.pattern.test(value)) {
                errors[field] = rules.message || `${rules.label || field} format is invalid`;
            }

            if (value && rules.minLength && value.length < rules.minLength) {
                errors[field] = `${rules.label || field} must be at least ${rules.minLength} characters`;
            }

            if (value && rules.maxLength && value.length > rules.maxLength) {
                errors[field] = `${rules.label || field} must be no more than ${rules.maxLength} characters`;
            }
        });

        setValidationErrors(errors);
        const valid = Object.keys(errors).length === 0;
        setIsValid(valid);

        return { errors, isValid: valid };
    }, [validationRules]);

    // Clear validation errors
    const clearErrors = useCallback(() => {
        setValidationErrors({});
        setIsValid(false);
    }, []);

    return {
        validationErrors,
        isValid,
        validateData,
        clearErrors
    };
}
