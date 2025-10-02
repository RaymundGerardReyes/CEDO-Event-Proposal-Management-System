/**
 * Custom Hook for Email Notifications
 * Purpose: Provide email functionality to React components
 * Key approaches: React hooks pattern, error handling, loading states
 * Refactor: Reusable email hook with proper state management
 */

import { useToast } from '@/hooks/use-toast';
import emailService from '@/services/email-service';
import { useCallback, useState } from 'react';

export const useEmail = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { toast } = useToast();

    /**
     * Send proposal submitted notification
     */
    const sendProposalSubmitted = useCallback(async ({ userEmail, userName, proposalData }) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await emailService.sendProposalSubmittedNotification({
                userEmail,
                userName,
                proposalData
            });

            if (result.demo) {
                toast({
                    title: "Email Service Not Configured",
                    description: "Email service is running in demo mode. No email was sent.",
                    variant: "default"
                });
            } else {
                toast({
                    title: "Email Sent",
                    description: "Proposal notification sent successfully",
                    variant: "default"
                });
            }

            return result;
        } catch (error) {
            const errorMessage = error.message || 'Failed to send proposal notification';
            setError(errorMessage);

            toast({
                title: "Email Failed",
                description: errorMessage,
                variant: "destructive"
            });

            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    /**
     * Send proposal approved notification
     */
    const sendProposalApproved = useCallback(async ({ userEmail, userName, proposalData }) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await emailService.sendProposalApprovedNotification({
                userEmail,
                userName,
                proposalData
            });

            toast({
                title: "Email Sent",
                description: "Approval notification sent successfully",
                variant: "default"
            });

            return result;
        } catch (error) {
            const errorMessage = error.message || 'Failed to send approval notification';
            setError(errorMessage);

            toast({
                title: "Email Failed",
                description: errorMessage,
                variant: "destructive"
            });

            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    /**
     * Send proposal rejected notification
     */
    const sendProposalRejected = useCallback(async ({ userEmail, userName, proposalData, adminComments }) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await emailService.sendProposalRejectedNotification({
                userEmail,
                userName,
                proposalData,
                adminComments
            });

            toast({
                title: "Email Sent",
                description: "Rejection notification sent successfully",
                variant: "default"
            });

            return result;
        } catch (error) {
            const errorMessage = error.message || 'Failed to send rejection notification';
            setError(errorMessage);

            toast({
                title: "Email Failed",
                description: errorMessage,
                variant: "destructive"
            });

            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    /**
     * Send custom email
     */
    const sendCustomEmail = useCallback(async ({ to, subject, html, attachments }) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await emailService.sendCustomEmail({
                to,
                subject,
                html,
                attachments
            });

            toast({
                title: "Email Sent",
                description: "Custom email sent successfully",
                variant: "default"
            });

            return result;
        } catch (error) {
            const errorMessage = error.message || 'Failed to send custom email';
            setError(errorMessage);

            toast({
                title: "Email Failed",
                description: errorMessage,
                variant: "destructive"
            });

            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    /**
     * Test email configuration
     */
    const testEmailConfiguration = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await emailService.testEmailConfiguration();

            toast({
                title: "Email Test",
                description: "Email configuration test successful",
                variant: "default"
            });

            return result;
        } catch (error) {
            const errorMessage = error.message || 'Email configuration test failed';
            setError(errorMessage);

            toast({
                title: "Email Test Failed",
                description: errorMessage,
                variant: "destructive"
            });

            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    /**
     * Get email service status
     */
    const getEmailStatus = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await emailService.getEmailStatus();
            return result;
        } catch (error) {
            const errorMessage = error.message || 'Failed to get email status';
            setError(errorMessage);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Send proposal submission with retry logic
     */
    const sendProposalSubmissionWithRetry = useCallback(async ({ userEmail, userName, proposalData, maxRetries = 3 }) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await emailService.sendProposalSubmissionWithRetry({
                userEmail,
                userName,
                proposalData,
                maxRetries
            });

            toast({
                title: "Email Sent",
                description: "Proposal notification sent successfully with retry",
                variant: "default"
            });

            return result;
        } catch (error) {
            const errorMessage = error.message || 'Failed to send proposal notification after retries';
            setError(errorMessage);

            toast({
                title: "Email Failed",
                description: errorMessage,
                variant: "destructive"
            });

            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // State
        isLoading,
        error,

        // Actions
        sendProposalSubmitted,
        sendProposalApproved,
        sendProposalRejected,
        sendCustomEmail,
        testEmailConfiguration,
        getEmailStatus,
        sendProposalSubmissionWithRetry,
        clearError
    };
};
