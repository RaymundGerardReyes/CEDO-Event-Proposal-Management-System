"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { AlertTriangle, Mail, User } from "lucide-react";

export function AccountNotFoundDialog({ isOpen, onClose, userEmail, onTryAgain }) {
    // Generate a pre-filled email for contacting the administrator
    const generateContactEmail = () => {
        const subject = encodeURIComponent("Account Access Request - CEDO System");
        const body = encodeURIComponent(`Dear Administrator,

I am trying to access the CEDO System but received an "Account not found" error.

My Details:
- Email: ${userEmail}
- Date: ${new Date().toLocaleDateString()}
- Time: ${new Date().toLocaleTimeString()}

Could you please help me gain access to the system? Let me know if you need any additional information.

Thank you for your assistance.

Best regards`);

        return `mailto:admin@cedo.com?subject=${subject}&body=${body}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md mx-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-8">
                <DialogHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>

                    <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                        Account Not Found
                    </DialogTitle>

                    <DialogDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Your Google account <strong className="text-gray-900 dark:text-white">{userEmail}</strong> is not registered in our system.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-6">
                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-orange-800 dark:text-orange-200">
                                <p className="font-medium mb-1">To get access:</p>
                                <p>Contact your administrator to add your account to the CEDO system.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={() => window.open(generateContactEmail(), '_blank')}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Administrator
                        </Button>

                        <Button
                            variant="outline"
                            onClick={onTryAgain}
                            className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors"
                        >
                            Try Again
                        </Button>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Administrator: admin@cedo.com
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};