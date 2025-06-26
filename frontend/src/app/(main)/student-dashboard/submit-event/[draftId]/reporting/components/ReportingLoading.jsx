/**
 * Loading State Component for Section 5 Reporting
 * Displays loading indicators while checking status or recovering data
 */

import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";

/**
 * Loading state component for reporting section
 * @param {Object} props - Component props
 * @param {boolean} props.isRecovering - Whether data recovery is in progress
 * @param {number} props.recoveryAttempts - Current recovery attempt number
 * @param {number} props.maxRecoveryAttempts - Maximum recovery attempts
 * @param {Object} props.effectiveFormData - Current form data for debugging
 * @param {string} props.dataRecoveryStatus - Data recovery status
 * @param {string} props.proposalStatus - Proposal status
 * @param {string} props.lastChecked - Last status check timestamp
 * @param {string} props.error - Any error message
 * @param {Function} props.onRetryStatusCheck - Retry status check callback
 * @param {Function} props.onRetryRecovery - Retry data recovery callback
 * @param {Function} props.onDebugRecovery - Debug recovery callback
 * @param {Function} props.onEmergencyBypass - Emergency bypass callback
 * @param {Function} props.onPrevious - Previous button callback
 * @returns {JSX.Element} Loading state UI
 */
export const ReportingLoading = ({
    isRecovering = false,
    recoveryAttempts = 0,
    maxRecoveryAttempts = 3,
    effectiveFormData = {},
    dataRecoveryStatus = 'checking',
    proposalStatus = 'loading',
    lastChecked = null,
    error = null,
    onRetryStatusCheck,
    onRetryRecovery,
    onDebugRecovery,
    onEmergencyBypass,
    onPrevious
}) => {
    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">
                    Section 5 of 5: Documentation & Accomplishment Reports
                </CardTitle>
                <CardDescription>
                    {isRecovering
                        ? 'Recovering form data and checking approval status...'
                        : 'Checking proposal approval status...'
                    }
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mr-3" />
                    <div className="text-center">
                        {isRecovering ? (
                            <>
                                <p className="text-lg font-medium">Recovering Form Data</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Attempt {recoveryAttempts + 1}/{maxRecoveryAttempts}: Checking localStorage and database...
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-lg font-medium">Checking Proposal Status</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Fetching latest approval status from database...
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Enhanced debug panel for troubleshooting */}
                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium mb-2">Debug Information</h4>
                    <div className="text-sm space-y-1">
                        <p><strong>Data Recovery Status:</strong> {dataRecoveryStatus}</p>
                        <p><strong>Proposal Status Check:</strong> {proposalStatus}</p>
                        <p><strong>Form Data Source:</strong> {
                            effectiveFormData?.recoveredFromDatabase ? 'Recovered Data' :
                                (effectiveFormData?.organizationName ? 'Provided Data' : 'No Complete Data')
                        }</p>

                        <div className="mt-2">
                            <p><strong>Available Data:</strong></p>
                            <ul className="ml-4 text-xs space-y-0.5">
                                <li>• Organization Name: {effectiveFormData?.organizationName || 'Missing'}</li>
                                <li>• Contact Email: {effectiveFormData?.contactEmail || 'Missing'}</li>
                                <li>• Proposal ID: {effectiveFormData?.id || effectiveFormData?.proposalId || 'Missing'}</li>
                                <li>• Total Fields: {Object.keys(effectiveFormData || {}).length}</li>
                            </ul>
                        </div>

                        {effectiveFormData?.recoveredFromDatabase && (
                            <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                                <p className="font-medium text-green-800">✅ Data Recovery Successful</p>
                                <p>Found organization: {effectiveFormData.organizationName}</p>
                                <p>Found proposal ID: {effectiveFormData.id || effectiveFormData.proposalId}</p>
                                <p>Source: Database (latest approved proposal)</p>
                            </div>
                        )}

                        <p><strong>Last Checked:</strong> {lastChecked || 'Never'}</p>
                        {error && (
                            <p><strong>Error:</strong> <span className="text-red-600">{error}</span></p>
                        )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-4 flex gap-2 flex-wrap">
                        {onRetryStatusCheck && (
                            <Button
                                onClick={onRetryStatusCheck}
                                variant="outline"
                                size="sm"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry Status Check
                            </Button>
                        )}

                        {onDebugRecovery && (
                            <Button
                                onClick={onDebugRecovery}
                                variant="outline"
                                size="sm"
                            >
                                Debug & Retry Recovery
                            </Button>
                        )}

                        {onRetryRecovery && (
                            <Button
                                onClick={onRetryRecovery}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-300"
                            >
                                🔧 Manual Recovery
                            </Button>
                        )}

                        {onEmergencyBypass && (
                            <Button
                                onClick={onEmergencyBypass}
                                variant="outline"
                                size="sm"
                                className="text-orange-600 border-orange-300"
                            >
                                🚨 Emergency Bypass
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter>
                {onPrevious && (
                    <Button variant="outline" onClick={onPrevious}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Overview
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

export default ReportingLoading; 