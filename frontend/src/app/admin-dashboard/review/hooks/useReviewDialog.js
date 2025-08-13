/**
 * useReviewDialog - Custom Hook for Review Dialog State Management
 * 
 * This hook encapsulates all business logic related to the review dialog,
 * following the separation of concerns principle from React best practices.
 * 
 * Features:
 * - Centralized state management
 * - Business logic separation
 * - Reusable across components
 * - Clean API surface
 */

import { useCallback, useMemo, useState } from 'react';

export const useReviewDialog = () => {
    // Dialog state
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Review state
    const [reviewDecision, setReviewDecision] = useState(null);
    const [reviewComment, setReviewComment] = useState('');
    const [newComment, setNewComment] = useState('');

    // Loading states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Open dialog with proposal
    const openDialog = useCallback((proposal) => {
        setSelectedProposal(proposal);
        setIsOpen(true);
        setActiveTab(proposal?.status === 'approved' ? 'documentation' : 'overview');
        setReviewDecision(null);
        setReviewComment('');
        setNewComment('');
    }, []);

    // Close dialog and reset state
    const closeDialog = useCallback(() => {
        setIsOpen(false);
        setSelectedProposal(null);
        setActiveTab('overview');
        setReviewDecision(null);
        setReviewComment('');
        setNewComment('');
    }, []);

    // Add comment to proposal
    const addComment = useCallback(async () => {
        if (!newComment.trim() || !selectedProposal) return;

        try {
            setIsLoading(true);

            // For demo purposes, use local state management instead of API
            // TODO: Replace with actual API call when backend is ready
            // await reviewService.addComment(selectedProposal.id, newComment);

            // Update local state (simulating successful API response)
            if (selectedProposal.details.comments) {
                selectedProposal.details.comments.push({
                    role: 'Admin',
                    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    text: newComment,
                    timestamp: new Date().toISOString(),
                    id: Date.now(), // Simple ID for demo
                });
            } else {
                // Initialize comments array if it doesn't exist
                selectedProposal.details.comments = [{
                    role: 'Admin',
                    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    text: newComment,
                    timestamp: new Date().toISOString(),
                    id: Date.now(),
                }];
            }

            setNewComment('');
            console.log('Comment added successfully (local state)');

        } catch (error) {
            console.error('Failed to add comment:', error);
            // For now, just log the error and continue with local state
            // In production, you would show a proper error message to the user
        } finally {
            setIsLoading(false);
        }
    }, [newComment, selectedProposal]);

    // Submit review decision
    const submitReview = useCallback(async () => {
        if (!reviewDecision || !selectedProposal) return;

        try {
            setIsSubmitting(true);

            // For demo purposes, use local state management instead of API
            // TODO: Replace with actual API call when backend is ready
            // await reviewService.submitReview({
            //     proposalId: selectedProposal.id,
            //     decision: reviewDecision,
            //     comment: reviewComment,
            // });

            // Simulate successful API response with local state update
            console.log('Review submitted successfully (local state):', {
                proposalId: selectedProposal.id,
                decision: reviewDecision,
                comment: reviewComment,
                timestamp: new Date().toISOString(),
            });

            // Close dialog on success
            closeDialog();

        } catch (error) {
            console.error('Failed to submit review:', error);
            // For now, just log the error
            // In production, you would show a proper error message to the user
        } finally {
            setIsSubmitting(false);
        }
    }, [reviewDecision, reviewComment, selectedProposal, closeDialog]);

    // Set review decision and navigate to decision tab
    const setDecisionAndNavigate = useCallback((decision) => {
        setReviewDecision(decision);
        setActiveTab('decision');
    }, []);

    // Computed values
    const canSubmitReview = useMemo(() => {
        return reviewDecision && !isSubmitting;
    }, [reviewDecision, isSubmitting]);

    const isApprovedProposal = useMemo(() => {
        return selectedProposal?.status === 'approved';
    }, [selectedProposal]);

    // Return hook API
    return {
        // State
        isOpen,
        selectedProposal,
        activeTab,
        reviewDecision,
        reviewComment,
        newComment,
        isSubmitting,
        isLoading,

        // Computed
        canSubmitReview,
        isApprovedProposal,

        // Actions
        open: openDialog,        // Alias for openDialog
        close: closeDialog,      // Alias for closeDialog
        openDialog,
        closeDialog,
        setActiveTab,
        setReviewDecision,
        setReviewComment,
        setNewComment,
        addComment,
        submitReview,
        setDecisionAndNavigate,
    };
}; 