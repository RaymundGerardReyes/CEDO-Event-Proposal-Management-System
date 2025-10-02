/**
 * ===================================================================
 * OPTIMAL NOTIFICATION SERVICE
 * ===================================================================
 * Purpose: Comprehensive notification service with unified targeting
 * Key approaches: Single source of truth, flexible targeting, performance optimization
 * Features: User/role/all targeting, full-text search, priority levels, delivery tracking
 * ===================================================================
 */

const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'cedo_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

class OptimalNotificationService {
    /**
     * Create a notification with flexible targeting
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} Created notification
     */
    static async createNotification(notificationData) {
        const {
            targetType, // 'user', 'role', 'all'
            targetUserId,
            targetRole,
            excludedUserIds = [],
            title,
            message,
            notificationType,
            priority = 'normal',
            relatedProposalId = null,
            relatedUserId = null,
            metadata = {},
            tags = [],
            expiresAt = null,
            createdBy = null
        } = notificationData;

        try {
            const result = await pool.query(`
                SELECT * FROM create_notification(
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                )
            `, [
                targetType,
                targetUserId,
                targetRole,
                excludedUserIds,
                title,
                message,
                notificationType,
                priority,
                relatedProposalId,
                relatedUserId,
                JSON.stringify(metadata),
                tags,
                expiresAt,
                createdBy
            ]);

            return result.rows[0];
        } catch (error) {
            console.error('Error creating notification:', error);
            throw new Error('Failed to create notification');
        }
    }

    /**
     * Get notifications for a specific user
     * @param {number} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} User notifications
     */
    static async getUserNotifications(userId, options = {}) {
        const {
            limit = 50,
            offset = 0,
            unreadOnly = false,
            notificationType = null,
            priority = null,
            search = null,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;

        let query = `
            SELECT 
                n.*,
                u.name as created_by_name,
                u.email as created_by_email,
                p.event_name as related_proposal_name,
                p.uuid as related_proposal_uuid
            FROM notifications n
            LEFT JOIN users u ON n.created_by = u.id
            LEFT JOIN proposals p ON n.related_proposal_id = p.id
            WHERE (
                (n.target_type = 'user' AND n.target_user_id = $1) OR
                (n.target_type = 'role' AND n.target_role = (SELECT role FROM users WHERE id = $1)) OR
                (n.target_type = 'all')
            )
            AND (n.excluded_user_ids IS NULL OR NOT ($1 = ANY(n.excluded_user_ids)))
            AND n.is_hidden = false
            AND (n.expires_at IS NULL OR n.expires_at > CURRENT_TIMESTAMP)
            AND n.status != 'expired'
        `;

        const params = [userId];
        let paramCount = 1;

        // Add filters
        if (unreadOnly) {
            query += ` AND n.is_read = false`;
        }

        if (notificationType) {
            paramCount++;
            query += ` AND n.notification_type = $${paramCount}`;
            params.push(notificationType);
        }

        if (priority) {
            paramCount++;
            query += ` AND n.priority = $${paramCount}`;
            params.push(priority);
        }

        if (search) {
            paramCount++;
            query += ` AND n.search_vector @@ plainto_tsquery('english', $${paramCount})`;
            params.push(search);
        }

        // Add sorting
        query += ` ORDER BY n.${sortBy} ${sortOrder}`;

        // Add pagination
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);

        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        try {
            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error getting user notifications:', error);
            throw new Error('Failed to get user notifications');
        }
    }

    /**
     * Get unread notification count for a user
     * @param {number} userId - User ID
     * @returns {Promise<number>} Unread count
     */
    static async getUnreadCount(userId) {
        try {
            const result = await pool.query('SELECT get_unread_notification_count($1) as count', [userId]);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw new Error('Failed to get unread count');
        }
    }

    /**
     * Mark notifications as read
     * @param {number} userId - User ID
     * @param {Array} notificationIds - Specific notification IDs (optional)
     * @returns {Promise<number>} Number of notifications marked as read
     */
    static async markAsRead(userId, notificationIds = null) {
        try {
            const result = await pool.query('SELECT mark_notifications_as_read($1, $2) as count', [
                userId,
                notificationIds
            ]);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            throw new Error('Failed to mark notifications as read');
        }
    }

    /**
     * Hide a notification (soft delete)
     * @param {number} notificationId - Notification ID
     * @param {number} userId - User ID (for security)
     * @returns {Promise<boolean>} Success status
     */
    static async hideNotification(notificationId, userId) {
        try {
            const result = await pool.query(`
                UPDATE notifications 
                SET is_hidden = true, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 
                AND (
                    (target_type = 'user' AND target_user_id = $2) OR
                    (target_type = 'role' AND target_role = (SELECT role FROM users WHERE id = $2)) OR
                    (target_type = 'all')
                )
                AND (excluded_user_ids IS NULL OR NOT ($2 = ANY(excluded_user_ids)))
                RETURNING id
            `, [notificationId, userId]);

            return result.rows.length > 0;
        } catch (error) {
            console.error('Error hiding notification:', error);
            throw new Error('Failed to hide notification');
        }
    }

    /**
     * Get notification statistics for a user
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Notification statistics
     */
    static async getNotificationStats(userId) {
        try {
            const result = await pool.query(`
                SELECT * FROM notification_stats WHERE user_id = $1
            `, [userId]);

            return result.rows[0] || {
                user_id: userId,
                total_notifications: 0,
                unread_count: 0,
                read_count: 0,
                urgent_count: 0,
                high_priority_count: 0,
                today_count: 0,
                week_count: 0,
                month_count: 0
            };
        } catch (error) {
            console.error('Error getting notification stats:', error);
            throw new Error('Failed to get notification statistics');
        }
    }

