/**
 * Admin Notifications Page
 * Purpose: Display and manage all notifications for admin users
 * Key approaches: Real-time data fetching, notification management, responsive design
 */

"use client";

import { PageHeader } from "@/components/dashboard/admin/page-header";
import { Card, CardContent } from "@/components/dashboard/admin/ui/card";
import { Button } from "@/components/ui/button";
import { getAppConfig } from "@/lib/utils";
import { Bell, Check, Clock, FileText, RefreshCw, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// Enhanced responsive breakpoints with zoom awareness (matching app-header.jsx)
const RESPONSIVE_BREAKPOINTS = {
    xs: 320,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
    zoom125: 1536,  // Handles 125% zoom
    zoom150: 1280,  // Handles 150% zoom
    zoom200: 960,   // Handles 200% zoom
};

// Notification type configurations
const notificationTypeConfig = {
    proposal_submitted: {
        icon: FileText,
        bgColor: "bg-blue-100",
        textColor: "text-blue-600",
        label: "Proposal Submitted"
    },
    proposal_approved: {
        icon: Check,
        bgColor: "bg-green-100",
        textColor: "text-green-600",
        label: "Proposal Approved"
    },
    proposal_rejected: {
        icon: X,
        bgColor: "bg-red-100",
        textColor: "text-red-600",
        label: "Proposal Rejected"
    },
    system_update: {
        icon: Clock,
        bgColor: "bg-orange-100",
        textColor: "text-orange-600",
        label: "System Update"
    }
};

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Enhanced responsive monitoring (matching app-header.jsx)
    useEffect(() => {
        const updateResponsiveState = () => {
            const width = window.innerWidth;
            const screenWidth = window.screen.width;
            const zoom = width / screenWidth;

            setViewportWidth(width);
            setZoomLevel(zoom);
        };

        updateResponsiveState();
        window.addEventListener("resize", updateResponsiveState, { passive: true });

        return () => window.removeEventListener("resize", updateResponsiveState);
    }, []);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('cedo_token='))
                ?.split('=')[1];

            console.log('🔍 Debug: Token found:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

            if (!token) {
                setError('Authentication required');
                return;
            }

            const backendUrl = getAppConfig().backendUrl;
            console.log('🔍 Debug: Backend URL:', backendUrl);
            console.log('🔍 Debug: Making API call to:', `${backendUrl}/api/notifications?page=1&limit=50`);

            const response = await fetch(`${backendUrl}/api/notifications?page=1&limit=50`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log('🔍 Debug: API Response status:', response.status);
            console.log('🔍 Debug: API Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.log('🔍 Debug: API Error response:', errorText);
                throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('🔍 Debug: API Response data:', result);

            if (result.success) {
                console.log('🔍 Debug: Notifications count:', result.data.notifications?.length || 0);
                setNotifications(result.data.notifications || []);
            } else {
                console.log('🔍 Debug: API returned success: false');
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
                setNotifications(prev =>
                    prev.map(notif => notif.id === notificationId ? { ...notif, isRead: true } : notif)
                );
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
                setNotifications(prev =>
                    prev.map(notif => ({ ...notif, isRead: true }))
                );
            }
        } catch (error) {
            console.error('❌ Failed to mark all as read:', error);
        }
    }, []);

    // Refresh notifications
    const refreshNotifications = useCallback(async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    }, [fetchNotifications]);

    // Handle notification click
    const handleNotificationClick = useCallback((notification) => {
        if (notification.relatedProposalId) {
            router.push(`/admin-dashboard/proposals/${notification.relatedProposalId}`);
        }
    }, [router]);

    // Get notification icon with responsive design
    const getNotificationIcon = (message) => {
        const type = getNotificationType(message);
        const config = notificationTypeConfig[type] || notificationTypeConfig.proposal_submitted;
        const IconComponent = config.icon;

        return (
            <div
                className={`rounded-full ${config.bgColor} ${config.textColor} transition-all duration-300`}
                style={{
                    padding: `clamp(0.5rem, 1vw, 0.75rem)`,
                    borderRadius: '50%'
                }}
            >
                <IconComponent
                    style={{
                        width: `clamp(1rem, 2vw, 1.25rem)`,
                        height: `clamp(1rem, 2vw, 1.25rem)`
                    }}
                />
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

    // Load notifications on mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return (
        <div
            className="flex-1 bg-[#f8f9fa] min-h-screen transition-all duration-300 ease-out"
            style={{
                padding: `clamp(0.75rem, 3vw, 1.5rem)`,
                paddingLeft: viewportWidth < RESPONSIVE_BREAKPOINTS.md ? 'clamp(0.75rem, 3vw, 1.5rem)' : 'clamp(1rem, 4vw, 2rem)',
                paddingRight: 'clamp(0.75rem, 3vw, 1.5rem)',
                paddingTop: 'clamp(0.75rem, 3vw, 1.5rem)',
                paddingBottom: 'clamp(0.75rem, 3vw, 1.5rem)'
            }}
        >
            <div className="w-full max-w-full space-y-fluid">
                <PageHeader
                    title="Notifications"
                    subtitle="Manage and view all system notifications"
                />

                <Card
                    className="shadow-sm border-0 transition-all duration-300 ease-out"
                    style={{
                        borderRadius: viewportWidth < RESPONSIVE_BREAKPOINTS.md ? '1rem' : '1.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                >
                    <CardContent
                        style={{
                            padding: `clamp(0.75rem, 3vw, 1.25rem)`,
                            paddingLeft: viewportWidth < RESPONSIVE_BREAKPOINTS.md ? 'clamp(0.75rem, 3vw, 1.25rem)' : 'clamp(1rem, 4vw, 1.5rem)',
                            paddingRight: viewportWidth < RESPONSIVE_BREAKPOINTS.md ? 'clamp(0.75rem, 3vw, 1.25rem)' : 'clamp(1rem, 4vw, 1.5rem)',
                            paddingTop: 'clamp(0.75rem, 3vw, 1.25rem)',
                            paddingBottom: 'clamp(0.75rem, 3vw, 1.25rem)'
                        }}
                    >
                        {/* Enhanced Header with responsive grid layout */}
                        <div
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4"
                            style={{ gap: `clamp(0.75rem, 2vw, 1rem)` }}
                        >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                <h3
                                    className="font-semibold text-gray-900 transition-all duration-300"
                                    style={{
                                        fontSize: `clamp(1.125rem, 2.5vw, 1.5rem)`,
                                        lineHeight: 1.2
                                    }}
                                >
                                    All Notifications
                                </h3>
                                <span
                                    className="text-gray-500 transition-all duration-300"
                                    style={{
                                        fontSize: `clamp(0.75rem, 1.5vw, 0.875rem)`,
                                        padding: `clamp(0.25rem, 0.5vw, 0.5rem) clamp(0.5rem, 1vw, 0.75rem)`,
                                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                        borderRadius: '0.5rem'
                                    }}
                                >
                                    {notifications.length} total
                                </span>
                            </div>
                            <div
                                className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto"
                                style={{ gap: `clamp(0.5rem, 1.5vw, 0.75rem)` }}
                            >
                                <Button
                                    variant="outline"
                                    onClick={refreshNotifications}
                                    disabled={refreshing}
                                    className="
                                        flex items-center justify-center
                                        transition-all duration-300 hover:scale-105 active:scale-95
                                        focus:outline-none focus:ring-2 focus:ring-blue-400/50
                                    "
                                    style={{
                                        height: `clamp(2.25rem, 4.5vw, 2.75rem)`,
                                        padding: `clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)`,
                                        fontSize: `clamp(0.75rem, 1.5vw, 0.875rem)`,
                                        borderRadius: '0.75rem'
                                    }}
                                >
                                    <RefreshCw
                                        className={`transition-transform duration-300 ${refreshing ? 'animate-spin' : ''}`}
                                        style={{
                                            width: `clamp(1rem, 2vw, 1.25rem)`,
                                            height: `clamp(1rem, 2vw, 1.25rem)`,
                                            marginRight: `clamp(0.25rem, 0.5vw, 0.5rem)`
                                        }}
                                    />
                                    <span className="hidden sm:inline">Refresh</span>
                                    <span className="sm:hidden">↻</span>
                                </Button>
                                {notifications.some(n => !n.isRead) && (
                                    <Button
                                        variant="outline"
                                        onClick={markAllAsRead}
                                        className="
                                            flex items-center justify-center
                                            transition-all duration-300 hover:scale-105 active:scale-95
                                            focus:outline-none focus:ring-2 focus:ring-green-400/50
                                            bg-green-50 border-green-200 text-green-700 hover:bg-green-100
                                        "
                                        style={{
                                            height: `clamp(2.25rem, 4.5vw, 2.75rem)`,
                                            padding: `clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)`,
                                            fontSize: `clamp(0.75rem, 1.5vw, 0.875rem)`,
                                            borderRadius: '0.75rem'
                                        }}
                                    >
                                        <Check
                                            style={{
                                                width: `clamp(1rem, 2vw, 1.25rem)`,
                                                height: `clamp(1rem, 2vw, 1.25rem)`,
                                                marginRight: `clamp(0.25rem, 0.5vw, 0.5rem)`
                                            }}
                                        />
                                        <span className="hidden sm:inline">Mark All Read</span>
                                        <span className="sm:hidden">✓ All</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Enhanced Content with responsive design */}
                        {loading ? (
                            <div
                                className="flex flex-col sm:flex-row items-center justify-center py-12"
                                style={{ gap: `clamp(0.75rem, 2vw, 1rem)` }}
                            >
                                <div
                                    className="animate-spin rounded-full border-b-2 border-blue-600"
                                    style={{
                                        width: `clamp(2rem, 4vw, 3rem)`,
                                        height: `clamp(2rem, 4vw, 3rem)`
                                    }}
                                ></div>
                                <span
                                    className="text-gray-600 transition-all duration-300"
                                    style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                                >
                                    Loading notifications...
                                </span>
                            </div>
                        ) : error ? (
                            <div
                                className="text-center py-12"
                                style={{ padding: `clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 2rem)` }}
                            >
                                <Bell
                                    className="mx-auto text-gray-400 mb-4"
                                    style={{
                                        width: `clamp(3rem, 6vw, 4rem)`,
                                        height: `clamp(3rem, 6vw, 4rem)`
                                    }}
                                />
                                <p
                                    className="text-red-600 mb-4 transition-all duration-300"
                                    style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                                >
                                    {error}
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={fetchNotifications}
                                    className="
                                        transition-all duration-300 hover:scale-105 active:scale-95
                                        focus:outline-none focus:ring-2 focus:ring-red-400/50
                                    "
                                    style={{
                                        height: `clamp(2.25rem, 4.5vw, 2.75rem)`,
                                        padding: `clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)`,
                                        fontSize: `clamp(0.75rem, 1.5vw, 0.875rem)`,
                                        borderRadius: '0.75rem'
                                    }}
                                >
                                    Retry
                                </Button>
                            </div>
                        ) : notifications.length > 0 ? (
                            <div
                                className="space-y-3"
                                style={{ gap: `clamp(0.5rem, 1.5vw, 0.75rem)` }}
                            >
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`
                                            rounded-lg border cursor-pointer transition-all duration-300 ease-out
                                            hover:shadow-md hover:scale-[1.01] active:scale-[0.99]
                                            focus:outline-none focus:ring-2 focus:ring-blue-400/50
                                            ${!notification.isRead ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-gray-200 hover:bg-gray-50"}
                                        `}
                                        style={{
                                            padding: `clamp(0.75rem, 2vw, 1rem)`,
                                            borderRadius: viewportWidth < RESPONSIVE_BREAKPOINTS.md ? '0.75rem' : '1rem'
                                        }}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div
                                            className="flex items-start"
                                            style={{ gap: `clamp(0.75rem, 2vw, 1rem)` }}
                                        >
                                            <div
                                                className="flex-shrink-0 mt-1"
                                                style={{ marginTop: `clamp(0.125rem, 0.25vw, 0.25rem)` }}
                                            >
                                                {getNotificationIcon(notification.message)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className="font-medium text-gray-900 line-clamp-2 transition-all duration-300"
                                                    style={{
                                                        fontSize: `clamp(0.875rem, 1.5vw, 1rem)`,
                                                        lineHeight: 1.4
                                                    }}
                                                >
                                                    {notification.message}
                                                </p>
                                                <div
                                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2"
                                                    style={{
                                                        gap: `clamp(0.25rem, 0.5vw, 0.5rem)`,
                                                        marginTop: `clamp(0.5rem, 1vw, 0.75rem)`
                                                    }}
                                                >
                                                    <p
                                                        className="text-gray-500 transition-all duration-300"
                                                        style={{
                                                            fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)`
                                                        }}
                                                    >
                                                        {getRelativeTime(notification.createdAt)}
                                                    </p>
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                markAsRead(notification.id);
                                                            }}
                                                            className="
                                                                text-blue-600 hover:text-blue-700 font-medium
                                                                transition-all duration-300 hover:scale-105 active:scale-95
                                                                focus:outline-none focus:ring-2 focus:ring-blue-400/50
                                                                px-2 py-1 rounded-md hover:bg-blue-50
                                                            "
                                                            style={{
                                                                fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)`,
                                                                padding: `clamp(0.25rem, 0.5vw, 0.5rem) clamp(0.5rem, 1vw, 0.75rem)`,
                                                                borderRadius: '0.5rem'
                                                            }}
                                                        >
                                                            Mark as read
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                className="text-center py-12"
                                style={{ padding: `clamp(2rem, 6vw, 4rem) clamp(1rem, 3vw, 2rem)` }}
                            >
                                <Bell
                                    className="mx-auto text-gray-400 mb-4"
                                    style={{
                                        width: `clamp(3rem, 6vw, 4rem)`,
                                        height: `clamp(3rem, 6vw, 4rem)`
                                    }}
                                />
                                <p
                                    className="text-gray-500 transition-all duration-300"
                                    style={{
                                        fontSize: `clamp(1rem, 2vw, 1.25rem)`,
                                        marginBottom: `clamp(0.25rem, 0.5vw, 0.5rem)`
                                    }}
                                >
                                    No notifications
                                </p>
                                <p
                                    className="text-gray-400 transition-all duration-300"
                                    style={{
                                        fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)`,
                                        marginTop: `clamp(0.25rem, 0.5vw, 0.5rem)`
                                    }}
                                >
                                    You'll see notifications here when they arrive
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
