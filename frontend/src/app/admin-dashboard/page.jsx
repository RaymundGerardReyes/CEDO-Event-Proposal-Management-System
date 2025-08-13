"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { PageHeader } from "@/components/dashboard/admin/page-header";
import { ResponsiveGrid } from "@/components/dashboard/admin/responsive-grid";
import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { Card, CardContent } from "@/components/dashboard/admin/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar, ClockIcon, FileText, TrendingDown, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import ProposalsHeaderControls from "./ProposalsHeaderControls";

/**
 * @typedef {Object} DashboardStats
 * @property {number} total
 * @property {number} pending
 * @property {number} approved
 * @property {number} rejected
 * @property {number} newSinceYesterday
 * @property {string} approvalRate
 * @property {string} dayOverDayPct
 * @property {boolean} isPositiveGrowth
 */

// Utility function to transform proposal data from API (MySQL schema) to frontend format
function transformProposal(proposal) {
  // Map backend API fields to frontend fields based on actual database schema from init-db.js
  // Schema fields: organization_name, organization_type, organization_description, contact_name, contact_email, contact_phone
  // event_name, event_venue, event_start_date, event_end_date, event_start_time, event_end_time, event_mode
  // school_event_type, school_return_service_credit, school_target_audience, community_event_type, community_sdp_credits
  // objectives, budget, volunteers_needed, attendance_count, proposal_status, event_status, etc.

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'TBD';
    }
  };

  // Format time helper
  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  // Format schedule helper
  const formatSchedule = (startDate, endDate, startTime, endTime) => {
    const start = formatDate(startDate);
    const end = formatDate(endDate);
    const timeStart = formatTime(startTime);
    const timeEnd = formatTime(endTime);

    if (start === 'TBD') return 'TBD';

    let schedule = start;
    if (end !== 'TBD' && start !== end) {
      schedule += ` to ${end}`;
    }
    if (timeStart && timeEnd) {
      schedule += `, ${timeStart} - ${timeEnd}`;
    } else if (timeStart) {
      schedule += `, ${timeStart}`;
    }

    return schedule;
  };

  // ✅ DEBUG: Log transformation for specific proposals
  if (proposal.id == 4 || proposal.event_name?.includes('Chuvanewss')) {
    console.log('🎯 [Frontend] DEBUG: transformProposal for ID 4:', {
      input_id: proposal.id,
      input_proposal_status: proposal.proposal_status,
      input_status: proposal.status,
      input_event_name: proposal.event_name,
      fallback_will_trigger: !proposal.proposal_status
    });
  }

  return {
    id: proposal.id, // Backend: id (from MySQL)
    title: proposal.event_name || 'Untitled Event', // Backend: event_name
    organization: proposal.organization_name || 'Unknown Organization', // Backend: organization_name
    submittedOn: proposal.created_at
      ? new Date(proposal.created_at).toISOString().split('T')[0]
      : 'N/A', // Backend: created_at
    status: proposal.proposal_status || 'pending', // Backend: proposal_status
    assignedTo: proposal.reviewed_by_admin_id ? `Admin ID: ${proposal.reviewed_by_admin_id}` : 'Unassigned', // Backend: reviewed_by_admin_id

    // Event details from database schema
    description: proposal.objectives || proposal.organization_description || 'No description available', // Backend: objectives or organization_description
    proposedVenue: proposal.event_venue || 'TBD', // Backend: event_venue
    proposedSchedule: formatSchedule(proposal.event_start_date, proposal.event_end_date, proposal.event_start_time, proposal.event_end_time), // Backend: event_start_date, event_end_date, event_start_time, event_end_time
    proposedSpeakers: 'TBD', // Not in current schema - would need to be added
    expectedParticipants: proposal.attendance_count || 'TBD', // Backend: attendance_count
    intendedGoal: proposal.objectives || 'TBD', // Backend: objectives
    requiredResources: `Budget: ₱${proposal.budget || 0}, Volunteers: ${proposal.volunteers_needed || 0}`, // Backend: budget, volunteers_needed

    // Additional schema fields
    location: proposal.event_venue, // Backend: event_venue
    schedule: formatSchedule(proposal.event_start_date, proposal.event_end_date, proposal.event_start_time, proposal.event_end_time),
    contactName: proposal.contact_name, // Backend: contact_name
    contactEmail: proposal.contact_email, // Backend: contact_email
    contactPhone: proposal.contact_phone, // Backend: contact_phone
    organizationType: proposal.organization_type, // Backend: organization_type
    organizationDescription: proposal.organization_description, // Backend: organization_description
    eventMode: proposal.event_mode, // Backend: event_mode
    schoolEventType: proposal.school_event_type, // Backend: school_event_type
    schoolReturnServiceCredit: proposal.school_return_service_credit, // Backend: school_return_service_credit
    schoolTargetAudience: proposal.school_target_audience, // Backend: school_target_audience (JSON)
    communityEventType: proposal.community_event_type, // Backend: community_event_type
    communitySdpCredits: proposal.community_sdp_credits, // Backend: community_sdp_credits
    communityTargetAudience: proposal.community_target_audience, // Backend: community_target_audience (JSON)
    budget: proposal.budget, // Backend: budget
    volunteersNeeded: proposal.volunteers_needed, // Backend: volunteers_needed
    attendanceCount: proposal.attendance_count, // Backend: attendance_count
    objectives: proposal.objectives, // Backend: objectives
    adminComments: proposal.admin_comments, // Backend: admin_comments
    digitalSignature: proposal.digital_signature, // Backend: digital_signature
    reportDescription: proposal.report_description, // Backend: report_description
    currentSection: proposal.current_section, // Backend: current_section
    hasActiveProposal: proposal.has_active_proposal, // Backend: has_active_proposal
    reportStatus: proposal.report_status, // Backend: report_status
    eventStatus: proposal.event_status, // Backend: event_status
    validationErrors: proposal.validation_errors, // Backend: validation_errors (JSON)
    formCompletionPercentage: proposal.form_completion_percentage, // Backend: form_completion_percentage

    // File references from schema
    schoolGpoaFileName: proposal.school_gpoa_file_name, // Backend: school_gpoa_file_name
    schoolGpoaFilePath: proposal.school_gpoa_file_path, // Backend: school_gpoa_file_path
    schoolProposalFileName: proposal.school_proposal_file_name, // Backend: school_proposal_file_name
    schoolProposalFilePath: proposal.school_proposal_file_path, // Backend: school_proposal_file_path
    communityGpoaFileName: proposal.community_gpoa_file_name, // Backend: community_gpoa_file_name
    communityGpoaFilePath: proposal.community_gpoa_file_path, // Backend: community_gpoa_file_path
    communityProposalFileName: proposal.community_proposal_file_name, // Backend: community_proposal_file_name
    communityProposalFilePath: proposal.community_proposal_file_path, // Backend: community_proposal_file_path
    accomplishmentReportFileName: proposal.accomplishment_report_file_name, // Backend: accomplishment_report_file_name
    accomplishmentReportFilePath: proposal.accomplishment_report_file_path, // Backend: accomplishment_report_file_path
    preRegistrationFileName: proposal.pre_registration_file_name, // Backend: pre_registration_file_name
    preRegistrationFilePath: proposal.pre_registration_file_path, // Backend: pre_registration_file_path
    finalAttendanceFileName: proposal.final_attendance_file_name, // Backend: final_attendance_file_name
    finalAttendanceFilePath: proposal.final_attendance_file_path, // Backend: final_attendance_file_path

    // Audit fields
    reviewedByAdminId: proposal.reviewed_by_admin_id, // Backend: reviewed_by_admin_id
    reviewedAt: proposal.reviewed_at, // Backend: reviewed_at
    submittedAt: proposal.submitted_at, // Backend: submitted_at
    approvedAt: proposal.approved_at, // Backend: approved_at

    // Legacy fields for backward compatibility
    speakers: null, // Not in current schema
    participants: [], // Not in current schema - would need separate table
    sponsors: null, // Not in current schema
    purpose: proposal.objectives, // Backend: objectives
    signedUpMembers: [], // Not in current schema - would need separate table
  };
}

