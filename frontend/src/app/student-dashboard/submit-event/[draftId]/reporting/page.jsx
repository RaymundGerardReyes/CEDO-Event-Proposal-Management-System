/**
 * Comprehensive Reporting Page Component
 * Purpose: Enable students to submit final accomplishment reports after approved events
 * Approach: Status-based access control, robust form handling, and comprehensive validation
 */

"use client";

import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { StatusDebugger } from '../components/StatusDebugger';
import { AccomplishmentReportForm } from './components/AccomplishmentReportForm';
import { AdminFeedbackDisplay } from './components/AdminFeedbackDisplay';
import { EventAmendmentForm } from './components/EventAmendmentForm';
import { ProposalStatusDisplay } from './components/ProposalStatusDisplay';
import { StatusVerificationPanel } from './components/StatusVerificationPanel';
import { EnhancedDebugger } from './debug/EnhancedDebugger';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Main reporting page with comprehensive status-based access control
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export default function ReportingPage() {
    // Use useSearchParams hook to properly access search parameters
    const searchParams = useSearchParams();
    const draftId = searchParams.get('draftId');
    const { user } = useAuth();
    const { toast } = useToast();

    // State to track proposal and report status
    const [proposalStatus, setProposalStatus] = useState('draft');
    const [reportStatus, setReportStatus] = useState('draft');
    const [mysqlId, setMysqlId] = useState(null);
    const [adminComments, setAdminComments] = useState('');
    const [submissionTimestamp, setSubmissionTimestamp] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Read from localStorage and fetch status on component mount
    useEffect(() => {
        const loadReportingData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Load from localStorage first for immediate access
                if (typeof window !== 'undefined') {
                    const storedStatus = localStorage.getItem('current_proposal_status');
                    const storedReportStatus = localStorage.getItem('current_report_status');
                    const storedMysqlId = localStorage.getItem('current_mysql_proposal_id');
                    const storedComments = localStorage.getItem('admin_comments');
                    const storedTimestamp = localStorage.getItem('submission_timestamp');

                    // ✅ FIX: Check if stored proposal is denied and needs to be updated
                    if (storedStatus === 'denied' && storedMysqlId) {
                        console.log('⚠️ Found denied proposal in localStorage (ID: ' + storedMysqlId + '), will fetch latest proposal');
                        // Don't load the denied proposal data, let fetchLatestStatus get the latest
                    } else {
                        if (storedStatus) {
                            setProposalStatus(storedStatus);
                            console.log('📋 ReportingPage: Read proposal status from localStorage:', storedStatus);
                        }

                        if (storedReportStatus) {
                            setReportStatus(storedReportStatus);
                            console.log('📋 ReportingPage: Read report status from localStorage:', storedReportStatus);
                        }

                        if (storedMysqlId) {
                            // ✅ FIX: Check for invalid IDs before setting state
                            if (parseInt(storedMysqlId) > 100000) {
                                console.log('🚨 Invalid MySQL ID detected in localStorage, clearing:', storedMysqlId);
                                localStorage.removeItem('current_mysql_proposal_id');
                                localStorage.removeItem('current_proposal_status');
                                // Don't set the invalid ID in state
                            } else {
                                setMysqlId(storedMysqlId);
                                console.log('📋 ReportingPage: Read MySQL ID from localStorage:', storedMysqlId);
                            }
                        }
                    }

                    if (storedComments) {
                        setAdminComments(storedComments);
                        console.log('📋 ReportingPage: Read admin comments from localStorage:', storedComments);
                    }

                    if (storedTimestamp) {
                        setSubmissionTimestamp(storedTimestamp);
                        console.log('📋 ReportingPage: Read submission timestamp from localStorage:', storedTimestamp);
                    }
                }

                // Fetch latest status from backend
                if (draftId) {
                    await fetchLatestStatus();
                }

            } catch (err) {
                // ✅ FIX: Improved error logging with detailed information
                const errorDetails = {
                    message: err?.message || 'Unknown error',
                    name: err?.name || 'Error',
                    stack: err?.stack || 'No stack trace',
                    type: typeof err,
                    stringified: err?.toString() || 'Cannot convert to string',
                    draftId: draftId,
                    context: 'loadReportingData'
                };

                console.error('❌ Error loading reporting data:', errorDetails);
                console.error('❌ Raw error object:', err);
                setError(err?.message || 'Failed to load reporting data');
            } finally {
                setIsLoading(false);
            }
        };

        loadReportingData();
    }, [draftId]);

    // ✅ Enhanced function to fetch latest status with automatic ID validation
    const fetchLatestStatus = async (retryCount = 0) => {
        const maxRetries = 3;
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

        // ✅ ENHANCED FIX: Clear invalid proposal IDs from both localStorage and state
        const storedId = localStorage.getItem('current_mysql_proposal_id');
        const currentId = mysqlId || storedId;

        if (currentId && parseInt(currentId) > 100000) {
            console.log('🚨 Invalid proposal ID detected, clearing:', currentId);
            localStorage.removeItem('current_mysql_proposal_id');
            localStorage.removeItem('current_proposal_status');

            // Also clear the state if it has invalid ID
            if (mysqlId && parseInt(mysqlId) > 100000) {
                setMysqlId(null);
                setProposalStatus('draft');
            }

            toast({
                title: "Invalid Data Cleared",
                description: "Cleared invalid proposal ID. Please refresh the page.",
                variant: "default"
            });
            return;
        }

        try {
            console.log('🔍 Fetching proposal status for:', { draftId, mysqlId, attempt: retryCount + 1 });

            // ✅ FIX: If we have a specific ID that's failing, try to get user's latest proposal instead
            if (retryCount === 0 && (mysqlId || draftId)) {
                const mysqlIdToUse = mysqlId || draftId;
                console.log('🔄 Attempting direct proposal fetch for ID:', mysqlIdToUse);

                const directResult = await tryDirectProposalFetch(mysqlIdToUse, backendUrl);
                if (directResult.success) {
                    await processProposalData(directResult.data);
                    return;
                }

                console.log('⚠️ Direct fetch failed, trying user proposals endpoint...');
            }

            // ✅ Fallback: Get user's latest proposals and pick the most recent
            await fetchUserLatestProposal(backendUrl);

        } catch (err) {
            console.error('❌ Error in fetchLatestStatus:', {
                message: err.message,
                retryCount,
                mysqlId,
                draftId
            });

            if (retryCount < maxRetries) {
                console.log(`🔄 Retrying... (${retryCount + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return fetchLatestStatus(retryCount + 1);
            }

            throw err;
        }
    };

    // ✅ Helper: Try direct proposal fetch
    const tryDirectProposalFetch = async (proposalId, backendUrl) => {
        try {
            const response = await fetch(`${backendUrl}/api/mongodb-unified/student-proposal/${proposalId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                cache: 'no-cache'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.proposal) {
                    console.log('✅ Direct proposal fetch successful');
                    return { success: true, data: data.proposal };
                }
            }

            console.log(`⚠️ Direct fetch failed: ${response.status}`);
            return { success: false };
        } catch (error) {
            console.log('⚠️ Direct fetch error:', error.message);
            return { success: false };
        }
    };

    // ✅ Helper: Get user's latest proposal
    const fetchUserLatestProposal = async (backendUrl) => {
        // Get token for authenticated request
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('cedo_token='))
            ?.split('=')[1];

        if (!token) {
            throw new Error('No authentication token available');
        }

        const response = await fetch(`${backendUrl}/api/mongodb-unified/user-proposals`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-cache'
        });

        if (!response.ok) {
            throw new Error(`User proposals fetch failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.proposals || data.proposals.length === 0) {
            throw new Error('No proposals found for user');
        }

        // Find the latest pending or approved proposal
        const latestProposal = data.proposals
            .filter(p => p.proposal_status === 'pending' || p.proposal_status === 'approved')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

        if (!latestProposal) {
            throw new Error('No active proposals found');
        }

        console.log('✅ Found latest proposal:', {
            id: latestProposal.id,
            status: latestProposal.proposal_status,
            event: latestProposal.event_name
        });

        // ✅ Update localStorage with correct ID (with safety check)
        if (latestProposal.id) {
            localStorage.setItem('current_mysql_proposal_id', latestProposal.id.toString());
            console.log('✅ Updated localStorage with valid proposal ID:', latestProposal.id);
        } else {
            console.warn('⚠️ Latest proposal has no ID, cannot update localStorage');
        }

        if (latestProposal.proposal_status) {
            localStorage.setItem('current_proposal_status', latestProposal.proposal_status);
        }

        await processProposalData(latestProposal);
    };

    // ✅ Helper function to process proposal data consistently
    const processProposalData = (proposal) => {
        console.log('📋 Processing proposal data:', proposal);

        // Update state with latest data - handle different field names
        const newProposalStatus = proposal.proposal_status || proposal.status || 'draft';
        const newReportStatus = proposal.report_status || 'draft';
        const newMysqlId = proposal.id || proposal.mysql_id;
        const newAdminComments = proposal.admin_comments || proposal.adminComments || '';
        const newSubmissionTimestamp = proposal.submitted_at || proposal.created_at || proposal.submittedAt;

        setProposalStatus(newProposalStatus);
        setReportStatus(newReportStatus);
        setMysqlId(newMysqlId);
        setAdminComments(newAdminComments);
        setSubmissionTimestamp(newSubmissionTimestamp);

        // Update localStorage with latest data
        if (typeof window !== 'undefined') {
            localStorage.setItem('current_proposal_status', newProposalStatus);
            localStorage.setItem('current_report_status', newReportStatus);
            localStorage.setItem('current_mysql_proposal_id', newMysqlId);
            localStorage.setItem('admin_comments', newAdminComments);
            localStorage.setItem('submission_timestamp', newSubmissionTimestamp);
        }

        console.log('✅ Updated proposal status:', {
            proposalStatus: newProposalStatus,
            reportStatus: newReportStatus,
            mysqlId: newMysqlId,
            adminComments: newAdminComments ? 'Present' : 'None'
        });

        // Update last updated timestamp
        setLastUpdated(new Date().toISOString());

        return {
            proposalStatus: newProposalStatus,
            reportStatus: newReportStatus,
            mysqlId: newMysqlId,
            adminComments: newAdminComments,
            submissionTimestamp: newSubmissionTimestamp
        };
    };

    // ✅ Clear cached data function
    const clearCachedData = () => {
        if (typeof window !== 'undefined') {
            console.log('🗑️ Clearing cached proposal data...');
            localStorage.removeItem('current_proposal_status');
            localStorage.removeItem('current_report_status');
            localStorage.removeItem('current_mysql_proposal_id');
            localStorage.removeItem('admin_comments');
            localStorage.removeItem('submission_timestamp');

            // Reset state to defaults
            setProposalStatus('draft');
            setReportStatus('draft');
            setAdminComments('');
            setSubmissionTimestamp(null);
            setLastUpdated(null);
        }
    };

    // ✅ Manual refresh function for user-triggered updates
    const handleRefresh = async () => {
        console.log('🔄 Manual refresh started...');
        setIsRefreshing(true);

        try {
            // Clear cached data first
            console.log('🗑️ Clearing cached data...');
            try {
                clearCachedData();
                console.log('✅ Cached data cleared successfully');
            } catch (clearError) {
                console.error('❌ Error clearing cached data:', clearError);
                throw new Error(`Failed to clear cached data: ${clearError.message}`);
            }

            // Force fresh fetch
            console.log('📡 Fetching latest status...');

            // ✅ Safety check: Ensure fetchLatestStatus function exists
            if (typeof fetchLatestStatus !== 'function') {
                throw new Error('fetchLatestStatus function is not available');
            }

            try {
                await fetchLatestStatus();
                console.log('✅ Latest status fetched successfully');
            } catch (fetchError) {
                // ✅ FIX: Improved error logging with detailed information
                const fetchErrorDetails = {
                    message: fetchError?.message || 'Unknown fetch error',
                    name: fetchError?.name || 'Error',
                    stack: fetchError?.stack || 'No stack trace',
                    type: typeof fetchError,
                    stringified: fetchError?.toString() || 'Cannot convert to string',
                    context: 'handleRefresh -> fetchLatestStatus'
                };

                console.error('❌ Error fetching latest status:', fetchErrorDetails);
                console.error('❌ Raw fetch error object:', fetchError);
                throw new Error(`Failed to fetch latest status: ${fetchError?.message || 'Unknown error'}`);
            }

            console.log('✅ Manual refresh completed successfully');
            toast({
                title: "Status Updated",
                description: "Proposal status has been refreshed from the database.",
                variant: "default"
            });
        } catch (err) {
            // ✅ FIX: Comprehensive error logging and handling
            console.log('❌ Manual refresh error caught, analyzing...');

            const errorDetails = {
                message: err?.message || 'Unknown error',
                name: err?.name || 'Error',
                stack: err?.stack || 'No stack trace',
                type: typeof err,
                stringified: err?.toString() || 'Cannot convert to string',
                isNetworkError: err?.name === 'TypeError' && err?.message?.includes('fetch'),
                isAbortError: err?.name === 'AbortError',
                hasResponse: !!err?.response,
                responseStatus: err?.response?.status || 'N/A'
            };

            console.error('❌ Manual refresh failed - Error Details:', errorDetails);
            console.error('❌ Raw error object:', err);

            // User-friendly error message
            let userMessage = errorDetails.message;
            if (errorDetails.isNetworkError) {
                userMessage = 'Network connection error. Please check your internet connection.';
            } else if (errorDetails.isAbortError) {
                userMessage = 'Request was cancelled or timed out. Please try again.';
            } else if (errorDetails.responseStatus === 401) {
                userMessage = 'Authentication error. Please sign in again.';
            } else if (errorDetails.responseStatus === 404) {
                userMessage = 'Proposal not found. It may have been deleted.';
            }

            toast({
                title: "Refresh Failed",
                description: userMessage,
                variant: "destructive"
            });
        } finally {
            console.log('🔄 Manual refresh cleanup - setting isRefreshing to false');
            setIsRefreshing(false);
        }
    };

    // ✅ Auto-refresh every 30 seconds to keep status current
    useEffect(() => {
        if (!draftId || isLoading) return;

        const interval = setInterval(async () => {
            try {
                console.log('🔄 Auto-refreshing proposal status...');
                await fetchLatestStatus();
            } catch (err) {
                console.warn('⚠️ Auto-refresh failed:', err.message);
                // Don't show error toast for auto-refresh failures
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [draftId, isLoading]);

    // ✅ Test backend connection function for debugging
    const testBackendConnection = async () => {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('cedo_token='))
                ?.split('=')[1];

            console.log('🧪 Testing backend connection...');
            console.log('📡 Backend URL:', backendUrl);
            console.log('🔑 Token exists:', !!token);
            console.log('📋 Proposal ID:', mysqlId || draftId);

            // Test MySQL-only connectivity
            const healthResponse = await fetch(`${backendUrl}/api/mongodb-unified/mysql-health`);
            console.log('❤️ MySQL Health check:', healthResponse.status, healthResponse.statusText);

            // Test MySQL-only reports endpoint
            const testResponse = await fetch(`${backendUrl}/api/mongodb-unified/mysql-test`);
            console.log('🧪 MySQL Test endpoint:', testResponse.status, testResponse.statusText);

            if (testResponse.ok) {
                const testData = await testResponse.json();
                console.log('🧪 MySQL Test response:', testData);
            }

            // Test proposal endpoints if we have an ID
            const proposalId = mysqlId || draftId;
            if (proposalId) {
                // Test appropriate endpoint based on ID type
                if (proposalId.match(/^[0-9a-fA-F]{24}$/)) {
                    // Test draftId lookup endpoint for MongoDB ObjectIds
                    const draftIdResponse = await fetch(`${backendUrl}/api/mongodb-unified/find-proposal-by-draftid/${proposalId}`, {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                    console.log('📋 DraftId Lookup endpoint:', draftIdResponse.status, draftIdResponse.statusText);

                    if (draftIdResponse.ok) {
                        const draftIdData = await draftIdResponse.json();
                        console.log('📋 DraftId Lookup data:', draftIdData);
                    } else {
                        const errorText = await draftIdResponse.text();
                        console.log('📋 DraftId Lookup error:', errorText);
                    }
                } else {
                    // Test direct student proposal endpoint for MySQL IDs/UUIDs
                    const studentProposalResponse = await fetch(`${backendUrl}/api/mongodb-unified/student-proposal/${proposalId}`, {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                    });
                    console.log('📋 MySQL Student Proposal endpoint:', studentProposalResponse.status, studentProposalResponse.statusText);

                    if (studentProposalResponse.ok) {
                        const studentProposalData = await studentProposalResponse.json();
                        console.log('📋 MySQL Student Proposal data:', studentProposalData);
                    } else {
                        const errorText = await studentProposalResponse.text();
                        console.log('📋 MySQL Student Proposal error:', errorText);
                    }
                }

                // Test MySQL-only user proposals endpoint if we have a token
                if (token) {
                    const userProposalsResponse = await fetch(`${backendUrl}/api/mongodb-unified/user-proposals`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    console.log('📋 MySQL User Proposals endpoint:', userProposalsResponse.status, userProposalsResponse.statusText);

                    if (userProposalsResponse.ok) {
                        const userProposalsData = await userProposalsResponse.json();
                        console.log('📋 MySQL User Proposals data:', userProposalsData);
                    } else {
                        const errorText = await userProposalsResponse.text();
                        console.log('📋 MySQL User Proposals error:', errorText);
                    }
                }
            }

            toast({
                title: "Connection Test Complete",
                description: "Check browser console for detailed results",
                variant: "default"
            });
        } catch (error) {
            console.error('❌ Backend connection test failed:', error);
            toast({
                title: "Connection Test Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    // Check if reporting is accessible
    const isReportingAccessible = proposalStatus === 'approved';
    const isReportInRevision = reportStatus === 'revision';
    const isReportApproved = reportStatus === 'approved';

    // Get status display information
    const getStatusDisplayInfo = (status) => {
        switch (status) {
            case 'approved':
                return {
                    title: 'Proposal Approved',
                    message: 'Your proposal has been approved. You can now submit your accomplishment report.',
                    color: 'green',
                    icon: 'check-circle'
                };
            case 'denied':
                return {
                    title: 'Proposal Denied',
                    message: 'Your proposal has been denied. Please review the feedback and consider submitting a new proposal.',
                    color: 'red',
                    icon: 'x-circle'
                };
            case 'pending':
                return {
                    title: 'Proposal Pending',
                    message: 'Your proposal is currently under review. Please wait for administrator approval.',
                    color: 'yellow',
                    icon: 'clock'
                };
            case 'revision_requested':
                return {
                    title: 'Revision Requested',
                    message: 'Your proposal requires revisions. Please review the feedback and submit an updated proposal.',
                    color: 'orange',
                    icon: 'exclamation-triangle'
                };
            case 'draft':
                return {
                    title: 'Draft Proposal',
                    message: 'Your proposal is still in draft status. Please complete and submit your proposal.',
                    color: 'gray',
                    icon: 'document'
                };
            default:
                return {
                    title: 'Unknown Status',
                    message: 'The status of your proposal is unclear. Please contact support.',
                    color: 'gray',
                    icon: 'question-mark-circle'
                };
        }
    };

    const statusInfo = getStatusDisplayInfo(proposalStatus);

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-8"></div>
                            <div className="h-32 bg-gray-200 rounded w-full mb-6"></div>
                            <div className="h-32 bg-gray-200 rounded w-full mb-6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Reporting</h2>
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Debug Tracker - Only show in development */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mb-6">
                            <DataFlowTracker
                                draftId={draftId}
                                proposalStatus={proposalStatus}
                                reportStatus={reportStatus}
                                mysqlId={mysqlId}
                            />
                        </div>
                    )}

                    {/* Status Verification Panel - Always visible */}
                    <StatusVerificationPanel
                        proposalStatus={proposalStatus}
                        mysqlId={mysqlId}
                        userRole={user?.role}
                    />

                    {/* Enhanced Debug Components - Only show in development */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mb-6 space-y-4">
                            <EnhancedDebugger
                                draftId={draftId}
                                proposalStatus={proposalStatus}
                                mysqlId={mysqlId}
                                onStatusUpdate={handleRefresh}
                            />
                            <StatusDebugger
                                draftId={draftId}
                                proposalStatus={proposalStatus}
                                reportStatus={reportStatus}
                                mysqlId={mysqlId}
                            />
                            <DataFlowTracker />
                        </div>
                    )}

                    {/* Status Header with Refresh Button */}
                    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Proposal Reporting</h1>
                                <p className="text-gray-600 mt-1">
                                    Current Status: <span className={`font-semibold ${proposalStatus === 'approved' ? 'text-green-600' :
                                        proposalStatus === 'pending' ? 'text-yellow-600' :
                                            proposalStatus === 'denied' ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                        {proposalStatus.charAt(0).toUpperCase() + proposalStatus.slice(1).replace('_', ' ')}
                                    </span>
                                </p>
                                {lastUpdated && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Last updated: {new Date(lastUpdated).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    data-testid="refresh-button"
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg
                                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
                                </button>
                                {process.env.NODE_ENV === 'development' && (
                                    <>
                                        <button
                                            onClick={testBackendConnection}
                                            className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                                            title="Test API Connection (Development Only)"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Test API
                                        </button>
                                        <button
                                            onClick={clearCachedData}
                                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                                            title="Clear Cached Data (Development Only)"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Clear Cache
                                        </button>
                                    </>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    Auto-refresh: 30s
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Proposal Status Display */}
                        <ProposalStatusDisplay
                            proposalStatus={proposalStatus}
                            reportStatus={reportStatus}
                            mysqlId={mysqlId}
                            submissionTimestamp={submissionTimestamp}
                        />

                        {/* Admin Feedback Display (only if in revision) */}
                        {isReportInRevision && adminComments && (
                            <AdminFeedbackDisplay
                                comments={adminComments}
                                reportStatus={reportStatus}
                            />
                        )}

                        {/* Conditional Content Based on Status */}
                        {!isReportingAccessible ? (
                            // Locked State - Proposal not approved
                            <div className={`bg-${statusInfo.color}-50 border border-${statusInfo.color}-200 rounded-lg p-6`}>
                                <div className="flex items-center mb-4">
                                    <svg className={`w-6 h-6 text-${statusInfo.color}-600 mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {statusInfo.icon === 'check-circle' && (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        )}
                                        {statusInfo.icon === 'x-circle' && (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        )}
                                        {statusInfo.icon === 'clock' && (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        )}
                                        {statusInfo.icon === 'exclamation-triangle' && (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        )}
                                        {statusInfo.icon === 'document' && (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        )}
                                        {statusInfo.icon === 'question-mark-circle' && (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        )}
                                    </svg>
                                    <h2 className={`text-lg font-semibold text-${statusInfo.color}-800`}>{statusInfo.title}</h2>
                                </div>
                                <p className={`text-${statusInfo.color}-700 mb-4`}>
                                    {statusInfo.message}
                                </p>
                                <div className={`bg-white rounded-lg p-4 border border-${statusInfo.color}-200`}>
                                    <p className={`text-sm text-${statusInfo.color}-600`}>
                                        <strong>Current Status:</strong> {proposalStatus.charAt(0).toUpperCase() + proposalStatus.slice(1).replace('_', ' ')}
                                    </p>
                                    {adminComments && (
                                        <div className="mt-2">
                                            <p className={`text-sm text-${statusInfo.color}-600`}>
                                                <strong>Admin Comments:</strong>
                                            </p>
                                            <p className={`text-sm text-${statusInfo.color}-600 mt-1 bg-gray-50 p-2 rounded`}>
                                                {adminComments}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Reporting Form - Proposal approved
                            <Suspense fallback={<div>Loading reporting form...</div>}>
                                <div className="space-y-6">
                                    {/* Accomplishment Report Form */}
                                    <AccomplishmentReportForm
                                        draftId={draftId}
                                        mysqlId={mysqlId}
                                        reportStatus={reportStatus}
                                        isReportInRevision={isReportInRevision}
                                        isReportApproved={isReportApproved}
                                        adminComments={adminComments}
                                        onStatusUpdate={(newStatus) => setReportStatus(newStatus)}
                                    />

                                    {/* Event Amendment Form (conditional) */}
                                    <EventAmendmentForm
                                        draftId={draftId}
                                        mysqlId={mysqlId}
                                        reportStatus={reportStatus}
                                        isReportInRevision={isReportInRevision}
                                        isReportApproved={isReportApproved}
                                    />
                                </div>
                            </Suspense>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}