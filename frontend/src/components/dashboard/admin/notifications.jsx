/**
 * Enhanced Notifications Component
 * Purpose: Dedicated notification dropdown with read/unread functionality and clean state management
 * Key approaches: Read/unread state management, visual indicators, proper keyboard navigation, outside click handling
 */

"use client";

import { Button } from "@/components/ui/button";
import { getAppConfig } from "@/lib/utils";
import { Bell, Check, Clock, FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

// Notification type configurations
const notificationTypeConfig = {
    proposal_submitted: {
        icon: FileText,
        bgColor: "bg-blue-100",
        textColor: "text-blue-600"
    },
    proposal_approved: {
        icon: Check,
        bgColor: "bg-green-100",
        textColor: "text-green-600"
    },
    proposal_rejected: {
        icon: X,
        bgColor: "bg-red-100",
        textColor: "text-red-600"
    },
    system_update: {
        icon: Clock,
        bgColor: "bg-orange-100",
        textColor: "text-orange-600"
    }
};

export default function Notifications({
    onNavigate = null,
    className = ""
}) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [readNotifications, setReadNotifications] = useState(new Set());

    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const firstItemRef = useRef(null);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('cedo_token='))
                ?.split('=')[1];

            if (!token) return;

            const backendUrl = getAppConfig().backendUrl;
            const response = await fetch(`${backendUrl}/api/notifications/unread-count`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setUnreadCount(result.data.unreadCount);
                }
            }
        } catch (error) {
            console.error('❌ Failed to fetch unread count:', error);
        }
    }, []);

    // Fetch recent notifications
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('cedo_token='))
                ?.split('=')[1];

            if (!token) {
                setError('Authentication required');
                return;
            }

            const backendUrl = getAppConfig().backendUrl;
            const response = await fetch(`${backendUrl}/api/notifications?page=1&limit=10`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                const fetchedNotifications = result.data.notifications || [];
                setNotifications(fetchedNotifications);

                // Update unread count based on actual data
                const actualUnreadCount = fetchedNotifications.filter(notif => !notif.isRead).length;
                setUnreadCount(actualUnreadCount);
            } else {
                setError(result.message || 'Failed to fetch notifications');
            }
        } catch (error) {
            console.error('❌ Failed to fetch notifications:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId) => {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('cedo_token='))
                ?.split('=')[1];

            if (!token) return;

            const backendUrl = getAppConfig().backendUrl;
            const response = await fetch(`${backendUrl}/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                // Update local state immediately for better UX
                setNotifications(prev =>
                    prev.map(notif => notif.id === notificationId ? { ...notif, isRead: true } : notif)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));

                // Add to read notifications set
                setReadNotifications(prev => new Set([...prev, notificationId]));

                // Persist to localStorage for session continuity
                const storedRead = JSON.parse(localStorage.getItem('readNotifications') || '[]');
                if (!storedRead.includes(notificationId)) {
                    localStorage.setItem('readNotifications', JSON.stringify([...storedRead, notificationId]));
                }
            }
        } catch (error) {
            console.error('❌ Failed to mark notification as read:', error);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('cedo_token='))
                ?.split('=')[1];

            if (!token) return;

            const backendUrl = getAppConfig().backendUrl;
            const response = await fetch(`${backendUrl}/api/notifications/mark-all-read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                // Update local state immediately
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, isRead: true }))
                );
                setUnreadCount(0);

                // Add all notification IDs to read set
                const allNotificationIds = notifications.map(notif => notif.id);
                setReadNotifications(prev => new Set([...prev, ...allNotificationIds]));

                // Persist to localStorage
                const storedRead = JSON.parse(localStorage.getItem('readNotifications') || '[]');
                const updatedRead = [...new Set([...storedRead, ...allNotificationIds])];
                localStorage.setItem('readNotifications', JSON.stringify(updatedRead));
            }
        } catch (error) {
            console.error('❌ Failed to mark all as read:', error);
        }
    }, [notifications]);

    // Handle notification click
    const handleNotificationClick = useCallback((notification) => {
        // Mark as read when clicked
        if (!notification.isRead) {
            markAsRead(notification.id);
        }

        setIsOpen(false);

        if (notification.relatedProposalId) {
            const path = `/admin-dashboard/proposals/${notification.relatedProposalId}`;
            if (onNavigate) {
                onNavigate(path);
            } else {
                router.push(path);
            }
        }
    }, [onNavigate, router, markAsRead]);

    // Toggle dropdown
    const toggleDropdown = useCallback(() => {
        setIsOpen(prev => {
            const newState = !prev;
            if (newState) {
                fetchNotifications();
            }
            return newState;
        });
    }, [fetchNotifications]);

    // Close dropdown
    const closeDropdown = useCallback(() => {
        setIsOpen(false);
        buttonRef.current?.focus();
    }, []);

    // Handle outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)) {
                closeDropdown();
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, closeDropdown]);

    // Handle keyboard navigation
    useEffect(() => {
        function handleKeyDown(event) {
            if (!isOpen) return;

            switch (event.key) {
                case 'Escape':
                    closeDropdown();
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    firstItemRef.current?.focus();
                    break;
                case 'Tab':
                    closeDropdown();
                    break;
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, closeDropdown]);

    // Load unread count on mount and restore read notifications from localStorage
    useEffect(() => {
        fetchUnreadCount();

        // Restore read notifications from localStorage
        const storedRead = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        setReadNotifications(new Set(storedRead));
    }, [fetchUnreadCount]);

    // Get notification icon
    const getNotificationIcon = (message) => {
        const type = getNotificationType(message);
        const config = notificationTypeConfig[type] || notificationTypeConfig.proposal_submitted;
        const IconComponent = config.icon;

        return (
            <div className={`p-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                <IconComponent className="h-3 w-3" />
            </div>
        );
    };

    // Get notification type from message
    const getNotificationType = (message) => {
        if (message.includes('has been approved')) return 'proposal_approved';
        if (message.includes('was not approved') || message.includes('rejected')) return 'proposal_rejected';
        if (message.includes('has been submitted')) return 'proposal_submitted';
        if (message.includes('system update') || message.includes('maintenance')) return 'system_update';
        return 'proposal_submitted';
    };

    // Get relative time
    const getRelativeTime = (timestamp) => {
        const now = new Date();
        const notificationTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    // Check if notification is read (combines backend and local state)
    const isNotificationRead = useCallback((notification) => {
        return notification.isRead || readNotifications.has(notification.id);
    }, [readNotifications]);

    // Get unread notifications count
    const getUnreadCount = useCallback(() => {
        return notifications.filter(notif => !isNotificationRead(notif)).length;
    }, [notifications, isNotificationRead]);

    return (
        <div className={`relative ${className}`}>
            {/* Notification Button */}
            <Button
                ref={buttonRef}
                variant="ghost"
                className="
          relative cursor-pointer rounded-2xl
          hover:bg-blue-50 active:bg-blue-100 
          transition-all duration-300 hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-blue-400/50
          group
        "
                style={{
                    width: `clamp(2.5rem, 5vw, 3rem)`,
                    height: `clamp(2.5rem, 5vw, 3rem)`,
                    padding: 0,
                }}
                onClick={toggleDropdown}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDropdown();
                    }
                }}
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label={`Open notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
                <Bell
                    className="text-gray-600 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110"
                    style={{
                        width: `clamp(1.25rem, 3vw, 1.5rem)`,
                        height: `clamp(1.25rem, 3vw, 1.5rem)`,
                    }}
                />
                {unreadCount > 0 && (
                    <span
                        className="
              absolute -top-1 -right-1 
              bg-gradient-to-r from-red-500 to-red-600 rounded-full 
              text-white font-bold
              flex items-center justify-center
              border-2 border-white shadow-lg
              animate-pulse
            "
                        style={{
                            width: `clamp(1.25rem, 3vw, 1.5rem)`,
                            height: `clamp(1.25rem, 3vw, 1.5rem)`,
                            fontSize: `clamp(0.625rem, 1.5vw, 0.75rem)`,
                        }}
                        aria-live="polite"
                    >
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </Button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    className="
            absolute right-0 mt-2 
            bg-white rounded-2xl shadow-2xl ring-1 ring-black/5
            overflow-hidden z-50
            backdrop-blur-sm border border-white/20
            animate-in fade-in-0 zoom-in-95 duration-200
          "
                    style={{
                        width: `clamp(320px, 40vw, 480px)`,
                        maxHeight: `clamp(400px, 60vh, 600px)`,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                    }}
                    role="menu"
                    aria-label="Notifications"
                >
                    {/* Header */}
                    <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 rounded-t-2xl">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <h3 className="font-semibold text-gray-900 text-lg">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        onClick={markAllAsRead}
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-auto px-3 py-1.5 text-sm rounded-lg transition-all duration-200"
                                    >
                                        Mark all read
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.push('/admin-dashboard/notifications');
                                    }}
                                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 h-auto px-3 py-1.5 text-sm rounded-lg transition-all duration-200"
                                >
                                    View All
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="relative">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200"></div>
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                                </div>
                                <span className="mt-3 text-gray-600 font-medium">Loading notifications...</span>
                            </div>
                        ) : error ? (
                            <div className="px-6 py-12 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <X className="w-8 h-8 text-red-600" />
                                </div>
                                <p className="text-red-600 mb-4 font-medium">{error}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchNotifications}
                                    className="text-sm rounded-lg hover:bg-red-50 hover:border-red-200 transition-all duration-200"
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification, index) => {
                                    const isRead = isNotificationRead(notification);
                                    return (
                                        <div
                                            key={notification.id}
                                            ref={index === 0 ? firstItemRef : null}
                                            className={`
                                px-6 py-4 hover:bg-gray-50/80 cursor-pointer
                                focus:bg-gray-50 focus:outline-none
                                transition-all duration-300 ease-out
                                group relative
                                ${!isRead ? "bg-gradient-to-r from-blue-50/30 to-transparent border-l-4 border-blue-400" : "bg-white"}
                                ${!isRead ? "font-semibold shadow-sm" : "font-normal"}
                                hover:shadow-md hover:scale-[1.01] active:scale-[0.99]
                            `}
                                            onClick={() => handleNotificationClick(notification)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleNotificationClick(notification);
                                                }
                                            }}
                                            tabIndex={0}
                                            role="menuitem"
                                        >
                                            <div className="flex items-start space-x-4">
                                                <div className="flex-shrink-0 mt-1">
                                                    <div className="relative">
                                                        {getNotificationIcon(notification.message)}
                                                        {!isRead && (
                                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <p className={`text-sm line-clamp-2 transition-all duration-200 ${!isRead ? "text-gray-900 font-semibold" : "text-gray-700"
                                                            }`}>
                                                            {notification.message}
                                                        </p>
                                                        {!isRead && (
                                                            <div className="ml-3 flex-shrink-0">
                                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            {getRelativeTime(notification.createdAt)}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            {!isRead && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        markAsRead(notification.id);
                                                                    }}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 
                                                                               px-3 py-1.5 rounded-lg hover:bg-blue-50 
                                                                               transition-all duration-200 font-medium
                                                                               group-hover:bg-blue-100"
                                                                >
                                                                    Mark read
                                                                </button>
                                                            )}
                                                            {isRead && (
                                                                <span className="text-xs text-gray-400 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-50">
                                                                    <Check className="h-3 w-3" />
                                                                    Read
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Bell className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
                                <p className="text-gray-500 text-sm">You'll see notifications here when they arrive</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
