"use client"

import { useDraftContext } from '@/contexts/draft-context';
import { useCallback, useEffect, useState } from 'react';

/**
 * Enhanced useDraft hook for UUID-based draft management
 * Integrates with backend draft system and handles proper UUID flow
 * Auto-save functionality moved to useAutoSave hook
 */
export function useDraft(draftId) {
    // Add error handling for context access
    let contextValues;
    try {
        contextValues = useDraftContext();
    } catch (error) {
        console.error('Failed to get draft context:', error);
        // Return a safe fallback
        return {
            draft: null,
            loading: true,
            error: error.message,
            patch: async () => false,
            getDraftData: () => ({}),
            getSectionData: () => ({}),
            hasDraft: () => false,
            getDraftStatus: () => 'not_found',
            getDraftUUID: () => null,
            payload: {},
            form_data: {}
        };
    }

    const {
        fetchDraft,
        updateDraftSection,
        getCurrentDraft,
        setCurrentDraft,
        loading: contextLoading,
        isInitialized
    } = contextValues;

    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load draft when draftId changes
    useEffect(() => {
        if (!draftId) {
            setDraft(null);
            setError(null);
            return;
        }

        // Wait for context to be initialized
        if (!isInitialized) {
            return;
        }

        const loadDraft = async () => {
            setLoading(true);
            setError(null);

            try {
                // Check if it's a UUID format
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(draftId);

                if (!isUUID) {
                    console.warn('⚠️ Non-UUID draft ID detected:', draftId);
                    // Handle descriptive draft IDs by creating a new UUID-based draft
                    const newDraftId = await createNewDraftFromDescriptive(draftId);
                    if (newDraftId) {
                        // Redirect to the new UUID-based draft
                        window.history.replaceState(null, '', `/student-dashboard/submit-event/${newDraftId}/overview`);
                        return;
                    }
                }

                const fetchedDraft = await fetchDraft(draftId);
                if (fetchedDraft) {
                    setDraft(fetchedDraft);
                    setCurrentDraft(draftId);
                } else {
                    setError('Draft not found');
                }
            } catch (err) {
                console.error('Failed to load draft:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadDraft();
    }, [draftId, fetchDraft, setCurrentDraft, isInitialized]);

    // Create new draft from descriptive ID
    const createNewDraftFromDescriptive = useCallback(async (descriptiveId) => {
        try {
            // Determine event type from descriptive ID
            const eventType = descriptiveId.includes('school') ? 'school-based' : 'community-based';

            // Create new UUID-based draft
            const response = await fetch('/api/proposals/drafts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventType,
                    originalDescriptiveId: descriptiveId
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ New UUID draft created from descriptive ID:', result.draftId);
                return result.draftId;
            }
        } catch (error) {
            console.error('Failed to create new draft from descriptive ID:', error);
        }
        return null;
    }, []);

    // Patch function to update draft sections
    const patch = useCallback(async ({ section, payload }) => {
        if (!draftId) {
            console.error('No draft ID available for patch');
            return false;
        }

        try {
            const success = await updateDraftSection(draftId, section, payload);
            if (success) {
                // Update local state
                setDraft(prev => ({
                    ...prev,
                    form_data: {
                        ...prev?.form_data,
                        [section]: payload
                    },
                    updatedAt: Date.now()
                }));
                return true;
            }
        } catch (err) {
            console.error('Failed to patch draft:', err);
            setError(err.message);
        }
        return false;
    }, [draftId, updateDraftSection]);

    // Get draft data with fallback
    const getDraftData = useCallback(() => {
        return draft?.form_data || draft?.payload || {};
    }, [draft]);

    // Get specific section data
    const getSectionData = useCallback((section) => {
        const data = getDraftData();
        return data[section] || {};
    }, [getDraftData]);

    // Check if draft exists
    const hasDraft = useCallback(() => {
        return !!draft;
    }, [draft]);

    // Get draft status
    const getDraftStatus = useCallback(() => {
        return draft?.status || 'not_found';
    }, [draft]);

    // Get draft UUID
    const getDraftUUID = useCallback(() => {
        return draft?.draftId || null;
    }, [draft]);

    return {
        draft,
        loading: loading || contextLoading,
        error,
        patch,
        getDraftData,
        getSectionData,
        hasDraft,
        getDraftStatus,
        getDraftUUID,
        // Legacy support
        payload: draft?.form_data || draft?.payload || {},
        form_data: draft?.form_data || draft?.payload || {}
    };
}