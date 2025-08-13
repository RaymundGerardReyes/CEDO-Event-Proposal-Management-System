/**
 * Proposal Status Display Component
 * Purpose: Display current proposal status, report status, MySQL ID, and submission timestamps
 * Approach: Clean status badges and organized information display
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, DatabaseIcon, FileTextIcon } from "lucide-react";

/**
 * Get status badge variant based on status
 */
const getStatusVariant = (status) => {
    switch (status) {
        case 'approved':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'denied':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'revision':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'draft':
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Not submitted';
    
    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting timestamp:', error);
        return 'Invalid date';
    }
};

/**
 * Proposal Status Display Component
 */
export const ProposalStatusDisplay = ({
    proposalStatus = 'draft',
    reportStatus = 'draft',
    mysqlId = null,
    submissionTimestamp = null
}) => {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DatabaseIcon className="h-5 w-5 text-blue-600" />
                    Proposal Status & Information
                </CardTitle>
                <CardDescription>
                    Current status of your event proposal and report submission
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Proposal Status */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <FileTextIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Proposal Status</span>
                        </div>
                        <Badge className={`${getStatusVariant(proposalStatus)} border`}>
                            {proposalStatus.charAt(0).toUpperCase() + proposalStatus.slice(1)}
                        </Badge>
                    </div>

                    {/* Report Status */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <FileTextIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Report Status</span>
                        </div>
                        <Badge className={`${getStatusVariant(reportStatus)} border`}>
                            {reportStatus.charAt(0).toUpperCase() + reportStatus.slice(1)}
                        </Badge>
                    </div>
                </div>

                {/* MySQL Proposal ID */}
                {mysqlId && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <DatabaseIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">MySQL Proposal ID</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                            <code className="text-sm font-mono text-gray-700">{mysqlId}</code>
                        </div>
                    </div>
                )}

                {/* Submission Timestamps */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Submission Information</span>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <ClockIcon className="h-4 w-4" />
                            <span>
                                <strong>Submitted:</strong> {formatTimestamp(submissionTimestamp)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status Explanation */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Status Explanation</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                        {proposalStatus === 'approved' && (
                            <p>✅ Your event proposal has been approved. You can now submit your accomplishment report.</p>
                        )}
                        {proposalStatus === 'pending' && (
                            <p>⏳ Your event proposal is under review by administrators.</p>
                        )}
                        {proposalStatus === 'denied' && (
                            <p>❌ Your event proposal was not approved. Please review the feedback and resubmit.</p>
                        )}
                        {proposalStatus === 'draft' && (
                            <p>📝 Your event proposal is still in draft status. Complete and submit your proposal first.</p>
                        )}
                        
                        {reportStatus === 'revision' && (
                            <p>📝 Your accomplishment report needs revisions. Please review the admin comments below.</p>
                        )}
                        {reportStatus === 'approved' && (
                            <p>✅ Your accomplishment report has been approved. No further action needed.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}; 