/**
 * Notification Service Tests
 * Purpose: Test the notification service functionality
 * Key approaches: Unit testing, API mocking, error handling
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notificationService } from '../notification-service';

// Mock getAppConfig
vi.mock('@/lib/utils', () => ({
    getAppConfig: () => ({
        backendUrl: 'http://localhost:5000'
    })
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
    writable: true,
    value: 'cedo_token=test-token-123'
});

describe('Notification Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create proposal submitted notification', async () => {
        // Mock successful API response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    id: 1,
                    uuid: 'test-uuid-123',
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
                    recipientId: 2,
                    notificationType: 'proposal_status_change',
                    message: 'Your proposal "Test Event" has been submitted for review. You will be notified once it\'s reviewed by the admin.',
                    relatedProposalId: 123,
                    relatedProposalUuid: 'proposal-uuid-123'
                })
            })
        );
    });

    it('should create admin notification for new proposal', async () => {
        // Mock successful API response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    id: 2,
                    uuid: 'admin-uuid-123',
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
                    recipientId: 2,
                    notificationType: 'proposal_status_change',
                    message: 'New proposal "Test Event" has been submitted by John Doe from Test Organization. Please review it.',
                    relatedProposalId: 123,
                    relatedProposalUuid: 'proposal-uuid-123'
                })
            })
        );
    });

    it('should handle API errors gracefully', async () => {
        // Mock API error
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500
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
        ).rejects.toThrow('API request failed: 500');
    });

    it('should handle missing authentication token', async () => {
        // Mock missing token
        Object.defineProperty(document, 'cookie', {
            writable: true,
            value: ''
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
        ).rejects.toThrow('Authentication token not found');
    });

    it('should create system notification', async () => {
        // Restore cookie for this test
        Object.defineProperty(document, 'cookie', {
            writable: true,
            value: 'cedo_token=test-token-123'
        });

        // Mock successful API response
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    id: 3,
                    uuid: 'system-uuid-123',
                    message: 'System maintenance scheduled for this weekend.'
                }
            })
        });

        const result = await notificationService.createSystemNotification({
            recipientId: 2,
            message: 'System maintenance scheduled for this weekend.',
            relatedProposalId: 123,
            relatedProposalUuid: 'proposal-uuid-123'
        });

        expect(result.uuid).toBe('system-uuid-123');
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:5000/api/notifications',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    recipientId: 2,
                    notificationType: 'proposal_status_change',
                    message: 'System maintenance scheduled for this weekend.',
                    relatedProposalId: 123,
                    relatedProposalUuid: 'proposal-uuid-123'
                })
            })
        );
    });
});
