"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { CheckCircle, Clock, Mail } from "lucide-react";

/**
 * AccountPendingDialog Component
 * 
 * Displays when a user's account exists but is not yet approved.
 * Provides information about the approval process and contact options.
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Function to close the dialog
 * @param {string} props.userEmail - User's email from Google token
 * @param {Function} props.onCheckAgain - Function to retry checking approval status
 */
export function AccountPendingDialog({ isOpen, onClose, userEmail, onCheckAgain }) {
    // Generate a pre-filled follow-up email for pending approval
    const generateFollowUpEmail = () => {
        const subject = encodeURIComponent("Follow-up: Account Approval Status - CEDO System");
        const body = encodeURIComponent(`Dear Administrator,

I am following up on my account approval status for the CEDO System.

My Details:
- Email: ${userEmail}
- Date: ${new Date().toLocaleDateString()}
- Time: ${new Date().toLocaleTimeString()}

I have already requested access but my account is still pending approval. Could you please provide an update on the status or let me know if any additional information is needed?

Thank you for your time and assistance.

Best regards`);

        return `mailto:admin@cedo.com?subject=${subject}&body=${body}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-8">
                <DialogHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                        <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>

                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                        Account Pending Approval
                    </DialogTitle>

                    <DialogDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Your account <strong className="text-gray-900 dark:text-white">{userEmail}</strong> is registered but awaiting administrator approval.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-6">
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <p className="font-medium mb-1">Your account has been created!</p>
                                <p>You'll receive an email notification once it's approved. This usually takes 1-2 business days.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-medium mb-2">What happens next:</p>
                            <ul className="space-y-1 list-disc list-inside ml-2">
                                <li>Administrator reviews your account</li>
                                <li>You receive approval notification</li>
                                <li>You can then sign in normally</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={onCheckAgain}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Check Again
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => window.open(generateFollowUpEmail(), '_blank')}
                            className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Admin
                        </Button>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Questions? Contact admin@cedo.com
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};