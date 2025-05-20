"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Check, ChevronRight, AlertCircle, Clock, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

export function MultiPhaseForm({
  phases,
  initialPhase = 0,
  initialData = {},
  onSubmit,
  onSaveDraft,
  proposalStatus = "draft",
  eventCompleted = false,
  isAdmin = false,
}) {
  const [currentPhase, setCurrentPhase] = useState(initialPhase)
  const [formData, setFormData] = useState(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const { toast } = useToast()

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (proposalStatus === "draft" || proposalStatus === "revision_needed") {
        handleSaveDraft(formData)
      }
    }, 30000)

    return () => clearInterval(autosaveInterval)
  }, [formData, proposalStatus])

  // Determine which phases should be visible based on status
  const getVisiblePhases = () => {
    if (proposalStatus === "draft" || proposalStatus === "pending" || proposalStatus === "revision_needed") {
      // During initial submission, only show phases 1-4
      return phases.slice(0, 4)
    } else if (proposalStatus === "approved" && eventCompleted) {
      // After approval and event completion, show all phases
      return phases
    } else if (proposalStatus === "approved") {
      // After approval but before event completion, show phases 1-4
      return phases.slice(0, 4)
    }
    return phases
  }

  const visiblePhases = getVisiblePhases()

  const handlePhaseSubmit = (phaseData) => {
    const updatedData = { ...formData, ...phaseData }
    setFormData(updatedData)

    // If this is the final submission phase (Phase 4)
    if (currentPhase === 3) {
      setConfirmAction("submit_proposal")
      setConfirmDialogOpen(true)
    }
    // If this is the accomplishment report phase (Phase 5)
    else if (currentPhase === 4) {
      setConfirmAction("submit_report")
      setConfirmDialogOpen(true)
    }
    // Otherwise, just move to the next phase
    else if (currentPhase < visiblePhases.length - 1) {
      setCurrentPhase(currentPhase + 1)
      window.scrollTo(0, 0)
    }
  }

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(formData, confirmAction)
      toast({
        title: confirmAction === "submit_proposal" ? "Proposal Submitted" : "Accomplishment Report Submitted",
        description:
          confirmAction === "submit_proposal"
            ? "Your event proposal has been submitted for review."
            : "Your accomplishment report has been submitted for verification.",
      })
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your form. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setConfirmDialogOpen(false)
    }
  }

  const handleSaveDraft = async (data) => {
    try {
      await onSaveDraft(data)
      toast({
        title: "Draft Saved",
        description: "Your progress has been saved.",
      })
    } catch (error) {
      console.error("Save draft error:", error)
    }
  }

  const handleBack = () => {
    if (currentPhase > 0) {
      setCurrentPhase(currentPhase - 1)
      window.scrollTo(0, 0)
    }
  }

  const isPhaseEditable = (phaseIndex) => {
    // Phase 1-4 are editable if status is draft or revision needed
    if (phaseIndex < 4) {
      return proposalStatus === "draft" || proposalStatus === "revision_needed"
    }
    // Phase 5 is editable if it's visible and not yet approved
    else if (phaseIndex === 4) {
      return eventCompleted && proposalStatus !== "report_approved"
    }
    return false
  }

  const CurrentPhaseComponent = visiblePhases[currentPhase]?.component

  return (
    <div className="space-y-8">
      {/* Status indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-cedo-blue">Event Proposal</h2>
          <p className="text-muted-foreground">Complete all required information to submit your proposal</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={cn(
              "px-3 py-1 text-sm",
              proposalStatus === "draft" && "bg-gray-100 text-gray-800 hover:bg-gray-100",
              proposalStatus === "pending" && "bg-amber-100 text-amber-800 hover:bg-amber-100",
              proposalStatus === "revision_needed" && "bg-orange-100 text-orange-800 hover:bg-orange-100",
              proposalStatus === "approved" && "bg-green-100 text-green-800 hover:bg-green-100",
              proposalStatus === "rejected" && "bg-red-100 text-red-800 hover:bg-red-100",
              proposalStatus === "report_pending" && "bg-purple-100 text-purple-800 hover:bg-purple-100",
              proposalStatus === "report_approved" && "bg-blue-100 text-blue-800 hover:bg-blue-100",
            )}
          >
            {proposalStatus === "draft" && "Draft"}
            {proposalStatus === "pending" && "Pending Review"}
            {proposalStatus === "revision_needed" && "Revision Needed"}
            {proposalStatus === "approved" && (eventCompleted ? "Event Completed" : "Approved")}
            {proposalStatus === "rejected" && "Rejected"}
            {proposalStatus === "report_pending" && "Report Pending"}
            {proposalStatus === "report_approved" && "Report Approved"}
          </Badge>
          {proposalStatus === "draft" && (
            <Button variant="outline" size="sm" onClick={() => handleSaveDraft(formData)} className="whitespace-nowrap">
              Save Draft
            </Button>
          )}
        </div>
      </div>

      {/* Desktop progress indicator */}
      <div className="hidden md:block">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {visiblePhases.map((phase, index) => (
              <li
                key={phase.name}
                className={cn(index !== visiblePhases.length - 1 ? "pr-8 sm:pr-20" : "", "relative")}
              >
                {index < currentPhase ? (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-cedo-blue" />
                    </div>
                    <button
                      type="button"
                      className="relative flex h-8 w-8 items-center justify-center rounded-full bg-cedo-blue hover:bg-cedo-blue/90"
                      onClick={() => isPhaseEditable(index) && setCurrentPhase(index)}
                      disabled={!isPhaseEditable(index)}
                    >
                      <Check className="h-5 w-5 text-white" aria-hidden="true" />
                      <span className="sr-only">{phase.name}</span>
                    </button>
                  </>
                ) : index === currentPhase ? (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-gray-200" />
                    </div>
                    <div
                      className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-cedo-blue bg-white"
                      aria-current="step"
                    >
                      <span className="h-2.5 w-2.5 rounded-full bg-cedo-blue" aria-hidden="true" />
                      <span className="sr-only">{phase.name}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-gray-200" />
                    </div>
                    <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                      <span
                        className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300"
                        aria-hidden="true"
                      />
                      <span className="sr-only">{phase.name}</span>
                    </div>
                  </>
                )}
                <div
                  className={cn(
                    "mt-2 text-sm font-medium",
                    index === currentPhase ? "text-cedo-blue" : "text-gray-500",
                  )}
                >
                  {phase.name}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Mobile phase indicator */}
      <div className="md:hidden">
        <p className="text-sm font-medium text-gray-500">
          Phase {currentPhase + 1} of {visiblePhases.length}
        </p>
        <h3 className="text-lg font-medium text-cedo-blue">{visiblePhases[currentPhase].name}</h3>
      </div>

      {/* Phase content */}
      <Card className="border border-[#f0f0f0] shadow-sm">
        <CardHeader>
          <CardTitle>{visiblePhases[currentPhase].name}</CardTitle>
          <CardDescription>{visiblePhases[currentPhase].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {proposalStatus === "revision_needed" && currentPhase === 3 && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-800">Revision Required</h4>
                <p className="text-sm text-orange-700">
                  Your proposal needs revisions before it can be approved. Please review the feedback below and make the
                  necessary changes.
                </p>
              </div>
            </div>
          )}

          {proposalStatus === "approved" && !eventCompleted && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Awaiting Event Completion</h4>
                <p className="text-sm text-blue-700">
                  Your proposal has been approved. After the event is completed, you'll be able to submit your
                  documentation and accomplishment report.
                </p>
              </div>
            </div>
          )}

          {proposalStatus === "approved" && eventCompleted && currentPhase < 4 && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
              <FileText className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Event Completed</h4>
                <p className="text-sm text-green-700">
                  Your event has been marked as completed. Please proceed to the Documentation & Accomplishment Report
                  phase to submit your final documentation.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 bg-white text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() => setCurrentPhase(4)}
                >
                  Go to Documentation Phase
                </Button>
              </div>
            </div>
          )}

          <CurrentPhaseComponent
            formData={formData}
            onSubmit={handlePhaseSubmit}
            isLastPhase={currentPhase === visiblePhases.length - 1}
            isEditable={isPhaseEditable(currentPhase)}
          />
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      {isPhaseEditable(currentPhase) && (
        <div className="flex justify-between pt-5 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={handleBack} disabled={currentPhase === 0 || isSubmitting}>
            Back
          </Button>

          <div className="flex gap-2">
            {(proposalStatus === "draft" || proposalStatus === "revision_needed") && (
              <Button type="button" variant="outline" onClick={() => handleSaveDraft(formData)} disabled={isSubmitting}>
                Save Draft
              </Button>
            )}

            <Button
              type="submit"
              form={`phase-${currentPhase}-form`}
              disabled={isSubmitting || !isPhaseEditable(currentPhase)}
              className="bg-cedo-blue hover:bg-cedo-blue/90"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : currentPhase === 3 ? (
                "Submit Proposal"
              ) : currentPhase === 4 ? (
                "Submit Report"
              ) : (
                <>
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "submit_proposal" ? "Submit Event Proposal" : "Submit Accomplishment Report"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "submit_proposal"
                ? "Are you sure you want to submit this event proposal? Once submitted, you won't be able to make changes unless revisions are requested."
                : "Are you sure you want to submit this accomplishment report? Make sure all required documentation is attached."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="bg-cedo-blue hover:bg-cedo-blue/90"
            >
              {isSubmitting ? "Submitting..." : "Confirm Submission"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
