/**
 * ReviewDialogFooter - Footer Component for Review Dialog
 * 
 * This component handles the footer section with action buttons
 * for the review dialog system.
 */

import { Button } from "@/components/dashboard/admin/ui/button";

const ReviewDialogFooter = ({
    onClose,
    onApprove,
    onRequestRevision,
    onReject,
    canSubmitReview,
    isSubmitting = false
}) => {
    const handleReject = () => {
        const shouldReject = confirm(
            "Warning: Rejection will halt the process entirely. Consider requesting revisions instead to keep the proposal active. Are you sure you want to reject?"
        );

        if (shouldReject && onReject) {
            onReject();
        }
    };

    return (
        <div className="
      sticky bottom-0 z-20 
      bg-white/95 backdrop-blur-sm border-t border-gray-200/60
      px-4 sm:px-6 lg:px-8 py-4 sm:py-5
      shadow-lg
    ">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
                <Button
                    variant="outline"
                    onClick={onClose}
                    className="order-2 sm:order-1 px-6 py-2.5 font-medium"
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 order-1 sm:order-2">
                    <Button
                        onClick={onApprove}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 font-medium shadow-sm"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                            </>
                        ) : (
                            <>✓ Approve Proposal</>
                        )}
                    </Button>

                    <Button
                        onClick={onRequestRevision}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 font-medium shadow-sm"
                        disabled={isSubmitting}
                    >
                        📝 Request Revision
                    </Button>

                    <Button
                        onClick={handleReject}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 font-medium shadow-sm relative group"
                        title="Avoid rejection - request revisions instead"
                        disabled={isSubmitting}
                    >
                        <span className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            ⚠️ Consider revision instead
                        </span>
                        ✗ Reject Proposal
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReviewDialogFooter; 