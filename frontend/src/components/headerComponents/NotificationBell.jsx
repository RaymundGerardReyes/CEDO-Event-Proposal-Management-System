/**
 * ===================================================================
 * NOTIFICATION BELL COMPONENT
 * ===================================================================
 * Purpose: Bell icon with unread count and dropdown for notifications
 * Key approaches: Real-time updates, optimistic UI, accessibility
 * Features: Unread count badge, dropdown menu, priority indicators
 * ===================================================================
 */

import { Bell, Check, Filter, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import useNotifications from '../../hooks/useNotifications';
import NotificationFilters from './NotificationFilters';
import NotificationItem from './NotificationItem';

const NotificationBell = ({ className = '' }) => {
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

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        unreadOnly: false,
        notificationType: null,
        priority: null
    });
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    const dropdownRef = useRef(null);
    const searchRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            setIsOpen(false);
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

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-2 text-sm font-normal text-gray-500">
                                        ({unreadCount} unread)
                                    </span>
                                )}
                            </h3>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                    aria-label="Toggle filters"
                                >
                                    <Filter className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                    aria-label="Mark all as read"
                                >
                                    <Check className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                    aria-label="Close"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search notifications..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <NotificationFilters
                                filters={filters}
                                onFilterChange={handleFilterChange}
                            />
                        </div>
                    )}

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
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
                        ) : filteredNotifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p>No notifications found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {filteredNotifications.slice(0, 10).map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onHide={handleHideNotification}
                                        priorityColor={getPriorityColor(notification.priority)}
                                        priorityIcon={getPriorityIcon(notification.priority)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {filteredNotifications.length > 10 && (
                        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                            <button
                                onClick={() => {/* Navigate to full notifications page */ }}
                                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