    /**
     * Create notification for all users with a specific role
     * @param {string} role - Target role
     * @param {Object} notificationData - Notification data
     * @param {Array} excludedUserIds - User IDs to exclude
     * @returns {Promise<Object>} Created notification
     */
    static async createRoleNotification(role, notificationData, excludedUserIds = []) {
        return this.createNotification({
            ...notificationData,
            targetType: 'role',
            targetRole: role,
            excludedUserIds
        });
    }

    /**
     * Create notification for all users
     * @param {Object} notificationData - Notification data
     * @param {Array} excludedUserIds - User IDs to exclude
     * @returns {Promise<Object>} Created notification
     */
    static async createGlobalNotification(notificationData, excludedUserIds = []) {
        return this.createNotification({
            ...notificationData,
            targetType: 'all',
            excludedUserIds
        });
    }

    /**
     * Create notification for a specific user
     * @param {number} userId - Target user ID
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} Created notification
     */
    static async createUserNotification(userId, notificationData) {
        return this.createNotification({
            ...notificationData,
            targetType: 'user',
            targetUserId: userId
        });
    }

    /**
     * Get notification templates
     * @param {string} notificationType - Notification type (optional)
     * @returns {Promise<Array>} Notification templates
     */
    static async getTemplates(notificationType = null) {
        try {
            let query = 'SELECT * FROM notification_templates WHERE is_active = true';
            const params = [];

            if (notificationType) {
                query += ' AND notification_type = $1';
                params.push(notificationType);
            }

            query += ' ORDER BY name';

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error getting templates:', error);
            throw new Error('Failed to get notification templates');
        }
    }

    /**
     * Get user notification preferences
     * @param {number} userId - User ID
     * @returns {Promise<Array>} User preferences
     */
    static async getUserPreferences(userId) {
        try {
            const result = await pool.query(`
                SELECT * FROM notification_preferences WHERE user_id = $1 ORDER BY notification_type
            `, [userId]);

            return result.rows;
        } catch (error) {
            console.error('Error getting user preferences:', error);
            throw new Error('Failed to get user preferences');
        }
    }

    /**
     * Update user notification preferences
     * @param {number} userId - User ID
     * @param {Array} preferences - Preference updates
     * @returns {Promise<boolean>} Success status
     */
    static async updateUserPreferences(userId, preferences) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (const pref of preferences) {
                const { notificationType, inApp, email, sms, push, frequency, quietHoursStart, quietHoursEnd, timezone } = pref;

                await client.query(`
                    INSERT INTO notification_preferences 
                    (user_id, notification_type, in_app, email, sms, push, frequency, quiet_hours_start, quiet_hours_end, timezone)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (user_id, notification_type)
                    DO UPDATE SET
                        in_app = EXCLUDED.in_app,
                        email = EXCLUDED.email,
                        sms = EXCLUDED.sms,
                        push = EXCLUDED.push,
                        frequency = EXCLUDED.frequency,
                        quiet_hours_start = EXCLUDED.quiet_hours_start,
                        quiet_hours_end = EXCLUDED.quiet_hours_end,
                        timezone = EXCLUDED.timezone,
                        updated_at = CURRENT_TIMESTAMP
                `, [userId, notificationType, inApp, email, sms, push, frequency, quietHoursStart, quietHoursEnd, timezone]);
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating user preferences:', error);
            throw new Error('Failed to update user preferences');
        } finally {
            client.release();
        }
    }

    /**
     * Clean up expired notifications
     * @returns {Promise<void>}
     */
    static async cleanupExpiredNotifications() {
        try {
            await pool.query('SELECT cleanup_expired_notifications()');
        } catch (error) {
            console.error('Error cleaning up expired notifications:', error);
            throw new Error('Failed to cleanup expired notifications');
        }
    }

    /**
     * Get notification delivery logs
     * @param {number} notificationId - Notification ID
     * @returns {Promise<Array>} Delivery logs
     */
    static async getDeliveryLogs(notificationId) {
        try {
            const result = await pool.query(`
                SELECT * FROM notification_delivery_logs 
                WHERE notification_id = $1 
                ORDER BY created_at DESC
            `, [notificationId]);

            return result.rows;
        } catch (error) {
            console.error('Error getting delivery logs:', error);
            throw new Error('Failed to get delivery logs');
        }
    }

    /**
     * Log delivery attempt
     * @param {number} notificationId - Notification ID
     * @param {string} channel - Delivery channel
     * @param {string} status - Delivery status
     * @param {string} errorMessage - Error message (if any)
     * @returns {Promise<boolean>} Success status
     */
    static async logDelivery(notificationId, channel, status, errorMessage = null) {
        try {
            await pool.query(`
                INSERT INTO notification_delivery_logs 
                (notification_id, delivery_channel, status, error_message, delivered_at)
                VALUES ($1, $2, $3, $4, $5)
            `, [notificationId, channel, status, errorMessage, status === 'delivered' ? new Date() : null]);

            return true;
        } catch (error) {
            console.error('Error logging delivery:', error);
            throw new Error('Failed to log delivery');
        }
    }
}

module.exports = OptimalNotificationService;
