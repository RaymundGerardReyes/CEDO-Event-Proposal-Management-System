"use client";

import { AccountNotFoundDialog } from "@/components/auth/AccountNotFoundDialog";
import { AccountPendingDialog } from "@/components/auth/AccountPendingDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, TestTube2 } from "lucide-react";
import { useState } from "react";

/**
 * Test page for demonstrating the Account Error Dialogs
 * This page allows developers and stakeholders to preview the dialog implementations
 */
export default function TestDialogsPage() {
    const [notFoundDialogOpen, setNotFoundDialogOpen] = useState(false);
    const [pendingDialogOpen, setPendingDialogOpen] = useState(false);

    const sampleEmail = "test.user@example.com";

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-4xl space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                        <TestTube2 className="h-8 w-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Account Error Dialogs - Test Page
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Preview and test the user-friendly error dialogs for Google Sign-In issues
                    </p>
                </div>

                {/* Test Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Account Not Found Dialog Test */}
                    <Card className="border-orange-200">
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-orange-900">Account Not Found</CardTitle>
                                    <CardDescription className="text-orange-700">
                                        User tries to sign in but their account doesn't exist in the system
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-orange-50 p-4 border border-orange-200">
                                <h4 className="text-sm font-medium text-orange-800 mb-2">
                                    When this appears:
                                </h4>
                                <ul className="space-y-1 text-sm text-orange-700">
                                    <li>• User signs in with Google but email not in database</li>
                                    <li>• Backend returns 403 error with reason "USER_NOT_FOUND"</li>
                                    <li>• System needs admin to create the account first</li>
                                </ul>
                            </div>

                            <div className="text-sm text-gray-600">
                                <strong>Test Email:</strong> {sampleEmail}
                            </div>

                            <Button
                                onClick={() => setNotFoundDialogOpen(true)}
                                className="w-full bg-orange-600 hover:bg-orange-700"
                            >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Show "Account Not Found" Dialog
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Account Pending Dialog Test */}
                    <Card className="border-yellow-200">
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-yellow-900">Account Pending Approval</CardTitle>
                                    <CardDescription className="text-yellow-700">
                                        User's account exists but is waiting for administrator approval
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                                    When this appears:
                                </h4>
                                <ul className="space-y-1 text-sm text-yellow-700">
                                    <li>• User account exists but is_approved = false</li>
                                    <li>• Backend returns 403 error with reason "USER_NOT_APPROVED"</li>
                                    <li>• Admin needs to approve the account before access</li>
                                </ul>
                            </div>

                            <div className="text-sm text-gray-600">
                                <strong>Test Email:</strong> {sampleEmail}
                            </div>

                            <Button
                                onClick={() => setPendingDialogOpen(true)}
                                className="w-full bg-yellow-600 hover:bg-yellow-700"
                            >
                                <Clock className="h-4 w-4 mr-2" />
                                Show "Account Pending" Dialog
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Implementation Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Implementation Details</CardTitle>
                        <CardDescription>
                            How these dialogs are integrated into the authentication system
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-900">Frontend Components</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>• <code>AccountNotFoundDialog.jsx</code></li>
                                    <li>• <code>AccountPendingDialog.jsx</code></li>
                                    <li>• Integrated into <code>AuthContext</code></li>
                                    <li>• Replaces generic toast notifications</li>
                                </ul>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium text-gray-900">Features</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                    <li>• User-friendly error messages</li>
                                    <li>• Contact administrator functionality</li>
                                    <li>• Pre-filled email templates</li>
                                    <li>• Clear next steps for users</li>
                                </ul>
                            </div>
                        </div>

                        <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                            <h4 className="text-sm font-medium text-blue-800 mb-2">
                                Development Notes:
                            </h4>
                            <p className="text-sm text-blue-700">
                                These dialogs automatically show when the corresponding authentication errors occur.
                                The user's email is extracted from the Google Sign-In token to personalize the message.
                                The dialogs include actionable buttons for contacting administrators and trying again.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-sm text-gray-500">
                    <p>
                        This is a development test page. Remove this route before production deployment.
                    </p>
                </div>
            </div>

            {/* Dialog Components */}
            <AccountNotFoundDialog
                isOpen={notFoundDialogOpen}
                onClose={() => setNotFoundDialogOpen(false)}
                userEmail={sampleEmail}
            />

            <AccountPendingDialog
                isOpen={pendingDialogOpen}
                onClose={() => setPendingDialogOpen(false)}
                userEmail={sampleEmail}
            />
        </div>
    );
} 