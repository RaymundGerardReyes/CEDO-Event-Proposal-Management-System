/**
 * ===================================================================
 * OPTIMAL NOTIFICATIONS API ROUTES
 * ===================================================================
 * Purpose: Comprehensive notification API with unified targeting
 * Key approaches: RESTful design, flexible targeting, performance optimization
 * Features: User/role/all targeting, full-text search, priority levels, delivery tracking
 * ===================================================================
 */

const express = require('express');
const router = express.Router();
const OptimalNotificationService = require('../services/optimal-notification.service');
const { validateToken } = require('../middleware/auth');

/**
 * ===================================================================
 * NOTIFICATION CRUD OPERATIONS
 * ===================================================================
 */

/**
 * Get notifications for the authenticated user
 * GET /api/notifications
 * Query params: limit, offset, unreadOnly, notificationType, priority, search, sortBy, sortOrder
 */
router.get('/', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const options = {
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0,
            unreadOnly: req.query.unreadOnly === 'true',
            notificationType: req.query.notificationType || null,
            priority: req.query.priority || null,
            search: req.query.search || null,
            sortBy: req.query.sortBy || 'created_at',
            sortOrder: req.query.sortOrder || 'DESC'
        };

        const notifications = await OptimalNotificationService.getUserNotifications(userId, options);

        res.json({
            success: true,
            data: notifications,
            pagination: {
                limit: options.limit,
                offset: options.offset,
                hasMore: notifications.length === options.limit
            }
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications',
            error: error.message
        });
    }
});

/**
 * Get unread notification count for the authenticated user
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await OptimalNotificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: { count }
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: error.message
        });
    }
});

/**
 * Get notification statistics for the authenticated user
 * GET /api/notifications/stats
 */
router.get('/stats', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await OptimalNotificationService.getNotificationStats(userId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notification statistics',
            error: error.message
        });
    }
});

/**
 * Mark notifications as read
 * PUT /api/notifications/mark-read
 * Body: { notificationIds: [1, 2, 3] } (optional - if not provided, marks all as read)
 */
router.put('/mark-read', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationIds } = req.body;

        const count = await OptimalNotificationService.markAsRead(userId, notificationIds);

        res.json({
            success: true,
            message: `Marked ${count} notifications as read`,
            data: { count }
        });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notifications as read',
            error: error.message
        });
    }
});

/**
 * Hide a notification (soft delete)
 * PUT /api/notifications/:id/hide
 */
router.put('/:id/hide', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id);

        const success = await OptimalNotificationService.hideNotification(notificationId, userId);

        if (success) {
            res.json({
                success: true,
                message: 'Notification hidden successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Notification not found or access denied'
            });
        }
    } catch (error) {
        console.error('Error hiding notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to hide notification',
            error: error.message
        });
    }
});

/**
 * ===================================================================
 * NOTIFICATION CREATION (ADMIN ONLY)
 * ===================================================================
 */

/**
 * Create a notification (Admin only)
 * POST /api/notifications
 * Body: { targetType, targetUserId, targetRole, excludedUserIds, title, message, notificationType, priority, ... }
 */
router.post('/', validateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const notificationData = {
            targetType: req.body.targetType,
            targetUserId: req.body.targetUserId,
            targetRole: req.body.targetRole,
            excludedUserIds: req.body.excludedUserIds || [],
            title: req.body.title,
            message: req.body.message,
            notificationType: req.body.notificationType,
            priority: req.body.priority || 'normal',
            relatedProposalId: req.body.relatedProposalId,
            relatedUserId: req.body.relatedUserId,
            metadata: req.body.metadata || {},
            tags: req.body.tags || [],
            expiresAt: req.body.expiresAt,
            createdBy: req.user.id
        };

        const notification = await OptimalNotificationService.createNotification(notificationData);

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: notification
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: error.message
        });
    }
});

/**
 * Create notification for all users with a specific role (Admin only)
 * POST /api/notifications/role/:role
 */
