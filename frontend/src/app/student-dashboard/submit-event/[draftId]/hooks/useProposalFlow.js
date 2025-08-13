/**
 * useProposalFlow Hook
 * Shared logic for proposal flow management
 * 
 * Key approaches: UUID management, localStorage integration,
 * error handling, and state management
 */

import { useCallback, useEffect, useState } from 'react';
import { getOrCreateProposalUuid, getProposalData } from '../reporting/services/proposalService';

export function useProposalFlow(draftId) {
    const [proposalUuid, setProposalUuid] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [proposalData, setProposalData] = useState(null);

    // Initialize proposal UUID
    const initializeProposal = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (draftId && draftId !== 'new-draft') {
                // Use existing draftId as UUID if it's valid
                setProposalUuid(draftId);
                console.log('✅ Using existing draft ID as UUID:', draftId);
            } else {
                // Create new proposal UUID
                const uuid = await getOrCreateProposalUuid();
                setProposalUuid(uuid);
                console.log('✅ Created new proposal UUID:', uuid);
            }

            // Load proposal data
            const data = getProposalData();
            setProposalData(data);

        } catch (error) {
            console.error('❌ Error initializing proposal:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [draftId]);

    // Handle proposal UUID update
    const handleProposalUpdate = useCallback((newUuid) => {
        setProposalUuid(newUuid);
        const data = getProposalData();
        setProposalData(data);
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
