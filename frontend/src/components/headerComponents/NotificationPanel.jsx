/**
 * ===================================================================
 * NOTIFICATION PANEL COMPONENT
 * ===================================================================
 * Purpose: Reusable notification panel with enhanced features
 * Key approaches: Clean separation, accessibility, responsive design
 * Features: Real-time updates, filtering, search, optimistic updates
 * ===================================================================
 */

import useNotifications from "@/hooks/useNotifications";
import {
    AlertCircle as AlertCircleIcon,
    AlertTriangle,
    Bell,
    BellOff,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronRight,
    FileText,
    Info,
    X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NotificationFilters from "./NotificationFilters";
import NotificationItem from "./NotificationItem";

const NotificationPanel = ({ className = "" }) => {
    const router = useRouter();
    const {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        hideNotification,
        searchNotifications,
        filterByType,
        filterByPriority,
        getUnreadNotifications,
        refresh
    } = useNotifications();

    const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
    const [showAllNotifications, setShowAllNotifications] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        unreadOnly: false,
        notificationType: null,
        priority: null
    });
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Dev-only: surface what's coming into the panel
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            try {
                // Initial mount trace
                console.log('[NotificationPanel] mount', {
                    notificationsCount: notifications?.length || 0,
                    unreadCount,
                    loading,
                    error
                });
                // Force an initial refresh in case cache returned 304
                window.dispatchEvent(new CustomEvent('notifications:refresh'));
            } catch (_) { }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('[NotificationPanel] data update', {
                notificationsCount: notifications?.length || 0,
                sample: notifications?.[0] || null,
                unreadCount,
                loading,
                error
            });
        }
    }, [notifications, unreadCount, loading, error]);

    // Compute a destination URL for a notification
    const getNotificationUrl = (n) => {
        const uuid = n?.related_proposal_uuid || n?.metadata?.proposalUuid;
        if (uuid) {
            // Heuristic: admin-targeted items go to admin proposals; otherwise student proposals
            if (n?.target_type === 'role' && (n?.target_role === 'head_admin' || n?.target_role === 'manager')) {
                return `/admin-dashboard/proposals/${uuid}`;
            }
            return `/student-dashboard/proposals/${uuid}`;
        }
        // Fallback: no-op
        return null;
    };

    // Filter notifications based on search and filters
    useEffect(() => {
        let filtered = [...notifications];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(notification =>
                notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                notification.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply unread filter
        if (filters.unreadOnly) {
            filtered = filtered.filter(notification => !notification.is_read);
        }

        // Apply type filter
        if (filters.notificationType) {
            filtered = filtered.filter(notification =>
                notification.notification_type === filters.notificationType
            );
        }

        // Apply priority filter
        if (filters.priority) {
            filtered = filtered.filter(notification =>
                notification.priority === filters.priority
            );
        }

        setFilteredNotifications(filtered);
    }, [notifications, searchTerm, filters]);

    // Handle search
    const handleSearch = async (term) => {
        setSearchTerm(term);
        if (term) {
            try {
                await searchNotifications(term);
            } catch (error) {
                console.error('Search error:', error);
            }
        }
    };

    // Handle filter changes
    const handleFilterChange = async (newFilters) => {
        setFilters(newFilters);

        try {
            if (newFilters.unreadOnly) {
                await getUnreadNotifications();
            } else if (newFilters.notificationType) {
                await filterByType(newFilters.notificationType);
            } else if (newFilters.priority) {
                await filterByPriority(newFilters.priority);
            } else {
                await refresh();
            }
        } catch (error) {
            console.error('Filter error:', error);
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await markAsRead();
            setNotificationPanelOpen(false);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Handle hide notification
    const handleHideNotification = async (notificationId) => {
        try {
            await hideNotification(notificationId);
        } catch (error) {
            console.error('Error hiding notification:', error);
        }
    };

    // Get notification type styles
    const getNotificationTypeStyles = (type) => {
        switch (type) {
            case "info":
                return "bg-blue-100 text-blue-600";
            case "success":
                return "bg-green-100 text-green-600";
            case "warning":
                return "bg-yellow-100 text-yellow-600";
            case "error":
                return "bg-red-100 text-red-600";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    // Get notification icon
    const getNotificationIcon = (type) => {
        switch (type) {
            case "info":
                return <Info className="h-3 w-3 sm:h-4 sm:w-4" />;
            case "success":
                return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
            case "warning":
                return <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />;
            case "error":
                return <AlertCircleIcon className="h-3 w-3 sm:h-4 sm:w-4" />;
            case "calendar":
                return <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />;
            case "document":
                return <FileText className="h-3 w-3 sm:h-4 sm:w-4" />;
            default:
                return <Bell className="h-3 w-3 sm:h-4 sm:w-4" />;
        }
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    // Get priority icon
    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'urgent': return '🔴';
            case 'high': return '🟠';
            case 'normal': return '🔵';
            case 'low': return '⚪';
            default: return '⚪';
        }
    };

    // Close panel when clicking outside
    useEffect(() => {
        if (!notificationPanelOpen) return;

        const handleClickOutside = (event) => {
            const notificationPanelContent = document.getElementById('notification-panel-content');
            const notificationButton = document.getElementById('notification-button');

            // Check if click is outside both the panel content and the button
            if (notificationPanelContent && notificationButton &&
                !notificationPanelContent.contains(event.target) &&
                !notificationButton.contains(event.target)) {
                setNotificationPanelOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [notificationPanelOpen]);

    const displayedNotifications = showAllNotifications ? filteredNotifications : filteredNotifications.slice(0, 5);

    return (
        <div className={`relative ${className}`}>
            {/* Notification Button */}
            <button
                id="notification-button"
                className="inline-flex items-center justify-center rounded-lg sm:rounded-xl p-2 sm:p-2.5 text-sm font-medium transition-all duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary relative min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px]"
                aria-label={`${unreadCount > 0 ? unreadCount : 'No'} unread notifications`}
                aria-haspopup="true"
                aria-expanded={notificationPanelOpen}
                aria-controls="notification-panel-content"
                onClick={() => {
                    setNotificationPanelOpen(!notificationPanelOpen);
                    if (!notificationPanelOpen) setShowAllNotifications(false);
                }}
            >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                    <span
                        className="absolute -right-1 -top-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white"
                        aria-hidden="true"
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {notificationPanelOpen && (
                <div
                    id="notification-panel-content"
                    className="absolute right-0 mt-2 w-[320px] sm:w-80 max-h-[70vh] overflow-y-auto rounded-lg sm:rounded-xl border bg-background shadow-lg z-50"
                    role="menu"
                    aria-labelledby="notification-button"
                >
                    {/* Enhanced Header */}
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                        <h3 className="font-medium text-sm sm:text-base">
                            {showAllNotifications ? "All Notifications" : "Recent Notifications"}
                        </h3>
                        <div className="flex gap-1 sm:gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                                aria-label="Toggle filters"
                            >
                                <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors"
                                    onClick={handleMarkAllAsRead}
                                >
                                    Mark all as read
                                </button>
                            )}
                            <button
                                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground p-1 rounded transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                                onClick={() => setNotificationPanelOpen(false)}
                                aria-label="Close notifications"
                            >
                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            <Bell className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="p-3 border-b bg-gray-50">
                            <NotificationFilters
                                filters={filters}
                                onFilterChange={handleFilterChange}
                            />
                        </div>
                    )}

                    {/* Enhanced Notification List */}
                    {loading ? (
                        <div className="p-4 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2">Loading notifications...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-center text-red-500">
                            <p>Error loading notifications</p>
                            <button
                                onClick={refresh}
                                className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
                            >
                                Try again
                            </button>
                        </div>
                    ) : displayedNotifications.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center text-muted-foreground">
                            <BellOff className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3" />
                            <p className="text-sm sm:text-base">No notifications</p>
                        </div>
                    ) : (
                        <ul className="py-1" role="none">
                            {displayedNotifications.map((notification) => (
                                <li key={notification.id} className={`px-3 sm:px-4 py-3 hover:bg-muted transition-colors ${!notification.is_read ? "bg-muted/40" : ""}`} role="menuitem">
                                    <NotificationItem
                                        notification={notification}
                                        onHide={handleHideNotification}
                                        priorityColor={getPriorityColor(notification.priority)}
                                        priorityIcon={getPriorityIcon(notification.priority)}
                                        showActions={true}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Enhanced Footer */}
                    <div className="p-2 border-t">
                        <button
                            className="w-full rounded-lg p-2 sm:p-3 text-center text-xs sm:text-sm hover:bg-muted flex items-center justify-center gap-1 sm:gap-2 transition-colors min-h-[40px]"
                            onClick={() => setShowAllNotifications(!showAllNotifications)}
                            role="menuitem"
                        >
                            {showAllNotifications ? (
                                <>
                                    <span>Show recent notifications</span>
                                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                                </>
                            ) : (
                                <>
                                    <span>View all notifications</span>
                                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
