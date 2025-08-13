
"use client"

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Create the draft context with a default value
export const DraftContext = createContext({
    drafts: new Map(),
    currentDraftId: null,
    loading: false,
    createDraft: async () => null,
    fetchDraft: async () => null,
    updateDraftSection: async () => false,
    getCurrentDraft: () => null,
    setCurrentDraft: () => { },
    isInitialized: false
});

// Draft provider component
export function DraftProvider({ children, initialDraft = null }) {
    const [drafts, setDrafts] = useState(new Map());
    const [currentDraftId, setCurrentDraftId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize with initial draft if provided
    useEffect(() => {
        if (initialDraft) {
            // Handle different draft structures
            let draftId = null;
            let formData = {};
            let status = 'draft';

            // Try different possible ID fields
            if (initialDraft.id) {
                draftId = initialDraft.id;
            } else if (initialDraft.draftId) {
                draftId = initialDraft.draftId;
            } else if (initialDraft.proposalId) {
                draftId = initialDraft.proposalId;
            }

            // Try different possible form_data fields
            if (initialDraft.form_data) {
                formData = initialDraft.form_data;
            } else if (initialDraft.payload) {
                formData = initialDraft.payload;
            } else if (initialDraft.data) {
                formData = initialDraft.data;
            }

            // Try different possible status fields
            if (initialDraft.status) {
                status = initialDraft.status;
            } else if (initialDraft.proposalStatus) {
                status = initialDraft.proposalStatus;
            }

            if (draftId) {
                const normalizedDraft = {
                    draftId,
                    form_data: formData,
                    status,
                    ...initialDraft
                };

                setDrafts(prev => new Map(prev).set(draftId, normalizedDraft));
                setCurrentDraftId(draftId);
            }
        }

        // Always mark as initialized after processing
        setIsInitialized(true);
    }, [initialDraft]);

    // Create a new draft with UUID
    const createDraft = useCallback(async (eventType = 'school-based') => {
        const draftId = uuidv4();

        const newDraft = {
            draftId,
            form_data: {
                proposalStatus: 'draft',
                organizationType: eventType,
                eventType: eventType,
                selectedEventType: eventType,
                validationErrors: {},
                currentSection: 'overview',
                createdAt: Date.now(),
                updatedAt: Date.now()
            },
            status: 'draft'
        };

        // Save to backend
        try {
            const response = await fetch('/api/proposals/drafts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ eventType })
            });

            if (response.ok) {
                const result = await response.json();
                const backendDraftId = result.draftId || draftId;

                // Update with backend draft ID
                newDraft.draftId = backendDraftId;
                setDrafts(prev => new Map(prev).set(backendDraftId, newDraft));
                setCurrentDraftId(backendDraftId);

                console.log('✅ New draft created with UUID:', backendDraftId);
                return backendDraftId;
            }
        } catch (error) {
            console.error('Failed to create draft on backend:', error);
        }

        // Fallback to local draft
        setDrafts(prev => new Map(prev).set(draftId, newDraft));
        setCurrentDraftId(draftId);
        return draftId;
    }, []);

    // Fetch draft from backend
    const fetchDraft = useCallback(async (draftId) => {
        if (!draftId) return null;

        setLoading(true);
        try {
            const response = await fetch(`/api/proposals/drafts/${draftId}`);
            if (response.ok) {
                const draft = await response.json();
                setDrafts(prev => new Map(prev).set(draftId, draft));
                setCurrentDraftId(draftId);
                console.log('✅ Draft fetched from backend:', draftId);
                return draft;
            }
        } catch (error) {
            console.error('Failed to fetch draft:', error);
        } finally {
            setLoading(false);
        }
        return null;
    }, []);

    // Update draft section
    const updateDraftSection = useCallback(async (draftId, section, data) => {
        if (!draftId) return false;

        try {
            const response = await fetch(`/api/proposals/drafts/${draftId}/${section}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                setDrafts(prev => new Map(prev).set(draftId, result.draft));
                console.log('✅ Draft section updated:', `${draftId}/${section}`);
                return true;
            }
        } catch (error) {
            console.error('Failed to update draft section:', error);
        }
        return false;
    }, []);

    // Get current draft
    const getCurrentDraft = useCallback(() => {
        return currentDraftId ? drafts.get(currentDraftId) : null;
    }, [currentDraftId, drafts]);

    // Set current draft
    const setCurrentDraft = useCallback((draftId) => {
        setCurrentDraftId(draftId);
    }, []);

    const value = {
        drafts,
        currentDraftId,
        loading,
        createDraft,
        fetchDraft,
        updateDraftSection,
        getCurrentDraft,
        setCurrentDraft,
        isInitialized
    };

    return (
        <DraftContext.Provider value={value}>
            {children}
        </DraftContext.Provider>
    );
}

// Hook to use draft context with proper error handling
export function useDraftContext() {
    const context = useContext(DraftContext);

    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
        // In browser, we can provide more detailed error information
        if (!context) {
            throw new Error('useDraftContext must be used within a DraftProvider');
        }

        // Check if context is properly initialized
        if (!context.isInitialized) {
            // Return a loading state instead of throwing
            return {
                ...context,
                loading: true,
                isInitialized: false
            };
        }
    }

    return context;
} 