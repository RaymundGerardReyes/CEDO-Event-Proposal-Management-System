/**
 * Test Authentication Component
 * Purpose: Debug authentication issues in the browser
 * Key approaches: Token extraction, user verification, API testing
 */

"use client";

import { getAppConfig } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function TestAuth() {
    const [authInfo, setAuthInfo] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const debugAuth = async () => {
            try {
                console.log('🔍 Debugging Authentication in Browser...');

                // Get all possible tokens
                const tokens = {
                    localStorage_cedo_token: localStorage.getItem('cedo_token'),
                    localStorage_authToken: localStorage.getItem('authToken'),
                    localStorage_token: localStorage.getItem('token'),
                    sessionStorage_cedo_token: sessionStorage.getItem('cedo_token'),
                    sessionStorage_authToken: sessionStorage.getItem('authToken'),
                    sessionStorage_token: sessionStorage.getItem('token'),
                };

                // Get cookies
                const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
                    const [name, value] = cookie.split('=');
                    acc[name] = value;
                    return acc;
                }, {});

                console.log('🔐 Tokens found:', tokens);
                console.log('🍪 Cookies found:', cookies);

                // Get the main token (same logic as notifications page)
                const mainToken = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('cedo_token='))
                    ?.split('=')[1];

                console.log('🎯 Main token (cedo_token):', mainToken ? `${mainToken.substring(0, 20)}...` : 'NOT FOUND');

                // Test API call if token exists
                let apiResult = null;
                if (mainToken) {
                    try {
                        const backendUrl = getAppConfig().backendUrl;
                        console.log('🌐 Backend URL:', backendUrl);
                        console.log('📡 Making API call to notifications...');

                        const response = await fetch(`${backendUrl}/api/notifications?page=1&limit=50`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${mainToken}`,
                            },
                        });

                        console.log('📡 API Response status:', response.status);
                        const responseData = await response.json();
                        console.log('📡 API Response data:', responseData);

                        apiResult = {
                            status: response.status,
                            success: responseData.success,
                            notificationsCount: responseData.data?.notifications?.length || 0,
                            data: responseData
                        };
                    } catch (apiError) {
                        console.error('❌ API call failed:', apiError);
                        apiResult = {
                            error: apiError.message,
                            status: 'ERROR'
                        };
                    }
                }

                setAuthInfo({
                    tokens,
                    cookies,
                    mainToken: mainToken ? `${mainToken.substring(0, 20)}...` : null,
                    apiResult,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('❌ Auth debug failed:', error);
                setAuthInfo({
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            } finally {
                setLoading(false);
            }
        };

        debugAuth();
    }, []);

    if (loading) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Testing Authentication</h1>
                <p>Loading authentication information...</p>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>

            <div className="space-y-6">
                <div className="bg-blue-100 p-4 rounded">
                    <h2 className="font-semibold mb-2">Main Token (cedo_token):</h2>
                    <p className="font-mono text-sm">
                        {authInfo.mainToken || 'NOT FOUND'}
                    </p>
                </div>

                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-semibold mb-2">All Tokens:</h2>
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify(authInfo.tokens, null, 2)}
                    </pre>
                </div>

                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-semibold mb-2">All Cookies:</h2>
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify(authInfo.cookies, null, 2)}
                    </pre>
                </div>

                {authInfo.apiResult && (
                    <div className="bg-green-100 p-4 rounded">
                        <h2 className="font-semibold mb-2">API Test Result:</h2>
                        <pre className="text-xs overflow-auto">
                            {JSON.stringify(authInfo.apiResult, null, 2)}
                        </pre>
                    </div>
                )}

                {authInfo.error && (
                    <div className="bg-red-100 p-4 rounded">
                        <h2 className="font-semibold mb-2 text-red-800">Error:</h2>
                        <p className="text-red-700">{authInfo.error}</p>
                    </div>
                )}

                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-semibold mb-2">Debug Timestamp:</h2>
                    <p className="text-sm">{authInfo.timestamp}</p>
                </div>
            </div>
        </div>
    );
}
