// frontend/src/app/student-dashboard/drafts/page.jsx

"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { getDraftsAndRejected } from "@/services/proposal-service"
import { AlertCircle, CheckCircle2, Clock, Database, FileEdit, Filter, RefreshCcw, Trash2, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

// Enhanced loading component with better visual feedback
function DraftsPageLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse p-4 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <div className="h-6 sm:h-8 w-48 sm:w-64 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 sm:h-4 w-80 sm:w-96 bg-gray-200 rounded"></div>
      </div>

      {/* Loading skeleton for tabs */}
      <div className="space-y-4">
        <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 sm:h-24 w-full bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Memoized status badge component
const StatusBadge = ({ status, source }) => {
  const statusInfo = useMemo(() => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return { color: 'bg-blue-100 text-blue-800', icon: FileEdit, label: 'Draft' };
      case 'denied':
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' };
      case 'revision_requested':
        return { color: 'bg-yellow-100 text-yellow-800', icon: RefreshCcw, label: 'Needs Revision' };
      case 'pending':
        return { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Pending' };
      case 'approved':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Approved' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: FileEdit, label: status || 'Unknown' };
    }
  }, [status]);

  const { color, icon: Icon, label } = statusInfo;

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${color} flex items-center gap-1 text-xs px-2 py-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
      {source && (
        <Badge variant="outline" className="text-xs">
          {source === 'postgresql' ? 'PostgreSQL' : source === 'mysql' ? 'MySQL' : source === 'mongodb' ? 'MongoDB' : source}
        </Badge>
      )}
    </div>
  );
};

// Hydration-safe wrapper component
function HydrationSafeWrapper({ children, fallback = null }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback || <DraftsPageLoading />;
  }

  return children;
}

