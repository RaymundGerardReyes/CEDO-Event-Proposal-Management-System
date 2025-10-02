/**
 * Improved Notification Service
 * Purpose: Enhanced notification service using the upgraded schema
 * Key approaches: Priority levels, status tracking, multi-channel delivery, templates
 */

require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

class ImprovedNotificationService {
    constructor() {
        this.priorities = ['low', 'normal', 'high', 'urgent'];
        this.statuses = ['pending', 'delivered', 'read', 'archived', 'expired'];
    }

    /**
     * Create a new notification with enhanced features
     */
    async createNotification({
        recipientId,
        senderId = null,
        type = 'proposal_status_change',
        title = 'Notification',
        message,
        priority = 'normal',
        relatedProposalId = null,
        relatedProposalUuid = null,
        relatedUserId = null,
        metadata = {},
        tags = [],
        expiresAt = null,
        deliveryChannels = ['in_app']
    }) {
        try {
            // Validate priority
            if (!this.priorities.includes(priority)) {
                priority = 'normal';
            }

            // Create the notification
            const result = await pool.query(`
                INSERT INTO notifications (
                    recipient_id, sender_id, notification_type, title, message,
                    priority, status, related_proposal_id, related_proposal_uuid,
                    related_user_id, metadata, tags, expires_at, created_by, updated_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING id, uuid, title, message, priority, status, created_at
            `, [
                recipientId, senderId, type, title, message, priority, 'pending',
                relatedProposalId, relatedProposalUuid, relatedUserId,
                JSON.stringify(metadata), tags, expiresAt, senderId, senderId
            ]);

            const notification = result.rows[0];

            // Update status to delivered for in-app notifications
            await pool.query(`
                UPDATE notifications 
                SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [notification.id]);

            console.log(`✅ Created enhanced notification: ${notification.title} (${notification.priority})`);
            return notification;

        } catch (error) {
            console.error('❌ Failed to create notification:', error);
            throw error;
        }
    }

    /**
     * Get notifications for a user with enhanced filtering
     */
    async getUserNotifications(userId, options = {}) {
        const {
            page = 1,
            limit = 50,
            unreadOnly = false,
            priority = null,
            status = null,
            type = null
        } = options;

        let query = `
            SELECT n.*, 
                   u.name as sender_name,
                   u.email as sender_email
            FROM notifications n
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.recipient_id = $1
        `;

        const params = [userId];
        let paramCount = 1;

        if (unreadOnly) {
            query += ` AND n.is_read = false`;
        }

        if (priority) {
            paramCount++;
            query += ` AND n.priority = $${paramCount}`;
            params.push(priority);
        }

        if (status) {
            paramCount++;
            query += ` AND n.status = $${paramCount}`;
            params.push(status);
        }

        if (type) {
            paramCount++;
            query += ` AND n.notification_type = $${paramCount}`;
            params.push(type);
        }

        query += ` AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)`;
        query += ` AND n.status != 'expired'`;
        query += ` ORDER BY n.priority DESC, n.created_at DESC`;
        query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;

        params.push(limit);
        params.push((page - 1) * limit);

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId) {
        const result = await pool.query(`
            SELECT COUNT(*) as count
            FROM notifications
            WHERE recipient_id = $1
            AND is_read = false
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            AND status != 'expired'
        `, [userId]);

        return parseInt(result.rows[0].count);
    }

    /**
     * Mark notifications as read
     */
    async markAsRead(userId, notificationIds = null) {
        let query, params;

        if (notificationIds && notificationIds.length > 0) {
            query = `
                UPDATE notifications
                SET is_read = true, read_at = CURRENT_TIMESTAMP, status = 'read'
                WHERE recipient_id = $1 AND id = ANY($2)
            `;
            params = [userId, notificationIds];
        } else {
            query = `
                UPDATE notifications
                SET is_read = true, read_at = CURRENT_TIMESTAMP, status = 'read'
                WHERE recipient_id = $1 AND is_read = false
            `;
            params = [userId];
        }

        const result = await pool.query(query, params);
        return result.rowCount;
    }

    /**
     * Create proposal-related notifications
     */
    async createProposalNotification({
        proposalId,
        proposalUuid,
        eventName,
        submitterName,
        organizationName,
        action, // 'submitted', 'approved', 'rejected', 'updated'
        adminId = null,
        studentId = null
    }) {
        const notifications = [];

        if (action === 'submitted' && adminId) {
            notifications.push({
                recipientId: adminId,
                senderId: studentId,
                type: 'proposal_submitted',
                title: 'New Proposal Submitted',
                message: `A new proposal "${eventName}" has been submitted by ${submitterName} from ${organizationName}. Please review it.`,
                priority: 'normal',
                relatedProposalId: proposalId,
                relatedProposalUuid: proposalUuid,
                metadata: { eventName, submitterName, organizationName, action }
            });
        }

        if (['approved', 'rejected'].includes(action) && studentId) {
            const statusText = action === 'approved' ? 'approved' : 'not approved';
            const priority = action === 'approved' ? 'normal' : 'high';

            notifications.push({
                recipientId: studentId,
                senderId: adminId,
                type: `proposal_${action}`,
                title: `Proposal ${action === 'approved' ? 'Approved' : 'Not Approved'}`,
                message: `Your proposal "${eventName}" has been ${statusText}. ${action === 'rejected' ? 'Please review the feedback and resubmit.' : 'Congratulations!'}`,
                priority,
                relatedProposalId: proposalId,
                relatedProposalUuid: proposalUuid,
                metadata: { eventName, action, statusText }
            });
        }

        const createdNotifications = [];
        for (const notificationData of notifications) {
            try {
                const notification = await this.createNotification(notificationData);
                createdNotifications.push(notification);
            } catch (error) {
                console.error(`❌ Failed to create ${action} notification:`, error);
            }
        }

        return createdNotifications;
    }

    /**
     * Create system notification
     */
    async createSystemNotification({
        recipientIds, // Array of user IDs or 'all' for all users
        title,
        message,
        priority = 'normal',
        type = 'system_update',
        expiresAt = null
    }) {
        let targetUserIds = [];

        if (recipientIds === 'all') {
            const result = await pool.query(`SELECT id FROM users WHERE is_approved = true`);
            targetUserIds = result.rows.map(row => row.id);
        } else if (Array.isArray(recipientIds)) {
            targetUserIds = recipientIds;
        } else {
            targetUserIds = [recipientIds];
        }

        const createdNotifications = [];
        for (const userId of targetUserIds) {
            try {
                const notification = await this.createNotification({
                    recipientId: userId,
                    type,
                    title,
                    message,
                    priority,
                    expiresAt
                });
                createdNotifications.push(notification);
            } catch (error) {
                console.error(`❌ Failed to create system notification for user ${userId}:`, error);
            }
        }

        return createdNotifications;
    }

    /**
     * Get notification statistics
     */
    async getNotificationStats(userId) {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_notifications,
                COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count,
                COUNT(CASE WHEN is_read = true THEN 1 END) as read_count,
                COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
                COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority_count,
                COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_count,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week_count,
                COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as month_count
            FROM notifications
            WHERE recipient_id = $1
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            AND status != 'expired'
        `, [userId]);

        return result.rows[0];
    }

