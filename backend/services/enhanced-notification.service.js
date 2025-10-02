/**
 * Enhanced Notification Service
 * Purpose: Comprehensive notification system with multi-channel delivery, priority levels, and templates
 * Key approaches: Template-based messaging, multi-channel delivery, user preferences, delivery tracking
 */

require('dotenv').config();
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

class EnhancedNotificationService {
    constructor() {
        this.emailTransporter = null;
        this.initializeEmailTransporter();
    }

    /**
     * Initialize email transporter
     */
    async initializeEmailTransporter() {
        try {
            this.emailTransporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            console.log('📧 Email transporter initialized');
        } catch (error) {
            console.log('⚠️ Email transporter not configured, notifications will be in-app only');
        }
    }

    /**
     * Create a new notification
     */
    async createNotification({
        recipientId,
        senderId = null,
        type,
        title,
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
            // Get user preferences
            const preferences = await this.getUserNotificationPreferences(recipientId, type);

            // Determine actual delivery channels based on preferences
            const actualChannels = this.determineDeliveryChannels(preferences, deliveryChannels);

            // Create notification
            const result = await pool.query(
                `INSERT INTO notifications_enhanced 
                 (recipient_id, sender_id, notification_type, title, message, priority, 
                  related_proposal_id, related_proposal_uuid, related_user_id, metadata, 
                  tags, expires_at, delivery_channels, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                 RETURNING id, uuid, title, message, priority, status`,
                [
                    recipientId,
                    senderId,
                    type,
                    title,
                    message,
                    priority,
                    relatedProposalId,
                    relatedProposalUuid,
                    relatedUserId,
                    JSON.stringify(metadata),
                    tags,
                    expiresAt,
                    JSON.stringify(actualChannels),
                    senderId
                ]
            );

            const notification = result.rows[0];

            // Deliver notification through configured channels
            await this.deliverNotification(notification.id, actualChannels, preferences);

            return notification;
        } catch (error) {
            console.error('❌ Failed to create notification:', error);
            throw error;
        }
    }

    /**
     * Get user notification preferences
     */
    async getUserNotificationPreferences(userId, notificationType) {
        try {
            const result = await pool.query(
                `SELECT * FROM notification_preferences 
                 WHERE user_id = $1 AND notification_type = $2`,
                [userId, notificationType]
            );

            if (result.rows.length > 0) {
                return result.rows[0];
            }

            // Return default preferences if none set
            return {
                in_app: true,
                email: true,
                sms: false,
                push: true,
                frequency: 'immediate'
            };
        } catch (error) {
            console.error('❌ Failed to get user preferences:', error);
            return {
                in_app: true,
                email: false,
                sms: false,
                push: false,
                frequency: 'immediate'
            };
        }
    }

    /**
     * Determine delivery channels based on user preferences
     */
    determineDeliveryChannels(preferences, requestedChannels) {
        const channels = [];

        if (preferences.in_app && requestedChannels.includes('in_app')) {
            channels.push('in_app');
        }

        if (preferences.email && requestedChannels.includes('email')) {
            channels.push('email');
        }

        if (preferences.sms && requestedChannels.includes('sms')) {
            channels.push('sms');
        }

        if (preferences.push && requestedChannels.includes('push')) {
            channels.push('push');
        }

        return channels.length > 0 ? channels : ['in_app']; // Fallback to in_app
    }

    /**
     * Deliver notification through specified channels
     */
    async deliverNotification(notificationId, channels, preferences) {
        for (const channel of channels) {
            try {
                switch (channel) {
                    case 'in_app':
                        await this.deliverInApp(notificationId);
                        break;
                    case 'email':
                        if (preferences.email) {
                            await this.deliverEmail(notificationId);
                        }
                        break;
                    case 'sms':
                        if (preferences.sms) {
                            await this.deliverSMS(notificationId);
                        }
                        break;
                    case 'push':
                        if (preferences.push) {
                            await this.deliverPush(notificationId);
                        }
                        break;
                }
            } catch (error) {
                console.error(`❌ Failed to deliver via ${channel}:`, error);
                await this.logDeliveryAttempt(notificationId, channel, 'failed', error.message);
            }
        }
    }

