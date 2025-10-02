/**
 * ===================================================================
 * NOTIFICATION FILTERS COMPONENT
 * ===================================================================
 * Purpose: Filter controls for notifications
 * Key approaches: Real-time filtering, accessibility, responsive design
 * Features: Type, priority, read status, search filters
 * ===================================================================
 */

import { CheckCircle, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';

const NotificationFilters = ({ filters, onFilterChange }) => {
    const [localFilters, setLocalFilters] = useState(filters);

    // Update local filters when props change
    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onFilterChange(newFilters);
    };

    // Clear all filters
    const clearFilters = () => {
        const clearedFilters = {
            unreadOnly: false,
            notificationType: null,
            priority: null
        };
        setLocalFilters(clearedFilters);
        onFilterChange(clearedFilters);
    };

    // Check if any filters are active
    const hasActiveFilters = localFilters.unreadOnly ||
        localFilters.notificationType ||
        localFilters.priority;

    // Notification type options
    const notificationTypes = [
        { value: 'proposal_submitted', label: 'Proposal Submitted', icon: '📝' },
        { value: 'proposal_approved', label: 'Proposal Approved', icon: '✅' },
        { value: 'proposal_rejected', label: 'Proposal Rejected', icon: '❌' },
        { value: 'user_registration', label: 'User Registration', icon: '👤' },
        { value: 'user_approved', label: 'User Approved', icon: '✅' },
        { value: 'user_rejected', label: 'User Rejected', icon: '❌' },
        { value: 'system_update', label: 'System Update', icon: '🔄' },
        { value: 'system_maintenance', label: 'System Maintenance', icon: '🔧' },
        { value: 'security_alert', label: 'Security Alert', icon: '🚨' },
        { value: 'deadline_reminder', label: 'Deadline Reminder', icon: '⏰' },
        { value: 'event_reminder', label: 'Event Reminder', icon: '📅' }
    ];

    // Priority options
    const priorityOptions = [
        { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-50 border-red-200', icon: '🔴' },
        { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: '🟠' },
        { value: 'normal', label: 'Normal', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: '🔵' },
        { value: 'low', label: 'Low', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: '⚪' }
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-900">Filters</h4>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Filter Options */}
            <div className="space-y-3">
                {/* Unread Only */}
                <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={localFilters.unreadOnly}
                            onChange={(e) => handleFilterChange('unreadOnly', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Unread only</span>
                    </label>
                </div>

                {/* Notification Type */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                        Notification Type
                    </label>
                    <select
                        value={localFilters.notificationType || ''}
                        onChange={(e) => handleFilterChange('notificationType', e.target.value || null)}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">All types</option>
                        {notificationTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.icon} {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Priority */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                        Priority Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {priorityOptions.map((priority) => (
                            <label
                                key={priority.value}
                                className={`
                                    flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors duration-200
                                    ${localFilters.priority === priority.value
                                        ? priority.color
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <input
                                    type="radio"
                                    name="priority"
                                    value={priority.value}
                                    checked={localFilters.priority === priority.value}
                                    onChange={(e) => handleFilterChange('priority', e.target.checked ? priority.value : null)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <span className="text-sm font-medium">
                                    {priority.icon} {priority.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-medium text-gray-700">Active filters:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {localFilters.unreadOnly && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Unread only
                            </span>
                        )}
                        {localFilters.notificationType && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {notificationTypes.find(t => t.value === localFilters.notificationType)?.icon}
                                {notificationTypes.find(t => t.value === localFilters.notificationType)?.label}
                            </span>
                        )}
                        {localFilters.priority && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {priorityOptions.find(p => p.value === localFilters.priority)?.icon}
                                {priorityOptions.find(p => p.value === localFilters.priority)?.label}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationFilters;
