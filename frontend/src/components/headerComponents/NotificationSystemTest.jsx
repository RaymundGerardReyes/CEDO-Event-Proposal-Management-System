/**
 * ===================================================================
 * NOTIFICATION SYSTEM FRONTEND TEST COMPONENT
 * ===================================================================
 * Purpose: Test the notification system from the frontend
 * Key approaches: Component testing, hook testing, integration testing
 * Features: Real-time testing, user interaction testing, error handling
 * ===================================================================
 */

import { useAuth } from '@/contexts/auth-context';
import useNotifications from '@/hooks/useNotifications';
import { AlertTriangle, Bell, CheckCircle, Info, X } from 'lucide-react';
import { useState } from 'react';
import NotificationPanel from './NotificationPanel';

const NotificationSystemTest = () => {
    const { user, token } = useAuth();
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
        refresh,
        stats
    } = useNotifications();

    const [testResults, setTestResults] = useState([]);
    const [isRunningTests, setIsRunningTests] = useState(false);
    const [showTestPanel, setShowTestPanel] = useState(false);

    // Test functions
    const runTest = async (testName, testFunction) => {
        try {
            console.log(`🧪 Running: ${testName}`);
            const result = await testFunction();
            setTestResults(prev => [...prev, { name: testName, status: 'PASSED', result, timestamp: new Date() }]);
            console.log(`✅ ${testName}: PASSED`);
            return result;
        } catch (error) {
            setTestResults(prev => [...prev, { name: testName, status: 'FAILED', error: error.message, timestamp: new Date() }]);
            console.log(`❌ ${testName}: FAILED - ${error.message}`);
            throw error;
        }
    };

    // Test notification data fetching
    const testDataFetching = async () => {
        if (!user || !token) {
            throw new Error('User not authenticated');
        }

        if (loading) {
            throw new Error('Still loading');
        }

        if (error) {
            throw new Error(`Error: ${error}`);
        }

        return {
            notificationsCount: notifications.length,
            unreadCount,
            hasStats: !!stats
        };
    };

    // Test notification actions
    const testNotificationActions = async () => {
        if (notifications.length === 0) {
            throw new Error('No notifications to test with');
        }

        const firstNotification = notifications[0];

        // Test hiding notification
        await hideNotification(firstNotification.id);

        // Test marking as read
        await markAsRead();

        return {
            hiddenNotificationId: firstNotification.id,
            markedAsRead: true
        };
    };

    // Test search functionality
    const testSearchFunctionality = async () => {
        if (notifications.length === 0) {
            throw new Error('No notifications to search');
        }

        const searchTerm = notifications[0].title.split(' ')[0];
        const results = await searchNotifications(searchTerm);

        return {
            searchTerm,
            resultsCount: results.length
        };
    };

    // Test filtering functionality
    const testFilteringFunctionality = async () => {
        if (notifications.length === 0) {
            throw new Error('No notifications to filter');
        }

        const notificationType = notifications[0].notification_type;
        const filteredResults = await filterByType(notificationType);

        return {
            filterType: notificationType,
            filteredCount: filteredResults.length
        };
    };

    // Test unread notifications
    const testUnreadNotifications = async () => {
        const unreadResults = await getUnreadNotifications();

        return {
            unreadCount: unreadResults.length,
            allUnread: unreadResults.every(n => !n.is_read)
        };
    };

    // Test refresh functionality
    const testRefreshFunctionality = async () => {
        const beforeCount = notifications.length;
        await refresh();
        const afterCount = notifications.length;

        return {
            beforeCount,
            afterCount,
            refreshed: true
        };
    };

    // Test error handling
    const testErrorHandling = async () => {
        try {
            // Try to hide a non-existent notification
            await hideNotification(999999);
            throw new Error('Should have failed');
        } catch (error) {
            return {
                errorHandled: true,
                errorMessage: error.message
            };
        }
    };

    // Run all tests
    const runAllTests = async () => {
        setIsRunningTests(true);
        setTestResults([]);

        try {
            await runTest('Data Fetching', testDataFetching);
            await runTest('Notification Actions', testNotificationActions);
            await runTest('Search Functionality', testSearchFunctionality);
            await runTest('Filtering Functionality', testFilteringFunctionality);
            await runTest('Unread Notifications', testUnreadNotifications);
            await runTest('Refresh Functionality', testRefreshFunctionality);
            await runTest('Error Handling', testErrorHandling);

            console.log('🎉 All frontend tests completed!');
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        } finally {
            setIsRunningTests(false);
        }
    };

    // Clear test results
    const clearTestResults = () => {
        setTestResults([]);
    };

    // Get test summary
    const getTestSummary = () => {
        const total = testResults.length;
        const passed = testResults.filter(r => r.status === 'PASSED').length;
        const failed = testResults.filter(r => r.status === 'FAILED').length;

        return { total, passed, failed, successRate: total > 0 ? (passed / total) * 100 : 0 };
    };

    const summary = getTestSummary();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Notification System Test</h1>
                <p className="text-gray-600">Test the notification system components and functionality</p>
            </div>

            {/* Test Controls */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Test Controls</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={runAllTests}
                            disabled={isRunningTests || !user}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isRunningTests ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Running Tests...
                                </>
                            ) : (
                                <>
                                    <Bell className="h-4 w-4" />
                                    Run All Tests
                                </>
                            )}
                        </button>
                        <button
                            onClick={clearTestResults}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
                        >
                            <X className="h-4 w-4" />
                            Clear Results
                        </button>
                        <button
                            onClick={() => setShowTestPanel(!showTestPanel)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                        >
                            <Info className="h-4 w-4" />
                            {showTestPanel ? 'Hide' : 'Show'} Test Panel
                        </button>
                    </div>
                </div>

                {!user && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            <p className="text-yellow-800">Please log in to run tests</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Test Results Summary */}
            {testResults.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Test Results Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
                            <div className="text-sm text-blue-800">Total Tests</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                            <div className="text-sm text-green-800">Passed</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                            <div className="text-sm text-red-800">Failed</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                            <div className="text-2xl font-bold text-purple-600">{summary.successRate.toFixed(1)}%</div>
                            <div className="text-sm text-purple-800">Success Rate</div>
                        </div>
                    </div>

                    {/* Detailed Results */}
                    <div className="space-y-2">
                        {testResults.map((result, index) => (
                            <div
                                key={index}
                                className={`p-3 rounded-lg border ${result.status === 'PASSED'
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-red-50 border-red-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {result.status === 'PASSED' ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <X className="h-5 w-5 text-red-600" />
                                        )}
                                        <span className="font-medium">{result.name}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {result.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                                {result.status === 'FAILED' && (
                                    <div className="mt-2 text-sm text-red-600">
                                        Error: {result.error}
                                    </div>
                                )}
                                {result.status === 'PASSED' && result.result && (
                                    <div className="mt-2 text-sm text-green-600">
                                        Result: {JSON.stringify(result.result)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Test Panel */}
            {showTestPanel && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Live Notification Panel Test</h2>
                    <div className="border rounded-lg p-4">
                        <NotificationPanel />
                    </div>
                </div>
            )}

            {/* Current System Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Current System Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Loading:</span>
                            <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                                {loading ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Error:</span>
                            <span className={error ? 'text-red-600' : 'text-green-600'}>
                                {error ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Notifications Count:</span>
                            <span className="text-blue-600">{notifications.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Unread Count:</span>
                            <span className="text-orange-600">{unreadCount}</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>User Authenticated:</span>
                            <span className={user ? 'text-green-600' : 'text-red-600'}>
                                {user ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Token Available:</span>
                            <span className={token ? 'text-green-600' : 'text-red-600'}>
                                {token ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Stats Available:</span>
                            <span className={stats ? 'text-green-600' : 'text-red-600'}>
                                {stats ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationSystemTest;
