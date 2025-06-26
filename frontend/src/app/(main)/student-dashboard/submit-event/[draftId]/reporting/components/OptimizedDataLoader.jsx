'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Optimized data loader for reporting section
 * Implements progressive loading and caching strategies
 */
export function OptimizedDataLoader({ onDataLoad, onError, children }) {
    const [loadingState, setLoadingState] = useState({
        phase: 'initializing',
        progress: 0,
        data: null,
        error: null,
        cached: false
    });

    const params = useParams();
    const draftId = params?.draftId;

    /**
     * Progressive data loading strategy
     */
    const loadData = useCallback(async () => {
        try {
            setLoadingState(prev => ({ ...prev, phase: 'checking-cache', progress: 10 }));

            // Phase 1: Check localStorage cache first
            const cacheKey = `reporting-data-${draftId}`;
            const cached = localStorage.getItem(cacheKey);

            if (cached) {
                const cachedData = JSON.parse(cached);
                const cacheAge = Date.now() - (cachedData.timestamp || 0);

                // Use cache if less than 5 minutes old
                if (cacheAge < 5 * 60 * 1000) {
                    setLoadingState(prev => ({
                        ...prev,
                        phase: 'cache-hit',
                        progress: 50,
                        data: cachedData.data,
                        cached: true
                    }));

                    onDataLoad(cachedData.data);

                    // Still fetch fresh data in background
                    fetchFreshData(true);
                    return;
                }
            }

            // Phase 2: Fetch fresh data
            await fetchFreshData(false);

        } catch (error) {
            console.error('❌ Data loading failed:', error);
            setLoadingState(prev => ({
                ...prev,
                phase: 'error',
                error: error.message
            }));
            onError(error);
        }
    }, [draftId, onDataLoad, onError]);

    /**
     * Fetch fresh data from API
     */
    const fetchFreshData = useCallback(async (isBackground = false) => {
        if (!isBackground) {
            setLoadingState(prev => ({ ...prev, phase: 'fetching-draft', progress: 20 }));
        }

        // Step 1: Get draft data (fast)
        const draftResponse = await fetch(`/api/proposals/drafts/${draftId}`);
        const draftData = await draftResponse.json();

        if (!isBackground) {
            setLoadingState(prev => ({ ...prev, progress: 40 }));
        }

        // Step 2: Get proposal data if exists (slower)
        let proposalData = null;
        if (draftData.proposalId) {
            if (!isBackground) {
                setLoadingState(prev => ({ ...prev, phase: 'fetching-proposal', progress: 60 }));
            }

            try {
                const proposalResponse = await fetch(
                    `/api/mongodb-unified/proposal/${draftData.proposalId}`
                );
                if (proposalResponse.ok) {
                    proposalData = await proposalResponse.json();
                }
            } catch (proposalError) {
                console.warn('Could not fetch proposal data:', proposalError);
            }
        }

        if (!isBackground) {
            setLoadingState(prev => ({ ...prev, phase: 'processing', progress: 80 }));
        }

        // Step 3: Combine and process data
        const combinedData = {
            draft: draftData,
            proposal: proposalData?.proposal || null,
            files: proposalData?.files || {},
            hasFiles: proposalData?.has_files || false,
            loadedAt: new Date().toISOString()
        };

        // Cache the result
        const cacheKey = `reporting-data-${draftId}`;
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                data: combinedData,
                timestamp: Date.now()
            }));
        } catch (cacheError) {
            console.warn('Could not cache data:', cacheError);
        }

        setLoadingState(prev => ({
            ...prev,
            phase: 'complete',
            progress: 100,
            data: combinedData
        }));

        onDataLoad(combinedData);
    }, [draftId, onDataLoad]);

    // Start loading on mount
    useEffect(() => {
        if (draftId) {
            loadData();
        }
    }, [draftId, loadData]);

    // Provide loading state to children
    return children(loadingState);
}

/**
 * Hook for using optimized data loading
 */
export function useOptimizedDataLoader(draftId) {
    const [state, setState] = useState({
        loading: true,
        data: null,
        error: null,
        cached: false,
        phase: 'initializing'
    });

    const handleDataLoad = useCallback((data) => {
        setState(prev => ({
            ...prev,
            loading: false,
            data,
            error: null
        }));
    }, []);

    const handleError = useCallback((error) => {
        setState(prev => ({
            ...prev,
            loading: false,
            error,
            data: null
        }));
    }, []);

    return {
        ...state,
        reload: () => {
            setState(prev => ({ ...prev, loading: true, error: null }));
            // Clear cache and reload
            const cacheKey = `reporting-data-${draftId}`;
            localStorage.removeItem(cacheKey);
        }
    };
} 