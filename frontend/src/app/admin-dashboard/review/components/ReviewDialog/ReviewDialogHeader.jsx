/**
 * ReviewDialogHeader - Header Component for Review Dialog
 * 
 * This component handles the header section of the review dialog,
 * including title, description, status badge, and close buttons.
 */

import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";

const ReviewDialogHeader = ({
    proposal,
    onClose,
    title = "System Review: Event Proposal",
    description = "Review the complete proposal details and provide your decision"
}) => {
    if (!proposal) return null;

    const getStatusBadgeClasses = (status) => {
        const baseClasses = "px-3 py-1.5 text-sm font-semibold rounded-full";

        switch (status) {
            case 'approved':
                return `${baseClasses} bg-green-50 text-green-700 border-green-200`;
            case 'rejected':
                return `${baseClasses} bg-red-50 text-red-700 border-red-200`;
            default:
                return `${baseClasses} bg-amber-50 text-amber-700 border-amber-200`;
        }
    };

    return (
        <div className="
      sticky top-0 z-20 
      bg-white/95 backdrop-blur-sm border-b border-gray-200/60
      px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6
      shadow-sm
    ">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                    <div className="flex items-start justify-between sm:justify-start">
                        <DialogTitle className="
              text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 
              leading-tight tracking-tight break-words pr-2
            ">
                            {title}
                        </DialogTitle>

                        {/* Mobile close button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="sm:hidden h-8 w-8 rounded-full hover:bg-gray-100"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </Button>
                    </div>

                    <DialogDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        {description}
                    </DialogDescription>
                </div>

                {/* Enhanced status and ID display */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:flex-col sm:items-end">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className={getStatusBadgeClasses(proposal.status)}
                        >
                            {proposal.status?.charAt(0).toUpperCase() + proposal.status?.slice(1)}
                        </Badge>
                    </div>

                    <div className="text-xs sm:text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                        ID: {proposal.id}
                    </div>

                    {/* Desktop close button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="hidden sm:flex items-center gap-2 text-sm px-3 py-1.5"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReviewDialogHeader; 