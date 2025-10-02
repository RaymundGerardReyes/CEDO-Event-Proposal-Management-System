/**
 * Debug Notifications Page
 * Purpose: Debug the notifications page to identify authentication and API issues
 * Key approaches: Console logging, API debugging, authentication verification, responsive design
 */

"use client";

import { getAppConfig } from "@/lib/utils";
import { useEffect, useState } from "react";

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

export default function DebugNotificationsPage() {
    const [debugInfo, setDebugInfo] = useState({});
    const [loading, setLoading] = useState(true);
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

    useEffect(() => {
        const debugNotifications = async () => {
            try {
                console.log('🔍 Starting notifications debug...');

                // Get authentication token
                const token = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('cedo_token='))
                    ?.split('=')[1];

                console.log('🔐 Authentication token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');

                if (!token) {
                    setDebugInfo({
                        error: 'No authentication token found',
                        token: null,
                        apiResponse: null
                    });
                    setLoading(false);
                    return;
                }

                // Get backend URL
                const backendUrl = getAppConfig().backendUrl;
                console.log('🌐 Backend URL:', backendUrl);

                // Make API call
                console.log('📡 Making API call to notifications endpoint...');
                const response = await fetch(`${backendUrl}/api/notifications?page=1&limit=50`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                console.log('📡 API Response status:', response.status);
                console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()));

                const responseData = await response.json();
                console.log('📡 API Response data:', responseData);

                setDebugInfo({
                    token: token.substring(0, 20) + '...',
                    backendUrl,
                    apiStatus: response.status,
                    apiResponse: responseData,
                    notificationsCount: responseData.data?.notifications?.length || 0
                });

            } catch (error) {
                console.error('❌ Debug failed:', error);
                setDebugInfo({
                    error: error.message,
                    token: null,
                    apiResponse: null
                });
            } finally {
                setLoading(false);
            }
        };

        debugNotifications();
    }, []);

    if (loading) {
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
                <div className="flex flex-col items-center justify-center py-12">
                    <div
                        className="animate-spin rounded-full border-b-2 border-blue-600"
                        style={{
                            width: `clamp(2rem, 4vw, 3rem)`,
                            height: `clamp(2rem, 4vw, 3rem)`
                        }}
                    ></div>
                    <h1
                        className="font-bold text-gray-900 transition-all duration-300"
                        style={{
                            fontSize: `clamp(1.5rem, 3vw, 2rem)`,
                            marginTop: `clamp(0.75rem, 2vw, 1rem)`
                        }}
                    >
                        Debug Notifications
                    </h1>
                    <p
                        className="text-gray-600 transition-all duration-300"
                        style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                    >
                        Loading debug information...
                    </p>
                </div>
            </div>
        );
    }

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
                <h1
                    className="font-bold text-gray-900 transition-all duration-300"
                    style={{
                        fontSize: `clamp(1.5rem, 3vw, 2rem)`,
                        marginBottom: `clamp(1rem, 2vw, 1.5rem)`
                    }}
                >
                    Debug Notifications
                </h1>

                <div
                    className="space-y-4"
                    style={{ gap: `clamp(0.75rem, 2vw, 1rem)` }}
                >
                    <div
                        className="bg-gray-100 p-4 rounded-lg transition-all duration-300"
                        style={{
                            padding: `clamp(0.75rem, 2vw, 1rem)`,
                            borderRadius: viewportWidth < RESPONSIVE_BREAKPOINTS.md ? '0.75rem' : '1rem'
                        }}
                    >
                        <h2
                            className="font-semibold mb-2 transition-all duration-300"
                            style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                        >
                            Authentication Token:
                        </h2>
                        <p
                            className="font-mono text-sm transition-all duration-300"
                            style={{ fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)` }}
                        >
                            {debugInfo.token || 'NOT FOUND'}
                        </p>
                    </div>

                    <div
                        className="bg-gray-100 p-4 rounded-lg transition-all duration-300"
                        style={{
                            padding: `clamp(0.75rem, 2vw, 1rem)`,
                            borderRadius: viewportWidth < RESPONSIVE_BREAKPOINTS.md ? '0.75rem' : '1rem'
                        }}
                    >
                        <h2
                            className="font-semibold mb-2 transition-all duration-300"
                            style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                        >
                            Backend URL:
                        </h2>
                        <p
                            className="font-mono text-sm transition-all duration-300"
                            style={{ fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)` }}
                        >
                            {debugInfo.backendUrl || 'NOT SET'}
                        </p>
                    </div>

                    <div
                        className="bg-gray-100 p-4 rounded-lg transition-all duration-300"
                        style={{
                            padding: `clamp(0.75rem, 2vw, 1rem)`,
                            borderRadius: viewportWidth < RESPONSIVE_BREAKPOINTS.md ? '0.75rem' : '1rem'
                        }}
                    >
                        <h2
                            className="font-semibold mb-2 transition-all duration-300"
                            style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                        >
                            API Status:
                        </h2>
                        <p
                            className="font-mono text-sm transition-all duration-300"
                            style={{ fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)` }}
                        >
                            {debugInfo.apiStatus || 'NO RESPONSE'}
                        </p>
                    </div>

                    <div
                        className="bg-gray-100 p-4 rounded-lg transition-all duration-300"
                        style={{
                            padding: `clamp(0.75rem, 2vw, 1rem)`,
                            borderRadius: viewportWidth < RESPONSIVE_BREAKPOINTS.md ? '0.75rem' : '1rem'
                        }}
                    >
                        <h2
                            className="font-semibold mb-2 transition-all duration-300"
                            style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                        >
                            Notifications Count:
                        </h2>
                        <p
                            className="font-mono text-sm transition-all duration-300"
                            style={{ fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)` }}
                        >
                            {debugInfo.notificationsCount || 0}
                        </p>
                    </div>

                    {debugInfo.error && (
                        <div
                            className="bg-red-100 p-4 rounded-lg transition-all duration-300"
                            style={{
                                padding: `clamp(0.75rem, 2vw, 1rem)`,
                                borderRadius: viewportWidth < RESPONSIVE_BREAKPOINTS.md ? '0.75rem' : '1rem'
                            }}
                        >
                            <h2
                                className="font-semibold mb-2 text-red-800 transition-all duration-300"
                                style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                            >
                                Error:
                            </h2>
                            <p
                                className="text-red-700 transition-all duration-300"
                                style={{ fontSize: `clamp(0.75rem, 1.3vw, 0.875rem)` }}
                            >
                                {debugInfo.error}
                            </p>
                        </div>
                    )}

                    <div
                        className="bg-gray-100 p-4 rounded-lg transition-all duration-300"
                        style={{
                            padding: `clamp(0.75rem, 2vw, 1rem)`,
                            borderRadius: viewportWidth < RESPONSIVE_BREAKPOINTS.md ? '0.75rem' : '1rem'
                        }}
                    >
                        <h2
                            className="font-semibold mb-2 transition-all duration-300"
                            style={{ fontSize: `clamp(0.875rem, 1.5vw, 1rem)` }}
                        >
                            Full API Response:
                        </h2>
                        <pre
                            className="text-xs overflow-auto transition-all duration-300"
                            style={{
                                fontSize: `clamp(0.625rem, 1.2vw, 0.75rem)`,
                                maxHeight: '400px'
                            }}
                        >
                            {JSON.stringify(debugInfo.apiResponse, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
