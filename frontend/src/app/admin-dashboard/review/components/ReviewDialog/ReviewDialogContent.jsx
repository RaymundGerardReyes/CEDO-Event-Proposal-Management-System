/**
 * ReviewDialogContent - Content Area Component for Review Dialog
 * 
 * This component handles the main content area of the review dialog,
 * providing a scrollable container for the tab content.
 */


const ReviewDialogContent = ({
    children,
    className = ""
}) => {
    return (
        <div className={`flex-1 overflow-y-auto bg-gray-50/30 ${className}`}>
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <div className="max-w-none space-y-6 sm:space-y-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default ReviewDialogContent; 