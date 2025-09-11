/**
 * Event Form UUID Context Provider
 * 
 * 🎯 Purpose:
 * - Manages UUID generation and state for event proposal forms
 * - Provides UUID to all form components in the event proposal flow
 * - Ensures consistent UUID across the entire form lifecycle
 * - Handles UUID persistence and retrieval
 * 
 * 🖥️ User Experience Goals:
 * - Seamless UUID generation on "Start Event Proposal" button click
 * - Consistent UUID across all form steps
 * - UUID persistence for draft saving and retrieval
 * - Clear UUID display for user reference
 */

"use client";

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Create the context
const EventFormContext = createContext();

// Custom hook to use the context
export const useEventForm = () => {
    const context = useContext(EventFormContext);
    if (!context) {
        throw new Error('useEventForm must be used within an EventFormProvider');
    }
    return context;
};

// Context Provider Component
export const EventFormProvider = ({ children }) => {
    const [eventUuid, setEventUuid] = useState(null);
    const [isUuidGenerated, setIsUuidGenerated] = useState(false);
    const [formStatus, setFormStatus] = useState('draft'); // 'draft', 'submitted', 'approved', 'rejected'
    const [createdAt, setCreatedAt] = useState(null);
    const [lastModified, setLastModified] = useState(null);

    // Generate new UUID
    const generateEventUuid = useCallback(() => {
        const newUuid = uuidv4();
        const timestamp = new Date().toISOString();

        setEventUuid(newUuid);
        setIsUuidGenerated(true);
        setCreatedAt(timestamp);
        setLastModified(timestamp);
        setFormStatus('draft');

        // Store in localStorage for persistence
        localStorage.setItem('eventFormUuid', newUuid);
        localStorage.setItem('eventFormCreatedAt', timestamp);
        localStorage.setItem('eventFormStatus', 'draft');

        console.log('🎯 New Event UUID Generated:', newUuid);
        return newUuid;
    }, []);

    // Load existing UUID from localStorage
    const loadExistingUuid = useCallback(() => {
        const storedUuid = localStorage.getItem('eventFormUuid');
        const storedCreatedAt = localStorage.getItem('eventFormCreatedAt');
        const storedStatus = localStorage.getItem('eventFormStatus');

        if (storedUuid) {
            setEventUuid(storedUuid);
            setIsUuidGenerated(true);
            setCreatedAt(storedCreatedAt);
            setFormStatus(storedStatus || 'draft');
            setLastModified(new Date().toISOString());

            console.log('🔄 Existing Event UUID Loaded:', storedUuid);
            return storedUuid;
        }

        return null;
    }, []);

    // Update form status
    const updateFormStatus = useCallback((status) => {
        setFormStatus(status);
        setLastModified(new Date().toISOString());
        localStorage.setItem('eventFormStatus', status);
    }, []);

    // Clear UUID (for new form or reset)
    const clearEventUuid = useCallback(() => {
        setEventUuid(null);
        setIsUuidGenerated(false);
        setFormStatus('draft');
        setCreatedAt(null);
        setLastModified(null);

        // Clear from localStorage
        localStorage.removeItem('eventFormUuid');
        localStorage.removeItem('eventFormCreatedAt');
        localStorage.removeItem('eventFormStatus');

        console.log('🗑️ Event UUID Cleared');
    }, []);

    // Reset and generate new UUID (for "Submit Another Report")
    const resetAndGenerateNewUuid = useCallback(() => {
        // Clear existing UUID
        clearEventUuid();

        // Generate new UUID
        const newUuid = generateEventUuid();

        console.log('🔄 Reset and Generated New UUID:', newUuid);
        return newUuid;
    }, [clearEventUuid, generateEventUuid]);

    // Initialize UUID on component mount
    useEffect(() => {
        loadExistingUuid();
    }, [loadExistingUuid]);

    // Update last modified timestamp when UUID changes
    useEffect(() => {
        if (eventUuid) {
            setLastModified(new Date().toISOString());
        }
    }, [eventUuid]);

    // Context value
    const contextValue = {
        // UUID state
        eventUuid,
        isUuidGenerated,
        formStatus,
        createdAt,
        lastModified,

        // UUID actions
        generateEventUuid,
        loadExistingUuid,
        clearEventUuid,
        resetAndGenerateNewUuid,
        updateFormStatus,

        // Utility functions
        getFormId: () => eventUuid,
        getFormStatus: () => formStatus,
        isFormDraft: () => formStatus === 'draft',
        isFormSubmitted: () => formStatus === 'submitted',
        isFormApproved: () => formStatus === 'approved',
        isFormRejected: () => formStatus === 'rejected',

        // Display helpers
        getShortUuid: () => eventUuid ? eventUuid.substring(0, 8) : null,
        getFormAge: () => {
            if (!createdAt) return null;
            const now = new Date();
            const created = new Date(createdAt);
            const diffMs = now - created;
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);

            if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            return 'Just now';
        }
    };

    return (
        <EventFormContext.Provider value={contextValue}>
            {children}
        </EventFormContext.Provider>
    );
};

export default EventFormContext;