// Utility to get JWT token from localStorage or cookies
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cedo_token') ||
    document.cookie.split('; ').find(row => row.startsWith('cedo_token='))?.split('=')[1];
}

// Hook for fetching dashboard statistics
const useDashboardStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from the backend API (MySQL-based stats)
      const token = getToken();
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include', // Include cookies for authentication
        cache: 'no-store', // Prevent browser caching of this request
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch dashboard statistics');
      }

      // Map backend stats to frontend format, with comments for each field
      // Backend returns: { success: true, data: { totalUsers, totalProposals, pendingApprovals, approvedUsers, recentUsers, timestamp } }
      const backendStats = data.data;
      console.log('📊 [Frontend] Backend stats data:', backendStats);

      setStats({
        total: backendStats.totalProposals || 0, // Backend: totalProposals (from MySQL proposals table)
        pending: backendStats.pendingApprovals || 0, // Backend: pendingApprovals (users pending approval)
        approved: backendStats.approvedUsers || 0, // Backend: approvedUsers (users approved)
        rejected: 0, // Not provided in this endpoint; would need a separate query for proposal rejections
        newSinceYesterday: backendStats.recentUsers || 0, // Backend: recentUsers (users created in last 30 days)
        approvalRate: backendStats.totalProposals > 0 ? `${Math.round((backendStats.approvedUsers / backendStats.totalProposals) * 100)}%` : '0%',
        dayOverDayPct: '0%', // Not provided; would need historical data comparison
        isPositiveGrowth: true, // Not provided; assuming positive growth as default
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[Admin Dashboard Stats Error]', {
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        endpoint: 'http://localhost:5000/api/admin/stats',
        hasToken: !!getToken(),
        timestamp: new Date().toISOString()
      });

      setError(errorMessage || 'Failed to fetch dashboard statistics');

      // Set fallback data
      setStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        newSinceYesterday: 0,
        approvalRate: '0%',
        dayOverDayPct: '0%',
        isPositiveGrowth: true,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

