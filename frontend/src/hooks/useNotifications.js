/**
 * ===================================================================
 * NOTIFICATIONS HOOK
 * ===================================================================
 * Purpose: React hook for managing notifications with unified targeting
 * Key approaches: Real-time updates, caching, optimistic updates
 * Features: User/role/all targeting, full-text search, priority levels
 * ===================================================================
 */

import { useAuth } from '@/contexts/auth-context';
import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    // Extract token from cookies (same logic as backend expects)
    const getToken = useCallback(() => {
        if (typeof document === 'undefined') return null;

        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('cedo_token='))
            ?.split('=')[1];

        return cookieValue || null;
    }, []);

    // Cache for performance
    const cacheRef = useRef(new Map());
    const lastFetchRef = useRef(null);

    /**
     * Fetch notifications with caching
     */
    const fetchNotifications = useCallback(async (options = {}) => {
        const token = getToken();
        if (!user || !token) {
            console.log('🔍 useNotifications: No user or token, skipping fetch');
            return;
        }

        console.log('🔍 useNotifications: Fetching notifications...', { user: user.id, options });

        const cacheKey = JSON.stringify(options);
        const now = Date.now();

        // Check cache (5 minute TTL)
        if (cacheRef.current.has(cacheKey) && (now - lastFetchRef.current) < 300000) {
            const cached = cacheRef.current.get(cacheKey);
            console.log('🔍 useNotifications: Using cached data');
            setNotifications(cached.data);
            return cached.data;
        }

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            Object.entries(options).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    params.append(key, value);
                }
            });
            // Cache buster to avoid initial 304 with empty cache on admin
            params.append('_t', Date.now().toString());

            const apiUrl = `${API_BASE_URL}/api/notifications?${params}`;
            console.log('🔍 useNotifications: API URL:', apiUrl);
            console.log('🔍 useNotifications: Token:', token.substring(0, 20) + '...');

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                cache: 'no-store'
            });

            console.log('🔍 useNotifications: Response status:', response.status);
            console.log('🔍 useNotifications: Response ok:', response.ok);

            // Handle 304 Not Modified by using cached data
            if (response.status === 304) {
                const cached = cacheRef.current.get(cacheKey);
                if (cached) {
                    console.log('🔍 useNotifications: 304 received, using cached notifications');
                    setNotifications(cached.data);
                    return cached.data;
                }
                console.log('🔍 useNotifications: 304 received, no cache available, keeping existing state');
                return notifications;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('🔍 useNotifications: Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            console.log('🔍 useNotifications: Response data:', result);

            if (result.success) {
                console.log('🔍 useNotifications: Notifications fetched:', result.data?.length || 0);
                setNotifications(result.data || []);
                cacheRef.current.set(cacheKey, { data: result.data || [], timestamp: now });
                lastFetchRef.current = now;
                return result.data || [];
            } else {
                console.error('🔍 useNotifications: API returned success: false', result.message);
                throw new Error(result.message || 'Failed to fetch notifications');
            }
        } catch (err) {
            console.error('🔍 useNotifications: Error fetching notifications:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [user, getToken]);

    /**
     * Fetch unread count
     */
    const fetchUnreadCount = useCallback(async () => {
        const token = getToken();
        if (!user || !token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count?_t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                cache: 'no-store'
            });

            if (response.status === 304) {
                console.log('🔍 useNotifications: Unread count 304, keeping current value');
                return unreadCount;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setUnreadCount(result.data.unreadCount);
                return result.data.unreadCount;
            } else {
                throw new Error(result.message || 'Failed to fetch unread count');
            }
        } catch (err) {
            console.error('Error fetching unread count:', err);
            setError(err.message);
            throw err;
        }
    }, [user, getToken]);

    /**
     * Fetch notification statistics
     */
    const fetchStats = useCallback(async () => {
        const token = getToken();
        if (!user || !token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/stats?_t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                cache: 'no-store'
            });

            if (response.status === 304) {
                console.log('🔍 useNotifications: Stats 304, keeping current value');
                return stats;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setStats(result.data);
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to fetch notification stats');
            }
        } catch (err) {
            console.error('Error fetching notification stats:', err);
            setError(err.message);
            throw err;
        }
    }, [user, getToken]);

    /**
     * Mark notifications as read
     */
    const markAsRead = useCallback(async (notificationIds = null) => {
        const token = getToken();
        if (!user || !token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notificationIds })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Optimistic update
                setNotifications(prev =>
                    prev.map(notification => ({
                        ...notification,
                        is_read: true,
                        read_at: new Date().toISOString()
                    }))
                );

                // Update unread count
                setUnreadCount(0);

                // Clear cache
                cacheRef.current.clear();

                return result.data.count;
            } else {
                throw new Error(result.message || 'Failed to mark notifications as read');
            }
        } catch (err) {
            console.error('Error marking notifications as read:', err);
            setError(err.message);
            throw err;
        }
    }, [user, getToken]);

    /**
     * Hide a notification
     */
    const hideNotification = useCallback(async (notificationId) => {
        const token = getToken();
        if (!user || !token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/hide`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Optimistic update
                setNotifications(prev =>
                    prev.filter(notification => notification.id !== notificationId)
                );

                // Update unread count if needed
                const hiddenNotification = notifications.find(n => n.id === notificationId);
                if (hiddenNotification && !hiddenNotification.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }

                // Clear cache
                cacheRef.current.clear();

                return true;
            } else {
                throw new Error(result.message || 'Failed to hide notification');
            }
        } catch (err) {
            console.error('Error hiding notification:', err);
            setError(err.message);
            throw err;
        }
    }, [user, getToken, notifications]);

    /**
     * Search notifications
     */
    const searchNotifications = useCallback(async (searchTerm, options = {}) => {
        return fetchNotifications({
            ...options,
            search: searchTerm
        });
    }, [fetchNotifications]);

    /**
     * Filter notifications by type
     */
    const filterByType = useCallback(async (notificationType, options = {}) => {
        return fetchNotifications({
            ...options,
            notificationType
        });
    }, [fetchNotifications]);

    /**
     * Filter notifications by priority
     */
    const filterByPriority = useCallback(async (priority, options = {}) => {
        return fetchNotifications({
            ...options,
            priority
        });
    }, [fetchNotifications]);

    /**
     * Get only unread notifications
     */
    const getUnreadNotifications = useCallback(async (options = {}) => {
        return fetchNotifications({
            ...options,
            unreadOnly: true
        });
    }, [fetchNotifications]);

    /**
     * Refresh all data
     */
    const refresh = useCallback(async () => {
        console.log('🔍 useNotifications: Refreshing notifications...');
        cacheRef.current.clear();
        lastFetchRef.current = null;

        try {
            await Promise.all([
                fetchNotifications(),
                fetchUnreadCount(),
                fetchStats()
            ]);
            console.log('🔍 useNotifications: Refresh completed successfully');
        } catch (error) {
            console.error('🔍 useNotifications: Refresh failed:', error);
        }
    }, [fetchNotifications, fetchUnreadCount, fetchStats]);

    /**
     * Initialize data on mount
     */
    useEffect(() => {
        const token = getToken();
        if (user && token) {
            refresh();
        }
    }, [user, getToken, refresh]);

    /**
     * Set up polling for real-time updates
     */
    useEffect(() => {
        const token = getToken();
        if (!user || !token) return;

        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000); // Poll every 30 seconds

        return () => clearInterval(interval);
    }, [user, getToken, fetchUnreadCount]);

    // Listen for global refresh events triggered elsewhere in the app
    useEffect(() => {
        const handleGlobalRefresh = () => {
            refresh();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('notifications:refresh', handleGlobalRefresh);
        }

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('notifications:refresh', handleGlobalRefresh);
            }
        };
    }, [refresh]);

    return {
        // Data
        notifications,
        unreadCount,
        stats,
        loading,
        error,

        // Actions
        fetchNotifications,
        fetchUnreadCount,
        fetchStats,
        markAsRead,
        hideNotification,
        searchNotifications,
        filterByType,
        filterByPriority,
        getUnreadNotifications,
        refresh,

        // Utilities
        clearError: () => setError(null)
    };
};

export default useNotifications;
