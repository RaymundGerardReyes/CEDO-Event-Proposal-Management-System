/**
 * ReviewDialogTabs - Tab Navigation Component for Review Dialog
 * 
 * This component handles the tab navigation and content switching
 * for the review dialog system.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/admin/ui/tabs";
import EventDetails from "../../EventDetails";
import CommentsPanel from "../../comments";
import DecisionPanel from "../../decision";
import OverviewTab from "./tabs/OverviewTab";


const ReviewDialogTabs = ({
    proposal,
    activeTab,
    onTabChange,
    reviewDecision,
    setReviewDecision,
    reviewComment,
    setReviewComment,
    newComment,
    setNewComment,
    onAddComment,
    isApprovedProposal
}) => {
    if (!proposal) return null;

    return (
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            {/* Enhanced Tab Navigation */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-1 mb-6 shadow-sm">
                <TabsList className="grid w-full grid-cols-4 h-12 bg-transparent p-0">
                    <TabsTrigger
                        value="overview"
                        className="
              text-sm font-medium rounded-md transition-all duration-200
              data-[state=active]:bg-cedo-blue data-[state=active]:text-white data-[state=active]:shadow-sm
              hover:bg-gray-100 data-[state=active]:hover:bg-cedo-blue
            "
                    >
                        Overview
                    </TabsTrigger>
                    <TabsTrigger
                        value="events"
                        className="
              text-sm font-medium rounded-md transition-all duration-200
              data-[state=active]:bg-cedo-blue data-[state=active]:text-white data-[state=active]:shadow-sm
              hover:bg-gray-100 data-[state=active]:hover:bg-cedo-blue
            "
                    >
                        Event Details
                    </TabsTrigger>
                    <TabsTrigger
                        value="comments"
                        className="
              text-sm font-medium rounded-md transition-all duration-200
              data-[state=active]:bg-cedo-blue data-[state=active]:text-white data-[state=active]:shadow-sm
              hover:bg-gray-100 data-[state=active]:hover:bg-cedo-blue
            "
                    >
                        Comments
                    </TabsTrigger>
                    <TabsTrigger
                        value="decision"
                        className="
              text-sm font-medium rounded-md transition-all duration-200
              data-[state=active]:bg-cedo-blue data-[state=active]:text-white data-[state=active]:shadow-sm
              hover:bg-gray-100 data-[state=active]:hover:bg-cedo-blue
            "
                    >
                        Decision
                    </TabsTrigger>
                </TabsList>
            </div>

            {/* Tab Content */}
            <TabsContent value="overview" className="space-y-6">
                <OverviewTab proposal={proposal} />
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
                <EventDetails selectedProposal={proposal} />
            </TabsContent>

            <TabsContent value="comments" className="space-y-6">
                <CommentsPanel
                    selectedProposal={proposal}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    handleAddComment={onAddComment}
                />
            </TabsContent>

            <TabsContent value="decision" className="space-y-6">
                <DecisionPanel
                    reviewDecision={reviewDecision}
                    setReviewDecision={setReviewDecision}
                    reviewComment={reviewComment}
                    setReviewComment={setReviewComment}
                />
            </TabsContent>
        </Tabs>
    );
};

export default ReviewDialogTabs; 