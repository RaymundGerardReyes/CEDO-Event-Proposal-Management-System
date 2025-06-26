/**
 * Custom Hook for Debounced Auto-Save Functionality
 * Extracted from monolithic component for reusability
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Custom hook for debounced auto-save functionality
 * @param {Function} saveFunction - Function to call for saving data
 * @param {number} delay - Debounce delay in milliseconds (default: 1000)
 * @returns {Object} Auto-save state and control functions
 */
export const useAutoSave = (saveFunction, delay = 1000) => {
    const timeoutRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [saveError, setSaveError] = useState(null);

    /**
     * Debounced save function that delays execution
     * @param {Object} data - Data to save
     */
    const debouncedSave = useCallback((data) => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Clear any previous errors
        setSaveError(null);

        // Set new timeout
        timeoutRef.current = setTimeout(async () => {
            setIsSaving(true);
            try {
                await saveFunction(data);
                setLastSaved(new Date().toISOString());
                setSaveError(null);
                console.log('✅ Auto-save successful');
            } catch (error) {
                console.error('❌ Auto-save failed:', error);
                setSaveError(error.message || 'Failed to save changes');
            } finally {
                setIsSaving(false);
            }
        }, delay);
    }, [saveFunction, delay]);

    /**
     * Cancel any pending save operation
     */
    const cancelSave = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsSaving(false);
    }, []);

    /**
     * Force immediate save without debouncing
     * @param {Object} data - Data to save
     */
    const forceSave = useCallback(async (data) => {
        // Cancel any pending debounced save
        cancelSave();

        setIsSaving(true);
        setSaveError(null);

        try {
            await saveFunction(data);
            setLastSaved(new Date().toISOString());
            setSaveError(null);
            console.log('✅ Force save successful');
        } catch (error) {
            console.error('❌ Force save failed:', error);
            setSaveError(error.message || 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    }, [saveFunction, cancelSave]);

    /**
     * Retry the last failed save with intelligent backoff for database issues
     * @param {Object} data - Data to save
     * @param {number} retryCount - Current retry attempt (default: 1)
     */
    const retrySave = useCallback((data, retryCount = 1) => {
        console.log(`🔄 Retrying auto-save (attempt ${retryCount})...`);
        setSaveError(null);

        // For database connection issues, add exponential backoff
        if (saveError && (
            saveError.includes('MongoDB connection not ready') ||
            saveError.includes('Database not initialized') ||
            saveError.includes('Database connection is initializing')
        )) {
            const backoffDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 10000); // Max 10 seconds
            console.log(`⏱️ Database connection issue detected. Waiting ${backoffDelay}ms before retry...`);

            setTimeout(() => {
                debouncedSave(data);
            }, backoffDelay);
        } else {
            // Regular retry for other errors
            debouncedSave(data);
        }
    }, [debouncedSave, saveError]);

    /**
     * Clear save error state
     */
    const clearSaveError = useCallback(() => {
        setSaveError(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        // State
        isSaving,
        lastSaved,
        saveError,

        // Actions
        debouncedSave,
        cancelSave,
        forceSave,
        retrySave,
        clearSaveError,
        setSaveError
    };
};

export default useAutoSave; 