"use client"

import StatusBadge from "@/components/dashboard/student/common/StatusBadge"
import { Button } from "@/components/dashboard/student/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs"
import { AlertTriangle, CheckCircle, Edit, FileText, PlusCircle } from "lucide-react"
import { useCallback, useState } from "react"
import AccomplishmentReport from "./AccomplishmentReport"

const Section1_Overview = ({ formData, onStartProposal, onContinueEditing, onViewProposal, onSubmitReport }) => {
  const hasActiveProposal = formData?.hasActiveProposal || false
  const proposalStatus = formData?.proposalStatus || "draft"
  const reportStatus = formData?.reportStatus || "draft"
  const isApproved = proposalStatus === "approved"
  const isDenied = proposalStatus === "denied"
  const isPending = proposalStatus === "pending"
  const isReportSubmitted = reportStatus === "pending" || reportStatus === "approved" || reportStatus === "denied"

  // State management for tabs and report data
  const [activeTab, setActiveTab] = useState("proposal")
  const [reportData, setReportData] = useState(null)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [reportError, setReportError] = useState(null)

  // State for approved events list
  const [approvedEvents, setApprovedEvents] = useState([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [eventsError, setEventsError] = useState(null)
  const [selectedEventForReport, setSelectedEventForReport] = useState(null)

  // Fetch approved events from database
  const fetchApprovedEvents = useCallback(async () => {
    setIsLoadingEvents(true)
    setEventsError(null)

    try {
      console.log('🔍 Fetching approved events from database...')
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

      // Include contactEmail if available so the backend can filter records
      const contactEmail = formData?.contactEmail || localStorage.getItem('cedo_user_email') || ''
      const url = contactEmail ?
        `${backendUrl}/api/events/approved?email=${encodeURIComponent(contactEmail)}` :
        `${backendUrl}/api/events/approved`

      // Fetch approved events from your database schema
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch approved events: ${response.status}`)
      }

      const data = await response.json()
      let eventsArr = data.events || data.proposals || data.data || []

      // Fallback: if we filtered by email and got 0, retry without the filter
      if (eventsArr.length === 0 && contactEmail) {
        console.log('⚠️ No events with email filter, retrying without email')
        try {
          const resAll = await fetch(`${backendUrl}/api/events/approved`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          })
          if (resAll.ok) {
            const dataAll = await resAll.json()
            eventsArr = dataAll.events || dataAll.proposals || dataAll.data || []
          }
        } catch (retryErr) {
          console.warn('Retry without email failed', retryErr)
        }
      }

      const drafts = [] // placeholder keep same variable names if used later
      // reuse existing transformation logic below; simply set events variable
      let events = eventsArr

      console.log('✅ Extracted events array:', events)
      console.log('✅ Events is array?', Array.isArray(events))
      console.log('✅ Events length:', events.length)

      // Ensure we have an array before mapping
      if (!Array.isArray(events)) {
        console.warn('⚠️ Events is not an array, converting to empty array')
        events = []
      }

      // Filter and format events based on your database schema
      let formattedEvents = []

      try {
        formattedEvents = events
          .filter(event => event && typeof event === 'object') // Filter out null/undefined/invalid items
          .map(event => ({
            id: event.id || event._id,
            uuid: event.uuid,
            organization_name: event.organization_name || event.organizationName || 'Unknown Organization',
            organization_type: event.organization_type || event.organizationType || 'school-based',
            event_name: event.event_name || event.eventName || 'Unnamed Event',
            event_venue: event.event_venue || event.eventVenue || 'TBD',
            event_start_date: event.event_start_date || event.eventStartDate || event.start_date,
            event_end_date: event.event_end_date || event.eventEndDate || event.end_date,
            proposal_status: event.proposal_status || event.proposalStatus || 'draft',
            report_status: event.report_status || event.reportStatus || 'not_applicable',
            accomplishment_report_file_name: event.accomplishment_report_file_name || event.accomplishmentReportFileName,
            contact_email: event.contact_email || event.contactEmail,
            contact_name: event.contact_name || event.contactName,
            created_at: event.created_at || event.createdAt,
            updated_at: event.updated_at || event.updatedAt,
            event_status: event.event_status || event.eventStatus || 'pending',
            form_completion_percentage: event.form_completion_percentage || event.formCompletionPercentage || 0
          }))
          .filter(event => event.proposal_status === 'approved') // Only include approved events

        console.log(`✅ Successfully formatted ${formattedEvents.length} approved events`)
      } catch (mapError) {
        console.error('❌ Error formatting events:', mapError)
        console.error('❌ Events data causing error:', events)
        formattedEvents = [] // Fallback to empty array
      }

      setApprovedEvents(formattedEvents)
      console.log(`✅ Final result: ${formattedEvents.length} approved events set in state`)

    } catch (error) {
      console.error('❌ Error fetching approved events:', error)
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })

      // Provide more helpful error messages
      let errorMessage = error.message
      if (error.message.includes('map is not a function')) {
        errorMessage = 'API returned unexpected data format. Expected an array of events.'
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Failed to connect to the server. Please check your internet connection.'
      }

      setEventsError(errorMessage)
      setApprovedEvents([])
    } finally {
      setIsLoadingEvents(false)
    }
  }, [formData])

  // Data fetching function for accomplishment report
  const fetchReportData = useCallback(async (eventId = null) => {
    if (!formData?.id && !formData?.proposalId && !formData?.organizationName) {
      console.warn('No event ID available for report fetching')
      return
    }

    setIsLoadingReport(true)
    setReportError(null)

    try {
      console.log('🔍 Fetching report data for event:', {
        id: formData.id,
        proposalId: formData.proposalId,
        organizationName: formData.organizationName
      })

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

      // Try multiple endpoints to find the report data
      let reportResponse = null

      // First try by proposal ID
      if (formData.id || formData.proposalId) {
        const proposalId = formData.id || formData.proposalId
        try {
          reportResponse = await fetch(`${backendUrl}/api/reports/${proposalId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            }
          })

          if (!reportResponse.ok && reportResponse.status !== 404) {
            throw new Error(`Report fetch failed: ${reportResponse.status}`)
          }
        } catch (error) {
          console.warn('Report fetch by ID failed:', error)
        }
      }

      // If direct fetch failed, try searching by organization details
      if (!reportResponse || !reportResponse.ok) {
        if (formData.organizationName && formData.contactEmail) {
          try {
            reportResponse = await fetch(`${backendUrl}/api/reports/search`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                organization_name: formData.organizationName,
                contact_email: formData.contactEmail
              })
            })
          } catch (error) {
            console.warn('Report search failed:', error)
          }
        }
      }

      let reportData = null
      if (reportResponse && reportResponse.ok) {
        reportData = await reportResponse.json()
        console.log('✅ Report data fetched successfully:', reportData)
      } else {
        // Create default report structure if no existing data found
        console.log('📝 No existing report found, creating default structure')
        reportData = {
          ...formData,
          reportDescription: '',
          attendanceCount: '',
          eventStatus: '',
          accomplishmentReport: null,
          preRegistrationList: null,
          finalAttendanceList: null,
          isNewReport: true
        }
      }

      setReportData(reportData)
    } catch (error) {
      console.error('❌ Error fetching report data:', error)
      setReportError(error.message)
      // Provide fallback data structure
      setReportData({
        ...formData,
        reportDescription: '',
        attendanceCount: '',
        eventStatus: '',
        accomplishmentReport: null,
        preRegistrationList: null,
        finalAttendanceList: null,
        isNewReport: true,
        fetchError: error.message
      })
    } finally {
      setIsLoadingReport(false)
    }
  }, [formData])

  // Handle tab change with data fetching
  const handleTabChange = useCallback((value) => {
    setActiveTab(value)

    // Fetch approved events when switching to report tab
    if (value === "report") {
      console.log('🔄 Switching to report tab, fetching approved events...')
      fetchApprovedEvents()
    }
  }, [fetchApprovedEvents])

  // Handle event selection for report creation/viewing
  const handleSelectEventForReport = useCallback(async (event) => {
    console.log('📋 Event selected for report:', event)
    setSelectedEventForReport(event)

    // Fetch specific report data for this event
    setIsLoadingReport(true)
    try {
      await fetchReportData(event.id)
    } catch (error) {
      console.error('Error fetching report data for event:', error)
    } finally {
      setIsLoadingReport(false)
    }
  }, [fetchReportData])

  // Enhanced onSubmitReport function that switches to report tab
  const handleViewReport = useCallback(() => {
    console.log('📋 View Report clicked, switching to report tab')
    setActiveTab("report")

    // Fetch approved events list
    fetchApprovedEvents()

    // Call original onSubmitReport if it exists
    if (onSubmitReport) {
      onSubmitReport()
    }
  }, [fetchApprovedEvents, onSubmitReport])

  // Update report data in parent component
  const updateReportData = useCallback((updates) => {
    setReportData(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  // Handle report submission
  const handleReportSubmit = useCallback(async (submissionData) => {
    console.log('📤 Report submission from Section5:', submissionData)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const proposalId = formData.id || formData.proposalId

      const response = await fetch(`${backendUrl}/api/reports/${proposalId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submissionData,
          proposalId: proposalId,
          organizationName: formData.organizationName,
          submissionTimestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        console.log('✅ Report submitted successfully')
        // Refresh the data to show updated status
        await fetchReportData()

        // Call original onSubmitReport if provided
        if (onSubmitReport) {
          onSubmitReport(submissionData)
        }
      } else {
        throw new Error(`Report submission failed: ${response.status}`)
      }
    } catch (error) {
      console.error('❌ Report submission error:', error)
      throw error
    }
  }, [formData, fetchReportData, onSubmitReport])

  // Handle going back to proposal from report
  const handleReportPrevious = useCallback(() => {
    setActiveTab("proposal")
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Submit Event Approval</CardTitle>
        <CardDescription>
          Submit your event proposal for approval and track its status through the approval process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="proposal" className="w-full" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="proposal">Event Proposal</TabsTrigger>
            <TabsTrigger value="report">
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
                        {formData.organizationTypes?.[0] === "school-based"
                          ? "School Event Proposal"
                          : "Community Event Proposal"}
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

                {/* Accomplishment Report Actions - Show after proposal status */}
                {isApproved && !isReportSubmitted && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Submit Accomplishment Report</h3>
                    <p className="text-muted-foreground mb-4">
                      Your event proposal has been approved. After the event, submit an accomplishment report.
                    </p>
                    <Button onClick={handleViewReport} className="gap-2">
                      Submit Report
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {isReportSubmitted && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-medium">Accomplishment Report</h3>
                        <p className="text-muted-foreground">
                          {formData.organizationTypes?.[0] === "school-based"
                            ? formData.schoolEventName
                            : formData.communityEventName || "Unnamed Event"}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          Status: {reportStatus === "pending" ? "Under Review" :
                            reportStatus === "approved" ? "Approved" :
                              reportStatus === "denied" ? "Needs Revision" : "Submitted"}
                        </p>
                      </div>
                      <div>
                        <Button onClick={handleViewReport} variant="outline">
                          View Report
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="report" className="space-y-4 mt-4">
            <AccomplishmentReport
              isLoadingEvents={isLoadingEvents}
              eventsError={eventsError}
              approvedEvents={approvedEvents}
              setActiveTab={setActiveTab}
              fetchApprovedEvents={fetchApprovedEvents}
              selectedEventForReport={selectedEventForReport}
              handleSelectEventForReport={handleSelectEventForReport}
              setSelectedEventForReport={setSelectedEventForReport}
              isLoadingReport={isLoadingReport}
              reportData={reportData}
              updateReportData={updateReportData}
              handleReportSubmit={handleReportSubmit}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default Section1_Overview
