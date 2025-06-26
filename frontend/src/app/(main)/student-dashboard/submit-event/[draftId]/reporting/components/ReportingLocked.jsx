/**
 * Locked State Component for Section 5 Reporting
 * Displays when proposal is not yet approved
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/dashboard/student/ui/alert";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { AlertCircle, ArrowLeft, Clock, FileText, MessageSquare, RefreshCw, User } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchAdminComments } from "../utils/api";

/**
 * Locked state component for reporting section
 * @param {Object} props - Component props
 * @param {string} props.proposalStatus - Current proposal status
 * @param {string} props.proposalId - Proposal ID
 * @param {boolean} props.isCheckingStatus - Whether status check is in progress
 * @param {string} props.lastChecked - Last status check timestamp
 * @param {string} props.error - Any error message
 * @param {string} props.dataRecoveryStatus - Data recovery status
 * @param {Object} props.formData - Available form data for debugging
 * @param {Function} props.onRefreshStatus - Refresh status callback
 * @param {Function} props.onForceRefresh - Force refresh callback
 * @param {Function} props.onPrevious - Previous button callback
 * @returns {JSX.Element} Locked state UI
 */
export const ReportingLocked = ({
    proposalStatus = 'pending',
    proposalId = null,
    isCheckingStatus = false,
    lastChecked = null,
    error = null,
    dataRecoveryStatus = 'success',
    formData = {},
    onRefreshStatus,
    onForceRefresh,
    onPrevious
}) => {
    // State for admin comments
    const [adminComments, setAdminComments] = useState([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentsError, setCommentsError] = useState(null);

    // Fetch admin comments when proposal is denied
    useEffect(() => {
        const shouldFetchComments = proposalId &&
            (proposalStatus === 'denied' || proposalStatus === 'rejected');

        if (shouldFetchComments) {
            setIsLoadingComments(true);
            setCommentsError(null);

            fetchAdminComments(proposalId)
                .then((result) => {
                    if (result.success && result.comments) {
                        setAdminComments(result.comments);
                        console.log('✅ Admin comments loaded:', result.comments.length, 'comments');
                    } else {
                        setAdminComments([]);
                    }
                })
                .catch((err) => {
                    console.error('❌ Failed to fetch admin comments:', err);
                    setCommentsError(err.message);
                    setAdminComments([]);
                })
                .finally(() => {
                    setIsLoadingComments(false);
                });
        } else {
            // Clear comments if not needed
            setAdminComments([]);
            setCommentsError(null);
        }
    }, [proposalId, proposalStatus]);

    const getStatusDisplayText = () => {
        switch (proposalStatus) {
            case 'pending':
                return 'Pending Review';
            case 'draft':
                return 'Draft (Not Submitted)';
            case 'submitted':
                return 'Submitted for Review';
            case 'rejected':
                return 'Rejected';
            default:
                return proposalStatus || 'Unknown';
        }
    };

    const getStatusMessage = () => {
        switch (proposalStatus) {
            case 'pending':
            case 'submitted':
                return 'Your proposal is currently under review by administrators. Please check back later.';
            case 'draft':
                return 'Your proposal is still in draft status. Please complete and submit Sections 2-4 first.';
            case 'rejected':
                return 'Your proposal has been rejected. Please review the feedback and resubmit.';
            default:
                return 'Your proposal needs to be approved before you can access Section 5.';
        }
    };

    const getNextSteps = () => {
        switch (proposalStatus) {
            case 'pending':
            case 'submitted':
                return [
                    'Wait for administrator review (typically 1-3 business days)',
                    'Check back periodically or refresh this page',
                    'You will receive an email notification when approved',
                    'Contact support if urgent'
                ];
            case 'draft':
                return [
                    'Go back to Section 2 and complete organization information',
                    'Fill out Section 3 with event details',
                    'Submit Section 4 for review',
                    'Return here once approved'
                ];
            case 'rejected':
                return [
                    'Review the rejection feedback from administrators',
                    'Make necessary corrections to your proposal',
                    'Resubmit Sections 2-4 for re-review',
                    'Contact support if you need clarification'
                ];
            default:
                return [
                    'Complete Sections 2-4 if not already done',
                    'Submit your proposal for review',
                    'Wait for approval',
                    'Return to Section 5 once approved'
                ];
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">
                    Section 5 of 5: Documentation & Accomplishment Reports
                </CardTitle>
                <CardDescription>
                    Upload your documentation and sign to complete your submission
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Section Locked</AlertTitle>
                    <AlertDescription>
                        <p>This section is locked until your event proposal is approved.</p>
                        <p className="mt-2">Current status: <strong>{getStatusDisplayText()}</strong></p>
                        {proposalId && (
                            <p className="mt-1 text-sm">Proposal ID: {proposalId}</p>
                        )}
                        <p className="mt-2">{getStatusMessage()}</p>
                    </AlertDescription>
                </Alert>

                {/* Real-time status info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Proposal Status</p>
                            <p className="text-sm text-gray-600">
                                Status: <span className="font-mono">{proposalStatus}</span>
                            </p>
                            {proposalId && (
                                <p className="text-xs text-gray-500">
                                    Proposal ID: {proposalId}
                                </p>
                            )}
                            {lastChecked && (
                                <p className="text-xs text-gray-500">
                                    Last checked: {new Date(lastChecked).toLocaleString()}
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {onRefreshStatus && (
                                <Button
                                    onClick={onRefreshStatus}
                                    disabled={isCheckingStatus}
                                    variant="outline"
                                    size="sm"
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                                    Refresh Status
                                </Button>
                            )}

                            {onForceRefresh && (
                                <Button
                                    onClick={onForceRefresh}
                                    disabled={isCheckingStatus}
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 border-blue-300"
                                >
                                    🔄 Force Refresh
                                </Button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                            <p><strong>Status Check Error:</strong> {error}</p>
                        </div>
                    )}
                </div>

                {/* Admin Comments Section - Enhanced Design */}
                {(proposalStatus === 'denied' || proposalStatus === 'rejected') && (
                    <div className="mt-6">
                        {isLoadingComments && (
                            <Card className="shadow-sm border-l-4 border-l-blue-500">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-t-lg p-4">
                                    <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
                                        <MessageSquare className="h-5 w-5 mr-2 animate-pulse" />
                                        Loading Admin Comments...
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="flex items-center space-x-2 text-blue-600">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Fetching feedback from administrators...</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {commentsError && (
                            <Card className="shadow-sm border-l-4 border-l-red-500">
                                <CardHeader className="bg-gradient-to-r from-red-50 to-red-100/50 rounded-t-lg p-4">
                                    <CardTitle className="text-lg font-semibold text-red-900 flex items-center">
                                        <AlertCircle className="h-5 w-5 mr-2" />
                                        Unable to Load Comments
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="bg-red-50 p-3 rounded-lg border-l-4 border-l-red-400">
                                        <p className="text-red-800 text-sm">{commentsError}</p>
                                        <Button
                                            onClick={() => window.location.reload()}
                                            variant="outline"
                                            size="sm"
                                            className="mt-2 text-red-600 border-red-300"
                                        >
                                            Retry Loading Comments
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!isLoadingComments && !commentsError && adminComments.length > 0 && (
                            <Card className="shadow-sm border-l-4 border-l-red-500">
                                <CardHeader className="bg-gradient-to-r from-red-50 to-red-100/50 rounded-t-lg p-4">
                                    <CardTitle className="text-lg font-semibold text-red-900 flex items-center">
                                        <FileText className="h-5 w-5 mr-2" />
                                        Admin Feedback
                                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                            {adminComments.length} comment{adminComments.length !== 1 ? 's' : ''}
                                        </span>
                                    </CardTitle>
                                    <CardDescription className="text-red-700">
                                        Please review the feedback below and make necessary changes to your proposal.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 space-y-4">
                                    {adminComments.map((comment, index) => (
                                        <div key={comment._id || index} className="bg-red-50 p-4 rounded-lg border-l-4 border-l-red-400">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-red-600" />
                                                    <span className="font-medium text-red-800">Administrator</span>
                                                </div>
                                                <div className="flex items-center space-x-1 text-xs text-red-600">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        {comment.createdAt ?
                                                            new Date(comment.createdAt).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            }) :
                                                            'Recently'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bg-white p-3 rounded border border-red-200">
                                                <p className="text-red-800 leading-relaxed text-sm break-words whitespace-pre-wrap">
                                                    {comment.comment}
                                                </p>
                                            </div>
                                            {comment.metadata && (
                                                <div className="mt-2 text-xs text-red-600 opacity-75">
                                                    <p>Reviewed by: {comment.metadata.userAgent || 'Admin Dashboard'}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Action buttons for denied proposals */}
                                    <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
                                        <h4 className="font-medium text-red-800 mb-2">What's Next?</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                onClick={onPrevious}
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-300 hover:bg-red-50"
                                            >
                                                <ArrowLeft className="mr-1 h-4 w-4" />
                                                Go Back & Edit
                                            </Button>
                                            <Button
                                                onClick={() => window.open('mailto:support@cedo.edu.ph', '_blank')}
                                                variant="outline"
                                                size="sm"
                                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                            >
                                                <MessageSquare className="mr-1 h-4 w-4" />
                                                Contact Support
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {!isLoadingComments && !commentsError && adminComments.length === 0 &&
                            (proposalStatus === 'denied' || proposalStatus === 'rejected') && (
                                <Card className="shadow-sm border-l-4 border-l-yellow-500">
                                    <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100/50 rounded-t-lg p-4">
                                        <CardTitle className="text-lg font-semibold text-yellow-900 flex items-center">
                                            <MessageSquare className="h-5 w-5 mr-2" />
                                            No Specific Comments Available
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-l-yellow-400">
                                            <p className="text-yellow-800 text-sm leading-relaxed">
                                                Your proposal has been {proposalStatus} but no specific feedback comments were provided.
                                                Please contact the administrators for more details about the decision.
                                            </p>
                                            <div className="mt-3 flex gap-2">
                                                <Button
                                                    onClick={() => window.open('mailto:support@cedo.edu.ph', '_blank')}
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                                >
                                                    <MessageSquare className="mr-1 h-4 w-4" />
                                                    Contact Support
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                    </div>
                )}

                {/* Next steps guidance */}
                <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3">Next Steps:</h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                        {getNextSteps().map((step, index) => (
                            <li key={index} className="flex">
                                <span className="font-medium mr-2">{index + 1}.</span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                {/* Debug info (collapsible) */}
                <div className="mt-4">
                    <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer font-medium">Debug Information</summary>
                        <div className="mt-2 space-y-1 p-2 bg-gray-50 rounded">
                            <p>• Recovery Status: {dataRecoveryStatus}</p>
                            <p>• Organization: {formData?.organizationName || 'Missing'}</p>
                            <p>• Contact Email: {formData?.contactEmail || 'Missing'}</p>
                            <p>• Proposal ID: {formData?.id || formData?.proposalId || 'Missing'}</p>
                            <p>• Data Source: {formData?.recoveredFromDatabase ? 'Recovered' : 'Provided'}</p>
                            <p>• Proposal Status: {proposalStatus}</p>
                            <p>• Last Checked: {lastChecked || 'Never'}</p>
                            {error && (
                                <p>• Error: <span className="text-red-600">{error}</span></p>
                            )}
                        </div>
                    </details>
                </div>

                {/* Auto-refresh notification */}
                {!isCheckingStatus && proposalStatus !== 'approved' && (
                    <div className="mt-4 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                        <p>
                            <strong>Auto-refresh enabled:</strong> This page automatically checks for status updates every 30 seconds.
                            You can also manually refresh using the button above.
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter>
                {onPrevious && (
                    <Button variant="outline" onClick={onPrevious} type="button">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Overview
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default ReportingLocked; 