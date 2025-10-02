/**
 * Email Service Tests
 * Purpose: Test frontend email service functionality
 * Key approaches: Vitest mocks, API testing, error handling
 * Refactor: Comprehensive email service testing
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import emailService from '../email-service';

// Mock the API utility
vi.mock('@/utils/api', () => ({
    api: {
        post: vi.fn(),
        get: vi.fn()
    }
}));

// Mock the utils
vi.mock('@/lib/utils', () => ({
    getAppConfig: vi.fn(() => ({ backendUrl: 'http://localhost:5000' }))
}));

describe('Email Service', () => {
    const mockApi = require('@/utils/api').api;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('testEmailConfiguration', () => {
        it('should test email configuration successfully', async () => {
            const mockResponse = {
                success: true,
                message: 'Email configuration is working',
                details: {
                    smtp: 'gmail',
                    user: 'test@example.com'
                }
            };

            mockApi.post.mockResolvedValue(mockResponse);

            const result = await emailService.testEmailConfiguration();

            expect(mockApi.post).toHaveBeenCalledWith('/email/test');
            expect(result.success).toBe(true);
            expect(result.message).toBe('Email configuration is working');
        });

        it('should handle email configuration test failure', async () => {
            const mockResponse = {
                success: false,
                message: 'Email configuration failed'
            };

            mockApi.post.mockResolvedValue(mockResponse);

            await expect(emailService.testEmailConfiguration()).rejects.toThrow('Email test failed');
        });

        it('should handle network errors', async () => {
            mockApi.post.mockRejectedValue(new Error('Network error'));

            await expect(emailService.testEmailConfiguration()).rejects.toThrow('Email test failed: Network error');
        });
    });

    describe('sendProposalSubmittedNotification', () => {
        it('should send proposal submitted notification successfully', async () => {
            const mockResponse = {
                success: true,
                message: 'Proposal notification sent successfully',
                data: {
                    messageId: 'test-message-id',
                    to: 'test@example.com',
                    subject: 'Proposal Submitted - CEDO'
                }
            };

            mockApi.post.mockResolvedValue(mockResponse);

            const result = await emailService.sendProposalSubmittedNotification({
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: {
                    event_name: 'Test Event',
                    event_start_date: '2024-02-15',
                    event_venue: 'Test Venue',
                    uuid: 'test-uuid-123'
                }
            });

            expect(mockApi.post).toHaveBeenCalledWith('/email/send-proposal-notification', {
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: {
                    event_name: 'Test Event',
                    event_start_date: '2024-02-15',
                    event_venue: 'Test Venue',
                    uuid: 'test-uuid-123'
                }
            });
            expect(result.success).toBe(true);
            expect(result.message).toBe('Proposal notification sent successfully');
        });

        it('should handle proposal notification failure', async () => {
            const mockResponse = {
                success: false,
                message: 'Failed to send proposal notification'
            };

            mockApi.post.mockResolvedValue(mockResponse);

            await expect(emailService.sendProposalSubmittedNotification({
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: {}
            })).rejects.toThrow('Failed to send proposal notification');
        });
    });

    describe('sendProposalApprovedNotification', () => {
        it('should send proposal approved notification successfully', async () => {
            const mockResponse = {
                success: true,
                message: 'Approval notification sent successfully',
                data: {
                    messageId: 'test-message-id',
                    to: 'test@example.com',
                    subject: 'Proposal Approved - CEDO'
                }
            };

            mockApi.post.mockResolvedValue(mockResponse);

            const result = await emailService.sendProposalApprovedNotification({
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: {
                    event_name: 'Test Event',
                    event_start_date: '2024-02-15',
                    event_venue: 'Test Venue',
                    uuid: 'test-uuid-123'
                }
            });

            expect(mockApi.post).toHaveBeenCalledWith('/email/send-approval-notification', {
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: {
                    event_name: 'Test Event',
                    event_start_date: '2024-02-15',
                    event_venue: 'Test Venue',
                    uuid: 'test-uuid-123'
                }
            });
            expect(result.success).toBe(true);
        });
    });

    describe('sendProposalRejectedNotification', () => {
        it('should send proposal rejected notification successfully', async () => {
            const mockResponse = {
                success: true,
                message: 'Rejection notification sent successfully',
                data: {
                    messageId: 'test-message-id',
                    to: 'test@example.com',
                    subject: 'Proposal Not Approved - CEDO'
                }
            };

            mockApi.post.mockResolvedValue(mockResponse);

            const result = await emailService.sendProposalRejectedNotification({
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: {
                    event_name: 'Test Event',
                    event_start_date: '2024-02-15',
                    event_venue: 'Test Venue',
                    uuid: 'test-uuid-123'
                },
                adminComments: 'Test rejection feedback'
            });

            expect(mockApi.post).toHaveBeenCalledWith('/email/send-rejection-notification', {
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: {
                    event_name: 'Test Event',
                    event_start_date: '2024-02-15',
                    event_venue: 'Test Venue',
                    uuid: 'test-uuid-123'
                },
                adminComments: 'Test rejection feedback'
            });
            expect(result.success).toBe(true);
        });
    });

    describe('sendCustomEmail', () => {
        it('should send custom email successfully', async () => {
            const mockResponse = {
                success: true,
                message: 'Custom email sent successfully',
                data: {
                    messageId: 'test-message-id',
                    to: 'test@example.com',
                    subject: 'Test Custom Email'
                }
            };

            mockApi.post.mockResolvedValue(mockResponse);

            const result = await emailService.sendCustomEmail({
                to: 'test@example.com',
                subject: 'Test Custom Email',
                html: '<h1>Test Email</h1>',
                attachments: []
            });

            expect(mockApi.post).toHaveBeenCalledWith('/email/send-custom', {
                to: 'test@example.com',
                subject: 'Test Custom Email',
                html: '<h1>Test Email</h1>',
                attachments: []
            });
            expect(result.success).toBe(true);
        });
    });

    describe('getEmailStatus', () => {
        it('should get email status successfully', async () => {
            const mockResponse = {
                success: true,
                data: {
                    initialized: true,
                    templateCount: 3,
                    smtp: 'gmail',
                    user: 'test@example.com'
                }
            };

            mockApi.get.mockResolvedValue(mockResponse);

            const result = await emailService.getEmailStatus();

            expect(mockApi.get).toHaveBeenCalledWith('/email/status');
            expect(result.success).toBe(true);
            expect(result.data.initialized).toBe(true);
            expect(result.data.templateCount).toBe(3);
        });
    });

    describe('sendProposalSubmissionWithRetry', () => {
        it('should retry on failure and eventually succeed', async () => {
            const mockResponse = {
                success: true,
                message: 'Proposal notification sent successfully',
                data: {
                    messageId: 'test-message-id',
                    to: 'test@example.com',
                    subject: 'Proposal Submitted - CEDO'
                }
            };

            // First call fails, second call succeeds
            mockApi.post
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(mockResponse);

            const result = await emailService.sendProposalSubmissionWithRetry({
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: {
                    event_name: 'Test Event',
                    event_start_date: '2024-02-15',
                    event_venue: 'Test Venue',
                    uuid: 'test-uuid-123'
                },
                maxRetries: 2
            });

            expect(mockApi.post).toHaveBeenCalledTimes(2);
            expect(result.success).toBe(true);
        });

        it('should fail after all retries', async () => {
            mockApi.post.mockRejectedValue(new Error('Persistent network error'));

            await expect(emailService.sendProposalSubmissionWithRetry({
                userEmail: 'test@example.com',
                userName: 'Test User',
                proposalData: {},
                maxRetries: 2
            })).rejects.toThrow('Persistent network error');

            expect(mockApi.post).toHaveBeenCalledTimes(2);
        });
    });
});

