/**
 * Notification Service Integration Test
 * Tests the notification service with proper backend URL configuration
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock the utils module
vi.mock('@/lib/utils', () => ({
    getAppConfig: () => ({
        backendUrl: 'http://localhost:5000'
    })
}));

describe('Notification Service Integration', () => {
    let notificationService;

    beforeEach(async () => {
        // Reset mocks
        vi.clearAllMocks();

        // Import the service after mocking
        const { notificationService: service } = await import('../notification-service.js');
        notificationService = service;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Service Configuration', () => {
        it('should set correct baseUrl', () => {
            expect(notificationService.baseUrl).toBe('http://localhost:5000');
        });
    });

    describe('createProposalSubmittedNotification', () => {
        it('should make correct API request', async () => {
            // Mock document.cookie to return a token
            Object.defineProperty(document, 'cookie', {
                writable: true,
                value: 'cedo_token=test-token-123; other_cookie=value'
            });

            // Mock successful response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: {
                        id: 1,
                        uuid: 'test-uuid-123',
                        title: 'Proposal Submitted',
                        message: 'Your proposal "Test Event" has been submitted for review.'
                    }
                })
            });

            const result = await notificationService.createProposalSubmittedNotification({
                recipientId: 2,
                proposalId: 123,
                proposalUuid: 'proposal-uuid-123',
                eventName: 'Test Event',
                contactPerson: 'John Doe',
                organizationName: 'Test Organization'
            });

            expect(result.uuid).toBe('test-uuid-123');
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/notifications',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test-token-123'
                    },
                    body: JSON.stringify({
                        targetType: 'user',
                        targetUserId: 2,
                        title: 'Proposal Submitted',
                        message: 'Your proposal "Test Event" has been submitted for review. You will be notified once it\'s reviewed by the admin.',
                        notificationType: 'proposal_status_change',
                        priority: 'normal',
                        relatedProposalId: 123,
                        metadata: {
                            proposalUuid: 'proposal-uuid-123',
                            eventName: 'Test Event',
                            contactPerson: 'John Doe',
                            organizationName: 'Test Organization'
                        }
                    })
                })
            );
        });

        it('should handle API errors correctly', async () => {
            // Mock document.cookie to return a token
            Object.defineProperty(document, 'cookie', {
                writable: true,
                value: 'cedo_token=test-token-123; other_cookie=value'
            });

            // Mock error response
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                text: async () => 'Not Found'
            });

            await expect(
                notificationService.createProposalSubmittedNotification({
                    recipientId: 2,
                    proposalId: 123,
                    proposalUuid: 'proposal-uuid-123',
                    eventName: 'Test Event',
                    contactPerson: 'John Doe',
                    organizationName: 'Test Organization'
                })
            ).rejects.toThrow('API request failed: 404 - Not Found');
        });
    });

    describe('createAdminNotificationForNewProposal', () => {
        it('should make correct API request', async () => {
            // Mock document.cookie to return a token
            Object.defineProperty(document, 'cookie', {
                writable: true,
                value: 'cedo_token=test-token-123; other_cookie=value'
            });

            // Mock successful response
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    data: {
                        id: 2,
                        uuid: 'admin-uuid-123',
                        title: 'New Proposal Submitted',
                        message: 'New proposal "Test Event" has been submitted by John Doe from Test Organization.'
                    }
                })
            });

            const result = await notificationService.createAdminNotificationForNewProposal({
                proposalId: 123,
                proposalUuid: 'proposal-uuid-123',
                eventName: 'Test Event',
                contactPerson: 'John Doe',
                organizationName: 'Test Organization',
                adminUserId: 2
            });

            expect(result.uuid).toBe('admin-uuid-123');
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:5000/api/notifications',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer test-token-123'
                    },
                    body: JSON.stringify({
                        targetType: 'user',
                        targetUserId: 2,
                        title: 'New Proposal Submitted',
                        message: 'New proposal "Test Event" has been submitted by John Doe from Test Organization. Please review it.',
                        notificationType: 'proposal_status_change',
                        priority: 'high',
                        relatedProposalId: 123,
                        metadata: {
                            proposalUuid: 'proposal-uuid-123',
                            eventName: 'Test Event',
                            contactPerson: 'John Doe',
                            organizationName: 'Test Organization'
                        }
                    })
                })
            );
        });
    });

    describe('getAuthToken', () => {
        it('should extract token from cookies', () => {
            // Mock document.cookie
            Object.defineProperty(document, 'cookie', {
                writable: true,
                value: 'cedo_token=test-token-123; other_cookie=value'
            });

            const token = notificationService.getAuthToken();
            expect(token).toBe('test-token-123');
        });

        it('should return undefined when no token found', () => {
            // Mock document.cookie
            Object.defineProperty(document, 'cookie', {
                writable: true,
                value: 'other_cookie=value'
            });

            const token = notificationService.getAuthToken();
            expect(token).toBeUndefined();
        });
    });
});
