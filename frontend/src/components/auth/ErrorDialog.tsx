/**
 * Error dialog component for displaying authentication errors
 * Provides consistent error messaging with proper accessibility
 */
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';

interface ErrorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
}

export function ErrorDialog({ isOpen, onClose, message }: ErrorDialogProps) {
    const errorDialogTitleId = "error-dialog-title";
    const errorDialogDescriptionId = "error-dialog-description";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogPortal>
                <DialogOverlay className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm transition-opacity duration-300 ease-out" />
                <DialogContent
                    className="fixed top-1/2 left-1/2 w-full max-w-sm transform -translate-x-1/2 -translate-y-1/2 bg-background dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 sm:p-8"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={errorDialogTitleId}
                    aria-describedby={errorDialogDescriptionId}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="flex flex-col space-y-4"
                    >
                        <DialogHeader>
                            <DialogTitle id={errorDialogTitleId} className="text-xl font-bold text-red-600 dark:text-red-500">
                                Sign In Failed
                            </DialogTitle>
                        </DialogHeader>
                        <DialogDescription id={errorDialogDescriptionId} className="text-sm text-gray-700 dark:text-gray-300">
                            {message}
                        </DialogDescription>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="px-4 py-2 border-red-600 text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-900/30 transition-colors duration-150"
                                >
                                    Close
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </motion.div>
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}

















