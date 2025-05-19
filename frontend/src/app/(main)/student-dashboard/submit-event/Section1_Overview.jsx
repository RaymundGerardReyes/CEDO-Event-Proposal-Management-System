"use client"

import { Button } from "@/components/dashboard/student/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs"
import { ArrowRight, FileText, PlusCircle, Edit, CheckCircle, AlertTriangle } from "lucide-react"
import StatusBadge from "@/components/dashboard/student/common/StatusBadge"

const Section1_Overview = ({ formData, onStartProposal, onContinueEditing, onViewProposal, onSubmitReport }) => {
  const hasActiveProposal = formData?.hasActiveProposal || false
  const proposalStatus = formData?.proposalStatus || "draft"
  const reportStatus = formData?.reportStatus || "draft"
  const isApproved = proposalStatus === "approved"
  const isDenied = proposalStatus === "denied"
  const isPending = proposalStatus === "pending"
  const isReportSubmitted = reportStatus === "pending" || reportStatus === "approved" || reportStatus === "denied"

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Submit Event Approval</CardTitle>
        <CardDescription>
          Submit your event proposal for approval and track its status through the approval process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="proposal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="proposal">Event Proposal</TabsTrigger>
            <TabsTrigger value="report" disabled={!isApproved}>
              Accomplishment Report
            </TabsTrigger>
          </TabsList>
          <TabsContent value="proposal" className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">Event Proposal Status</h3>
              <div className="flex items-center gap-2">
                <StatusBadge status={proposalStatus} />
                {isPending && (
                  <p className="text-sm text-muted-foreground">Your proposal is being reviewed by the admin.</p>
                )}
                {isApproved && (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Your proposal has been approved!
                  </p>
                )}
                {isDenied && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Your proposal has been denied. Please review admin comments.
                  </p>
                )}
              </div>
            </div>

            {!hasActiveProposal && (
              <div className="bg-white border rounded-lg p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Start a New Event Proposal</h3>
                <p className="text-muted-foreground mb-4">
                  Create a new event proposal to get approval for your upcoming event.
                </p>
                <Button onClick={onStartProposal} className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Start New Proposal
                </Button>
              </div>
            )}

            {hasActiveProposal && (
              <div className="space-y-4">
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium">{formData.organizationName || "Event Proposal"}</h3>
                      <p className="text-muted-foreground">
                        {formData.organizationTypes?.includes("school-based")
                          ? formData.schoolEventName
                          : formData.communityEventName || "Unnamed Event"}
                      </p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      {proposalStatus === "draft" && (
                        <Button onClick={onContinueEditing} className="w-full sm:w-auto gap-2">
                          <Edit className="h-4 w-4" />
                          Continue Editing
                        </Button>
                      )}
                      {(proposalStatus === "pending" ||
                        proposalStatus === "approved" ||
                        proposalStatus === "denied") && (
                        <Button onClick={onViewProposal} variant="outline" className="w-full sm:w-auto">
                          View Proposal
                        </Button>
                      )}
                      {proposalStatus === "denied" && (
                        <Button onClick={onContinueEditing} className="w-full sm:w-auto gap-2">
                          <Edit className="h-4 w-4" />
                          Edit & Resubmit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="report" className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">Accomplishment Report Status</h3>
              <div className="flex items-center gap-2">
                <StatusBadge status={reportStatus} />
                {reportStatus === "pending" && (
                  <p className="text-sm text-muted-foreground">Your report is being reviewed by the admin.</p>
                )}
                {reportStatus === "approved" && (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Your report has been approved!
                  </p>
                )}
                {reportStatus === "denied" && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Your report has been denied. Please review admin comments.
                  </p>
                )}
              </div>
            </div>

            {isApproved && !isReportSubmitted && (
              <div className="bg-white border rounded-lg p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Submit Accomplishment Report</h3>
                <p className="text-muted-foreground mb-4">
                  Your event proposal has been approved. After the event, submit an accomplishment report.
                </p>
                <Button onClick={onSubmitReport} className="gap-2">
                  Submit Report
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isReportSubmitted && (
              <div className="bg-white border rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium">Accomplishment Report</h3>
                    <p className="text-muted-foreground">
                      {formData.organizationTypes?.includes("school-based")
                        ? formData.schoolEventName
                        : formData.communityEventName || "Unnamed Event"}
                    </p>
                  </div>
                  <div>
                    <Button onClick={onSubmitReport} variant="outline">
                      View Report
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default Section1_Overview
