/**
 * Frontend Email Service for CEDO Proposal Management System
 * Purpose: Handle email notifications from frontend to backend
 * Key approaches: Centralized API calls, error handling, user feedback
 * Refactor: Reusable email service with proper error handling
 */

import { getAppConfig } from '@/lib/utils';
import { api } from '@/utils/api';

class EmailService {
    constructor() {
        this.baseUrl = getAppConfig().backendUrl;
    }

    /**
     * Test email configuration
     */
    async testEmailConfiguration() {
        try {
            console.log('🧪 Testing email configuration...');

            const response = await api.post('/email/test');

            if (response.success) {
                console.log('✅ Email configuration test successful');
                return {
                    success: true,
                    message: response.message,
                    details: response.details
                };
            } else {
                throw new Error(response.message || 'Email test failed');
            }
        } catch (error) {
            console.error('❌ Email configuration test failed:', error);
            throw new Error(`Email test failed: ${error.message}`);
        }
    }

    /**
     * Send proposal submitted notification
     */
    async sendProposalSubmittedNotification({ userEmail, userName, proposalData }) {
        try {
            console.log(`📧 Sending proposal notification to ${userEmail}`);

            const response = await api.post('/email/send-proposal-notification', {
                userEmail,
                userName,
                proposalData
            });

            if (response.success) {
                console.log('✅ Proposal notification sent successfully');
                return {
                    success: true,
                    message: response.message,
                    data: response.data
                };
            } else if (response.demo) {
                console.warn('⚠️ Email service not configured. Running in demo mode.');
                return {
                    success: false,
                    message: 'Email service not configured. Email was not sent.',
                    demo: true,
                    data: response.data
                };
            } else {
                throw new Error(response.message || 'Failed to send proposal notification');
            }
        } catch (error) {
            console.error('❌ Failed to send proposal notification:', error);
            throw new Error(`Failed to send proposal notification: ${error.message}`);
        }
    }

    /**
     * Send proposal approved notification
     */
    async sendProposalApprovedNotification({ userEmail, userName, proposalData }) {
        try {
            console.log(`✅ Sending approval notification to ${userEmail}`);

            const response = await api.post('/email/send-approval-notification', {
                userEmail,
                userName,
                proposalData
            });

            if (response.success) {
                console.log('✅ Approval notification sent successfully');
                return {
                    success: true,
                    message: response.message,
                    data: response.data
                };
            } else if (response.demo) {
                console.warn('⚠️ Email service not configured. Running in demo mode.');
                return {
                    success: false,
                    message: 'Email service not configured. Email was not sent.',
                    demo: true,
                    data: response.data
                };
            } else {
                throw new Error(response.message || 'Failed to send approval notification');
            }
        } catch (error) {
            console.error('❌ Failed to send approval notification:', error);
            throw new Error(`Failed to send approval notification: ${error.message}`);
        }
    }

    /**
     * Send proposal rejected notification
     */
    async sendProposalRejectedNotification({ userEmail, userName, proposalData, adminComments }) {
        try {
            console.log(`❌ Sending rejection notification to ${userEmail}`);

            const response = await api.post('/email/send-rejection-notification', {
                userEmail,
                userName,
                proposalData,
                adminComments
            });

            if (response.success) {
                console.log('✅ Rejection notification sent successfully');
                return {
                    success: true,
                    message: response.message,
                    data: response.data
                };
            } else if (response.demo) {
                console.warn('⚠️ Email service not configured. Running in demo mode.');
                return {
                    success: false,
                    message: 'Email service not configured. Email was not sent.',
                    demo: true,
                    data: response.data
                };
            } else {
                throw new Error(response.message || 'Failed to send rejection notification');
            }
        } catch (error) {
            console.error('❌ Failed to send rejection notification:', error);
            throw new Error(`Failed to send rejection notification: ${error.message}`);
        }
    }

    /**
     * Send custom email
     */
    async sendCustomEmail({ to, subject, html, attachments = [] }) {
        try {
            console.log(`📧 Sending custom email to ${to}`);

            const response = await api.post('/email/send-custom', {
                to,
                subject,
                html,
                attachments
            });

            if (response.success) {
                console.log('✅ Custom email sent successfully');
                return {
                    success: true,
                    message: response.message,
                    data: response.data
                };
            } else {
                throw new Error(response.message || 'Failed to send custom email');
            }
        } catch (error) {
            console.error('❌ Failed to send custom email:', error);
            throw new Error(`Failed to send custom email: ${error.message}`);
        }
    }

    /**
     * Get email service status
     */
    async getEmailStatus() {
        try {
            console.log('📊 Getting email service status...');

            const response = await api.get('/email/status');

            if (response.success) {
                return {
                    success: true,
                    data: response.data
                };
            } else {
                throw new Error(response.message || 'Failed to get email status');
            }
        } catch (error) {
            console.error('❌ Failed to get email status:', error);
            throw new Error(`Failed to get email status: ${error.message}`);
        }
    }

    /**
     * Send proposal submission notification with automatic retry
     */
    async sendProposalSubmissionWithRetry({ userEmail, userName, proposalData, maxRetries = 3 }) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`📧 Attempt ${attempt}/${maxRetries}: Sending proposal notification to ${userEmail}`);

                const result = await this.sendProposalSubmittedNotification({
                    userEmail,
                    userName,
                    proposalData
                });

                console.log(`✅ Proposal notification sent successfully on attempt ${attempt}`);
                return result;

            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed:`, error.message);

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`⏳ Waiting ${delay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.error(`❌ All ${maxRetries} attempts failed for proposal notification`);
        throw lastError;
    }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;
