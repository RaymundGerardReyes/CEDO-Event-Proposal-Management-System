/**
 * ===================================================================
 * NOTIFICATION SERVICE
 * ===================================================================
 * Purpose: Backend service for notification system with database integration
 * Key approaches: Database operations, user targeting, performance optimization
 * Features: CRUD operations, targeting, search, statistics
 * ===================================================================
 */

// Use the same database connection as the main server
const { pool } = require('../config/database-postgresql-only');

console.log('🔧 NotificationService using shared database connection');

class NotificationService {
    /**
     * Get notifications for a specific user with filtering and pagination
     */
    async getNotifications(userId, options = {}) {
        const {
            page = 1,
            limit = 20,
            unreadOnly = false,
            notificationType = null,
            priority = null,
            search = null,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;

        const offset = (page - 1) * limit;
        let query = `
            SELECT 
                n.id, n.uuid, n.title, n.message, n.notification_type, n.priority,
                n.is_read, n.read_at, n.is_hidden, n.status, n.created_at, n.updated_at,
                n.expires_at, n.delivered_at, n.metadata, n.tags,
                n.related_proposal_id, n.related_proposal_uuid, n.related_user_id,
                n.target_type, n.target_user_id, n.target_role,
                u.name as created_by_name, u.email as created_by_email,
                p.event_name as related_proposal_name
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

        // Apply filters
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
            console.error('Error fetching notifications:', error);
            throw new Error('Failed to fetch notifications');
        }
    }

    /**
     * Get unread notification count for a user
     */
    async getUnreadCount(userId) {
        try {
            const result = await pool.query(
                'SELECT get_unread_notification_count($1) as count',
                [userId]
            );
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw new Error('Failed to get unread count');
        }
    }

    /**
     * Mark notifications as read
     */
    async markAsRead(userId, notificationIds = null) {
        try {
            const result = await pool.query(
                'SELECT mark_notifications_as_read($1, $2) as updated_count',
                [userId, notificationIds]
            );
            return parseInt(result.rows[0].updated_count);
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            throw new Error('Failed to mark notifications as read');
        }
    }

    /**
     * Hide a notification
     */
    async hideNotification(notificationId, userId) {
        try {
            const result = await pool.query(`
                UPDATE notifications 
                SET is_hidden = true, updated_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND (
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
     * Create a new notification
     */
    async createNotification(notificationData) {
        const {
            targetType,
            targetUserId = null,
            targetRole = null,
            excludedUserIds = null,
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
                targetType, title, message, notificationType,
                targetUserId, targetRole, excludedUserIds, priority,
                relatedProposalId, relatedUserId, metadata, tags,
                expiresAt, createdBy
            ]);

            // The function returns the created notification with notification_ prefix
            const notification = result.rows[0];
            return {
                id: notification.notification_id,
                uuid: notification.notification_uuid,
                title: notification.notification_title,
                message: notification.notification_message,
                target_type: notification.notification_target_type,
                priority: notification.notification_priority,
                status: notification.notification_status
            };
        } catch (error) {
            console.error('Error creating notification:', error);
            throw new Error('Failed to create notification');
        }
    }

    /**
     * Get notification statistics for a user
     */
    async getNotificationStats(userId) {
        try {
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
                WHERE (
                    (target_type = 'user' AND target_user_id = $1) OR
                    (target_type = 'role' AND target_role = (SELECT role FROM users WHERE id = $1)) OR
                    (target_type = 'all')
                )
                AND (excluded_user_ids IS NULL OR NOT ($1 = ANY(excluded_user_ids)))
                AND is_hidden = false
                AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
                AND status != 'expired'
            `, [userId]);

            return result.rows[0];
        } catch (error) {
            console.error('Error getting notification stats:', error);
            throw new Error('Failed to get notification statistics');
        }
    }

    /**
     * Search notifications
     */
    async searchNotifications(userId, searchTerm, options = {}) {
        const {
            page = 1,
            limit = 20,
            notificationType = null,
            priority = null
        } = options;

        const offset = (page - 1) * limit;
        let query = `
            SELECT 
                n.id, n.uuid, n.title, n.message, n.notification_type, n.priority,
                n.is_read, n.read_at, n.is_hidden, n.status, n.created_at, n.updated_at,
                n.expires_at, n.delivered_at, n.metadata, n.tags,
                n.related_proposal_id, n.related_proposal_uuid, n.related_user_id,
                n.target_type, n.target_user_id, n.target_role,
                u.name as created_by_name, u.email as created_by_email,
                p.event_name as related_proposal_name,
                ts_rank(n.search_vector, plainto_tsquery('english', $2)) as rank
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
            AND n.search_vector @@ plainto_tsquery('english', $2)
        `;

        const params = [userId, searchTerm];
        let paramCount = 2;

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

        query += ` ORDER BY rank DESC, n.created_at DESC`;

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
            console.error('Error searching notifications:', error);
            throw new Error('Failed to search notifications');
        }
    }

    /**
     * Get user notification preferences
     */
    async getNotificationPreferences(userId) {
        try {
            const result = await pool.query(`
                SELECT * FROM notification_preferences 
                WHERE user_id = $1 
                ORDER BY notification_type
            `, [userId]);

            return result.rows;
        } catch (error) {
            console.error('Error getting notification preferences:', error);
            throw new Error('Failed to get notification preferences');
        }
    }

    /**
     * Update user notification preferences
     */
    async updateNotificationPreferences(userId, preferences) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            for (const preference of preferences) {
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
                `, [
                    userId,
                    preference.notification_type,
                    preference.in_app,
                    preference.email,
                    preference.sms,
                    preference.push,
                    preference.frequency,
                    preference.quiet_hours_start,
                    preference.quiet_hours_end,
                    preference.timezone
                ]);
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error updating notification preferences:', error);
            throw new Error('Failed to update notification preferences');
        } finally {
            client.release();
        }
    }

    /**
     * Clean up expired notifications
     */
    async cleanupExpiredNotifications() {
        try {
            await pool.query('SELECT cleanup_expired_notifications()');
            return true;
        } catch (error) {
            console.error('Error cleaning up expired notifications:', error);
            throw new Error('Failed to cleanup expired notifications');
        }
    }
}

module.exports = new NotificationService();