    /**
     * Deliver in-app notification
     */
    async deliverInApp(notificationId) {
        await pool.query(
            `UPDATE notifications_enhanced 
             SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [notificationId]
        );
        await this.logDeliveryAttempt(notificationId, 'in_app', 'delivered');
    }

    /**
     * Deliver email notification
     */
    async deliverEmail(notificationId) {
        if (!this.emailTransporter) {
            throw new Error('Email transporter not configured');
        }

        const notification = await this.getNotificationById(notificationId);
        const user = await this.getUserById(notification.recipient_id);

        if (!user.email) {
            throw new Error('User email not found');
        }

        const emailOptions = {
            from: process.env.SMTP_FROM || 'noreply@cedo.gov.ph',
            to: user.email,
            subject: notification.title,
            html: this.generateEmailHTML(notification),
            text: notification.message
        };

        await this.emailTransporter.sendMail(emailOptions);

        await pool.query(
            `UPDATE notifications_enhanced 
             SET email_sent = true 
             WHERE id = $1`,
            [notificationId]
        );

        await this.logDeliveryAttempt(notificationId, 'email', 'sent');
    }

    /**
     * Deliver SMS notification (placeholder)
     */
    async deliverSMS(notificationId) {
        // Implement SMS delivery logic here
        console.log(`📱 SMS delivery for notification ${notificationId} (not implemented)`);
        await this.logDeliveryAttempt(notificationId, 'sms', 'pending');
    }

    /**
     * Deliver push notification (placeholder)
     */
    async deliverPush(notificationId) {
        // Implement push notification logic here
        console.log(`🔔 Push delivery for notification ${notificationId} (not implemented)`);
        await this.logDeliveryAttempt(notificationId, 'push', 'pending');
    }

    /**
     * Log delivery attempt
     */
    async logDeliveryAttempt(notificationId, channel, status, errorMessage = null) {
        try {
            await pool.query(
                `INSERT INTO notification_delivery_logs 
                 (notification_id, delivery_channel, status, error_message, delivered_at)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    notificationId,
                    channel,
                    status,
                    errorMessage,
                    status === 'delivered' || status === 'sent' ? new Date() : null
                ]
            );
        } catch (error) {
            console.error('❌ Failed to log delivery attempt:', error);
        }
    }

    /**
     * Get notification by ID
     */
    async getNotificationById(notificationId) {
        const result = await pool.query(
            `SELECT * FROM notifications_enhanced WHERE id = $1`,
            [notificationId]
        );
        return result.rows[0];
    }

    /**
     * Get user by ID
     */
    async getUserById(userId) {
        const result = await pool.query(
            `SELECT id, name, email, role FROM users WHERE id = $1`,
            [userId]
        );
        return result.rows[0];
    }

    /**
     * Generate email HTML
     */
    generateEmailHTML(notification) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${notification.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                    .content { padding: 20px; background: #fff; border: 1px solid #e9ecef; border-radius: 8px; }
                    .footer { margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; font-size: 14px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${notification.title}</h1>
                    </div>
                    <div class="content">
                        <p>${notification.message}</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated notification from CEDO System.</p>
                        <p>Please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Get notifications for user
     */
    async getUserNotifications(userId, options = {}) {
        const {
            page = 1,
            limit = 50,
            unreadOnly = false,
            type = null,
            priority = null
        } = options;

        let query = `
            SELECT n.*, 
                   u.name as sender_name,
                   u.email as sender_email
            FROM notifications_enhanced n
            LEFT JOIN users u ON n.sender_id = u.id
            WHERE n.recipient_id = $1
        `;

        const params = [userId];
        let paramCount = 1;

        if (unreadOnly) {
            query += ` AND n.is_read = false`;
        }

        if (type) {
            paramCount++;
            query += ` AND n.notification_type = $${paramCount}`;
            params.push(type);
        }

        if (priority) {
            paramCount++;
            query += ` AND n.priority = $${paramCount}`;
            params.push(priority);
        }

        query += ` AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)`;
        query += ` AND n.status != 'expired'`;
        query += ` ORDER BY n.created_at DESC`;
        query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;

        params.push(limit);
        params.push((page - 1) * limit);

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Get unread count for user
     */
    async getUnreadCount(userId) {
        const result = await pool.query(
            `SELECT get_unread_notification_count($1) as count`,
            [userId]
        );
        return parseInt(result.rows[0].count);
    }

    /**
     * Mark notifications as read
     */
    async markAsRead(userId, notificationIds = null) {
        const result = await pool.query(
            `SELECT mark_notifications_as_read($1, $2) as updated_count`,
            [userId, notificationIds]
        );
        return parseInt(result.rows[0].updated_count);
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
            // Notify admin about new proposal
            notifications.push({
                recipientId: adminId,
                senderId: studentId,
                type: 'proposal_submitted',
                title: 'New Proposal Submitted',
                message: `A new proposal "${eventName}" has been submitted by ${submitterName} from ${organizationName}. Please review it.`,
                priority: 'normal',
                relatedProposalId: proposalId,
                relatedProposalUuid: proposalUuid,
                metadata: {
                    eventName,
                    submitterName,
                    organizationName,
                    action
                }
            });
        }

        if (['approved', 'rejected'].includes(action) && studentId) {
            // Notify student about proposal status
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
                metadata: {
                    eventName,
                    action,
                    statusText
                }
            });
        }

        // Create all notifications
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
     * Clean up expired notifications
     */
    async cleanupExpiredNotifications() {
        try {
            await pool.query(`SELECT cleanup_expired_notifications()`);
            console.log('🧹 Expired notifications cleaned up');
        } catch (error) {
            console.error('❌ Failed to cleanup expired notifications:', error);
        }
    }
}

module.exports = new EnhancedNotificationService();
