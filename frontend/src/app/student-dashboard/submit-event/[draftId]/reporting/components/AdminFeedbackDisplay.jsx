/**
 * Admin Feedback Display Component
 * Purpose: Display admin comments and feedback when report is in revision status
 * Approach: Read-only display with clear visual hierarchy
 */

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangleIcon, MessageSquareIcon } from "lucide-react";

/**
 * Admin Feedback Display Component
 */
export const AdminFeedbackDisplay = ({
    comments = '',
    reportStatus = 'revision'
}) => {
    if (!comments || reportStatus !== 'revision') {
        return null;
    }

    return (
        <Card className="w-full border-orange-200 bg-orange-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                    <AlertTriangleIcon className="h-5 w-5" />
                    Admin Feedback - Revision Required
                </CardTitle>
                <CardDescription className="text-orange-700">
                    Your accomplishment report has been reviewed and requires revisions
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status Alert */}
                <Alert className="border-orange-200 bg-orange-100">
                    <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                        Please review the feedback below and make the necessary changes to your report.
                    </AlertDescription>
                </Alert>

                {/* Admin Comments */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <MessageSquareIcon className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Admin Comments</span>
                    </div>
                    <div className="bg-white border border-orange-200 rounded-md p-4">
                        <div className="prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap text-gray-700">
                                {comments}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Instructions */}
                <div className="bg-white border border-orange-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-orange-800 mb-2">Next Steps</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                        <li>• Review the admin comments carefully</li>
                        <li>• Make the necessary changes to your report</li>
                        <li>• Update your event details if needed</li>
                        <li>• Resubmit your accomplishment report</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}; 