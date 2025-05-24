"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useMachine } from "@xstate/react"
import { useEffect, useRef, useState } from "react"
import { SubmissionErrorDialog } from "./dialogs/SubmissionErrorDialog"
import { SubmissionSuccessDialog } from "./dialogs/SubmissionSuccessDialog"
import { SubmitProposalDialog } from "./dialogs/SubmitProposalDialog"
import { eventStateMachine, loadPersistedFormData, STATUS } from "./eventStateMachine"
import Section1_Overview from "./Section1_Overview"
import Section2_OrgInfo from "./Section2_OrgInfo"
import Section3_SchoolEvent from "./Section3_SchoolEvent"
import Section4_CommunityEvent from "./Section4_CommunityEvent"
import Section5_Reporting from "./Section5_Reporting"
import { ValidationErrorsAlert } from "./ValidationErrorsAlert"

const SubmitEventFlow = () => {
  const { toast } = useToast()
  const toastShownRef = useRef(false)

  // Initialize with default values for testing
  const defaultFormData = {
    currentSection: "overview",
    organizationName: "",
    organizationTypes: [],
    hasActiveProposal: false,
    proposalStatus: "draft",
    reportStatus: "draft",
    validationErrors: {},
  }

  // Initialize the state machine with persisted data or default data
  const [state, send] = useMachine(eventStateMachine, {
    context: {
      formData: typeof window !== "undefined" ? { ...defaultFormData, ...loadPersistedFormData() } : defaultFormData,
      errors: {},
      submissionId: null,
      error: null,
    },
  })

  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showReportingDialog, setShowReportingDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Safely access formData and its properties
  const formData = state.context.formData || defaultFormData
  const currentSection = formData.currentSection || "overview"
  const validationErrors = formData.validationErrors || {}
  const hasValidationErrors = Object.keys(validationErrors).length > 0

  // Calculate progress based on current state
  useEffect(() => {
    const stateToProgress = {
      overview: 20,
      orgInfo: 40,
      schoolEvent: 60,
      communityEvent: 80,
      pendingReview: 90,
      approved: 90,
      denied: 40,
      reporting: 95,
      reportPending: 98,
      reportApproved: 100,
      reportDenied: 95,
    }

    setProgress(stateToProgress[currentSection] || 0)

    // Reset toast shown flag when section changes
    toastShownRef.current = false
  }, [currentSection])

  // Handle form updates
  const handleFormUpdate = (data) => {
    if (data) {
      console.log("Updating form data:", data)

      // Create a new update object
      const update = { ...data }

      // If we're updating form fields and not explicitly setting validation errors,
      // clear any existing validation errors for those fields
      if (data.validationErrors === undefined) {
        const updatedValidationErrors = { ...(formData.validationErrors || {}) }
        let errorsChanged = false

        // Clear validation errors for fields being updated
        Object.keys(data).forEach((key) => {
          if (updatedValidationErrors && updatedValidationErrors[key]) {
            delete updatedValidationErrors[key]
            errorsChanged = true
          }
        })

        // Only include updated validation errors if they changed
        if (errorsChanged) {
          update.validationErrors = updatedValidationErrors
        }
      }

      // Always send data with the event
      send({
        type: "UPDATE_FORM",
        data: update,
      })
    } else {
      // If no data is provided, send an empty object to avoid undefined errors
      send({
        type: "UPDATE_FORM",
        data: {},
      })
    }
  }

  // Section 1 handlers
  const handleStartProposal = () => {
    send({ type: "START_PROPOSAL" })
  }

  const handleContinueEditing = () => {
    send({ type: "CONTINUE_EDITING" })
  }

  const handleViewProposal = () => {
    send({ type: "VIEW_ACTIVE_PROPOSAL" })
  }

  const handleSubmitReport = () => {
    send({ type: "SUBMIT_REPORT" })
  }

  // Section 2 handlers
  const handleSection2Next = () => {
    // The validation is now handled in the Section2_OrgInfo component
    // This function is called only when validation has passed
    send({ type: "NEXT" })
  }

  const handleSection2Previous = () => {
    send({ type: "PREVIOUS" })
  }

  const handleSection2Withdraw = () => {
    send({ type: "WITHDRAW" })
  }

  // Section 3 handlers
  const handleSection3Next = () => {
    // Validate required fields for Section 3
    const errors = {}
    const requiredFields = [
      "schoolEventName",
      "schoolVenue",
      "schoolStartDate",
      "schoolEndDate",
      "schoolTimeStart",
      "schoolTimeEnd",
      "schoolEventType",
      "schoolEventMode",
      "schoolReturnServiceCredit",
    ]

    requiredFields.forEach((field) => {
      if (!formData[field]) {
        errors[field] = `${field.replace("school", "")} is required`
      }
    })

    if (!formData.schoolTargetAudience || formData.schoolTargetAudience.length === 0) {
      errors.schoolTargetAudience = "At least one target audience must be selected"
    }

    if (Object.keys(errors).length > 0) {
      // Update form data with validation errors
      handleFormUpdate({ validationErrors: errors })

      // Show toast with error message
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive",
      })

      return
    }

    // Clear validation errors and proceed
    handleFormUpdate({ validationErrors: {} })
    send({ type: "NEXT" })
  }

  const handleSection3Previous = () => {
    send({ type: "PREVIOUS" })
  }

  const handleSection3Withdraw = () => {
    send({ type: "WITHDRAW" })
  }

  // Section 4 handlers
  const handleSection4Submit = () => {
    // Validate form data before showing submit dialog
    const errors = {}

    if (!formData.organizationName) {
      errors.organizationName = "Organization name is required"
    }

    if (!formData.organizationTypes || formData.organizationTypes.length === 0) {
      errors.organizationTypes = "At least one organization type must be selected"
    }

    if (Object.keys(errors).length > 0) {
      // Update form data with validation errors
      handleFormUpdate({ validationErrors: errors })

      // Show toast with error message
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      })

      return
    }

    // Clear validation errors before proceeding
    handleFormUpdate({ validationErrors: {} })
    setShowSubmitDialog(true)
  }

  const handleSection4Previous = () => {
    send({ type: "PREVIOUS" })
  }

  const handleSection4Withdraw = () => {
    send({ type: "WITHDRAW" })
  }

  // Section 5 handlers
  const handleSection5Submit = () => {
    send({ type: "SUBMIT_REPORT" })
  }

  const handleSection5Previous = () => {
    send({ type: "PREVIOUS" })
  }

  // Dialog handlers
  const handleSubmitConfirm = async () => {
    setShowSubmitDialog(false)
    setIsSubmitting(true)

    try {
      console.log("Submitting form data:", formData)

      // Check if organization name is present
      if (!formData.organizationName) {
        throw new Error("Organization name is required")
      }

      // Set hasActiveProposal to true before submitting
      const updatedFormData = {
        ...formData,
        hasActiveProposal: true,
        proposalStatus: "pending",
        validationErrors: {}, // Clear any validation errors
      }

      // Update the state machine with the updated form data
      handleFormUpdate({
        hasActiveProposal: true,
        proposalStatus: "pending",
        validationErrors: {},
      })

      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock successful submission for demo purposes
      // In a real app, you would call the API here
      // const result = await submitEventProposal(updatedFormData)
      const result = { id: "event-" + Date.now() }

      // Update the state machine with the submission result
      send({
        type: "SUBMIT",
        data: { submissionId: result.id },
      })

      setIsSubmitting(false)
      setShowSuccessDialog(true)
      toast({
        title: "Event Submitted!",
        description: "Your event proposal has been submitted successfully.",
      })
    } catch (error) {
      console.error("Submission error:", error)
      setIsSubmitting(false)
      setShowErrorDialog(true)
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your event proposal.",
        variant: "destructive",
      })
    }
  }

  const handleRetry = () => {
    setShowErrorDialog(false)
    send({ type: "RETRY" })
  }

  const handleEdit = () => {
    setShowErrorDialog(false)
    send({ type: "BACK_TO_FORM" })
  }

  const handleSuccessDone = () => {
    setShowSuccessDialog(false)
    // Reset the form
    window.location.href = "/student-dashboard/submit-event"
  }

  // For demonstration purposes - these would be API calls in a real app
  const handleApproveProposal = () => {
    send({ type: "APPROVE_PROPOSAL" })
    toast({
      title: "Proposal Approved",
      description: "The event proposal has been approved.",
    })
  }

  const handleDenyProposal = () => {
    send({ type: "DENY_PROPOSAL" })
    toast({
      title: "Proposal Denied",
      description: "The event proposal has been denied.",
    })
  }

  const handleApproveReport = () => {
    send({ type: "APPROVE_REPORT" })
    toast({
      title: "Report Approved",
      description: "The accomplishment report has been approved.",
    })
  }

  const handleDenyReport = () => {
    send({ type: "DENY_REPORT" })
    toast({
      title: "Report Denied",
      description: "The accomplishment report has been denied.",
    })
  }

  // Show validation error toast only once per section
  useEffect(() => {
    if (hasValidationErrors && !toastShownRef.current) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before continuing.",
        variant: "destructive",
      })
      toastShownRef.current = true
    }
  }, [hasValidationErrors, toast])

  // Render the current section based on state
  const renderCurrentSection = () => {
    switch (state.value) {
      case STATUS.OVERVIEW:
        return (
          <Section1_Overview
            formData={formData}
            onStartProposal={handleStartProposal}
            onContinueEditing={handleContinueEditing}
            onViewProposal={handleViewProposal}
            onSubmitReport={handleSubmitReport}
          />
        )
      case STATUS.ORG_INFO:
        return (
          <>
            {hasValidationErrors && <ValidationErrorsAlert errors={validationErrors} />}
            <Section2_OrgInfo
              formData={formData}
              onChange={handleFormUpdate}
              onNext={handleSection2Next}
              onPrevious={handleSection2Previous}
              onWithdraw={handleSection2Withdraw}
              errors={validationErrors}
              disabled={formData.proposalStatus === "pending" || formData.proposalStatus === "approved"}
            />
          </>
        )
      case STATUS.SCHOOL_EVENT:
        return (
          <>
            {hasValidationErrors && <ValidationErrorsAlert errors={validationErrors} />}
            <Section3_SchoolEvent
              formData={formData}
              handleInputChange={(e) => {
                // Direct pass-through of the event object to ensure proper handling
                if (e && e.target) {
                  handleFormUpdate({ [e.target.name]: e.target.value })
                }
              }}
              handleFileChange={(e) => {
                if (e && e.target && e.target.files && e.target.files[0]) {
                  handleFormUpdate({ [e.target.name]: e.target.files[0] })
                }
              }}
              handleCheckboxChange={(name, checked) => {
                handleFormUpdate({ [name]: checked })
              }}
              onNext={handleSection3Next}
              onPrevious={handleSection3Previous}
              onWithdraw={handleSection3Withdraw}
              disabled={formData.proposalStatus === "pending" || formData.proposalStatus === "approved"}
            />
          </>
        )
      case STATUS.COMMUNITY_EVENT:
        return (
          <>
            {hasValidationErrors && <ValidationErrorsAlert errors={validationErrors} />}
            <Section4_CommunityEvent
              formData={formData}
              handleInputChange={(e) => {
                if (e && e.target) {
                  handleFormUpdate({ [e.target.name]: e.target.value })
                }
              }}
              handleFileChange={(e) => {
                if (e && e.target && e.target.files && e.target.files[0]) {
                  handleFormUpdate({ [e.target.name]: e.target.files[0] })
                }
              }}
              handleCheckboxChange={(name, checked) => {
                handleFormUpdate({ [name]: checked })
              }}
              onSubmit={handleSection4Submit}
              onPrevious={handleSection4Previous}
              onWithdraw={handleSection4Withdraw}
              disabled={formData.proposalStatus === "pending" || formData.proposalStatus === "approved"}
            />
          </>
        )
      case STATUS.PENDING_REVIEW:
        return (
          <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Proposal Under Review</h2>
            <p className="mb-4">
              Your event proposal is currently under review. You will be notified once a decision has been made.
            </p>

            {/* For demonstration purposes only - in a real app this would be admin-only */}
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <h3 className="font-medium mb-2">Demo Controls (Admin Only)</h3>
              <div className="flex gap-2">
                <Button onClick={handleApproveProposal} className="bg-green-600 hover:bg-green-700">
                  Approve Proposal
                </Button>
                <Button onClick={handleDenyProposal} className="bg-red-600 hover:bg-red-700">
                  Deny Proposal
                </Button>
              </div>
            </div>

            <Button onClick={() => send({ type: "BACK_TO_OVERVIEW" })} variant="outline">
              Back to Overview
            </Button>
          </div>
        )
      case STATUS.APPROVED:
        return (
          <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-green-700">Proposal Approved</h2>
            <p className="mb-4">
              Congratulations! Your event proposal has been approved. You can now proceed to submit your accomplishment
              report after the event takes place.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleSubmitReport} className="bg-blue-600 hover:bg-blue-700">
                Submit Accomplishment Report
              </Button>
              <Button onClick={() => send({ type: "BACK_TO_OVERVIEW" })} variant="outline">
                Back to Overview
              </Button>
            </div>
          </div>
        )
      case STATUS.DENIED:
        return (
          <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-red-700">Proposal Denied</h2>
            <p className="mb-4">
              Your event proposal has been denied. You can edit and resubmit your proposal or withdraw it to start a new
              one.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => send({ type: "EDIT_PROPOSAL" })} className="bg-amber-600 hover:bg-amber-700">
                Edit Proposal
              </Button>
              <Button onClick={() => send({ type: "WITHDRAW_PROPOSAL" })} className="bg-red-600 hover:bg-red-700">
                Withdraw Proposal
              </Button>
              <Button onClick={() => send({ type: "BACK_TO_OVERVIEW" })} variant="outline">
                Back to Overview
              </Button>
            </div>
          </div>
        )
      case STATUS.REPORTING:
        return (
          <>
            {hasValidationErrors && <ValidationErrorsAlert errors={validationErrors} />}
            <Section5_Reporting
              formData={formData}
              updateFormData={handleFormUpdate}
              onSubmit={handleSection5Submit}
              onPrevious={handleSection5Previous}
              disabled={formData.reportStatus === "pending" || formData.reportStatus === "approved"}
              sectionsComplete={{
                section1: true,
                section2: true,
                section3: formData.organizationTypes?.includes("school-based") ? true : undefined,
                section4: formData.organizationTypes?.includes("community-based") ? true : undefined,
              }}
            />
          </>
        )
      case STATUS.REPORT_PENDING:
        return (
          <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Report Under Review</h2>
            <p className="mb-4">
              Your accomplishment report is currently under review. You will be notified once a decision has been made.
            </p>

            {/* For demonstration purposes only - in a real app this would be admin-only */}
            <div className="bg-gray-100 p-4 rounded-md mb-4">
              <h3 className="font-medium mb-2">Demo Controls (Admin Only)</h3>
              <div className="flex gap-2">
                <Button onClick={handleApproveReport} className="bg-green-600 hover:bg-green-700">
                  Approve Report
                </Button>
                <Button onClick={handleDenyReport} className="bg-red-600 hover:bg-red-700">
                  Deny Report
                </Button>
              </div>
            </div>

            <Button onClick={() => send({ type: "BACK_TO_OVERVIEW" })} variant="outline">
              Back to Overview
            </Button>
          </div>
        )
      case STATUS.REPORT_APPROVED:
        return (
          <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-green-700">Report Approved</h2>
            <p className="mb-4">
              Congratulations! Your accomplishment report has been approved. The workflow is now complete.
            </p>
            <Button onClick={() => send({ type: "COMPLETE_WORKFLOW" })} className="bg-green-600 hover:bg-green-700">
              Complete Workflow
            </Button>
          </div>
        )
      case STATUS.REPORT_DENIED:
        return (
          <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-red-700">Report Denied</h2>
            <p className="mb-4">Your accomplishment report has been denied. You can edit and resubmit your report.</p>
            <div className="flex gap-2">
              <Button onClick={() => send({ type: "EDIT_REPORT" })} className="bg-amber-600 hover:bg-amber-700">
                Edit Report
              </Button>
              <Button onClick={() => send({ type: "BACK_TO_OVERVIEW" })} variant="outline">
                Back to Overview
              </Button>
            </div>
          </div>
        )
      case STATUS.SUBMITTING:
        return (
          <div className="flex justify-center items-center p-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-lg">Submitting your event proposal...</p>
            </div>
          </div>
        )
      case STATUS.ERROR:
        return (
          <div className="w-full max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-red-700">Submission Error</h2>
            <p className="mb-4">
              There was an error submitting your event proposal. Please try again or go back to edit your form.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
                Retry Submission
              </Button>
              <Button onClick={handleEdit} variant="outline">
                Back to Form
              </Button>
            </div>
          </div>
        )
      default:
        return <div>Unknown state</div>
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4">
      <div className="mb-6">
        <div className="relative pt-1">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Start</span>
            <span>Complete</span>
          </div>
        </div>
      </div>

      {renderCurrentSection()}

      {/* Dialogs */}
      <SubmitProposalDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        onSubmit={handleSubmitConfirm}
        isSubmitting={isSubmitting}
      />

      <SubmissionSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onDone={handleSuccessDone}
      />

      <SubmissionErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        onRetry={handleRetry}
        onEdit={handleEdit}
      />
    </div>
  )
}

export default SubmitEventFlow