// Main content component with enhanced optimization
function DraftsContent() {
  const router = useRouter()
  const { user, isLoading: authLoading, isInitialized } = useAuth()

  // Consolidated state management
  const [state, setState] = useState({
    proposals: [],
    loading: true,
    error: null,
    metadata: null,
    activeTab: 'all',
    processingProposal: null,
    showDeleteDialog: false,
    proposalToDelete: null
  })

  // Refs for cleanup and preventing race conditions
  const mountedRef = useRef(true)
  const fetchControllerRef = useRef(null)
  const refreshIntervalRef = useRef(null)
  // Prevent duplicate/rapid requests
  const isFetchingRef = useRef(false)
  const lastFetchTimeRef = useRef(0)
  const visibilityDebounceRef = useRef(null)

  // Memoized backend URL and token
  const backendConfig = useMemo(() => ({
    backend: process.env.API_URL || 'http://localhost:5000',
    getToken: () => {
      if (typeof window === 'undefined') return null;
      return localStorage.getItem('cedo_token') ||
        document.cookie.split('; ').find(row => row.startsWith('cedo_token='))?.split('=')[1];
    }
  }), []);

  // Optimized date formatter
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(date);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return 'Invalid Date';
    }
  }, []);

  // Optimized step name getter
  const getStepName = useCallback((step) => {
    if (typeof step === 'string' && step !== 'Unknown Step') return step;

    const steps = {
      overview: "Overview",
      orgInfo: "Organization Info",
      schoolEvent: "School Event Details",
      communityEvent: "Community Event Details",
      reporting: "Reporting",
    };
    return steps[step] || "Unknown Step";
  }, []);

  // Enhanced fetch function with better error handling and race condition prevention
  const fetchProposals = useCallback(async () => {
    // Cooldown: avoid bursts within 1.5s
    const now = Date.now()
    if (isFetchingRef.current || now - lastFetchTimeRef.current < 1500) {
      return
    }

    if (!user?.email || !mountedRef.current) {
      setState(prev => ({ ...prev, proposals: [], loading: false }))
      return
    }

    // No need for abort controller with service function

    try {
      isFetchingRef.current = true
      setState(prev => ({ ...prev, loading: true, error: null }))

      console.log('📋 Fetching drafts and rejected proposals for user:', user.email)

      // Use the new service function
      const result = await getDraftsAndRejected({
        includeRejected: true,
        limit: 100,
        offset: 0
      })

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch proposals')
      }

      const proposals = result.data || []
      console.log('📋 Drafts and rejected proposals loaded:', proposals.length)

      // Transform proposals to match component expectations
      const transformedProposals = proposals.map(proposal => ({
        id: proposal.uuid, // Use UUID as ID
        uuid: proposal.uuid,
        name: proposal.eventName || proposal.event_name || 'Untitled Event',
        organizationName: proposal.organizationName || proposal.organization_name,
        organizationType: proposal.organizationType || proposal.organization_type,
        contactPerson: proposal.contactPerson || proposal.contact_person,
        contactEmail: proposal.contactEmail || proposal.contact_email,
        contactPhone: proposal.contactPhone || proposal.contact_phone,
        eventName: proposal.eventName || proposal.event_name,
        eventVenue: proposal.eventVenue || proposal.event_venue,
        eventStartDate: proposal.eventStartDate || proposal.event_start_date,
        eventEndDate: proposal.eventEndDate || proposal.event_end_date,
        eventStartTime: proposal.eventStartTime || proposal.event_start_time,
        eventEndTime: proposal.eventEndTime || proposal.event_end_time,
        eventMode: proposal.eventMode || proposal.event_mode,
        eventType: proposal.eventType || proposal.event_type,
        targetAudience: proposal.targetAudience || proposal.target_audience,
        sdpCredits: proposal.sdpCredits || proposal.sdp_credits,
        currentSection: proposal.currentSection || proposal.current_section,
        formCompletionPercentage: proposal.formCompletionPercentage || proposal.form_completion_percentage,
        proposalStatus: proposal.proposalStatus || proposal.proposal_status,
        reportStatus: proposal.reportStatus || proposal.report_status,
        eventStatus: proposal.eventStatus || proposal.event_status,
        attendanceCount: proposal.attendanceCount || proposal.attendance_count,
        objectives: proposal.objectives,
        budget: proposal.budget,
        volunteersNeeded: proposal.volunteersNeeded || proposal.volunteers_needed,
        reportDescription: proposal.reportDescription || proposal.report_description,
        adminComments: proposal.adminComments || proposal.admin_comments,
        submittedAt: proposal.submittedAt || proposal.submitted_at,
        approvedAt: proposal.approvedAt || proposal.approved_at,
        createdAt: proposal.createdAt || proposal.created_at,
        updatedAt: proposal.updatedAt || proposal.updated_at,
        userName: proposal.userName || proposal.user_name,
        userEmail: proposal.userEmail || proposal.user_email,
        // Map to component expected fields
        status: proposal.proposalStatus || proposal.proposal_status,
        step: proposal.currentSection || proposal.current_section,
        progress: proposal.formCompletionPercentage || proposal.form_completion_percentage || 0,
        lastEdited: proposal.updatedAt || proposal.updated_at || proposal.createdAt || proposal.created_at,
        source: 'postgresql', // Since we're using PostgreSQL
        data: proposal // Store full proposal data
      }))

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          proposals: transformedProposals,
          metadata: result.metadata || {},
          loading: false,
          error: null,
        }))
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      // Log as a plain object so custom logger can serialize correctly
      console.error('❌ Failed to fetch proposals:', {
        name: err?.name,
        message: err?.message,
        stack: typeof err?.stack === 'string' ? err.stack.split('\n')[0] : undefined,
      })
      if (!mountedRef.current) return

      let userFriendlyMessage = err.message
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        userFriendlyMessage = `Cannot connect to backend server. Please check:\n\n1. Backend server is running (npm run dev in backend folder)\n2. Backend URL is correct: ${backendConfig.backend}\n3. No firewall blocking the connection\n4. CORS is properly configured`
      } else if (err.message.includes('Authentication token')) {
        userFriendlyMessage = 'Authentication expired. Please sign in again.'
      }

      setState(prev => ({ ...prev, error: userFriendlyMessage, loading: false }))
    } finally {
      lastFetchTimeRef.current = Date.now()
      isFetchingRef.current = false
    }
  }, [user?.email])

  // Enhanced proposal handling with better error recovery
  const handleContinueProposal = useCallback((proposal) => {
    if (state.processingProposal === proposal.id) {
      //       console.log('⚠️ Already processing this proposal');
      return;
    }

    try {
      //       console.log('🔄 handleContinueProposal called with:', {
      //         id: proposal.id,
      //         status: proposal.status,
      //         source: proposal.source,
      //         name: proposal.name
      //       });

      setState(prev => ({ ...prev, processingProposal: proposal.id }));

      // Store proposal info for continuation
      const proposalData = {
        id: proposal.id,
        source: proposal.source,
        organizationName: proposal.organizationName,
        organizationType: proposal.organizationType,
        contactEmail: proposal.contactEmail,
        contactName: proposal.contactName,
        eventName: proposal.eventName || proposal.name,
        currentSection: proposal.currentSection,
        status: proposal.status,
        data: proposal.data || {}
      };

      localStorage.setItem('currentDraft', JSON.stringify(proposalData));

      // Navigate based on status
      if (proposal.status === 'draft') {
        const sectionRoutes = {
          'overview': '/student-dashboard/submit-event',
          'orgInfo': '/student-dashboard/submit-event',
          'schoolEvent': '/student-dashboard/submit-event',
          'communityEvent': '/student-dashboard/submit-event',
          'reporting': '/student-dashboard/submit-event'
        };
        const targetRoute = sectionRoutes[proposal.currentSection] || '/student-dashboard/submit-event';
        router.push(targetRoute);
      } else if (['rejected', 'denied', 'revision_requested'].includes(proposal.status)) {
        const reviewUrl = `/student-dashboard/submit-event?mode=review&proposalId=${proposal.id}&source=${proposal.source}`;
        router.push(reviewUrl);
      } else {
        router.push("/student-dashboard/submit-event");
      }

      // Clear processing state after navigation
      setTimeout(() => {
        if (mountedRef.current) {
          setState(prev => ({ ...prev, processingProposal: null }));
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Error in handleContinueProposal:', error);

      if (mountedRef.current) {
        setState(prev => ({ ...prev, processingProposal: null }));
      }

      // Show user-friendly error message
      alert(`Failed to ${proposal.status === 'draft' ? 'continue' : 'review'} proposal: ${error.message}`);

      // Fallback navigation
      try {
        router.push("/student-dashboard/submit-event");
      } catch (fallbackError) {
        console.error('❌ Fallback navigation failed:', fallbackError);
        alert('Navigation failed. Please try refreshing the page.');
      }
    }
  }, [state.processingProposal, router]);

  // Optimized delete handlers
  const handleDeleteProposal = useCallback((proposalId) => {
    setState(prev => ({
      ...prev,
      proposals: prev.proposals.filter((proposal) => proposal.id !== proposalId),
      showDeleteDialog: false,
      proposalToDelete: null
    }));
    // TODO: Implement actual deletion API call
  }, []);

  const confirmDelete = useCallback((proposal) => {
    setState(prev => ({
      ...prev,
      proposalToDelete: proposal,
      showDeleteDialog: true
    }));
  }, []);

  // Memoized filtered proposals
  const filteredProposals = useMemo(() => {
    switch (state.activeTab) {
      case 'drafts':
        return state.proposals.filter(p => p.status === 'draft');
      case 'rejected':
        return state.proposals.filter(p => ['denied', 'rejected', 'revision_requested'].includes(p.status));
      default:
        return state.proposals;
    }
  }, [state.proposals, state.activeTab]);

  // Memoized tab counts
  const tabCounts = useMemo(() => ({
    all: state.proposals.length,
    drafts: state.proposals.filter(p => p.status === 'draft').length,
    rejected: state.proposals.filter(p => ['denied', 'rejected', 'revision_requested'].includes(p.status)).length
  }), [state.proposals]);

  // Optimized effects with proper cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Auto-load on mount and when user changes
  useEffect(() => {
    if (!authLoading && user && isInitialized && mountedRef.current) {
      fetchProposals();
    }
  }, [fetchProposals, authLoading, user, isInitialized]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibility = () => {
      if (!user || !mountedRef.current) return
      if (document.visibilityState !== 'visible') return
      // Debounce and throttle visibility-triggered refresh
      if (visibilityDebounceRef.current) clearTimeout(visibilityDebounceRef.current)
      visibilityDebounceRef.current = setTimeout(() => {
        const now = Date.now()
        if (now - lastFetchTimeRef.current > 5000) {
          fetchProposals()
        }
      }, 300)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      if (visibilityDebounceRef.current) clearTimeout(visibilityDebounceRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchProposals, user])

  // Periodic refresh with proper cleanup
  useEffect(() => {
    if (!user) return
    // Set a single interval; guard inside based on last fetch
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
    refreshIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) return
      const now = Date.now()
      if (!state.loading && now - lastFetchTimeRef.current >= 30000) {
        fetchProposals()
      }
    }, 5000) // check frequently, fetch no more than every 30s

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
    }
  }, [fetchProposals, user, state.loading])

  // Early returns for different states
  if (authLoading || !isInitialized) {
    return <DraftsPageLoading />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to view your drafts and rejected proposals.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              My Proposals
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your draft and rejected event submissions
            </p>
          </div>
          {state.metadata && (
            <div className="text-right text-sm text-muted-foreground">
              <p>Total: <span className="font-medium">{state.metadata.total || 0}</span></p>
              <p>Source: <span className="font-medium">PostgreSQL</span></p>
            </div>
          )}
        </div>
      </div>

      {state.loading ? (
        <DraftsPageLoading />
      ) : state.error ? (
        <Alert variant="destructive" className="p-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load proposals</AlertTitle>
          <AlertDescription>
            <div className="space-y-3">
              <div className="whitespace-pre-line text-sm">
                {state.error}
              </div>

              {/* Specific troubleshooting based on error type */}
              {state.error.includes('Cannot connect to backend server') && (
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Backend Connection Issue</p>
                  <div className="space-y-2 text-xs text-yellow-700">
                    <p>• Check if backend server is running: <code className="bg-yellow-100 px-1 rounded">npm run dev</code> in backend folder</p>
                    <p>• Verify backend URL: <code className="bg-yellow-100 px-1 rounded">{backendConfig.backend}</code></p>
                    <p>• Check browser console for detailed error logs</p>
                  </div>
                </div>
              )}

              {state.error.includes('Authentication') && (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <p className="text-sm font-medium text-blue-800 mb-2">Authentication Issue</p>
                  <p className="text-xs text-blue-700">Please sign out and sign back in to refresh your authentication token.</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={fetchProposals} disabled={state.loading}>
                  <RefreshCcw className={`h-4 w-4 mr-1 ${state.loading ? 'animate-spin' : ''}`} />
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    //                     console.log('🔍 Current environment:');
                    //                     console.log('- Backend URL:', backendConfig.backend);
                    //                     console.log('- User:', user);
                    //                     console.log('- Token present:', !!backendConfig.getToken());
                    //                     console.log('- Current error:', state.error);
                    alert('Debug info logged to console. Check browser developer tools.');
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Debug Info
                </Button>

                {state.error.includes('Cannot connect to backend server') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(`${backendConfig.backend}/api/health`);
                        if (response.ok) {
                          alert('✅ Backend is responding! Try refreshing the page.');
                        } else {
                          alert(`❌ Backend responded with status: ${response.status}`);
                        }
                      } catch (err) {
                        alert(`❌ Cannot reach backend: ${err.message}`);
                      }
                    }}
                  >
                    <Database className="h-4 w-4 mr-1" />
                    Test Backend
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Statistics and Tabs */}
          <div className="space-y-4">
            {state.metadata && (
              <Alert className="p-4">
                <Database className="h-4 w-4" />
                <AlertTitle>Data Summary</AlertTitle>
                <AlertDescription>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    <span>Total: <strong>{state.metadata.total || 0}</strong></span>
                    <span>Source: <strong>PostgreSQL</strong></span>
                    <span>Last Updated: <strong>{formatDate(new Date().toISOString())}</strong></span>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
                <TabsTrigger value="drafts">Drafts ({tabCounts.drafts})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({tabCounts.rejected})</TabsTrigger>
              </TabsList>

              <TabsContent value={state.activeTab} className="mt-6">
                {filteredProposals.length > 0 ? (
                  <div className="space-y-4">
                    {/* Data Integration Alert */}
                    <Alert className="p-4 sm:p-6">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      <AlertTitle className="text-sm sm:text-base font-medium">
                        Real-time Data Integration
                      </AlertTitle>
                      <AlertDescription className="text-xs sm:text-sm mt-1 sm:mt-2">
                        Your proposals are fetched directly from the PostgreSQL database.
                        Data is automatically updated and filtered by your user account.
                      </AlertDescription>
                    </Alert>

                    {/* Proposal Cards */}
                    {filteredProposals.map((proposal) => (
                      <Card key={`${proposal.source}-${proposal.id}`} className="shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-0">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 sm:p-6 space-y-4 lg:space-y-0">
                            {/* Proposal Information */}
                            <div className="space-y-2 sm:space-y-3 flex-1">
                              <div className="flex items-start justify-between">
                                <h3 className="font-medium text-base sm:text-lg lg:text-xl break-words pr-4">
                                  {proposal.name}
                                </h3>
                                <StatusBadge status={proposal.status} source={proposal.source} />
                              </div>

                              {/* Meta Information */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                  <span className="truncate">Last edited {formatDate(proposal.lastEdited)}</span>
                                </div>
                                <div className="flex items-center">
                                  <FileEdit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-muted-foreground flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-muted-foreground truncate">
                                    Step: {getStepName(proposal.step)}
                                  </span>
                                </div>
                              </div>

                              {/* Additional Info for Rejected Proposals */}
                              {proposal.adminComments && (
                                <div className="p-3 bg-yellow-50 rounded-md border-l-4 border-yellow-400">
                                  <p className="text-sm font-medium text-yellow-800">Admin Comments:</p>
                                  <p className="text-xs text-yellow-700 mt-1">{proposal.adminComments}</p>
                                </div>
                              )}
                            </div>

                            {/* Actions and Progress */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:ml-6">
                              {/* Progress Bar */}
                              <div className="order-1 sm:order-none">
                                <div className="text-xs text-muted-foreground mb-1">Progress</div>
                                <div className="w-full sm:w-24 lg:w-32 h-2 bg-gray-200 rounded-full">
                                  <div
                                    className="h-2 bg-[#0A2B70] rounded-full transition-all duration-300"
                                    style={{ width: `${proposal.calculatedProgress || proposal.progress}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {proposal.calculatedProgress || proposal.progress}% complete
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 sm:gap-3">
                                {/* Debug Button - only show in development */}
                                {process.env.NODE_ENV === 'development' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="min-h-[44px] sm:min-h-[40px] px-2 text-xs border border-dashed border-gray-300"
                                    onClick={() => {
                                      // Fixed: Use a valid object for console.log
                                      console.log('🐛 Debug button clicked for proposal:', {
                                        id: proposal.id,
                                        status: proposal.status,
                                        source: proposal.source,
                                        name: proposal.name,
                                        currentSection: proposal.currentSection,
                                        data: proposal.data
                                      });
                                      alert(`Debug Info:\nID: ${proposal.id}\nStatus: ${proposal.status}\nSource: ${proposal.source}\nName: ${proposal.name}\n\nCheck console for full details.`);
                                    }}
                                    title="Debug proposal data"
                                  >
                                    🐛
                                  </Button>
                                )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="min-h-[44px] sm:min-h-[40px] px-3 sm:px-4 text-xs sm:text-sm"
                                  onClick={() => confirmDelete(proposal)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500 sm:mr-1" />
                                  <span className="hidden sm:inline">Delete</span>
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="min-h-[44px] sm:min-h-[40px] px-4 sm:px-6 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                                  disabled={state.processingProposal === proposal.id}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleContinueProposal(proposal);
                                  }}
                                >
                                  {state.processingProposal === proposal.id
                                    ? (proposal.status === 'draft' ? 'Loading...' : 'Opening...')
                                    : (proposal.status === 'draft' ? 'Continue' : 'Review')
                                  }
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  // Empty State
                  <Card className="shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16 text-center px-4 sm:px-6">
                      <Filter className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-muted-foreground/50 mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg lg:text-xl font-medium mb-1 sm:mb-2">
                        No {state.activeTab === 'all' ? 'proposals' : state.activeTab} found
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground max-w-sm sm:max-w-md mb-4 sm:mb-6">
                        {state.activeTab === 'drafts'
                          ? "You don't have any draft proposals. Start a new submission to create one."
                          : state.activeTab === 'rejected'
                            ? "You don't have any rejected proposals."
                            : "You don't have any proposals yet. Start your first submission!"
                        }
                      </p>
                      <Button
                        className="min-h-[44px] px-6 text-sm sm:text-base"
                        onClick={() => router.push("/student-dashboard/submit-event")}
                      >
                        Submit New Event
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={state.showDeleteDialog} onOpenChange={(open) => setState(prev => ({ ...prev, showDeleteDialog: open }))}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg mx-auto">
          <DialogHeader className="space-y-2 sm:space-y-3">
            <DialogTitle className="text-lg sm:text-xl">Delete Proposal</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Are you sure you want to delete "{state.proposalToDelete?.name}"? This action cannot be undone.
              {state.proposalToDelete?.source && (
                <span className="block mt-2 text-xs text-muted-foreground">
                  Source: {state.proposalToDelete.source === 'postgresql' ? 'PostgreSQL Database' : state.proposalToDelete.source === 'mysql' ? 'MySQL Database' : 'MongoDB Database'}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              variant="outline"
              className="min-h-[44px] w-full sm:w-auto order-2 sm:order-1"
              onClick={() => setState(prev => ({ ...prev, showDeleteDialog: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px] w-full sm:w-auto order-1 sm:order-2"
              onClick={() => state.proposalToDelete && handleDeleteProposal(state.proposalToDelete.id)}
            >
              Delete Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Main export with enhanced Suspense wrapper and hydration safety
export default function DraftsPage() {
  return (
    <HydrationSafeWrapper>
      <DraftsContent />
    </HydrationSafeWrapper>
  );
}
