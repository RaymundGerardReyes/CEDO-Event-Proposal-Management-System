/**
 * Frontend Notifications Debug Tool
 * Purpose: Debug notifications directly from the frontend
 * Key approaches: API testing, authentication verification, data flow tracing
 */

"use client";

import { getAppConfig } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function DebugFrontendNotifications() {
    const [debugInfo, setDebugInfo] = useState({});
    const [loading, setLoading] = useState(true);
    const [testResults, setTestResults] = useState({});

    useEffect(() => {
        const debugNotifications = async () => {
            console.log('🔍 Starting frontend notifications debug...');

            try {
                // 1. Check authentication token
                const token = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('cedo_token='))
                    ?.split('=')[1];

                console.log('🔐 Authentication token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

                // 2. Get backend URL
                const backendUrl = getAppConfig().backendUrl;
                console.log('🌐 Backend URL:', backendUrl);

                // 3. Test API endpoints
                const apiTests = {
                    notifications: null,
                    unreadCount: null,
                    markAsRead: null
                };

                if (token) {
                    // Test notifications endpoint
                    try {
                        console.log('📡 Testing notifications endpoint...');
                        const notificationsResponse = await fetch(`${backendUrl}/api/notifications?page=1&limit=10`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                        });

                        console.log('📡 Notifications API Response status:', notificationsResponse.status);
                        const notificationsData = await notificationsResponse.json();
                        console.log('📡 Notifications API Response data:', notificationsData);

                        apiTests.notifications = {
                            status: notificationsResponse.status,
                            success: notificationsResponse.ok,
                            data: notificationsData,
                            count: notificationsData.data?.notifications?.length || 0
                        };
                    } catch (error) {
                        console.error('❌ Notifications API test failed:', error);
                        apiTests.notifications = { error: error.message };
                    }

                    // Test unread count endpoint
                    try {
                        console.log('📡 Testing unread count endpoint...');
                        const unreadResponse = await fetch(`${backendUrl}/api/notifications/unread-count`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                        });

                        console.log('📡 Unread count API Response status:', unreadResponse.status);
                        const unreadData = await unreadResponse.json();
                        console.log('📡 Unread count API Response data:', unreadData);

                        apiTests.unreadCount = {
                            status: unreadResponse.status,
                            success: unreadResponse.ok,
                            data: unreadData,
                            count: unreadData.data?.unreadCount || 0
                        };
                    } catch (error) {
                        console.error('❌ Unread count API test failed:', error);
                        apiTests.unreadCount = { error: error.message };
                    }

                    // Test mark as read endpoint (if we have notifications)
                    if (apiTests.notifications?.success && apiTests.notifications.count > 0) {
                        try {
                            console.log('📡 Testing mark as read endpoint...');
                            const notificationId = apiTests.notifications.data.data.notifications[0].id;

                            const markReadResponse = await fetch(`${backendUrl}/api/notifications/${notificationId}/read`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                },
                            });

                            console.log('📡 Mark as read API Response status:', markReadResponse.status);
                            const markReadData = await markReadResponse.json();
                            console.log('📡 Mark as read API Response data:', markReadData);

                            apiTests.markAsRead = {
                                status: markReadResponse.status,
                                success: markReadResponse.ok,
                                data: markReadData,
                                notificationId: notificationId
                            };
                        } catch (error) {
                            console.error('❌ Mark as read API test failed:', error);
                            apiTests.markAsRead = { error: error.message };
                        }
                    }
                }

                setDebugInfo({
                    token: token ? `${token.substring(0, 20)}...` : 'NOT FOUND',
                    backendUrl,
                    timestamp: new Date().toISOString()
                });

                setTestResults(apiTests);

            } catch (error) {
                console.error('❌ Debug failed:', error);
                setDebugInfo({
                    error: error.message,
                    token: null,
                    backendUrl: null
                });
            } finally {
                setLoading(false);
            }
        };

        debugNotifications();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Debugging notifications...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Frontend Notifications Debug</h1>

            {/* Authentication Info */}
            <div className="bg-gray-100 p-4 rounded-lg">
                <h2 className="font-semibold mb-2">Authentication</h2>
                <p className="text-sm">
                    <strong>Token:</strong> {debugInfo.token || 'NOT FOUND'}
                </p>
                <p className="text-sm">
                    <strong>Backend URL:</strong> {debugInfo.backendUrl || 'NOT SET'}
                </p>
                <p className="text-sm">
                    <strong>Timestamp:</strong> {debugInfo.timestamp || 'N/A'}
                </p>
            </div>

            {/* API Test Results */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">API Test Results</h2>

                {/* Notifications Endpoint */}
                <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium mb-2">GET /api/notifications</h3>
                    {testResults.notifications ? (
                        <div className="space-y-2">
                            <p className={`text-sm ${testResults.notifications.success ? 'text-green-600' : 'text-red-600'}`}>
                                Status: {testResults.notifications.status} {testResults.notifications.success ? '✅' : '❌'}
                            </p>
                            <p className="text-sm">
                                Notifications count: {testResults.notifications.count || 0}
                            </p>
                            {testResults.notifications.error && (
                                <p className="text-sm text-red-600">
                                    Error: {testResults.notifications.error}
                                </p>
                            )}
                            {testResults.notifications.data?.data?.notifications?.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm font-medium">Recent notifications:</p>
                                    <ul className="text-sm space-y-1 ml-4">
                                        {testResults.notifications.data.data.notifications.slice(0, 3).map((notif, index) => (
                                            <li key={index} className="text-gray-600">
                                                {index + 1}. {notif.message.substring(0, 50)}... (Read: {notif.isRead ? 'Yes' : 'No'})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Not tested</p>
                    )}
                </div>

                {/* Unread Count Endpoint */}
                <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium mb-2">GET /api/notifications/unread-count</h3>
                    {testResults.unreadCount ? (
                        <div className="space-y-2">
                            <p className={`text-sm ${testResults.unreadCount.success ? 'text-green-600' : 'text-red-600'}`}>
                                Status: {testResults.unreadCount.status} {testResults.unreadCount.success ? '✅' : '❌'}
                            </p>
                            <p className="text-sm">
                                Unread count: {testResults.unreadCount.count || 0}
                            </p>
                            {testResults.unreadCount.error && (
                                <p className="text-sm text-red-600">
                                    Error: {testResults.unreadCount.error}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Not tested</p>
                    )}
                </div>

                {/* Mark as Read Endpoint */}
                <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium mb-2">PATCH /api/notifications/{testResults.markAsRead?.notificationId || '{id}'}/read</h3>
                    {testResults.markAsRead ? (
                        <div className="space-y-2">
                            <p className={`text-sm ${testResults.markAsRead.success ? 'text-green-600' : 'text-red-600'}`}>
                                Status: {testResults.markAsRead.status} {testResults.markAsRead.success ? '✅' : '❌'}
                            </p>
                            <p className="text-sm">
                                Notification ID: {testResults.markAsRead.notificationId}
                            </p>
                            {testResults.markAsRead.error && (
                                <p className="text-sm text-red-600">
                                    Error: {testResults.markAsRead.error}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">
                            {testResults.notifications?.count > 0 ? 'Not tested' : 'No notifications to test with'}
                        </p>
                    )}
                </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Recommendations</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• If token is "NOT FOUND", you need to log in first</li>
                    <li>• If API tests fail, check if backend server is running</li>
                    <li>• If notifications count is 0, run the backend script to create test data</li>
                    <li>• Check browser console for additional error details</li>
                </ul>
            </div>
        </div>
    );
}