    /**
     * Clean up expired notifications
     */
    async cleanupExpiredNotifications() {
        try {
            // Mark expired notifications
            await pool.query(`
                UPDATE notifications 
                SET status = 'expired'
                WHERE expires_at IS NOT NULL 
                AND expires_at < CURRENT_TIMESTAMP 
                AND status != 'expired'
            `);

            // Delete very old expired notifications (older than 30 days)
            await pool.query(`
                DELETE FROM notifications 
                WHERE expires_at IS NOT NULL 
                AND expires_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
                AND status = 'expired'
            `);

            console.log('🧹 Expired notifications cleaned up');
        } catch (error) {
            console.error('❌ Failed to cleanup expired notifications:', error);
        }
    }

    /**
     * Get notification templates
     */
    async getTemplates(type = null) {
        let query = 'SELECT * FROM notification_templates WHERE is_active = true';
        const params = [];

        if (type) {
            query += ' AND notification_type = $1';
            params.push(type);
        }

        query += ' ORDER BY name';

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Get user notification preferences
     */
    async getUserPreferences(userId) {
        const result = await pool.query(`
            SELECT * FROM notification_preferences 
            WHERE user_id = $1
            ORDER BY notification_type
        `, [userId]);

        return result.rows;
    }

    /**
     * Update user notification preferences
     */
    async updateUserPreferences(userId, preferences) {
        const { notificationType, inApp, email, sms, push, frequency } = preferences;

        await pool.query(`
            INSERT INTO notification_preferences 
            (user_id, notification_type, in_app, email, sms, push, frequency)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, notification_type)
            DO UPDATE SET
                in_app = EXCLUDED.in_app,
                email = EXCLUDED.email,
                sms = EXCLUDED.sms,
                push = EXCLUDED.push,
                frequency = EXCLUDED.frequency,
                updated_at = CURRENT_TIMESTAMP
        `, [userId, notificationType, inApp, email, sms, push, frequency]);
    }
}

module.exports = new ImprovedNotificationService();
