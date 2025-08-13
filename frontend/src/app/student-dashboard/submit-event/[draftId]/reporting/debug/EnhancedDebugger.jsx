/**
 * Enhanced Reporting Page Debugger
 * Comprehensive debugging for proposal status flow with authentication fixes
 */

"use client";

import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function EnhancedDebugger({ draftId, proposalStatus, mysqlId, onStatusUpdate }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [debugLogs, setDebugLogs] = useState([]);
    const [isDebugging, setIsDebugging] = useState(false);
    const [tokenInfo, setTokenInfo] = useState(null);
    const [apiEndpoints, setApiEndpoints] = useState([]);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, message, type };
        setDebugLogs(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs
        console.log(`[${timestamp}] ${message}`);
    };

    // Analyze authentication token
    const analyzeToken = () => {
        addLog('=== TOKEN ANALYSIS ===', 'header');

        // Method 1: From cookies (primary)
        const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('cedo_token='))
            ?.split('=')[1];

        // Method 2: From localStorage
        const localToken = localStorage.getItem('cedo_token');

        // Method 3: From sessionStorage  
        const sessionToken = sessionStorage.getItem('cedo_token');

        // Method 4: Alternative token names
        const altTokens = [
            localStorage.getItem('authToken'),
            localStorage.getItem('token'),
            sessionStorage.getItem('authToken')
        ].filter(Boolean);

        addLog(`Cookie token: ${cookieToken ? 'Present' : 'Missing'} ${cookieToken ? `(length: ${cookieToken.length})` : ''}`);
        addLog(`LocalStorage token: ${localToken ? 'Present' : 'Missing'} ${localToken ? `(length: ${localToken.length})` : ''}`);
        addLog(`SessionStorage token: ${sessionToken ? 'Present' : 'Missing'}`);
        addLog(`Alternative tokens found: ${altTokens.length}`);

        // Analyze the primary token
        const primaryToken = cookieToken || localToken || sessionToken;
        if (primaryToken) {
            try {
                // Basic JWT structure check
                const parts = primaryToken.split('.');
                addLog(`Token parts: ${parts.length} (should be 3 for JWT)`);

                if (parts.length === 3) {
                    // Try to decode payload
                    const payload = JSON.parse(atob(parts[1]));
                    const now = Date.now() / 1000;

                    addLog(`Token payload decoded successfully`);
                    addLog(`User ID: ${payload.id || payload.user?.id || 'Missing'}`);
                    addLog(`User role: ${payload.role || payload.user?.role || 'Missing'}`);
                    addLog(`Token expires: ${payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'No expiry'}`);
                    addLog(`Token valid: ${!payload.exp || payload.exp > now ? 'Yes' : 'EXPIRED'}`);

                    setTokenInfo({
                        valid: true,
                        source: cookieToken ? 'cookie' : localToken ? 'localStorage' : 'sessionStorage',
                        userId: payload.id || payload.user?.id,
                        role: payload.role || payload.user?.role,
                        expired: payload.exp && payload.exp <= now
                    });
                } else {
                    addLog(`❌ Invalid JWT structure - ${parts.length} parts instead of 3`, 'error');
                    setTokenInfo({ valid: false, error: 'Invalid JWT structure' });
                }
            } catch (error) {
                addLog(`❌ Token decode error: ${error.message}`, 'error');
                setTokenInfo({ valid: false, error: error.message });
            }
        } else {
            addLog('❌ No authentication token found anywhere', 'error');
            setTokenInfo({ valid: false, error: 'No token found' });
        }
    };

    // Test multiple API endpoints
    const testAPIEndpoints = async () => {
        addLog('=== API ENDPOINTS TEST ===', 'header');

        const backendUrl = 'http://localhost:5000';
        const testId = mysqlId || draftId || '2';

        const endpoints = [
            {
                name: 'MySQL Reports (student-proposal)',
                url: `${backendUrl}/api/mongodb-unified/student-proposal/${testId}`,
                requiresAuth: false,
                description: 'Primary student endpoint - should work without auth'
            },
            {
                name: 'MySQL Reports (find-by-draftid)',
                url: `${backendUrl}/api/mongodb-unified/find-proposal-by-draftid/${testId}`,
                requiresAuth: true,
                description: 'Authenticated endpoint for draft ID lookup'
            },
            {
                name: 'User Proposals',
                url: `${backendUrl}/api/mongodb-unified/user-proposals`,
                requiresAuth: true,
                description: 'All proposals for current user'
            },
            {
                name: 'Health Check',
                url: `${backendUrl}/api/mongodb-unified/mysql-health`,
                requiresAuth: false,
                description: 'Basic health check'
            },
            {
                name: 'Legacy Proposals API',
                url: `${backendUrl}/api/proposals/${testId}`,
                requiresAuth: true,
                description: 'Old API endpoint (may not work for students)',
                studentAccess: false
            },
            {
                name: 'Admin Proposals (hybrid)',
                url: `${backendUrl}/api/mongodb-unified/admin/proposals-hybrid?limit=10`,
                requiresAuth: true,
                description: 'Admin-only endpoint (expected 401/403 for students)',
                studentAccess: false
            }
        ];

        const results = [];

        for (const endpoint of endpoints) {
            addLog(`Testing: ${endpoint.name} - ${endpoint.description}`);

            // Skip admin-only endpoints if user is student
            if (endpoint.studentAccess === false && user?.role === 'student') {
                addLog(`   ⏭️ Skipping admin endpoint (user is student)`, 'info');
                results.push({
                    ...endpoint,
                    status: 'skipped',
                    success: null,
                    data: 'Skipped - Admin only endpoint'
                });
                continue;
            }

            try {
                const headers = { 'Content-Type': 'application/json' };

                if (endpoint.requiresAuth && tokenInfo?.valid && !tokenInfo.expired) {
                    const token = document.cookie
                        .split('; ')
                        .find(row => row.startsWith('cedo_token='))
                        ?.split('=')[1] || localStorage.getItem('cedo_token');

                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }
                }

                const response = await fetch(endpoint.url, {
                    method: 'GET',
                    headers,
                    cache: 'no-cache'
                });

                const status = response.status;
                let data = null;

                try {
                    data = await response.json();
                } catch {
                    data = await response.text();
                }

                results.push({
                    ...endpoint,
                    status,
                    success: response.ok,
                    data
                });

                if (response.ok) {
                    addLog(`✅ ${endpoint.name}: ${status}`, 'success');
                    if (data?.proposal?.proposal_status || data?.proposals?.length) {
                        const proposalStatus = data.proposal?.proposal_status ||
                            data.proposals?.[0]?.proposal_status ||
                            data.proposals?.[0]?.status;
                        if (proposalStatus) {
                            addLog(`   Status found: ${proposalStatus}`, 'success');
                        }
                    }
                } else {
                    // Better error message handling
                    let errorMsg = 'Unknown error';
                    if (typeof data === 'string') {
                        errorMsg = data;
                    } else if (data?.message) {
                        errorMsg = data.message;
                    } else if (data?.error) {
                        errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
                    } else if (data && typeof data === 'object') {
                        errorMsg = JSON.stringify(data);
                    }

                    // Special handling for common errors
                    if (status === 401) {
                        errorMsg = 'Unauthorized - Token might be invalid or insufficient permissions';
                    } else if (status === 403) {
                        errorMsg = 'Forbidden - User role may not have access to this endpoint';
                    } else if (status === 404) {
                        errorMsg = 'Not found - Endpoint or resource does not exist';
                    }

                    addLog(`❌ ${endpoint.name}: ${status} - ${errorMsg}`, 'error');
                }

            } catch (error) {
                addLog(`💥 ${endpoint.name}: Network error - ${error.message}`, 'error');
                results.push({
                    ...endpoint,
                    status: 0,
                    success: false,
                    error: error.message
                });
            }
        }

        setApiEndpoints(results);
        return results;
    };

    // Fix authentication issues
    const fixAuthentication = async () => {
        addLog('=== AUTHENTICATION FIX ===', 'header');

        try {
            // Clear potentially corrupted tokens
            addLog('Clearing potentially corrupted tokens...');

            // Clear from all possible locations
            localStorage.removeItem('cedo_token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            sessionStorage.removeItem('cedo_token');
            sessionStorage.removeItem('authToken');

            // Clear cookies
            document.cookie = 'cedo_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

            addLog('Tokens cleared from all locations');

            // Try to get fresh token from auth context
            if (user) {
                addLog(`User context available: ${user.email} (${user.role})`);

                // Trigger a fresh authentication
                addLog('Requesting fresh authentication...');

                toast({
                    title: "Authentication Reset",
                    description: "Cleared corrupted tokens. Please refresh the page to sign in again.",
                    variant: "default"
                });

                // Redirect to sign-in after a delay
                setTimeout(() => {
                    window.location.href = '/auth/sign-in?redirect=' + encodeURIComponent(window.location.pathname);
                }, 2000);

            } else {
                addLog('No user context - redirecting to sign-in');
                window.location.href = '/auth/sign-in';
            }

        } catch (error) {
            addLog(`❌ Fix authentication error: ${error.message}`, 'error');
        }
    };

    // Clear stale data
    const clearStaleData = () => {
        addLog('=== CLEARING STALE DATA ===', 'header');

        const keysToRemove = [
            'current_proposal_status',
            'current_report_status',
            'current_mysql_proposal_id',
            'admin_comments',
            'submission_timestamp'
        ];

        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                addLog(`Removing localStorage: ${key} = ${localStorage.getItem(key)}`);
                localStorage.removeItem(key);
            }
        });

        // Clear sessionStorage too
        Object.keys(sessionStorage).forEach(key => {
            if (key.includes('proposal') || key.includes('status')) {
                addLog(`Removing sessionStorage: ${key}`);
                sessionStorage.removeItem(key);
            }
        });

        addLog('Stale data cleared');

        // Trigger a status update
        if (onStatusUpdate) {
            onStatusUpdate();
        }
    };

    // Comprehensive debug run
    const runComprehensiveDebug = async () => {
        setIsDebugging(true);
        setDebugLogs([]);

        addLog('🚀 STARTING COMPREHENSIVE DEBUG', 'header');
        addLog(`Draft ID: ${draftId || 'null'}`);
        addLog(`MySQL ID: ${mysqlId || 'null'}`);
        addLog(`Current Status: ${proposalStatus || 'null'}`);
        addLog(`User: ${user?.email || 'null'} (${user?.role || 'null'})`);

        // Step 1: Analyze token
        analyzeToken();

        // Step 2: Test API endpoints
        await testAPIEndpoints();

        // Step 3: Check localStorage
        addLog('=== LOCALSTORAGE ANALYSIS ===', 'header');
        Object.keys(localStorage).forEach(key => {
            if (key.includes('proposal') || key.includes('status') || key.includes('mysql')) {
                addLog(`${key}: ${localStorage.getItem(key)}`);
            }
        });

        // Generate summary
        addLog('=== DEBUG SUMMARY ===', 'header');
        const workingEndpoints = apiEndpoints.filter(e => e.success).length;
        const failedEndpoints = apiEndpoints.filter(e => e.success === false).length;
        const skippedEndpoints = apiEndpoints.filter(e => e.status === 'skipped').length;

        addLog(`Working endpoints: ${workingEndpoints}`, workingEndpoints > 0 ? 'success' : 'info');
        addLog(`Failed endpoints: ${failedEndpoints}`, failedEndpoints > 0 ? 'error' : 'info');
        addLog(`Skipped endpoints: ${skippedEndpoints}`, 'info');

        // Check if main endpoint is working
        const mainEndpoint = apiEndpoints.find(e => e.name.includes('student-proposal'));
        if (mainEndpoint?.success) {
            addLog('✅ Main student endpoint working - status display should be accurate', 'success');
        } else {
            addLog('❌ Main student endpoint failed - this is the primary issue', 'error');
        }

        addLog('🎉 DEBUG COMPLETE', 'header');
        setIsDebugging(false);
    };

    return (
        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">🔧 Enhanced Status Debugger</h3>

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
                <button
                    onClick={runComprehensiveDebug}
                    disabled={isDebugging}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {isDebugging ? 'Debugging...' : '🔍 Run Full Debug'}
                </button>

                <button
                    onClick={analyzeToken}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                    🔑 Check Token
                </button>

                <button
                    onClick={testAPIEndpoints}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                >
                    📡 Test APIs
                </button>

                <button
                    onClick={clearStaleData}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                >
                    🗑️ Clear Cache
                </button>

                <button
                    onClick={fixAuthentication}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    🔧 Fix Auth
                </button>

                <button
                    onClick={() => setDebugLogs([])}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                    🧹 Clear Logs
                </button>
            </div>

            {/* Token Status */}
            {tokenInfo && (
                <div className={`mb-4 p-3 rounded ${tokenInfo.valid ? 'bg-green-100' : 'bg-red-100'}`}>
                    <h4 className="font-semibold">🔑 Token Status</h4>
                    <p>Valid: {tokenInfo.valid ? '✅ Yes' : '❌ No'}</p>
                    {tokenInfo.valid && (
                        <>
                            <p>Source: {tokenInfo.source}</p>
                            <p>User ID: {tokenInfo.userId}</p>
                            <p>Role: {tokenInfo.role}</p>
                            <p>Expired: {tokenInfo.expired ? '❌ Yes' : '✅ No'}</p>
                        </>
                    )}
                    {tokenInfo.error && <p className="text-red-600">Error: {tokenInfo.error}</p>}
                </div>
            )}

            {/* API Endpoints Results */}
            {apiEndpoints.length > 0 && (
                <div className="mb-4">
                    <h4 className="font-semibold mb-2">📡 API Endpoints Status</h4>
                    <div className="space-y-2">
                        {apiEndpoints.map((endpoint, index) => (
                            <div key={index} className={`p-2 rounded text-sm ${endpoint.status === 'skipped' ? 'bg-gray-100' :
                                    endpoint.success ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                <div className="font-semibold">{endpoint.name}</div>
                                <div className="text-xs text-gray-600 mb-1">{endpoint.description}</div>
                                <div>
                                    Status: {endpoint.status}
                                    {endpoint.status === 'skipped' ? ' ⏭️' :
                                        endpoint.success ? ' ✅' : ' ❌'}
                                    {endpoint.data?.proposal?.proposal_status && (
                                        <span className="ml-2 font-semibold text-blue-600">
                                            Proposal Status: {endpoint.data.proposal.proposal_status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Debug Logs */}
            <div className="max-h-96 overflow-y-auto border rounded p-2 bg-white">
                <h4 className="font-semibold mb-2">📋 Debug Logs</h4>
                {debugLogs.length === 0 ? (
                    <p className="text-gray-500 italic">No logs yet. Click "Run Full Debug" to start.</p>
                ) : (
                    <div className="space-y-1 font-mono text-sm">
                        {debugLogs.map((log, index) => (
                            <div key={index} className={`${log.type === 'error' ? 'text-red-600' :
                                log.type === 'success' ? 'text-green-600' :
                                    log.type === 'header' ? 'text-blue-600 font-bold' : 'text-gray-700'
                                }`}>
                                <span className="text-gray-400">{log.timestamp}</span> {log.message}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
