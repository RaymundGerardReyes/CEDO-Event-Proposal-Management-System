/**
 * Enhanced Notifications API Routes
 * Purpose: API endpoints for the enhanced notification system
 * Key approaches: RESTful design, comprehensive error handling, user authentication
 */

const express = require('express');
const router = express.Router();
const enhancedNotificationService = require('../services/enhanced-notification.service');
const { validateToken } = require('../middleware/auth');

/**
 * GET /api/notifications/enhanced
 * Get notifications for the authenticated user
 */
router.get('/', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            page = 1,
            limit = 50,
            unreadOnly = false,
            type = null,
            priority = null
        } = req.query;

        const notifications = await enhancedNotificationService.getUserNotifications(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            unreadOnly: unreadOnly === 'true',
            type,
            priority
        });

        const unreadCount = await enhancedNotificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: notifications.length
                },
                unreadCount
            }
        });
    } catch (error) {
        console.error('❌ Failed to get notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

/**
 * GET /api/notifications/enhanced/unread-count
 * Get unread notification count for the authenticated user
 */
router.get('/unread-count', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await enhancedNotificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: {
                unreadCount
            }
        });
    } catch (error) {
        console.error('❌ Failed to get unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count',
            error: error.message
        });
    }
});

/**
 * PATCH /api/notifications/enhanced/:id/read
 * Mark a specific notification as read
 */
router.patch('/:id/read', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id);

        const updatedCount = await enhancedNotificationService.markAsRead(userId, [notificationId]);

        res.json({
            success: true,
            data: {
                updatedCount,
                message: updatedCount > 0 ? 'Notification marked as read' : 'Notification not found or already read'
            }
        });
    } catch (error) {
        console.error('❌ Failed to mark notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
});

/**
 * PATCH /api/notifications/enhanced/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
router.patch('/mark-all-read', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const updatedCount = await enhancedNotificationService.markAsRead(userId);

        res.json({
            success: true,
            data: {
                updatedCount,
                message: `${updatedCount} notifications marked as read`
            }
        });
    } catch (error) {
        console.error('❌ Failed to mark all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
});

/**
 * POST /api/notifications/enhanced/proposal
 * Create proposal-related notifications
 */
router.post('/proposal', validateToken, async (req, res) => {
    try {
        const {
            proposalId,
            proposalUuid,
            eventName,
            submitterName,
            organizationName,
            action,
            adminId,
            studentId
        } = req.body;

        if (!proposalId || !eventName || !action) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: proposalId, eventName, action'
            });
        }

        const notifications = await enhancedNotificationService.createProposalNotification({
            proposalId,
            proposalUuid,
            eventName,
            submitterName,
            organizationName,
            action,
            adminId,
            studentId
        });

        res.json({
            success: true,
            data: {
                notifications,
                message: `${notifications.length} notifications created`
            }
        });
    } catch (error) {
        console.error('❌ Failed to create proposal notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create proposal notifications',
            error: error.message
        });
    }
});

/**
 * POST /api/notifications/enhanced/system
 * Create system notifications (admin only)
 */
router.post('/system', validateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (!['head_admin', 'manager', 'reviewer'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        const {
            recipientIds,
            title,
            message,
            priority = 'normal',
            type = 'system_update',
            expiresAt = null
        } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, message'
            });
        }

        const notifications = await enhancedNotificationService.createSystemNotification({
            recipientIds,
            title,
            message,
            priority,
            type,
            expiresAt
        });

        res.json({
            success: true,
            data: {
                notifications,
                message: `${notifications.length} system notifications created`
            }
        });
    } catch (error) {
        console.error('❌ Failed to create system notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create system notifications',
            error: error.message
        });
    }
});

/**
 * GET /api/notifications/enhanced/stats
 * Get notification statistics for the authenticated user
 */
router.get('/stats', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // This would require the enhanced schema to be implemented
        // For now, return basic stats
        const unreadCount = await enhancedNotificationService.getUnreadCount(userId);

        res.json({
            success: true,
            data: {
                unreadCount,
                totalNotifications: 0, // Would be calculated from enhanced schema
                todayCount: 0,
                weekCount: 0,
                monthCount: 0
            }
        });
    } catch (error) {
        console.error('❌ Failed to get notification stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification statistics',
            error: error.message
        });
    }
});

/**
 * DELETE /api/notifications/enhanced/:id
 * Delete a specific notification
 */
router.delete('/:id', validateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id);

        // This would require the enhanced schema
        // For now, return not implemented
        res.status(501).json({
            success: false,
            message: 'Delete notification not implemented yet'
        });
    } catch (error) {
        console.error('❌ Failed to delete notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
});

/**
 * POST /api/notifications/enhanced/cleanup
 * Clean up expired notifications (admin only)
 */
router.post('/cleanup', validateToken, async (req, res) => {
    try {
        // Check if user is admin
        if (!['head_admin', 'manager'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        await enhancedNotificationService.cleanupExpiredNotifications();

        res.json({
            success: true,
            message: 'Expired notifications cleaned up successfully'
        });
    } catch (error) {
        console.error('❌ Failed to cleanup notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup expired notifications',
            error: error.message
        });
    }
});

module.exports = router;
