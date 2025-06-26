/**
 * ReviewDialog - Main Container Component
 * 
 * This is the main container component for the review dialog system.
 * It provides the dialog structure and context for child components.
 * 
 * Following compound components pattern for flexible composition.
 */

import { Dialog, DialogContent } from "@/components/ui/dialog";

const ReviewDialog = ({
    isOpen,
    onClose,
    children,
    className = ""
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`
          fixed left-[50%] top-[50%] z-50 
          w-[98vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[1200px] xl:max-w-[1400px]
          h-[95vh] max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh]
          translate-x-[-50%] translate-y-[-50%]
          flex flex-col
          border border-gray-200/80 bg-white shadow-2xl
          duration-300 ease-out
          data-[state=open]:animate-in data-[state=closed]:animate-out 
          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
          data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]
          data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
          data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
          rounded-none sm:rounded-lg md:rounded-xl
          overflow-hidden
          backdrop-blur-sm
          ${className}
        `}
            >
                {children}
            </DialogContent>
        </Dialog>
    );
};

export default ReviewDialog; 