router.post('/role/:role', validateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const role = req.params.role;
        const { excludedUserIds = [], ...notificationData } = req.body;
        notificationData.createdBy = req.user.id;

        const notification = await OptimalNotificationService.createRoleNotification(role, notificationData, excludedUserIds);

        res.status(201).json({
            success: true,
            message: `Notification created for role: ${role}`,
            data: notification
        });
    } catch (error) {
        console.error('Error creating role notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create role notification',
            error: error.message
        });
    }
});

/**
 * Create global notification for all users (Admin only)
 * POST /api/notifications/global
 */
router.post('/global', validateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const { excludedUserIds = [], ...notificationData } = req.body;
        notificationData.createdBy = req.user.id;

        const notification = await OptimalNotificationService.createGlobalNotification(notificationData, excludedUserIds);

        res.status(201).json({
            success: true,
            message: 'Global notification created successfully',
            data: notification
        });
    } catch (error) {
        console.error('Error creating global notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create global notification',
            error: error.message
        });
    }
});

/**
 * Create notification for a specific user (Admin only)
 * POST /api/notifications/user/:userId
 */
router.post('/user/:userId', validateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const userId = parseInt(req.params.userId);
        const notificationData = { ...req.body, createdBy: req.user.id };

        const notification = await OptimalNotificationService.createUserNotification(userId, notificationData);

        res.status(201).json({
            success: true,
            message: `Notification created for user: ${userId}`,
            data: notification
        });
    } catch (error) {
        console.error('Error creating user notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create user notification',
            error: error.message
        });
    }
});

/**
 * ===================================================================
 * NOTIFICATION TEMPLATES
 * ===================================================================
 */

/**
 * Get notification templates
 * GET /api/notifications/templates
 * Query params: notificationType (optional)
 */
router.get('/templates', validateToken, async (req, res) => {
    try {
        const notificationType = req.query.notificationType || null;
        const templates = await OptimalNotificationService.getTemplates(notificationType);

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('Error getting templates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notification templates',
            error: error.message
        });
    }
});

/**
 * ===================================================================
 * USER PREFERENCES
 * ===================================================================
 */

/**
 * Get user notification preferences
 * GET /api/notifications/preferences
 */
router.get('/preferences', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await OptimalNotificationService.getUserPreferences(userId);

        res.json({
            success: true,
            data: preferences
        });
    } catch (error) {
        console.error('Error getting user preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user preferences',
            error: error.message
        });
    }
});

/**
 * Update user notification preferences
 * PUT /api/notifications/preferences
 * Body: [{ notificationType, inApp, email, sms, push, frequency, quietHoursStart, quietHoursEnd, timezone }, ...]
 */
router.put('/preferences', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = req.body;

        if (!Array.isArray(preferences)) {
            return res.status(400).json({
                success: false,
                message: 'Preferences must be an array'
            });
        }

        await OptimalNotificationService.updateUserPreferences(userId, preferences);

        res.json({
            success: true,
            message: 'Preferences updated successfully'
        });
    } catch (error) {
        console.error('Error updating user preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user preferences',
            error: error.message
        });
    }
});

/**
 * ===================================================================
 * DELIVERY LOGS (ADMIN ONLY)
 * ===================================================================
 */

/**
 * Get delivery logs for a notification (Admin only)
 * GET /api/notifications/:id/delivery-logs
 */
router.get('/:id/delivery-logs', validateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        const notificationId = parseInt(req.params.id);
        const logs = await OptimalNotificationService.getDeliveryLogs(notificationId);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Error getting delivery logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get delivery logs',
            error: error.message
        });
    }
});

/**
 * ===================================================================
 * MAINTENANCE (ADMIN ONLY)
 * ===================================================================
 */

/**
 * Clean up expired notifications (Admin only)
 * POST /api/notifications/cleanup
 */
router.post('/cleanup', validateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin role required.'
            });
        }

        await OptimalNotificationService.cleanupExpiredNotifications();

        res.json({
            success: true,
            message: 'Expired notifications cleaned up successfully'
        });
    } catch (error) {
        console.error('Error cleaning up expired notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup expired notifications',
            error: error.message
        });
    }
});

module.exports = router;
