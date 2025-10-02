/**
 * Notification Service
 * Purpose: Handle notification creation and management from the frontend
 * Key approaches: API integration, error handling, user feedback
 */

import { getAppConfig } from '@/lib/utils';

class NotificationService {
    constructor() {
        // Get backend URL with fallback
        const config = getAppConfig();
        this.baseUrl = config?.backendUrl || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

        // Ensure the URL doesn't end with /api to prevent double /api/ in URLs
        if (this.baseUrl.endsWith('/api')) {
            this.baseUrl = this.baseUrl.replace(/\/api$/, '');
        }

        console.log('🔧 NotificationService baseUrl:', this.baseUrl);
    }

    /**
     * Get authentication token from cookies
     */
    getAuthToken() {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('cedo_token='))
            ?.split('=')[1];
        return token;
    }

    /**
     * Create a notification for proposal submission
     */
    async createProposalSubmittedNotification({
        recipientId,
        proposalId,
        proposalUuid,
        eventName,
        contactPerson,
        organizationName
    }) {
        try {
            console.log('🔔 Creating proposal submission notification...');
            console.log('🔧 Base URL:', this.baseUrl);
            console.log('🔧 Recipient ID:', recipientId);
            console.log('🔧 Proposal ID:', proposalId);

            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const message = `Your proposal "${eventName}" has been submitted for review. You will be notified once it's reviewed by the admin.`;

            const requestUrl = `${this.baseUrl}/api/notifications`;
            console.log('🔧 Request URL:', requestUrl);

            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    targetType: 'user',
                    targetUserId: recipientId,
                    title: 'Proposal Submitted',
                    message,
                    notificationType: 'proposal_status_change',
                    priority: 'normal',
                    relatedProposalId: proposalId,
                    metadata: {
                        proposalUuid,
                        eventName,
                        contactPerson,
                        organizationName
                    }
                })
            });

            console.log('🔧 Response status:', response.status);
            console.log('🔧 Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error Response:', errorText);
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('🔧 API Response:', result);

            if (result.success) {
                console.log('✅ Proposal submission notification created:', result.data.uuid);
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to create notification');
            }

        } catch (error) {
            console.error('❌ Failed to create proposal submission notification:', error);
            throw error;
        }
    }

    /**
     * Create a notification for admin about new proposal submission
     */
    async createAdminNotificationForNewProposal({
        proposalId,
        proposalUuid,
        eventName,
        contactPerson,
        organizationName,
        adminUserId = null // Prefer role targeting if not explicitly provided
    }) {
        try {
            console.log('🔔 Creating admin notification for new proposal...');
            console.log('🔧 Base URL:', this.baseUrl);
            console.log('🔧 Admin User ID:', adminUserId);
            console.log('🔧 Proposal ID:', proposalId);

            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const message = `New proposal "${eventName}" has been submitted by ${contactPerson} from ${organizationName}. Please review it.`;

            const requestUrl = `${this.baseUrl}/api/notifications`;
            console.log('🔧 Request URL:', requestUrl);

            const response = await fetch(requestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify((() => {
                    const base = {
                        title: 'New Proposal Submitted',
                        message,
                        notificationType: 'proposal_status_change',
                        priority: 'high',
                        relatedProposalId: proposalId,
                        metadata: { proposalUuid, eventName, contactPerson, organizationName }
                    };
                    if (adminUserId && Number.isInteger(adminUserId)) {
                        return { ...base, targetType: 'user', targetUserId: adminUserId };
                    }
                    // Default to head_admin per backend role_type enum
                    return { ...base, targetType: 'role', targetRole: 'head_admin' };
                })())
            });

            console.log('🔧 Response status:', response.status);
            console.log('🔧 Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error Response:', errorText);
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('🔧 API Response:', result);

            if (result.success) {
                console.log('✅ Admin notification created for new proposal:', result.data.uuid);
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to create admin notification');
            }

        } catch (error) {
            console.error('❌ Failed to create admin notification:', error);
            throw error;
        }
    }

    /**
     * Create a system notification
     */
    async createSystemNotification({ recipientId, message, relatedProposalId = null, relatedProposalUuid = null }) {
        try {
            const token = this.getAuthToken();
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`${this.baseUrl}/api/notifications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    recipientId,
                    notificationType: 'proposal_status_change',
                    message,
                    relatedProposalId,
                    relatedProposalUuid
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('✅ System notification created:', result.data.uuid);
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to create system notification');
            }

        } catch (error) {
            console.error('❌ Failed to create system notification:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
