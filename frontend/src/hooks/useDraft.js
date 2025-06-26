"use client";

import { createDraft, getDraft, updateDraft } from '@/lib/draft-api';
import { useCallback, useEffect, useState } from 'react';

/**
 * useDraft – universal data hook for loading/patching a proposal draft.
 *
 * @param {string | undefined} draftId – UUID of the draft; if omitted you can call `create()` later.
 * @returns {{ draft, patch, create, loading, error }}
 */
export function useDraft(draftId) {
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(Boolean(draftId));
    const [error, setError] = useState(null);

    // Initial fetch and whenever the id changes.
    useEffect(() => {
        if (!draftId) return;
        setLoading(true);
        getDraft(draftId)
            .then(setDraft)
            .catch(setError)
            .finally(() => setLoading(false));
    }, [draftId]);

    // Patch specific section data.
    const patch = useCallback(
        async ({ section, payload }) => {
            if (!draftId) throw new Error('patch() called before draftId is available');
            const updated = await updateDraft(draftId, section, payload);
            setDraft(updated);
            return updated;
        },
        [draftId]
    );

    // Create a new draft (used by the overview page).
    const create = useCallback(async () => {
        const fresh = await createDraft();
        setDraft(fresh);
        return fresh;
    }, []);

    return { draft, patch, create, loading, error };
}