// Hook for fetching recent proposals with pagination
const useRecentProposals = () => {
  const [recentProposals, setRecentProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 5,
    hasNextPage: false,
    hasPreviousPage: false
  });

  const fetchProposals = useCallback(async (page = 1, showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }
      setError(null);

      // Use the hybrid API endpoint that combines MySQL + MongoDB
      const backendUrl = 'http://localhost:5000'; // Direct backend URL
      const apiUrl = `${backendUrl}/api/mongodb-unified/admin/proposals-hybrid?limit=${pagination.limit}&page=${page}`;

      console.log('🔍 [Frontend] Fetching proposals from:', apiUrl);

      const token = getToken();
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      console.log('📡 [Frontend] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Frontend] API Error:', response.status, response.statusText, errorText);
        throw new Error(`Failed to fetch proposals: ${response.status} - ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      console.log('📦 [Frontend] Raw API response:', data);
      console.log('📊 [Frontend] Proposals count:', data.proposals?.length || 0);
      console.log('📋 [Frontend] Pagination info:', data.pagination);

      // ✅ DEBUG: Log specific proposal ID 4 from API response
      const proposal4FromAPI = data.proposals?.find(p => p.id == 4 || p.id == '4');
      if (proposal4FromAPI) {
        console.log('🔍 [Frontend] DEBUG: API returned proposal ID 4 with status:', {
          id: proposal4FromAPI.id,
          proposal_status: proposal4FromAPI.proposal_status,
          status: proposal4FromAPI.status,
          organization_name: proposal4FromAPI.organization_name
        });
      }

      if (data.success && data.proposals) {
        // Use the utility function to transform each proposal
        const transformedProposals = data.proposals.map(transformProposal);
        console.log('✅ [Frontend] Transformed proposals:', transformedProposals);

        // ✅ DEBUG: Log specific proposal ID 4 after transformation
        const transformed4 = transformedProposals.find(p => p.id == 4 || p.title?.includes('Chuvanewss'));
        if (transformed4) {
          console.log('🔍 [Frontend] DEBUG: Transformed proposal ID 4 final status:', {
            title: transformed4.title,
            organization: transformed4.organization,
            status: transformed4.status,
            submittedOn: transformed4.submittedOn
          });
        }

        // Smooth transition: briefly delay to prevent jarring flicker
        if (!showLoadingState) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }

        setRecentProposals(transformedProposals);

        // Update pagination state - map backend response to frontend format
        if (data.pagination) {
          setPagination({
            currentPage: data.pagination.page || page,
            totalPages: data.pagination.pages || 1,
            totalCount: data.pagination.total || 0,
            limit: data.pagination.limit || 5,
            hasNextPage: data.pagination.hasNext || false,
            hasPreviousPage: data.pagination.hasPrev || false
          });
        }
      } else {
        console.warn('⚠️ [Frontend] API returned no proposals or error:', data);
        throw new Error(data.error || 'Failed to fetch proposals');
      }
    } catch (err) {
      console.error('❌ [Frontend] Error fetching recent proposals:', err);
      setError(err.message);
      setRecentProposals([]); // No fallback data!
      setPagination(prev => ({ ...prev, totalCount: 0, totalPages: 1 }));
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [pagination.limit]);

  const goToPage = useCallback(async (page) => {
    if (page >= 1 && page <= pagination.totalPages && !paginationLoading) {
      setPaginationLoading(true);
      try {
        await fetchProposals(page, false); // Don't show full loading state for pagination
      } finally {
        setPaginationLoading(false);
      }
    }
  }, [fetchProposals, pagination.totalPages, paginationLoading]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage && !paginationLoading) {
      goToPage(pagination.currentPage + 1);
    }
  }, [goToPage, pagination.hasNextPage, pagination.currentPage, paginationLoading]);

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage && !paginationLoading) {
      goToPage(pagination.currentPage - 1);
    }
  }, [goToPage, pagination.hasPreviousPage, pagination.currentPage, paginationLoading]);

  useEffect(() => {
    fetchProposals(1);
  }, []);

  return {
    recentProposals,
    loading,
    paginationLoading,
    error,
    pagination,
    refetch: () => fetchProposals(pagination.currentPage),
    goToPage,
    nextPage,
    previousPage
  };
};

// Sample data for upcoming events
const upcomingEvents = [
  {
    id: "EVENT-001",
    title: "Science Fair Exhibition",
    date: "Mon, Mar 20",
    location: "Main Campus Hall",
    attendees: 120,
  },
  {
    id: "EVENT-002",
    title: "Leadership Workshop",
    date: "Wed, Mar 22",
    location: "Conference Room B",
    attendees: 45,
  },
  {
    id: "EVENT-003",
    title: "Community Service Day",
    date: "Sat, Mar 25",
    location: "City Park",
    attendees: 75,
  },
]

// --- Main Dashboard Grid ---
export default function DashboardPage() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [expandedProposalId, setExpandedProposalId] = useState(null)
  const [showDebug, setShowDebug] = useState(false) // Add debug toggle

  // State for proposals controls
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  // Fetch dashboard statistics
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();

  // Fetch recent proposals with pagination
  const {
    recentProposals,
    loading: proposalsLoading,
    paginationLoading,
    error: proposalsError,
    pagination,
    refetch: refetchProposals,
    goToPage,
    nextPage,
    previousPage
  } = useRecentProposals();

  // Handlers for proposals controls
  const handleSearchChange = useCallback((searchTerm) => {
    setSearchTerm(searchTerm);
    console.log('Search term changed:', searchTerm);
    // TODO: Implement search filtering logic
  }, []);

  const handleExport = useCallback(() => {
    console.log('Exporting proposals...');
    // TODO: Implement export functionality
    alert('Export functionality would trigger here');
  }, []);

  const handleStatusChange = useCallback((status) => {
    setStatusFilter(status);
    console.log('Status filter changed:', status);
    // TODO: Implement status filtering logic
  }, []);

  const toggleExpandProposal = (id) => {
    setExpandedProposalId(expandedProposalId === id ? null : id)
  }

  // Show loading state while fetching stats and proposals
  if (statsLoading || proposalsLoading) {
    return (
      <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8 animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-40 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-60 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
          <div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state if stats or proposals failed to load
  if (statsError || proposalsError) {
    console.warn('Dashboard stats error:', statsError);
    console.warn('Proposals error:', proposalsError);
    // Continue rendering with fallback data instead of stopping
  }

  // Use stats or fallback to prevent crashes
  const safeStats = stats || {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    newSinceYesterday: 0,
    approvalRate: '0%',
    dayOverDayPct: '0%',
    isPositiveGrowth: true,
  };

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader
        title="Dashboard"
        subtitle="Summary"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setShowDebug(!showDebug)} variant="outline" size="sm">
              {showDebug ? "Hide Debug" : "Show Debug"}
            </Button>
            <Button onClick={refetchStats} variant="outline" size="sm" disabled={statsLoading}>
              {statsLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        }
      />

      {/* Debug Section */}
      {showDebug && (
        <div className="mb-8 p-4 bg-gray-100 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">🔍 Debug Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Stats API Status:</h4>
              <div className="text-sm space-y-1">
                <div>Loading: {statsLoading ? 'Yes' : 'No'}</div>
                <div>Error: {statsError || 'None'}</div>
                <div>Data: {stats ? 'Loaded' : 'Not loaded'}</div>
                <div>Raw Stats: <pre className="text-xs">{JSON.stringify(stats, null, 2)}</pre></div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Proposals API Status:</h4>
              <div className="text-sm space-y-1">
                <div>Loading: {proposalsLoading ? 'Yes' : 'No'}</div>
                <div>Pagination Loading: {paginationLoading ? 'Yes' : 'No'}</div>
                <div>Error: {proposalsError || 'None'}</div>
                <div>Data: {recentProposals.length} proposals</div>
                <div>Search Term: "{searchTerm}"</div>
                <div>Status Filter: {statusFilter}</div>
                <div>Current Page: {pagination.currentPage} of {pagination.totalPages}</div>
                <div>Total Count: {pagination.totalCount}</div>
                <div>Has Next: {pagination.hasNextPage ? 'Yes' : 'No'}</div>
                <div>Has Previous: {pagination.hasPreviousPage ? 'Yes' : 'No'}</div>
                <div>Sample: <pre className="text-xs">{JSON.stringify(recentProposals[0], null, 2)}</pre></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} className="mb-8">
        <Card className="hover-card-effect">
          <CardContent className="cedo-stats-card">
            <div>
              <p className="text-muted-foreground text-sm">Pending Review</p>
              <h2 className="text-3xl font-bold mt-1 text-cedo-blue">{safeStats.pending}</h2>
              <p className="text-xs text-muted-foreground mt-1">{safeStats.newSinceYesterday} new since yesterday</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <ClockIcon className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-card-effect">
          <CardContent className="cedo-stats-card">
            <div>
              <p className="text-muted-foreground text-sm">Approved</p>
              <h2 className="text-3xl font-bold mt-1 text-cedo-blue">{safeStats.approved}</h2>
              <p className="text-xs text-muted-foreground mt-1">{safeStats.approvalRate} approval rate</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-500"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-card-effect">
          <CardContent className="cedo-stats-card">
            <div>
              <p className="text-muted-foreground text-sm">Rejected</p>
              <h2 className="text-3xl font-bold mt-1 text-cedo-blue">{safeStats.rejected}</h2>
              <p className="text-xs text-muted-foreground mt-1">Requires feedback</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-card-effect">
          <CardContent className="cedo-stats-card">
            <div>
              <p className="text-muted-foreground text-sm">Total Proposals</p>
              <h2 className="text-3xl font-bold mt-1 text-cedo-blue">{safeStats.total}</h2>
              <p className={`text-xs mt-1 flex items-center ${safeStats.isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
                {safeStats.isPositiveGrowth ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {safeStats.isPositiveGrowth ? '↑' : '↓'} {safeStats.dayOverDayPct}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </ResponsiveGrid>

      <div className="dashboard-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Proposals Section */}
        <section className="proposals-section lg:col-span-2" aria-labelledby="proposals-heading">
          <Card className="cedo-card">
            <CardContent className="p-6">
              <ProposalsHeaderControls
                onSearchChange={handleSearchChange}
                onExport={handleExport}
                onStatusChange={handleStatusChange}
                initialSearchTerm={searchTerm}
                initialStatus={statusFilter}
              />

              <div className="overflow-x-auto">
                {proposalsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedo-blue"></div>
                    <span className="ml-3 text-sm text-muted-foreground">Loading proposals...</span>
                  </div>
                ) : proposalsError ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-2">Failed to load proposals</div>
                    <div className="text-sm text-gray-600 mb-4">Error: {proposalsError}</div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refetchProposals}
                      className="text-cedo-blue hover:bg-cedo-blue/5"
                    >
                      Retry
                    </Button>
                  </div>
                ) : recentProposals.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">No proposals found</div>
                    <p className="text-sm text-muted-foreground">No recent proposals to display</p>
                  </div>
                ) : (
                  <div className="relative">
                    {paginationLoading && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cedo-blue"></div>
                          <span className="text-sm text-muted-foreground">Loading page...</span>
                        </div>
                      </div>
                    )}
                    <table className="w-full cedo-table">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th className="text-left font-medium py-2 px-2">Title</th>
                          <th className="text-left font-medium py-2 px-2">Organization</th>
                          <th className="text-left font-medium py-2 px-2">Submitted On</th>
                          <th className="text-left font-medium py-2 px-2">Status</th>
                          <th className="text-left font-medium py-2 px-2">Assigned To</th>
                          <th className="text-right font-medium py-2 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentProposals.map((proposal) => (
                          <React.Fragment key={proposal.id}>
                            <tr className="border-b hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-2">
                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm font-medium">
                                  {proposal.title}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm">
                                  {proposal.organization}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm">
                                  {proposal.submittedOn}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <Badge
                                  className={
                                    proposal.status === "approved"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                                      : proposal.status === "pending"
                                        ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                                        : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                                  }
                                >
                                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3 px-2">
                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm">
                                  {proposal.assignedTo}
                                </div>
                              </td>
                              <td className="py-3 px-2 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-cedo-blue hover:text-cedo-blue/70 hover:bg-cedo-blue/5 transition-colors"
                                  onClick={() => toggleExpandProposal(proposal.id)}
                                >
                                  {expandedProposalId === proposal.id ? "Hide" : "View"}
                                </Button>
                              </td>
                            </tr>
                            {expandedProposalId === proposal.id && (
                              <tr className="bg-gray-50">
                                <td colSpan={6} className="p-0">
                                  <div className="p-4 custom-slide-in">
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                      <div className="flex justify-between items-start mb-4">
                                        <div>
                                          <h3 className="text-lg font-medium text-cedo-blue">{proposal.title}</h3>
                                          <p className="text-sm text-muted-foreground">{proposal.organization}</p>
                                        </div>
                                        <Badge
                                          className={
                                            proposal.status === "approved"
                                              ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                                              : proposal.status === "pending"
                                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                                                : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                                          }
                                        >
                                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                        </Badge>
                                      </div>

                                      {proposal.status === "approved" ? (
                                        <div className="space-y-4">
                                          <div>
                                            <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                              ✅ Accomplishment Details
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <p className="text-sm font-medium">Event Description</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.description || "No description provided"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Venue</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.location || "No venue specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Schedule</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.schedule || "No schedule specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Event Mode</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.eventMode ? proposal.eventMode.charAt(0).toUpperCase() + proposal.eventMode.slice(1) : "Not specified"}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          <div>
                                            <h4 className="text-sm font-medium text-cedo-blue mb-2">Event Statistics</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                              <div>
                                                <p className="text-sm font-medium">Attendance Count</p>
                                                <div className="flex items-center gap-2">
                                                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
                                                    {proposal.attendanceCount || 0}
                                                  </div>
                                                  <span className="text-sm text-muted-foreground">participants</span>
                                                </div>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Budget</p>
                                                <p className="text-sm text-muted-foreground">
                                                  ₱{proposal.budget ? Number(proposal.budget).toLocaleString() : '0'}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Volunteers</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.volunteersNeeded || 0} needed
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          <div>
                                            <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                              Contact Information
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <p className="text-sm font-medium">Contact Person</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.contactName || "Not specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Contact Email</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.contactEmail || "Not specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Contact Phone</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.contactPhone || "Not specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Organization Type</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.organizationType ? proposal.organizationType.charAt(0).toUpperCase() + proposal.organizationType.slice(1).replace('-', ' ') : "Not specified"}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          {proposal.reportDescription && (
                                            <div>
                                              <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                                Report Description
                                              </h4>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.reportDescription}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="space-y-4">
                                          <div>
                                            <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                              🕒 Pending Event Information
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <p className="text-sm font-medium">Event Description</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.description || "No description provided"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Proposed Venue</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.proposedVenue || "No venue specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Proposed Schedule</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.proposedSchedule || "No schedule specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Event Mode</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.eventMode ? proposal.eventMode.charAt(0).toUpperCase() + proposal.eventMode.slice(1) : "Not specified"}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          <div>
                                            <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                              Event Type & Credits
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              {proposal.schoolEventType && (
                                                <div>
                                                  <p className="text-sm font-medium">School Event Type</p>
                                                  <p className="text-sm text-muted-foreground">
                                                    {proposal.schoolEventType.charAt(0).toUpperCase() + proposal.schoolEventType.slice(1).replace('-', ' ')}
                                                  </p>
                                                </div>
                                              )}
                                              {proposal.communityEventType && (
                                                <div>
                                                  <p className="text-sm font-medium">Community Event Type</p>
                                                  <p className="text-sm text-muted-foreground">
                                                    {proposal.communityEventType.charAt(0).toUpperCase() + proposal.communityEventType.slice(1).replace('-', ' ')}
                                                  </p>
                                                </div>
                                              )}
                                              {proposal.schoolReturnServiceCredit && (
                                                <div>
                                                  <p className="text-sm font-medium">Return Service Credit</p>
                                                  <p className="text-sm text-muted-foreground">
                                                    {proposal.schoolReturnServiceCredit}
                                                  </p>
                                                </div>
                                              )}
                                              {proposal.communitySdpCredits && (
                                                <div>
                                                  <p className="text-sm font-medium">SDP Credits</p>
                                                  <p className="text-sm text-muted-foreground">
                                                    {proposal.communitySdpCredits}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          <div>
                                            <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                              Resource Planning
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                              <div>
                                                <p className="text-sm font-medium">Expected Participants</p>
                                                <div className="flex items-center gap-2">
                                                  <div className="h-8 w-8 rounded-full bg-cedo-blue/10 flex items-center justify-center text-cedo-blue font-medium">
                                                    {proposal.expectedParticipants || "TBD"}
                                                  </div>
                                                  <span className="text-sm text-muted-foreground">estimated</span>
                                                </div>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Budget</p>
                                                <p className="text-sm text-muted-foreground">
                                                  ₱{proposal.budget ? Number(proposal.budget).toLocaleString() : '0'}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Volunteers Needed</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.volunteersNeeded || 0}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          <div>
                                            <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                              Contact Information
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <p className="text-sm font-medium">Contact Person</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.contactName || "Not specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Contact Email</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.contactEmail || "Not specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Contact Phone</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.contactPhone || "Not specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Organization Type</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.organizationType ? proposal.organizationType.charAt(0).toUpperCase() + proposal.organizationType.slice(1).replace('-', ' ') : "Not specified"}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          <div>
                                            <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                              Additional Information
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              <div>
                                                <p className="text-sm font-medium">Objectives</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.intendedGoal || "No objectives specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Required Resources</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.requiredResources || "No resources specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Current Section</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.currentSection ? proposal.currentSection.charAt(0).toUpperCase() + proposal.currentSection.slice(1) : "Not specified"}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">Form Completion</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {proposal.formCompletionPercentage ? `${proposal.formCompletionPercentage}%` : "0%"}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          {proposal.adminComments && (
                                            <div>
                                              <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                                Admin Comments
                                              </h4>
                                              <p className="text-sm text-muted-foreground bg-amber-50 p-3 rounded-md border border-amber-200">
                                                {proposal.adminComments}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div className="flex justify-end mt-4">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-cedo-blue hover:bg-cedo-blue/5 transition-colors"
                                          onClick={() => toggleExpandProposal(proposal.id)}
                                        >
                                          Close
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
                <div>
                  {proposalsLoading
                    ? "Loading proposals..."
                    : proposalsError
                      ? "Failed to load proposals"
                      : `Showing ${recentProposals.length} of ${pagination.totalCount} proposals (Page ${pagination.currentPage} of ${pagination.totalPages})`
                  }
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={proposalsLoading || paginationLoading || !pagination.hasPreviousPage}
                    onClick={previousPage}
                  >
                    {paginationLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                        <span>Previous</span>
                      </div>
                    ) : (
                      "Previous"
                    )}
                  </Button>

                  {/* Page numbers */}
                  {pagination.totalPages > 1 && (
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.currentPage ? "default" : "outline"}
                            size="sm"
                            disabled={proposalsLoading || paginationLoading}
                            onClick={() => goToPage(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {paginationLoading && pageNum === pagination.currentPage ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                            ) : (
                              pageNum
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={proposalsLoading || paginationLoading || !pagination.hasNextPage}
                    onClick={nextPage}
                  >
                    {paginationLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
                        <span>Next</span>
                      </div>
                    ) : (
                      "Next"
                    )}
                  </Button>

                  <div className="border-l border-gray-300 pl-2 ml-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={proposalsLoading}
                      onClick={refetchProposals}
                    >
                      {proposalsLoading ? "Loading..." : "Refresh"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        {/* Sidebar Section */}
        <aside className="sidebar-section" aria-label="Sidebar">
          <Card className="cedo-card">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div>
                  <h3 className="cedo-header">Upcoming Events</h3>
                  <p className="cedo-subheader">Events scheduled for the next 7 days</p>
                </div>

                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border border-gray-100 rounded-md p-4 hover:border-cedo-blue/30 transition-colors hover-card-effect"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-cedo-blue">{event.title}</h4>
                        <Badge variant="outline" className="cedo-badge-primary">
                          {event.id}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>{event.date}</div>
                        <div>{event.location}</div>
                        <div>{event.attendees} attendees</div>
                      </div>
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-cedo-blue hover:text-cedo-blue/70 hover:bg-cedo-blue/5 px-0 transition-colors"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-cedo-blue hover:text-cedo-blue/70 hover:bg-cedo-blue/5 transition-colors"
                  onClick={() => {
                    router.push("/events?filter=upcoming&timeframe=7days")
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View All Events
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
