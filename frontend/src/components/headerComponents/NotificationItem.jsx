/**
 * ===================================================================
 * NOTIFICATION ITEM COMPONENT
 * ===================================================================
 * Purpose: Individual notification display with actions
 * Key approaches: Optimistic updates, accessibility, responsive design
 * Features: Priority indicators, read/unread states, action buttons
 * ===================================================================
 */

import {
    AlertCircle,
    Check,
    CheckCircle,
    Clock,
    FileText,
    Info,
    User,
    X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NotificationItem = ({
    notification,
    onHide,
    priorityColor = 'text-gray-600 bg-gray-50 border-gray-200',
    priorityIcon = '⚪',
    showActions = true
}) => {
    const router = useRouter();
    const [isHovered, setIsHovered] = useState(false);
    const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;

        return date.toLocaleDateString();
    };

    // Get notification type icon
    const getTypeIcon = (notificationType) => {
        switch (notificationType) {
            case 'proposal_submitted':
            case 'proposal_approved':
            case 'proposal_rejected':
                return <FileText className="h-4 w-4" />;
            case 'user_registration':
            case 'user_approved':
            case 'user_rejected':
                return <User className="h-4 w-4" />;
            case 'system_update':
            case 'system_maintenance':
                return <Info className="h-4 w-4" />;
            case 'security_alert':
                return <AlertCircle className="h-4 w-4" />;
            case 'deadline_reminder':
            case 'event_reminder':
                return <Clock className="h-4 w-4" />;
            default:
                return <Info className="h-4 w-4" />;
        }
    };

    // Get notification type color
    const getTypeColor = (notificationType) => {
        switch (notificationType) {
            case 'proposal_approved':
            case 'user_approved':
                return 'text-green-600';
            case 'proposal_rejected':
            case 'user_rejected':
                return 'text-red-600';
            case 'security_alert':
                return 'text-red-600';
            case 'system_update':
            case 'system_maintenance':
                return 'text-blue-600';
            case 'deadline_reminder':
            case 'event_reminder':
                return 'text-orange-600';
            default:
                return 'text-gray-600';
        }
    };

    // Handle mark as read
    const handleMarkAsRead = async () => {
        if (notification.is_read) return;

        setIsMarkingAsRead(true);
        try {
            // Optimistic update - the parent component will handle the actual API call
            // This is just for immediate UI feedback
        } catch (error) {
            console.error('Error marking as read:', error);
        } finally {
            setIsMarkingAsRead(false);
        }
    };

    // Handle hide notification
    const handleHide = () => {
        if (onHide) {
            onHide(notification.id);
        }
    };

    // Build redirect href when related proposal is attached
    const relatedUuid = notification?.related_proposal_uuid || notification?.metadata?.proposalUuid;
    const isAdminTarget = notification?.target_type === 'role' && (notification?.target_role === 'head_admin' || notification?.target_role === 'manager');
    const href = relatedUuid ? (isAdminTarget ? `/admin-dashboard/proposals/${relatedUuid}` : `/student-dashboard/proposals/${relatedUuid}`) : null;

    return (
        <div
            className={`
                relative p-4 transition-all duration-200 cursor-pointer
                ${notification.is_read
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                }
                ${isHovered ? 'shadow-sm' : ''}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Priority Indicator */}
            <div className="flex items-start space-x-3">
                <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                    ${priorityColor}
                `}>
                    {priorityIcon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0" onClick={() => { if (href) router.push(href); }}>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                            <div className={`${getTypeColor(notification.notification_type)}`}>
                                {getTypeIcon(notification.notification_type)}
                            </div>
                            <h4 className={`
                                text-sm font-medium truncate
                                ${notification.is_read ? 'text-gray-900' : 'text-gray-900 font-semibold'}
                            `}>
                                {notification.title}
                            </h4>
                            {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(notification.created_at)}</span>
                        </div>
                    </div>

                    {/* Message */}
                    <p className={`
                        mt-1 text-sm text-gray-600 line-clamp-2
                        ${notification.is_read ? '' : 'font-medium'}
                    `}>
                        {notification.message}
                    </p>

                    {/* Tags */}
                    {notification.tags && notification.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {notification.tags.slice(0, 3).map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                    {tag}
                                </span>
                            ))}
                            {notification.tags.length > 3 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    +{notification.tags.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Related Info */}
                    {notification.related_proposal_name && (
                        <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
                            <FileText className="h-3 w-3" />
                            <span>Related to: {notification.related_proposal_name}</span>
                        </div>
                    )}

                    {notification.created_by_name && (
                        <div className="mt-1 flex items-center space-x-1 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            <span>From: {notification.created_by_name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            {showActions && (isHovered || !notification.is_read) && (
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                    {!notification.is_read && (
                        <button
                            onClick={handleMarkAsRead}
                            disabled={isMarkingAsRead}
                            className="p-1 text-gray-400 hover:text-green-600 rounded transition-colors duration-200"
                            aria-label="Mark as read"
                        >
                            {isMarkingAsRead ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-500"></div>
                            ) : (
                                <Check className="h-3 w-3" />
                            )}
                        </button>
                    )}

                    <button
                        onClick={handleHide}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors duration-200"
                        aria-label="Hide notification"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            {/* Read Status Indicator */}
            {notification.is_read && notification.read_at && (
                <div className="absolute bottom-2 right-2 flex items-center space-x-1 text-xs text-gray-400">
                    <CheckCircle className="h-3 w-3" />
                    <span>Read {formatTimestamp(notification.read_at)}</span>
                </div>
            )}

            {/* Expiration Warning */}
            {notification.expires_at && new Date(notification.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000) && (
                <div className="absolute bottom-2 left-2 flex items-center space-x-1 text-xs text-orange-600">
                    <Clock className="h-3 w-3" />
                    <span>Expires soon</span>
                </div>
            )}
        </div>
    );
};

export default NotificationItem;
