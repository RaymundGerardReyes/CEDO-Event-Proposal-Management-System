/**
 * ===================================================================
 * NOTIFICATION API ROUTES
 * ===================================================================
 * Purpose: API endpoints for notification system
 * Key approaches: RESTful design, authentication, error handling
 * Features: CRUD operations, search, filtering, statistics
 * ===================================================================
 */

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification.service');
const { validateToken } = require('../middleware/auth');

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
router.get('/', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            page = 1,
            limit = 20,
            unreadOnly = false,
            notificationType = null,
            priority = null,
            search = null,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const notifications = await notificationService.getNotifications(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            unreadOnly: unreadOnly === 'true',
            notificationType,
            priority,
            search,
            sortBy,
            sortOrder
        });

        res.json({
            success: true,
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: notifications.length
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await notificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: { unreadCount }
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
 * GET /api/notifications/stats
 * Get notification statistics
 */
router.get('/stats', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const stats = await notificationService.getNotificationStats(userId);

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
 * POST /api/notifications/mark-read
 * Mark notifications as read
 */
router.post('/mark-read', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationIds = null } = req.body;

        const updatedCount = await notificationService.markAsRead(userId, notificationIds);

        res.json({
            success: true,
            data: { updatedCount },
            message: `Marked ${updatedCount} notifications as read`
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
 * POST /api/notifications/:id/hide
 * Hide a specific notification
 */
router.post('/:id/hide', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id);

        if (isNaN(notificationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification ID'
            });
        }

        const success = await notificationService.hideNotification(notificationId, userId);

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
 * POST /api/notifications/search
 * Search notifications
 */
router.post('/search', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            searchTerm,
            page = 1,
            limit = 20,
            notificationType = null,
            priority = null
        } = req.body;

        if (!searchTerm || searchTerm.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search term is required'
            });
        }

        const notifications = await notificationService.searchNotifications(userId, searchTerm, {
            page: parseInt(page),
            limit: parseInt(limit),
            notificationType,
            priority
        });

        res.json({
            success: true,
            data: notifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: notifications.length
            }
        });
    } catch (error) {
        console.error('Error searching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search notifications',
            error: error.message
        });
    }
});

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
 */
router.get('/preferences', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await notificationService.getNotificationPreferences(userId);

        res.json({
            success: true,
            data: preferences
        });
    } catch (error) {
        console.error('Error getting notification preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notification preferences',
            error: error.message
        });
    }
});

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
 */
router.put('/preferences', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { preferences } = req.body;

        if (!Array.isArray(preferences)) {
            return res.status(400).json({
                success: false,
                message: 'Preferences must be an array'
            });
        }

        await notificationService.updateNotificationPreferences(userId, preferences);

        res.json({
            success: true,
            message: 'Notification preferences updated successfully'
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification preferences',
            error: error.message
        });
    }
});

/**
 * POST /api/notifications
 * Create a new notification (general endpoint)
 */
router.post('/', validateToken, async (req, res) => {
    try {
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
            expiresAt = null
        } = req.body;

        // Validate required fields
        if (!targetType || !title || !message || !notificationType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: targetType, title, message, notificationType'
            });
        }

        // Create the notification
        const notification = await notificationService.createNotification({
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
            metadata,
            tags,
            expiresAt
        });

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
 * POST /api/notifications/create
 * Create a new notification (admin only)
 */
router.post('/create', validateToken, async (req, res) => {
    try {
        // Check if user has admin privileges
        if (!['admin', 'head_admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin privileges required'
            });
        }

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
            expiresAt = null
        } = req.body;

        // Validate required fields
        if (!targetType || !title || !message || !notificationType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: targetType, title, message, notificationType'
            });
        }

        const notification = await notificationService.createNotification({
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
            metadata,
            tags,
            expiresAt,
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notification created successfully'
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
 * POST /api/notifications/cleanup
 * Clean up expired notifications (admin only)
 */
router.post('/cleanup', validateToken, async (req, res) => {
    try {
        // Check if user has admin privileges
        if (!['admin', 'head_admin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin privileges required'
            });
        }

        await notificationService.cleanupExpiredNotifications();

        res.json({
            success: true,
            message: 'Expired notifications cleaned up successfully'
        });
    } catch (error) {
        console.error('Error cleaning up notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup expired notifications',
            error: error.message
        });
    }
});

module.exports = router;