/**
 * useProposalFlow Hook
 * Shared logic for proposal flow management
 * 
 * Key approaches: UUID management, localStorage integration,
 * error handling, and state management
 */

import { useCallback, useEffect, useState } from 'react';
import { createFallbackProposalData, generateFallbackUuid } from '../../shared/utils';
import { getOrCreateProposalUuid, getProposalData } from '../reporting/services/proposalService';

export function useProposalFlow(draftId) {
    const [proposalUuid, setProposalUuid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [proposalData, setProposalData] = useState(null);

    // Initialize proposal UUID with enhanced error handling
    const initializeProposal = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (draftId && draftId !== 'new-draft') {
                // Use existing draftId as UUID if it's valid
                setProposalUuid(draftId);
                console.log('✅ Using existing draft ID as UUID:', draftId);
            } else {
                // Create new proposal UUID with error handling
                try {
                    const uuid = await getOrCreateProposalUuid();
                    setProposalUuid(uuid);
                    console.log('✅ Created new proposal UUID:', uuid);
                } catch (uuidError) {
                    console.error('❌ Error creating proposal UUID:', uuidError);
                    // Fallback to a simple UUID using shared utility
                    const fallbackUuid = generateFallbackUuid();
                    setProposalUuid(fallbackUuid);
                    console.log('✅ Using fallback UUID:', fallbackUuid);
                }
            }

            // Load proposal data with error handling
            try {
                const data = getProposalData();
                setProposalData(data);
            } catch (dataError) {
                console.error('❌ Error loading proposal data:', dataError);
                // Set minimal data structure using shared utility
                setProposalData(createFallbackProposalData());
            }

        } catch (error) {
            console.error('❌ Error initializing proposal:', error);
            setError(error.message || 'Failed to initialize proposal');
        } finally {
            setLoading(false);
        }
    }, [draftId]);

    // Handle proposal UUID update with error handling
    const handleProposalUpdate = useCallback((newUuid) => {
        try {
            setProposalUuid(newUuid);
            const data = getProposalData();
            setProposalData(data);
        } catch (error) {
            console.error('❌ Error updating proposal:', error);
            setError(error.message || 'Failed to update proposal');
        }
    }, []);

    // Initialize on mount
    useEffect(() => {
        initializeProposal();
    }, [initializeProposal]);

    // Handle localStorage proposal_uuid
    useEffect(() => {
        if (proposalUuid && typeof window !== 'undefined') {
            localStorage.setItem('proposal_uuid', proposalUuid);
        }
    }, [proposalUuid]);

    return {
        proposalUuid,
        loading,
        error,
        proposalData,
        initializeProposal,
        handleProposalUpdate
    };
}
