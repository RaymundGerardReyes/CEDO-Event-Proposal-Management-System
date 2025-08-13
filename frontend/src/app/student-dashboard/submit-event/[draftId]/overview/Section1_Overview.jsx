"use client"

import StatusBadge from "@/components/dashboard/student/common/StatusBadge"
import { Button } from "@/components/dashboard/student/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from '@/hooks/use-toast'
import { createDraft } from '@/lib/draft-api'
import { loadConfig } from "@/lib/utils"
import { AlertTriangle, CheckCircle, Edit, FileText, PlusCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from "react"

const Section1_Overview = ({ formData, onStartProposal, onContinueEditing, onViewProposal, onSubmitReport }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, isLoading: authLoading, isInitialized } = useAuth();

  // 🔧 DEBUG: Add debug logging to understand loading states
  console.log('🔍 Section1_Overview render state:', {
    hasFormData: !!formData,
    authUser: !!authUser,
    authLoading,
    isInitialized,
    formDataKeys: formData ? Object.keys(formData) : []
  });

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

  // 🔧 MERGED: Configuration and user profile state from AccomplishmentReport
  const [config, setConfig] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [userError, setUserError] = useState(null);

  // 🆕 Search & date filter state from AccomplishmentReport
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Load configuration first (from AccomplishmentReport)
  useEffect(() => {
    const loadAppConfig = async () => {
      try {
        const appConfig = await loadConfig();
        console.log("⚙️ Loaded config:", appConfig);
        setConfig(appConfig);
      } catch (err) {
        console.error("❌ Error loading config:", err);
        // Set fallback config
        const fallbackConfig = {
          apiUrl: process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000',
          backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000'
        };
        console.log("🔄 Using fallback config:", fallbackConfig);
        setConfig(fallbackConfig);
      }
    };
    loadAppConfig();
  }, []);

  // Use auth context user data instead of fetching profile (from AccomplishmentReport)
  useEffect(() => {
    if (!isInitialized) return; // Wait for auth to initialize

    if (authLoading) {
      setIsLoadingUserData(true);
      return;
    }

    if (authUser) {
      console.log("👤 Using user data from auth context:", authUser);
      setUserProfileData(authUser);
      setUserError(null);
    } else {
      console.log("⚠️ No authenticated user found");
      setUserError("No authenticated user found");
    }

    console.log("🔍 Auth state:", { authUser, authLoading, isInitialized });

    setIsLoadingUserData(false);
  }, [authUser, authLoading, isInitialized]);

  // Local fallback when parent does not supply a handler
  const handleStartProposal = async () => {
    try {
      // Add this user check here:
      if (!authUser || isNaN(Number(authUser.id))) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in as a real user to create a draft.",
          variant: "destructive",
        });
        return;
      }

      // Get token from localStorage or cookies
      let token = null;
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('cedo_token');
        if (!token) {
          // Try to get from cookies if not in localStorage
          const match = document.cookie.match(/(?:^|; )cedo_token=([^;]*)/);
          if (match) token = match[1];
        }
      }

      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'No authentication token found. Please sign in again.',
          variant: 'destructive',
        });
        return;
      }

      const { draftId } = await createDraft(token);
      toast({ title: 'Draft created', description: 'Let\'s fill in your organisation details', variant: 'default' });
      router.push(`/student-dashboard/submit-event/${draftId}/event-type`);
    } catch (err) {
      console.error('Failed to create draft', err);
      toast({ title: 'Failed to start proposal', description: err.message || 'Unexpected error', variant: 'destructive' });
    }
  };

  // Prefer parent callback when provided, otherwise use fallback
  const startProposal = onStartProposal || handleStartProposal;

  // 🔧 MERGED: Enhanced fetchApprovedEvents from AccomplishmentReport
  const fetchApprovedEvents = useCallback(async () => {
    const userId = userProfileData?.id;
    const userRole = userProfileData?.role || 'student';

    // Do not fetch if the user is a student/partner but we don't have their ID yet.
    // This prevents fetching all events by mistake.
    if ((userRole === 'student' || userRole === 'partner') && !userId) {
      console.warn("User ID not found in profile data. Skipping event fetch to prevent loading incorrect data.");
      setIsLoadingEvents(false);
      setApprovedEvents([]); // Ensure the list is empty
      return;
    }

    setIsLoadingEvents(true);
    setEventsError(null);

    try {
      const backend = config?.backendUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const queryParams = new URLSearchParams();

      // Admins see all events. Other roles are filtered by their User ID.
      if (userRole !== 'admin' && userId) {
        queryParams.append('userId', userId);
      }
      queryParams.append('status', 'approved,pending');

      const url = `${backend}/api/events/approved?${queryParams.toString()}`;
      console.log(`✅ Fetching events for user ${userId || '(admin)'} from URL: ${url}`);

      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      });

      if (!res.ok) throw new Error(`Events fetch failed: ${res.status}`);

      const data = await res.json();
      let eventsArr = data.events || data.data || data.proposals || [];

      // Transform & filter approved
      const formatted = (Array.isArray(eventsArr) ? eventsArr : [])
        .filter((ev) => ['approved', 'pending'].includes(ev.proposal_status || ev.status))
        .map((event) => ({
          id: event.id || event._id,
          organization_name:
            event.organization_name || event.organizationName || "Unknown Org",
          organization_type:
            event.organization_type || event.organizationType || "school-based",
          event_name: event.event_name || event.eventName || "Unnamed Event",
          event_venue: event.event_venue || event.eventVenue || "TBD",
          event_start_date: event.event_start_date || event.startDate,
          event_end_date: event.event_end_date || event.endDate,
          proposal_status: event.proposal_status || event.status,
          report_status: event.report_status || event.reportStatus || "not_applicable",
          accomplishment_report_file_name:
            event.accomplishment_report_file_name || event.accomplishmentReportFileName,
          contact_email: event.contact_email || event.contactEmail,
          contact_name: event.contact_name || event.contactName,
          event_status: event.event_status || event.eventStatus || "pending",
          form_completion_percentage:
            event.form_completion_percentage || 0,
        }));

      setApprovedEvents(formatted);
    } catch (err) {
      console.error("❌ Error fetching approved events:", err);
      setEventsError(err.message);
      setApprovedEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [userProfileData, config]);

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

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000'

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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:5000'
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

  // 🔧 MERGED: Reporting helpers from AccomplishmentReport
  const updateReportDataFromEvent = useCallback((updates) => {
    setSelectedEventForReport((prev) => ({ ...prev, ...updates }));
  }, []);

  // 🔧 DATA MAPPING: Create a correctly structured formData object for the Section5 component.
  const reportFormData = useMemo(() => {
    if (!selectedEventForReport) return null;

    // Maps fields from the `event` object to the structure Section5 expects.
    return {
      ...selectedEventForReport,
      id: selectedEventForReport.id,
      proposalId: selectedEventForReport.id,
      organizationName: selectedEventForReport.organization_name,
      contactEmail: selectedEventForReport.contact_email,
      contactName: selectedEventForReport.contact_name,
      organizationType: selectedEventForReport.organization_type,
      organizationTypes: [selectedEventForReport.organization_type],
      schoolEventName: selectedEventForReport.organization_type === 'school-based' ? selectedEventForReport.event_name : '',
      communityEventName: selectedEventForReport.organization_type === 'community-based' ? selectedEventForReport.event_name : '',
      schoolVenue: selectedEventForReport.organization_type === 'school-based' ? selectedEventForReport.event_venue : '',
      communityVenue: selectedEventForReport.organization_type === 'community-based' ? selectedEventForReport.event_venue : '',
      schoolStartDate: selectedEventForReport.organization_type === 'school-based' ? selectedEventForReport.event_start_date : '',
      communityStartDate: selectedEventForReport.organization_type === 'community-based' ? selectedEventForReport.event_start_date : '',
      schoolEndDate: selectedEventForReport.organization_type === 'school-based' ? selectedEventForReport.event_end_date : '',
      communityEndDate: selectedEventForReport.organization_type === 'community-based' ? selectedEventForReport.event_end_date : '',
      event_status: selectedEventForReport.event_status, // Pass through event_status
      proposalStatus: selectedEventForReport.proposal_status,
    };
  }, [selectedEventForReport]);

  // 🆕 Helper to reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setFromDate("");
    setToDate("");
  };

  // 🆕 Derived list after applying client-side filters
  const filteredEvents = approvedEvents.filter((event) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      (event.event_name?.toLowerCase() || "").includes(query) ||
      (event.organization_name?.toLowerCase() || "").includes(query);

    const eventStart = new Date(event.event_start_date);
    const fromOk = !fromDate || eventStart >= new Date(fromDate);
    const toOk = !toDate || eventStart <= new Date(toDate);

    return matchesSearch && fromOk && toOk;
  });

  // 🔧 SIMPLIFIED: Remove complex loading conditions to ensure component renders
  // Only show loading if absolutely necessary (auth not initialized)
  if (!isInitialized) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-10">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm">Loading authentication...</span>
        </CardContent>
      </Card>
    );
  }

  // 🔧 SIMPLIFIED: Show user error but still render the component
  if (userError) {
    console.warn('⚠️ User error detected but continuing to render:', userError);
  }

  console.log('✅ Section1_Overview rendering main content');

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
                <Button onClick={startProposal} className="gap-2">
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
            {/* 🔧 MERGED: Header from AccomplishmentReport */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-2">Accomplishment Reports</h3>
              <p className="text-sm text-muted-foreground">
                Manage accomplishment reports for your approved events
              </p>
            </div>

            {/* Loading state for approved events */}
            {isLoadingEvents && (
              <div className="bg-white border rounded-lg p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
                </div>
                <h3 className="text-lg font-medium mb-2">Loading Approved Events</h3>
                <p className="text-muted-foreground">
                  Fetching your approved events from database...
                </p>
              </div>
            )}

            {/* Error state for approved events */}
            {eventsError && !isLoadingEvents && (
              <div className="bg-white border border-red-200 rounded-lg p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-red-600">Failed to Load Events</h3>
                <p className="text-muted-foreground mb-4">
                  {eventsError}
                </p>
                <Button onClick={fetchApprovedEvents} variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Retry Loading Events
                </Button>
              </div>
            )}

            {/* No approved events */}
            {!isLoadingEvents && !eventsError && approvedEvents.length === 0 && (
              <div className="bg-white border rounded-lg p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-600">No Approved Events</h3>
                <p className="text-muted-foreground">
                  You don't have any approved events yet. Submit an event proposal to get started.
                </p>
                <Button onClick={() => setActiveTab("proposal")} variant="outline" className="mt-4">
                  Go to Event Proposal
                </Button>
              </div>
            )}

            {/* List of approved events */}
            {!isLoadingEvents && !eventsError && approvedEvents.length > 0 && !selectedEventForReport && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    📋 <strong>{filteredEvents.length}</strong> of {approvedEvents.length} Approved Event{approvedEvents.length > 1 ? 's' : ''} shown – refine your search below
                  </p>
                </div>

                {/* 🆕 Filters UI */}
                <div className="bg-white border rounded-lg p-4 flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Search</label>
                    <input
                      type="text"
                      placeholder="Search by event or organization…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">From</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">To</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="border rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <Button onClick={resetFilters} variant="outline" className="md:ml-2 mt-2 md:mt-6">Clear</Button>
                </div>

                <div className="grid gap-4">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-lg">{event.event_name}</h4>
                            <StatusBadge status={event.report_status} />
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p><strong>Organization:</strong> {event.organization_name}</p>
                            <p><strong>Type:</strong> {event.organization_type}</p>
                            <p><strong>Venue:</strong> {event.event_venue}</p>
                            <p><strong>Date:</strong> {new Date(event.event_start_date).toLocaleDateString()} - {new Date(event.event_end_date).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> {event.event_status || 'Pending'}</p>
                            {event.accomplishment_report_file_name && (
                              <p className="text-green-600">
                                <strong>Report:</strong> {event.accomplishment_report_file_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {event.report_status === 'not_applicable' || !event.accomplishment_report_file_name ? (
                            <Button
                              onClick={() => handleSelectEventForReport(event)}
                              className="w-full sm:w-auto"
                            >
                              Create Report
                            </Button>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <Link
                                href={`/student-dashboard/reports/${event.id}`}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                View Report
                              </Link>
                              <Button
                                onClick={() => handleSelectEventForReport(event)}
                                variant="outline"
                                className="w-full sm:w-auto"
                                size="sm"
                              >
                                Edit Report
                              </Button>
                            </div>
                          )}
                          <div className="text-xs text-center text-muted-foreground">
                            ID: {event.id}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🆕 No events match filters */}
            {!isLoadingEvents && !eventsError && approvedEvents.length > 0 && filteredEvents.length === 0 && !selectedEventForReport && (
              <div className="bg-white border rounded-lg p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-600">No Events Match Your Filters</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search text or date range.</p>
                <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
              </div>
            )}

            {/* Report creation/editing interface */}
            {selectedEventForReport && (
              <div className="space-y-4">
                {/* Back button and event info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">
                      {selectedEventForReport.accomplishment_report_file_name
                        ? 'Viewing Report'
                        : 'Creating Report'}: {selectedEventForReport.event_name}
                    </h3>
                    <Button
                      onClick={() => setSelectedEventForReport(null)}
                      variant="outline"
                      size="sm"
                    >
                      ← Back to Events List
                    </Button>
                  </div>
                  <p className="text-sm text-blue-700">
                    Organization: {selectedEventForReport.organization_name} |
                    Date: {new Date(selectedEventForReport.event_start_date).toLocaleDateString()}
                  </p>
                </div>

                {/* Render the form only when we have the mapped data */}
                {reportFormData && (
                  <div className="w-full">
                    <div className="text-center py-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Reporting Section
                      </h2>
                      <p className="text-gray-600">
                        This section has been refactored to use the new clean architecture.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Please navigate to the reporting page directly for the updated interface.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default Section1_Overview
