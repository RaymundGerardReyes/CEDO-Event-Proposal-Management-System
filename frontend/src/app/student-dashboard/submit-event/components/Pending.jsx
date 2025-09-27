/**
 * Proposal Pending Review Component
 * Shows the status of submitted proposals while waiting for approval
 * 
 * 🎯 Purpose:
 * - Display proposal submission status
 * - Show approval progress and timeline
 * - Provide access to Reports.jsx once approved
 * - Allow users to track their proposal status
 * 
 * 🖥️ User Experience Goals:
 * - Clear status communication
 * - Professional waiting experience
 * - Easy access to next steps when approved
 * - Visual feedback on review progress
 */

"use client";

import BackButton from '@/components/BackButton';
import { getProposalStatus } from '@/services/proposal-service.js';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    FileText,
    Mail,
    Phone,
    RefreshCw,
    Send,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEventForm } from '../contexts/EventFormContext';

export default function Pending({ methods, onNext, onPrevious, isLastStep, onApproved }) {
    const { eventUuid, getShortUuid, getFormAge } = useEventForm();
    const [proposalStatus, setProposalStatus] = useState('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState(new Date());
    const [proposalData, setProposalData] = useState(null);
    const [error, setError] = useState(null);

    // Real backend API call to check proposal status
    useEffect(() => {
        const checkStatus = async () => {
            if (!eventUuid) {
                console.warn('⚠️ No event UUID available for status check');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                console.log('📋 Checking proposal status from backend for UUID:', eventUuid);

                const result = await getProposalStatus(eventUuid);

                if (result.success) {
                    const status = result.data.proposal_status;
                    console.log('✅ Backend returned proposal status:', status);

                    // Map backend status to component state
                    setProposalStatus(status);
                    setProposalData(result.data);

                    // If approved and onApproved callback exists, trigger it
                    if (status === 'approved' && onApproved) {
                        console.log('🎉 Proposal approved! Triggering onApproved callback');
                        // Small delay to show the approved state first
                        setTimeout(() => {
                            onApproved();
                        }, 1000);
                    }
                } else {
                    console.error('❌ Failed to get proposal status:', result.message);
                    setError(result.message || 'Failed to get proposal status');
                    // Keep current status on error
                }
            } catch (error) {
                console.error('❌ Error checking proposal status:', error);
                setError('Network error while checking status');
                // Keep current status on error
            } finally {
                setIsLoading(false);
                setLastChecked(new Date());
            }
        };

        // Check status immediately
        checkStatus();

        // Check status every 30 seconds for real-time updates
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, [eventUuid]);

    // Format date for display
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle manual refresh
    const handleRefresh = async () => {
        if (!eventUuid) {
            console.warn('⚠️ No event UUID available for manual refresh');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('🔄 Manual refresh - checking proposal status for UUID:', eventUuid);

            const result = await getProposalStatus(eventUuid);

            if (result.success) {
                const status = result.data.proposal_status;
                console.log('✅ Manual refresh - Backend returned proposal status:', status);

                setProposalStatus(status);
                setProposalData(result.data);

                // If approved and onApproved callback exists, trigger it
                if (status === 'approved' && onApproved) {
                    console.log('🎉 Manual refresh - Proposal approved! Triggering onApproved callback');
                    setTimeout(() => {
                        onApproved();
                    }, 1000);
                }
            } else {
                console.error('❌ Manual refresh failed:', result.message);
                setError(result.message || 'Failed to refresh proposal status');
            }
        } catch (error) {
            console.error('❌ Manual refresh error:', error);
            setError('Network error while refreshing status');
        } finally {
            setIsLoading(false);
            setLastChecked(new Date());
        }
    };

    // Handle proceeding to Reports when approved
    const handleProceedToReports = () => {
        if (onApproved) {
            onApproved();
        }
    };

    // Handle going back to edit when rejected
    const handleBackToEdit = () => {
        if (onPrevious) {
            onPrevious();
        }
    };

    // Show approved state - unlock Reports.jsx
    if (proposalStatus === 'approved') {
        return (
            <div className="space-y-8">
                {/* Back Button */}
                <div className="flex justify-start">
                    <BackButton
                        customAction={onPrevious}
                    />
                </div>

                {/* Success Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Proposal Approved! 🎉</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Congratulations! Your proposal has been approved. You can now proceed to submit your post-event documentation and accomplishment reports.
                    </p>
                </div>

                {/* Approval Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
                        Approval Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Proposal Status</label>
                                <div className="flex items-center mt-1">
                                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                                    <span className="text-green-800 font-semibold">Approved</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Approved On</label>
                                <p className="text-gray-900 font-medium">{formatDate(new Date())}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Event ID</label>
                                <p className="text-gray-900 font-mono text-sm">{getShortUuid()}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Next Steps</label>
                                <p className="text-gray-900">Submit post-event documentation and accomplishment reports</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Deadline</label>
                                <p className="text-gray-900">Within 7 days after event completion</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Proceed to Reports */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-green-900 mb-4">
                            Ready to Submit Post-Event Documentation?
                        </h3>
                        <p className="text-green-800 mb-6">
                            Now that your proposal is approved, you can submit your accomplishment reports,
                            event photos, and attendance documentation.
                        </p>
                        <button
                            onClick={handleProceedToReports}
                            className="inline-flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
                        >
                            <FileText className="h-5 w-5 mr-2" />
                            Proceed to Documentation & Reports
                        </button>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Phone className="h-5 w-5 mr-2" />
                        Need Help?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                        <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-500" />
                            <span>Email: cedo@university.edu</span>
                        </div>
                        <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            <span>Phone: (555) 123-4567</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show rejected state
    if (proposalStatus === 'denied') {
        return (
            <div className="space-y-8">
                {/* Back Button */}
                <div className="flex justify-start">
                    <BackButton
                        customAction={handleBackToEdit}
                    />
                </div>

                {/* Rejection Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Proposal Not Approved</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Unfortunately, your proposal was not approved. Please review the feedback below and make the necessary changes before resubmitting.
                    </p>
                </div>

                {/* Rejection Details */}
                <div className="bg-white border border-red-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <AlertCircle className="h-6 w-6 mr-2 text-red-600" />
                        Rejection Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Proposal Status</label>
                                <div className="flex items-center mt-1">
                                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                                    <span className="text-red-800 font-semibold">Not Approved</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Reviewed On</label>
                                <p className="text-gray-900 font-medium">{formatDate(proposalData?.reviewed_at || new Date())}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Event ID</label>
                                <p className="text-gray-900 font-mono text-sm">{getShortUuid()}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Admin Comments</label>
                                <p className="text-gray-900">{proposalData?.admin_comments || 'No specific feedback provided.'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500">Next Steps</label>
                                <p className="text-gray-900">Review the feedback and make necessary changes to your proposal</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-red-900 mb-4">
                            What would you like to do?
                        </h3>
                        <p className="text-red-800 mb-6">
                            You can edit your proposal and resubmit it, or contact the CEDO team for more information.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleBackToEdit}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <RefreshCw className="h-5 w-5 mr-2" />
                                Edit & Resubmit Proposal
                            </button>
                            <button
                                onClick={handleRefresh}
                                className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                            >
                                <RefreshCw className="h-5 w-5 mr-2" />
                                Check Status Again
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Phone className="h-5 w-5 mr-2" />
                        Need Help?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                        <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-500" />
                            <span>Email: cedo@university.edu</span>
                        </div>
                        <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            <span>Phone: (555) 123-4567</span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                        If you have any questions about the rejection or need clarification on the feedback, please don't hesitate to contact us.
                    </p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error && !proposalData) {
        return (
            <div className="space-y-8">
                {/* Back Button */}
                <div className="flex justify-start">
                    <BackButton
                    />
                </div>

                <div className="text-center">
                    <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Unable to Load Status</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
                        {error}
                    </p>
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Show pending state
    return (
        <div className="space-y-8">
            {/* Back Button */}
            <div className="flex justify-start">
                <BackButton />
            </div>

            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mx-auto mb-6">
                    <Clock className="h-10 w-10 text-yellow-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {proposalStatus === 'approved' ? 'Proposal Approved! 🎉' :
                        proposalStatus === 'denied' ? 'Proposal Not Approved' :
                            'Proposal Under Review'}
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    {proposalStatus === 'approved'
                        ? 'Congratulations! Your proposal has been approved. You can now proceed to submit your post-event documentation.'
                        : proposalStatus === 'denied'
                            ? 'Unfortunately, your proposal was not approved. Please review the feedback below and make the necessary changes.'
                            : 'Your proposal has been submitted and is currently being reviewed by the CEDO team. We\'ll notify you once the review is complete.'
                    }
                </p>

                {/* UUID Display */}
                {eventUuid && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                        <p className="text-sm text-blue-800">
                            <strong>Event ID:</strong> <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 font-mono text-xs">{getShortUuid()}</code>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">Submitted {getFormAge()}</p>
                    </div>
                )}
            </div>

            {/* Status Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Clock className="h-6 w-6 mr-2 text-yellow-600" />
                        Review Status
                    </h2>
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Checking...' : 'Refresh Status'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                            <Send className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Submitted</h3>
                        <p className="text-sm text-gray-600">Proposal received</p>
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full w-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-3">
                            <Users className="h-6 w-6 text-yellow-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Under Review</h3>
                        <p className="text-sm text-gray-600">CEDO team reviewing</p>
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-yellow-600 h-2 rounded-full w-2/3 animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3">
                            <CheckCircle className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Approval</h3>
                        <p className="text-sm text-gray-600">Awaiting decision</p>
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-gray-400 h-2 rounded-full w-1/3"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Last checked: {formatDate(lastChecked)}</span>
                        <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Auto-refresh every 30 seconds
                        </span>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                                <span className="text-red-800 text-sm">{error}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Timeline */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Calendar className="h-6 w-6 mr-2" />
                    Review Timeline
                </h2>

                <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">Proposal Submitted</h3>
                            <p className="text-sm text-gray-600">Your proposal has been successfully submitted and is in the review queue.</p>
                            <p className="text-xs text-gray-500 mt-1">Status: Completed</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Clock className="h-5 w-5 text-yellow-600" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">Under Review</h3>
                            <p className="text-sm text-gray-600">The CEDO team is currently reviewing your proposal for approval.</p>
                            <p className="text-xs text-gray-500 mt-1">Status: In Progress</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">Approval Decision</h3>
                            <p className="text-sm text-gray-600">You will receive notification once the review is complete and a decision is made.</p>
                            <p className="text-xs text-gray-500 mt-1">Status: Pending</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* What to Expect */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    What to Expect
                </h3>
                <div className="space-y-3 text-blue-800">
                    <div className="flex items-start">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p>
                            <strong>Review Time:</strong> Most proposals are reviewed within 3-5 business days.
                        </p>
                    </div>
                    <div className="flex items-start">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p>
                            <strong>Notification:</strong> You will receive an email notification once the review is complete.
                        </p>
                    </div>
                    <div className="flex items-start">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p>
                            <strong>Next Steps:</strong> Once approved, you'll be able to submit your post-event documentation and accomplishment reports.
                        </p>
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    Need Help?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                    <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Email: cedo@university.edu</span>
                    </div>
                    <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Phone: (555) 123-4567</span>
                    </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                    If you have any questions about your proposal or the review process, please don't hesitate to contact us.
                </p>
            </div>
        </div>
    );
}

