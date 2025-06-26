/**
 * Error State Component for Section 5 Reporting
 * Displays error messages and recovery options
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/dashboard/student/ui/alert";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

/**
 * Error state component for reporting section
 * @param {Object} props - Component props
 * @param {string} props.error - Error message to display
 * @param {string} props.errorType - Type of error: 'recovery-failed', 'data-missing', 'status-failed'
 * @param {number} props.recoveryAttempts - Number of recovery attempts made
 * @param {number} props.maxRecoveryAttempts - Maximum recovery attempts allowed
 * @param {string} props.dataRecoveryStatus - Data recovery status
 * @param {string} props.proposalStatus - Proposal status
 * @param {boolean} props.isCheckingStatus - Whether status check is in progress
 * @param {Object} props.formData - Available form data for debugging
 * @param {Function} props.onRetry - Retry callback
 * @param {Function} props.onResetRecovery - Reset recovery callback
 * @param {Function} props.onPrevious - Previous button callback
 * @returns {JSX.Element} Error state UI
 */
export const ReportingError = ({
    error = 'An unknown error occurred',
    errorType = 'status-failed',
    recoveryAttempts = 0,
    maxRecoveryAttempts = 3,
    dataRecoveryStatus = 'failed',
    proposalStatus = 'error',
    isCheckingStatus = false,
    formData = {},
    onRetry,
    onResetRecovery,
    onPrevious
}) => {
    const isRecoveryFailure = errorType === 'recovery-failed' || dataRecoveryStatus === 'disabled';
    const isDataMissing = errorType === 'data-missing' || proposalStatus === 'no-data';
    const isStatusFailure = errorType === 'status-failed';

    const getErrorTitle = () => {
        if (isRecoveryFailure) return 'Data Recovery Failed';
        if (isDataMissing) return 'Incomplete Data';
        if (isStatusFailure) return 'Status Check Failed';
        return 'Error';
    };

    const getErrorDescription = () => {
        if (isRecoveryFailure) {
            return (
                <div>
                    <p>Unable to recover your organization data after {maxRecoveryAttempts} attempts.</p>
                    <p className="mt-2 text-sm">Please start from Section 2 to complete your organization information.</p>
                </div>
            );
        }

        if (isDataMissing) {
            return (
                <div>
                    <p>Missing required organization information for Section 5.</p>
                    <p className="mt-2 text-sm">Please complete Sections 2-3 first to provide organization details and event information.</p>
                </div>
            );
        }

        if (isStatusFailure) {
            return (
                <div>
                    <p>Unable to verify your proposal approval status.</p>
                    <p className="mt-2 text-sm">Error: {error}</p>
                </div>
            );
        }

        return <p>{error}</p>;
    };

    const getRetryButtonText = () => {
        if (isRecoveryFailure) return 'Reset and Retry Recovery';
        if (isStatusFailure) return 'Retry Status Check';
        return 'Retry';
    };

    const handleRetry = () => {
        if (isRecoveryFailure && onResetRecovery) {
            onResetRecovery();
        } else if (onRetry) {
            onRetry();
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">
                    Section 5 of 5: Documentation & Accomplishment Reports
                </CardTitle>
                <CardDescription>
                    {isRecoveryFailure ? 'Data recovery failed' :
                        isDataMissing ? 'Missing required data' :
                            'Unable to verify proposal status'}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{getErrorTitle()}</AlertTitle>
                    <AlertDescription>{getErrorDescription()}</AlertDescription>
                </Alert>

                {/* Action buttons */}
                <div className="mt-4 space-y-2">
                    {(onRetry || onResetRecovery) && (
                        <Button
                            onClick={handleRetry}
                            disabled={isCheckingStatus}
                            variant="outline"
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                            {getRetryButtonText()}
                        </Button>
                    )}

                    {/* Debug information for troubleshooting */}
                    <details className="mt-4 p-3 bg-gray-50 rounded text-sm">
                        <summary className="cursor-pointer font-medium">Debug Information</summary>
                        <div className="mt-2 space-y-1">
                            <p>• Error Type: {errorType}</p>
                            <p>• Recovery Status: {dataRecoveryStatus}</p>
                            <p>• Recovery Attempts: {recoveryAttempts}/{maxRecoveryAttempts}</p>
                            <p>• Proposal Status: {proposalStatus}</p>
                            <p>• Form Data Available: {Object.keys(formData).length > 0 ? 'Yes' : 'No'}</p>

                            {Object.keys(formData).length > 0 && (
                                <div className="mt-2">
                                    <p>• Available Fields:</p>
                                    <ul className="ml-4 text-xs space-y-0.5">
                                        <li>Organization Name: {formData.organizationName || 'Missing'}</li>
                                        <li>Contact Email: {formData.contactEmail || 'Missing'}</li>
                                        <li>Proposal ID: {formData.id || formData.proposalId || 'Missing'}</li>
                                        <li>Total Fields: {Object.keys(formData).length}</li>
                                    </ul>
                                </div>
                            )}

                            {error && (
                                <p>• Error Details: <span className="text-red-600">{error}</span></p>
                            )}
                        </div>
                    </details>
                </div>

                {/* Helpful guidance based on error type */}
                <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">What to do next:</h4>

                    {isRecoveryFailure && (
                        <div className="text-sm text-blue-700 space-y-2">
                            <p>1. Click "Reset and Retry Recovery" to attempt data recovery again</p>
                            <p>2. If that fails, go back to Section 2 and re-enter your organization information</p>
                            <p>3. Complete Sections 2-4 before returning to Section 5</p>
                        </div>
                    )}

                    {isDataMissing && (
                        <div className="text-sm text-blue-700 space-y-2">
                            <p>1. Use the "Back to Overview" button to return to the previous section</p>
                            <p>2. Complete Section 2 (Organization Information) with your organization details</p>
                            <p>3. Complete Section 3 (Event Details) with your event information</p>
                            <p>4. Submit Section 4 and wait for admin approval</p>
                            <p>5. Return to Section 5 once your proposal is approved</p>
                        </div>
                    )}

                    {isStatusFailure && (
                        <div className="text-sm text-blue-700 space-y-2">
                            <p>1. Click "Retry Status Check" to attempt the check again</p>
                            <p>2. Check your internet connection</p>
                            <p>3. If the problem persists, contact your administrator</p>
                        </div>
                    )}
                </div>
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

export default ReportingError; 