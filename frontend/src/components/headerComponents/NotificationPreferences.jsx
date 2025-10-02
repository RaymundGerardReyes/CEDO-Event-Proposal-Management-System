/**
 * ===================================================================
 * NOTIFICATION PREFERENCES COMPONENT
 * ===================================================================
 * Purpose: User notification preferences management
 * Key approaches: Real-time updates, form validation, accessibility
 * Features: Channel selection, frequency settings, quiet hours, timezone
 * ===================================================================
 */

import {
    Bell,
    Check,
    Mail,
    MessageSquare,
    RefreshCw,
    Save,
    Smartphone,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';

const NotificationPreferences = ({ userId, onSave, onCancel }) => {
    const [preferences, setPreferences] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Default notification types
    const notificationTypes = [
        {
            value: 'proposal_submitted',
            label: 'Proposal Submitted',
            description: 'When a new proposal is submitted for review',
            icon: '📝'
        },
        {
            value: 'proposal_approved',
            label: 'Proposal Approved',
            description: 'When your proposal is approved',
            icon: '✅'
        },
        {
            value: 'proposal_rejected',
            label: 'Proposal Rejected',
            description: 'When your proposal is not approved',
            icon: '❌'
        },
        {
            value: 'user_registration',
            label: 'User Registration',
            description: 'When new users register (Admin only)',
            icon: '👤'
        },
        {
            value: 'user_approved',
            label: 'User Approved',
            description: 'When your account is approved',
            icon: '✅'
        },
        {
            value: 'system_update',
            label: 'System Updates',
            description: 'Important system announcements',
            icon: '🔄'
        },
        {
            value: 'deadline_reminder',
            label: 'Deadline Reminders',
            description: 'Reminders about upcoming deadlines',
            icon: '⏰'
        },
        {
            value: 'event_reminder',
            label: 'Event Reminders',
            description: 'Reminders about your scheduled events',
            icon: '📅'
        }
    ];

    // Frequency options
    const frequencyOptions = [
        { value: 'immediate', label: 'Immediate', description: 'Receive notifications instantly' },
        { value: 'hourly', label: 'Hourly', description: 'Receive notifications once per hour' },
        { value: 'daily', label: 'Daily', description: 'Receive notifications once per day' },
        { value: 'weekly', label: 'Weekly', description: 'Receive notifications once per week' },
        { value: 'never', label: 'Never', description: 'Do not receive these notifications' }
    ];

    // Timezone options (common timezones)
    const timezoneOptions = [
        { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
        { value: 'America/New_York', label: 'Eastern Time (ET)' },
        { value: 'America/Chicago', label: 'Central Time (CT)' },
        { value: 'America/Denver', label: 'Mountain Time (MT)' },
        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
        { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
        { value: 'Europe/Paris', label: 'Central European Time (CET)' },
        { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
        { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
        { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
    ];

    // Load preferences
    useEffect(() => {
        loadPreferences();
    }, [userId]);

    const loadPreferences = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/preferences`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                // Initialize preferences for all notification types
                const allPreferences = notificationTypes.map(type => {
                    const existing = result.data.find(p => p.notification_type === type.value);
                    return existing || {
                        notification_type: type.value,
                        in_app: true,
                        email: true,
                        sms: false,
                        push: true,
                        frequency: 'immediate',
                        quiet_hours_start: null,
                        quiet_hours_end: null,
                        timezone: 'UTC'
                    };
                });

                setPreferences(allPreferences);
            } else {
                throw new Error(result.message || 'Failed to load preferences');
            }
        } catch (err) {
            console.error('Error loading preferences:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Update preference
    const updatePreference = (index, field, value) => {
        setPreferences(prev =>
            prev.map((pref, i) =>
                i === index ? { ...pref, [field]: value } : pref
            )
        );
    };

    // Save preferences
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/preferences`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(preferences)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                if (onSave) onSave();
            } else {
                throw new Error(result.message || 'Failed to save preferences');
            }
        } catch (err) {
            console.error('Error saving preferences:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Handle cancel
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            loadPreferences();
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading preferences...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Bell className="h-6 w-6 mr-3" />
                    Notification Preferences
                </h2>
                <p className="text-gray-600 mt-2">
                    Customize how and when you receive notifications
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                        <X className="h-5 w-5 text-red-400 mr-2" />
                        <span className="text-red-800">{error}</span>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center">
                        <Check className="h-5 w-5 text-green-400 mr-2" />
                        <span className="text-green-800">Preferences saved successfully!</span>
                    </div>
                </div>
            )}

            {/* Preferences Form */}
            <div className="space-y-6">
                {preferences.map((preference, index) => {
                    const typeInfo = notificationTypes.find(t => t.value === preference.notification_type);
                    if (!typeInfo) return null;

                    return (
                        <div key={preference.notification_type} className="bg-white border border-gray-200 rounded-lg p-6">
                            {/* Notification Type Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{typeInfo.icon}</span>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{typeInfo.label}</h3>
                                        <p className="text-sm text-gray-600">{typeInfo.description}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Channel Preferences */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                {/* In-App */}
                                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={preference.in_app}
                                        onChange={(e) => updatePreference(index, 'in_app', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <Bell className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">In-App</span>
                                </label>

                                {/* Email */}
                                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={preference.email}
                                        onChange={(e) => updatePreference(index, 'email', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <Mail className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Email</span>
                                </label>

                                {/* SMS */}
                                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={preference.sms}
                                        onChange={(e) => updatePreference(index, 'sms', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <MessageSquare className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">SMS</span>
                                </label>

                                {/* Push */}
                                <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={preference.push}
                                        onChange={(e) => updatePreference(index, 'push', e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <Smartphone className="h-5 w-5 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Push</span>
                                </label>
                            </div>

                            {/* Frequency */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Frequency
                                </label>
                                <select
                                    value={preference.frequency}
                                    onChange={(e) => updatePreference(index, 'frequency', e.target.value)}
                                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {frequencyOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label} - {option.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Quiet Hours */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quiet Hours Start
                                    </label>
                                    <input
                                        type="time"
                                        value={preference.quiet_hours_start || ''}
                                        onChange={(e) => updatePreference(index, 'quiet_hours_start', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quiet Hours End
                                    </label>
                                    <input
                                        type="time"
                                        value={preference.quiet_hours_end || ''}
                                        onChange={(e) => updatePreference(index, 'quiet_hours_end', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Timezone
                                    </label>
                                    <select
                                        value={preference.timezone}
                                        onChange={(e) => updatePreference(index, 'timezone', e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {timezoneOptions.map((tz) => (
                                            <option key={tz.value} value={tz.value}>
                                                {tz.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <div className="flex items-center">
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <Save className="h-4 w-4 mr-2" />
                            Save Preferences
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

export default NotificationPreferences;
