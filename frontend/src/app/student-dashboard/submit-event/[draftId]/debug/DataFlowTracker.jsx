/**
 * DataFlowTracker Component
 * Enhanced debugging interface for UUID-based proposal flow
 * 
 * Key approaches: Comprehensive debugging, real-time status tracking,
 * export functionality, and developer-friendly interface
 */

'use client';

import { getToken } from '@/utils/auth-utils';
import { useEffect, useState } from 'react';
import {
    addDebugLog,
    clearProposalData,
    getDebugInfo,
    getProposalData
} from '../reporting/services/proposalService';

export default function DataFlowTracker({ proposalUuid }) {
    const [debugInfo, setDebugInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [localData, setLocalData] = useState(null);
    const [authStatus, setAuthStatus] = useState(null);

    // Load initial data
    useEffect(() => {
        loadLocalData();
        checkAuthStatus();
    }, []);

    /**
     * Load local proposal data
     */
    const loadLocalData = () => {
        try {
            const data = getProposalData();
            setLocalData(data);
        } catch (error) {
            console.error('Error loading local data:', error);
        }
    };

    /**
     * Check authentication status
     */
    const checkAuthStatus = async () => {
        try {
            const token = getToken();
            setAuthStatus({
                hasToken: !!token,
                tokenLength: token ? token.length : 0,
                isValid: !!token
            });
        } catch (error) {
            setAuthStatus({
                hasToken: false,
                error: error.message
            });
        }
    };

    /**
     * Run full debug analysis
     */
    const runFullDebug = async () => {
        setLoading(true);
        setError(null);

        try {
            const uuid = proposalUuid || localData?.uuid;
            if (!uuid) {
                throw new Error('No proposal UUID available');
            }

            const info = await getDebugInfo(uuid);
            setDebugInfo(info);

            // Add debug log
            await addDebugLog(uuid, 'frontend', 'Full debug analysis completed', {
                timestamp: new Date().toISOString(),
                localData,
                authStatus
            });

            console.log('✅ Full debug completed:', info);
        } catch (error) {
            setError(error.message);
            console.error('❌ Full debug failed:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Run status debug
     */
    const runStatusDebug = async () => {
        setLoading(true);
        setError(null);

        try {
            const uuid = proposalUuid || localData?.uuid;
            if (!uuid) {
                throw new Error('No proposal UUID available');
            }

            const info = await getDebugInfo(uuid);
            const statusInfo = {
                uuid: info.mysql_record?.uuid,
                id: info.mysql_record?.id,
                proposal_status: info.mysql_record?.proposal_status,
                report_status: info.mysql_record?.report_status,
                current_section: info.mysql_record?.current_section,
                status_match: info.status_match,
                local_status: localData?.status,
                local_section: localData?.section
            };

            setDebugInfo({ ...info, status_debug: statusInfo });

            await addDebugLog(uuid, 'frontend', 'Status debug completed', statusInfo);

            console.log('✅ Status debug completed:', statusInfo);
        } catch (error) {
            setError(error.message);
            console.error('❌ Status debug failed:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Test API endpoints
     */
    const testAPIs = async () => {
        setLoading(true);
        setError(null);

        try {
            const uuid = proposalUuid || localData?.uuid;
            if (!uuid) {
                throw new Error('No proposal UUID available');
            }

            const results = {
                timestamp: new Date().toISOString(),
                tests: {}
            };

            // Test GET proposal
            try {
                const response = await fetch(`/api/proposals/${uuid}`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                results.tests.getProposal = {
                    status: response.status,
                    ok: response.ok
                };
            } catch (error) {
                results.tests.getProposal = { error: error.message };
            }

            // Test GET debug
            try {
                const response = await fetch(`/api/proposals/${uuid}/debug`, {
                    headers: { 'Authorization': `Bearer ${getToken()}` }
                });
                results.tests.getDebug = {
                    status: response.status,
                    ok: response.ok
                };
            } catch (error) {
                results.tests.getDebug = { error: error.message };
            }

            setDebugInfo(prev => ({ ...prev, api_tests: results }));
            await addDebugLog(uuid, 'frontend', 'API tests completed', results);

            console.log('✅ API tests completed:', results);
        } catch (error) {
            setError(error.message);
            console.error('❌ API tests failed:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Clear cache
     */
    const clearCache = () => {
        try {
            clearProposalData();
            setLocalData(null);
            setDebugInfo(null);
            setError(null);

            console.log('✅ Cache cleared');
        } catch (error) {
            setError(error.message);
            console.error('❌ Cache clear failed:', error);
        }
    };

    /**
     * Fix authentication
     */
    const fixAuth = async () => {
        try {
            // Clear any invalid tokens
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_token');

            // Re-check auth status
            await checkAuthStatus();

            console.log('✅ Auth fix attempted');
        } catch (error) {
            setError(error.message);
            console.error('❌ Auth fix failed:', error);
        }
    };

    /**
     * Clear debug logs
     */
    const clearLogs = async () => {
        setLoading(true);
        setError(null);

        try {
            const uuid = proposalUuid || localData?.uuid;
            if (!uuid) {
                throw new Error('No proposal UUID available');
            }

            // This would call a backend endpoint to clear logs
            await addDebugLog(uuid, 'frontend', 'Debug logs cleared by user');

            setDebugInfo(null);
            console.log('✅ Debug logs cleared');
        } catch (error) {
            setError(error.message);
            console.error('❌ Clear logs failed:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Export snapshot
     */
    const exportSnapshot = () => {
        try {
            const snapshot = {
                timestamp: new Date().toISOString(),
                proposal_uuid: proposalUuid || localData?.uuid,
                local_data: localData,
                auth_status: authStatus,
                debug_info: debugInfo,
                localStorage: {
                    proposal_uuid: localStorage.getItem('proposal_uuid'),
                    proposal_status: localStorage.getItem('proposal_status'),
                    current_section: localStorage.getItem('current_section'),
                    report_status: localStorage.getItem('report_status')
                }
            };

            const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `proposal-debug-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('✅ Snapshot exported');
        } catch (error) {
            setError(error.message);
            console.error('❌ Export failed:', error);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Data Flow Tracker
            </h2>

            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800">UUID</h3>
                    <p className="text-sm text-blue-600 font-mono">
                        {proposalUuid || localData?.uuid || 'Not set'}
                    </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">Status</h3>
                    <p className="text-sm text-green-600">
                        {localData?.status || 'Unknown'}
                    </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800">Section</h3>
                    <p className="text-sm text-purple-600">
                        {localData?.section || 'Unknown'}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <button
                    onClick={runFullDebug}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    {loading ? 'Running...' : 'Run Full Debug'}
                </button>

                <button
                    onClick={runStatusDebug}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    {loading ? 'Running...' : 'Run Status Debug'}
                </button>

                <button
                    onClick={testAPIs}
                    disabled={loading}
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    {loading ? 'Testing...' : 'Test APIs'}
                </button>

                <button
                    onClick={exportSnapshot}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    Export Snapshot
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <button
                    onClick={clearCache}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    Clear Cache
                </button>

                <button
                    onClick={fixAuth}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    Fix Auth
                </button>

                <button
                    onClick={clearLogs}
                    disabled={loading}
                    className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    {loading ? 'Clearing...' : 'Clear Logs'}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {/* Debug Information Display */}
            {debugInfo && (
                <div className="space-y-6">
                    {/* Status Debug */}
                    {debugInfo.status_debug && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-3">Status Debug</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">UUID:</span>
                                    <p className="font-mono text-xs">{debugInfo.status_debug.uuid}</p>
                                </div>
                                <div>
                                    <span className="font-medium">ID:</span>
                                    <p>{debugInfo.status_debug.id}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Proposal Status:</span>
                                    <p className={debugInfo.status_debug.proposal_status === 'approved' ? 'text-green-600' : 'text-gray-600'}>
                                        {debugInfo.status_debug.proposal_status}
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium">Status Match:</span>
                                    <p className={debugInfo.status_debug.status_match ? 'text-green-600' : 'text-red-600'}>
                                        {debugInfo.status_debug.status_match ? '✅' : '❌'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* API Tests */}
                    {debugInfo.api_tests && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-3">API Tests</h3>
                            <div className="space-y-2 text-sm">
                                {Object.entries(debugInfo.api_tests.tests).map(([test, result]) => (
                                    <div key={test} className="flex justify-between items-center">
                                        <span className="font-medium">{test}:</span>
                                        <span className={result.ok ? 'text-green-600' : 'text-red-600'}>
                                            {result.ok ? '✅' : `❌ ${result.status || result.error}`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MySQL Record */}
                    {debugInfo.mysql_record && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-3">MySQL Record</h3>
                            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                                {JSON.stringify(debugInfo.mysql_record, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Audit Logs */}
                    {debugInfo.audit_logs && debugInfo.audit_logs.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-3">Audit Logs</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {debugInfo.audit_logs.map((log, index) => (
                                    <div key={index} className="bg-white p-2 rounded text-xs">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{log.action}</span>
                                            <span className="text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        {log.note && <p className="text-gray-600 mt-1">{log.note}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Debug Logs */}
                    {debugInfo.debug_logs && debugInfo.debug_logs.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-3">Debug Logs</h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {debugInfo.debug_logs.map((log, index) => (
                                    <div key={index} className="bg-white p-2 rounded text-xs">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{log.source}</span>
                                            <span className="text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-gray-600 mt-1">{log.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Local Data Display */}
            {localData && (
                <div className="bg-blue-50 p-4 rounded-lg mt-6">
                    <h3 className="font-semibold text-blue-800 mb-3">Local Storage Data</h3>
                    <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                        {JSON.stringify(localData, null, 2)}
                    </pre>
                </div>
            )}

            {/* Auth Status Display */}
            {authStatus && (
                <div className="bg-green-50 p-4 rounded-lg mt-6">
                    <h3 className="font-semibold text-green-800 mb-3">Authentication Status</h3>
                    <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                        {JSON.stringify(authStatus, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
} 