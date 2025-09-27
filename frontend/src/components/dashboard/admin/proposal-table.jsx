"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

// Utility function to safely get file count
const getSafeFileCount = (files) => {
  if (!files) return 0;
  if (Array.isArray(files)) return files.length;
  if (typeof files === 'object') return Object.keys(files).length;
  return 0;
};

// Utility function to safely format file count for display
const formatFileCount = (files) => {
  const count = getSafeFileCount(files);
  return count === 0 ? 'No files' : `${count} file${count === 1 ? '' : 's'}`;
};

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAppConfig } from "@/lib/utils";
import { createAuthHeaders, getAuthToken } from '@/utils/auth-utils';
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  XCircle
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';


const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  denied: 'bg-red-100 text-red-800 border-red-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
}

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  denied: XCircle,
  rejected: XCircle
}

export const ProposalTable = ({ statusFilter = 'all' }) => {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({})
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // ✅ New state for comment dialog
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [rejectionComment, setRejectionComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  const { toast } = useToast()

  // Create a stable toast reference to prevent infinite re-renders
  const toastRef = useRef(toast)
  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  // Test function to verify backend connection
  const testBackendConnection = async () => {
    try {
      const backendUrl = getAppConfig().backendUrl
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('cedo_token='))
        ?.split('=')[1];

      console.log('🧪 Testing backend connection...')
      console.log('📡 Backend URL:', backendUrl)
      console.log('🔑 Token exists:', !!token)

      const healthResponse = await fetch(`${backendUrl}/api/health`)
      console.log('❤️ Health check:', healthResponse.status, healthResponse.statusText)

      toast({
        title: "Backend Connection Test",
        description: "Check console for detailed results",
        variant: "default"
      })
    } catch (error) {
      console.error('❌ Backend connection test failed:', error)
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // ✅ Ref to track if component is mounted (prevent state updates after unmount)
  const isMountedRef = useRef(true);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoized filtered proposals for performance
  const filteredProposals = useMemo(() => {
    return proposals.filter(proposal => {
      const matchesSearch = !searchTerm ||
        proposal.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.event_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.proposal_status?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || proposal.proposal_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [proposals, searchTerm, statusFilter]);

  // Simple search term state
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Simplified fetch proposals function
  const fetchProposals = useCallback(async () => {
    if (!isMountedRef.current || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      // Get authentication token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('cedo_token='))
        ?.split('=')[1];

      if (!token) {
        console.warn('No authentication token found for fetching proposals');
        setLoading(false);
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      }).toString()

      const backendUrl = getAppConfig().backendUrl
      const apiUrl = `${backendUrl}/api/admin/proposals?${queryParams}`
      console.log('📊 Fetching proposals:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json();

      if (!isMountedRef.current) return;

      if (result.success) {
        const rawProposals = result.proposals || []
        const pagination = result.pagination || {}

        // Normalize proposal data
        const normalizedProposals = rawProposals.map(proposal => ({
          ...proposal,
          status: proposal.status || proposal.proposal_status || 'pending',
          proposal_status: proposal.proposal_status || proposal.status || 'pending',
          adminComments: proposal.adminComments || proposal.admin_comments || '',
          admin_comments: proposal.admin_comments || proposal.adminComments || '',
          eventName: proposal.eventName || proposal.event_name || proposal.event_title || '',
          contactPerson: proposal.contactPerson || proposal.contact_person || proposal.contact_name || '',
          contactEmail: proposal.contactEmail || proposal.contact_email || '',
          contactPhone: proposal.contactPhone || proposal.contact_phone || '',
          organizationType: proposal.organizationType || proposal.organization_type || '',
          venue: proposal.venue || '',
          startDate: proposal.startDate || proposal.start_date || proposal.event_start_date || '',
          endDate: proposal.endDate || proposal.end_date || proposal.event_end_date || '',
          timeStart: proposal.timeStart || proposal.time_start || proposal.event_start_time || '',
          timeEnd: proposal.timeEnd || proposal.time_end || proposal.event_end_time || '',
          eventType: proposal.eventType || proposal.event_type || '',
          eventMode: proposal.eventMode || proposal.event_mode || '',
          submittedAt: proposal.submittedAt || proposal.submitted_at || proposal.created_at || '',
          updatedAt: proposal.updatedAt || proposal.updated_at || '',
          hasFiles: !!(proposal.files && Object.keys(proposal.files).length > 0) ||
            !!(proposal.gpoa_file_name || proposal.project_proposal_file_name),
          files: {
            ...(proposal.gpoa_file_name && {
              gpoa: {
                name: proposal.gpoa_file_name,
                size: proposal.gpoa_file_size,
                type: proposal.gpoa_file_type,
                path: proposal.gpoa_file_path
              }
            }),
            ...(proposal.project_proposal_file_name && {
              projectProposal: {
                name: proposal.project_proposal_file_name,
                size: proposal.project_proposal_file_size,
                type: proposal.project_proposal_file_type,
                path: proposal.project_proposal_file_path
              }
            })
          }
        }))

        setProposals(normalizedProposals)
        setPagination(pagination)
        console.log('✅ Proposals fetched successfully:', normalizedProposals.length)
      } else {
        console.error('❌ Error fetching proposals:', result.error)
        if (isMountedRef.current) {
          toastRef.current({
            title: "Error",
            description: result.error || "Failed to fetch proposals",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('❌ Fetch error:', error)
      if (isMountedRef.current) {
        toastRef.current({
          title: "Error",
          description: "Failed to connect to server. Please check if the backend is running.",
          variant: "destructive"
        })
      }
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentPage, debouncedSearchTerm, statusFilter])

  // Initial fetch on component mount
  useEffect(() => {
    fetchProposals();
  }, [])

  // Effect to fetch proposals when page, filter, or debounced search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProposals();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentPage, debouncedSearchTerm, statusFilter])

  // ✅ Enhanced proposal status update with comment support and improved error handling
  const updateProposalStatus = async (proposalId, newStatus, adminComments = '') => {
    if (!proposalId) {
      toast({
        title: "Error",
        description: "Invalid proposal ID",
        variant: "destructive"
      })
      return
    }

    setActionLoading(true)
    console.log(`🔄 Updating proposal ${proposalId} status to: ${newStatus}`, { adminComments })

    try {
      const backendUrl = getAppConfig().backendUrl
      console.log(`📡 Backend URL: ${backendUrl}`)

      // Get authentication token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('cedo_token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Authentication token not found. Please sign in again.');
      }

      // Prepare the request payload
      const payload = {
        status: newStatus,
        adminComments: adminComments || null
      }

      console.log(`📤 Sending PATCH request to: ${backendUrl}/api/admin/proposals/${proposalId}/status`)
      console.log(`📤 Payload:`, payload)

      const response = await fetch(`${backendUrl}/api/admin/proposals/${proposalId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      })

      console.log(`📡 Response status: ${response.status} ${response.statusText}`)

      // Handle different response scenarios
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          console.error('❌ Server error response:', errorData)
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError)
          const textError = await response.text()
          console.error('❌ Raw error response:', textError)
          errorMessage = textError || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('✅ Success response:', data)

      if (data.success) {
        toast({
          title: "Success",
          description: data.message || `Proposal ${newStatus} successfully`,
          variant: "default"
        })

        // ✅ Update the proposals list immediately with optimistic update
        setProposals(prevProposals =>
          prevProposals.map(proposal =>
            proposal.id === parseInt(proposalId) || proposal.id === proposalId
              ? {
                ...proposal,
                proposal_status: newStatus,
                status: newStatus,
                admin_comments: adminComments,
                adminComments: adminComments,
                updated_at: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
              : proposal
          )
        )

        // ✅ Update selectedProposal if it's the one being updated
        if (selectedProposal && (selectedProposal.id === parseInt(proposalId) || selectedProposal.id === proposalId)) {
          setSelectedProposal(prev => ({
            ...prev,
            proposal_status: newStatus,
            status: newStatus,
            admin_comments: adminComments,
            adminComments: adminComments,
            updated_at: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))
        }

        // ✅ Fetch updated proposal data to ensure consistency
        setTimeout(() => {
          fetchUpdatedProposalDetails(proposalId)
          fetchProposals()
        }, 1000)

        // ✅ Close comment dialog and reset state
        setShowCommentDialog(false)
        setRejectionComment('')
      } else {
        throw new Error(data.error || data.message || 'Failed to update proposal - server returned success: false')
      }
    } catch (error) {
      console.error('❌ Error updating proposal:', error)

      // Enhanced error logging for debugging
      console.error('❌ Error details:', {
        proposalId,
        newStatus,
        adminComments,
        errorMessage: error.message,
        errorStack: error.stack
      })

      toast({
        title: "Error",
        description: error.message || "Failed to update proposal. Please check the console for details.",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
      setCommentLoading(false)
    }
  }

  // ✅ Fetch updated proposal details after status change
  const fetchUpdatedProposalDetails = async (proposalId) => {
    try {
      const backendUrl = getAppConfig().backendUrl

      // Get authentication token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('cedo_token='))
        ?.split('=')[1];

      if (!token) {
        console.warn('No authentication token found for fetching proposal details');
        return;
      }

      // Try to fetch individual proposal details first
      let response = await fetch(`${backendUrl}/api/admin/proposals/${proposalId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.proposal) {
          // ✅ Update the selectedProposal with fresh data including adminComments
          setSelectedProposal(data.proposal)
          console.log('✅ Updated proposal details with comments:', data.proposal.adminComments)
          return
        }
      }

      // ✅ Fallback: Re-fetch all proposals and find the updated one
      console.log('🔄 Fallback: Re-fetching all proposals to get updated data')
      const allProposalsResponse = await fetch(`${backendUrl}/api/admin/proposals?limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (allProposalsResponse.ok) {
        const allData = await allProposalsResponse.json()
        if (allData.success && allData.proposals) {
          const updatedProposal = allData.proposals.find(p => p.id === proposalId)
          if (updatedProposal) {
            setSelectedProposal(updatedProposal)
            console.log('✅ Updated proposal via fallback method:', updatedProposal.adminComments)
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching updated proposal details:', error)
    }
  }

  // ✅ Handle rejection with comment
  const handleRejectionWithComment = () => {
    if (!rejectionComment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a reason for rejecting this proposal.",
        variant: "destructive"
      })
      return
    }

    setCommentLoading(true)
    updateProposalStatus(selectedProposal.id, "rejected", rejectionComment.trim())
  }

  // Simplified file download function
  const downloadFile = async (proposalId, fileType) => {
    try {
      const backendUrl = getAppConfig().backendUrl
      console.log(`🔍 Downloading ${fileType} for proposal ${proposalId}`)

      const token = getAuthToken();
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to download files",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Downloading...",
        description: `Preparing ${fileType} file`,
        variant: "default"
      })

      const headers = createAuthHeaders({
        'Accept': 'application/octet-stream, application/pdf, */*'
      });

      const response = await fetch(`${backendUrl}/api/admin/proposals/${proposalId}/download/${fileType}`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${fileType}_proposal_${proposalId}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: "Download Successful",
          description: `${fileType} file downloaded`,
          variant: "default"
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        let errorMessage = "File not found"
        if (response.status === 401) {
          errorMessage = "Authentication failed. Please sign in again."
        } else if (response.status === 404) {
          errorMessage = "File not found or proposal doesn't exist"
        } else if (response.status === 500) {
          errorMessage = "Server error occurred while downloading file"
        } else if (errorData.error) {
          errorMessage = errorData.error
        } else if (errorData.message) {
          errorMessage = errorData.message
        }

        toast({
          title: "Download Failed",
          description: errorMessage,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ Download error:', error)
      toast({
        title: "Download Error",
        description: "Failed to download file",
        variant: "destructive"
      })
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';

    try {
      // timeString is expected to be in "HH:mm:ss" format from the database.
      const [hours, minutes] = timeString.split(':');

      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';

      h = h % 12;
      h = h || 12; // Convert hour '0' to '12'

      return `${h}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', timeString, error);
      return timeString; // Fallback to original string if something goes wrong
    }
  };

  if (loading) {
    return (
      <div className="@container space-y-3 sm:space-y-4">
        {/* Optimized Loading State with Container Queries */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading proposals...</span>
            </div>
            {/* Container-aware skeleton cards */}
            <div className="mt-4 space-y-2">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse p-3 border rounded-lg bg-gray-50"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex flex-col @sm:flex-row @sm:gap-3 gap-2">
                    <div className="h-3 bg-gray-200 rounded flex-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="@container w-full max-w-full">
      {/* Optimized Search and Filters with Container Queries */}
      <div className="space-y-3 sm:space-y-4">
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col @sm:flex-row @sm:items-center gap-3">
              <div className="relative flex-1 min-w-0 z-20">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <Input
                  placeholder="Search by event, contact, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full text-sm border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg"
                  aria-label="Search proposals"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={fetchProposals}
                  variant="outline"
                  disabled={loading}
                  className="@sm:min-w-[100px] px-3 py-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 rounded-lg flex items-center justify-center"
                  aria-label="Refresh proposals list"
                >
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="whitespace-nowrap">Refresh</span>
                </Button>
                <Button
                  onClick={testBackendConnection}
                  variant="outline"
                  disabled={loading}
                  className="@sm:min-w-[100px] px-3 py-2 border-orange-300 hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 rounded-lg flex items-center justify-center text-orange-600"
                  aria-label="Test backend connection"
                  title="Test API connection and endpoints"
                >
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="whitespace-nowrap hidden @sm:inline">Test API</span>
                  <span className="whitespace-nowrap @sm:hidden">Test</span>
                </Button>
              </div>
            </div>
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                <span className="inline-flex items-center flex-wrap gap-1">
                  <span>Searching:</span>
                  <span className="font-medium text-blue-600 break-all">"{searchTerm}"</span>
                  {filteredProposals.length !== proposals.length && (
                    <span className="text-gray-500">({filteredProposals.length} of {proposals.length} results)</span>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Container Query Optimized Proposals Table */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-col @sm:flex-row @sm:items-center @sm:justify-between gap-2">
              <span className="text-base @sm:text-lg font-bold text-gray-800">
                Proposals ({pagination.total || 0})
              </span>
              <Badge variant="outline" className="w-fit px-2 py-1 text-xs">
                Page {pagination.page || 1} of {pagination.pages || 1}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 @sm:p-3">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-6 @sm:py-8 px-4">
                <div className="mx-auto w-12 h-12 @sm:w-16 @sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 @sm:w-6 @sm:h-6 text-gray-400" />
                </div>
                <h3 className="text-base @sm:text-lg font-medium text-gray-700 mb-2">No proposals found</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  {searchTerm ? `No proposals match "${searchTerm}"` : "There are no proposals to display"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View - Hidden on mobile */}
                <div className="hidden @2xl:block overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="font-semibold text-gray-700 text-sm px-3 py-3">Event Name</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm px-3 py-3">Organization</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm px-3 py-3">Contact</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm px-3 py-3">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm px-3 py-3">Date</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm px-3 py-3">Type</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm px-3 py-3">Files</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 text-sm px-3 py-3">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProposals.map((proposal) => {
                        const StatusIcon = statusIcons[proposal.status] || Clock

                        return (
                          <TableRow key={proposal.id} className="hover:bg-gray-50/80 transition-colors duration-150 border-b border-gray-100">
                            <TableCell className="font-medium px-3 py-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 truncate max-w-[180px]">{proposal.eventName}</div>
                                <div className="text-xs text-gray-500 flex items-center mt-1">
                                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{proposal.venue}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3">
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate max-w-[120px]">{proposal.contactPerson}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[120px]">{proposal.organizationType}</div>
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center text-xs">
                                  <Mail className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                                  <span className="truncate max-w-[150px] text-blue-600">{proposal.contactEmail}</span>
                                </div>
                                {proposal.contactPhone && (
                                  <div className="flex items-center text-xs text-gray-600">
                                    <Phone className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{proposal.contactPhone}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3">
                              <Badge className={`${statusColors[proposal.status] || statusColors.pending} text-xs`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-3 py-3">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center text-xs">
                                  <Calendar className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-900">{formatDate(proposal.startDate)}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Submitted: {formatDate(proposal.submittedAt)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3">
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {proposal.eventType}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-3 py-3">
                              <div className="flex items-center space-x-1">
                                {proposal.hasFiles ? (
                                  <div className="flex items-center space-x-1">
                                    <div className="p-1 bg-green-100 rounded-full">
                                      <FileText className="h-3 w-3 text-green-600" />
                                    </div>
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                      {formatFileCount(proposal.files) || 'Files'}
                                    </Badge>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1">
                                    <div className="p-1 bg-gray-100 rounded-full">
                                      <FileText className="h-3 w-3 text-gray-400" />
                                    </div>
                                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">
                                      No files
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-3 py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 shadow-lg">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedProposal(proposal)
                                    setShowDetails(true)
                                  }} className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {proposal.status === 'pending' && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => updateProposalStatus(proposal.id, 'approved')}
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedProposal(proposal)
                                          setShowCommentDialog(true)
                                        }}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Deny
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile/Tablet Card View - Container Query Optimized */}
                <div className="@2xl:hidden space-y-3 p-3">
                  {filteredProposals.map((proposal) => {
                    const StatusIcon = statusIcons[proposal.status] || Clock

                    return (
                      <Card key={proposal.id} className="border border-gray-200 hover:shadow-md transition-all duration-200 bg-white @container">
                        <CardContent className="p-3 @sm:p-4">
                          <div className="space-y-3">
                            {/* Header with event name and status */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-sm @sm:text-base leading-tight mb-1 break-words">{proposal.eventName}</h3>
                                <div className="flex items-center text-xs text-gray-500">
                                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{proposal.venue}</span>
                                </div>
                              </div>
                              <Badge className={`${statusColors[proposal.status] || statusColors.pending} flex-shrink-0 text-xs`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                              </Badge>
                            </div>

                            {/* Organization info - Container responsive grid */}
                            <div className="border-t pt-3">
                              <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2">
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Person</span>
                                  <p className="text-sm font-medium text-gray-900 mt-0.5 break-words">{proposal.contactPerson}</p>
                                  <p className="text-xs text-gray-500 break-words">{proposal.organizationType}</p>
                                </div>
                              </div>
                            </div>

                            {/* Contact details - Flexbox layout */}
                            <div className="space-y-2">
                              <div className="flex items-start text-sm min-w-0">
                                <Mail className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span className="truncate text-blue-600 break-all text-xs">{proposal.contactEmail}</span>
                              </div>
                              {proposal.contactPhone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                                  <span className="break-all text-xs">{proposal.contactPhone}</span>
                                </div>
                              )}
                            </div>

                            {/* Date, type, and file info - Container responsive */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <div className="flex items-center text-gray-600">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{formatDate(proposal.startDate)}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {proposal.eventType}
                              </Badge>
                              {proposal.hasFiles ? (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {formatFileCount(proposal.files) || 'Files'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500 border-gray-200">
                                  <FileText className="h-3 w-3 mr-1" />
                                  No files
                                </Badge>
                              )}
                              <span className="text-gray-500 @sm:block hidden">
                                Submitted: {formatDate(proposal.submittedAt)}
                              </span>
                            </div>

                            {/* Actions - Responsive button layout */}
                            <div className="border-t pt-3 flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProposal(proposal)
                                  setShowDetails(true)
                                }}
                                className="flex-1 @sm:flex-none min-w-fit text-xs px-3 py-2"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                              {proposal.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateProposalStatus(proposal.id, 'approved')}
                                    className="text-green-600 border-green-200 hover:bg-green-50 text-xs px-3 py-2"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedProposal(proposal)
                                      setShowCommentDialog(true)
                                    }}
                                    className="text-red-600 border-red-200 hover:bg-red-50 text-xs px-3 py-2"
                                  >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Deny
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Optimized Responsive Pagination */}
        {pagination.pages > 1 && (
          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-3 @sm:p-4">
              <div className="flex flex-col @sm:flex-row @sm:items-center @sm:justify-between gap-3">
                <div className="text-sm text-gray-600 text-center @sm:text-left">
                  <span className="font-medium">
                    Showing {filteredProposals.length} of {pagination.total} proposals
                  </span>
                  {searchTerm && filteredProposals.length !== proposals.length && (
                    <span className="block text-xs text-gray-500 mt-1">
                      ({proposals.length - filteredProposals.length} filtered out)
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 @sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!pagination.hasPrev || loading}
                    className="px-3 py-2 text-xs border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 transition-all duration-200"
                    aria-label="Go to previous page"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden @sm:inline">Previous</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded border">
                      {pagination.page}
                    </span>
                    <span className="text-xs text-gray-500">of</span>
                    <span className="text-xs font-medium">{pagination.pages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNext || loading}
                    className="px-3 py-2 text-xs border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 transition-all duration-200"
                    aria-label="Go to next page"
                  >
                    <span className="hidden @sm:inline">Next</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
              {/* Simplified page jump for larger pagination */}
              {pagination.pages > 5 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex flex-col @sm:flex-row items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Jump to page:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={pagination.pages}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                        placeholder={pagination.page}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const page = parseInt(e.target.value);
                            if (page >= 1 && page <= pagination.pages) {
                              setCurrentPage(page);
                              e.target.value = '';
                            }
                          }
                        }}
                      />
                      <span className="text-sm text-gray-500">Press Enter</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Optimized Responsive Proposal Details Modal - Following UX Best Practices */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="
          fixed left-[50%] top-[50%] z-50 
          grid w-[95vw] h-[90vh] 
          sm:w-[85vw] sm:h-[80vh] sm:max-w-[700px] sm:max-h-[600px]
          md:w-[75vw] md:h-[75vh] md:max-w-[800px] md:max-h-[650px]
          lg:w-[65vw] lg:h-[70vh] lg:max-w-[900px] lg:max-h-[700px]
          xl:w-[55vw] xl:h-[65vh] xl:max-w-[1000px] xl:max-h-[750px]
          translate-x-[-50%] translate-y-[-50%]
          border-0 sm:border
          bg-white shadow-none sm:shadow-xl
          rounded-none sm:rounded-lg
          overflow-hidden
          duration-300 ease-out
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
          data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]
          data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
          data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
          focus:outline-none
        ">
          {/* Optimized Modal Header - Clean and Accessible */}
          <DialogHeader className="
            sticky top-0 z-10 
            bg-white border-b border-gray-200
            p-4 sm:p-5 lg:p-6
            shadow-sm
          ">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
              <div className="flex-1 min-w-0 pr-4">
                <DialogTitle className="
                  text-lg sm:text-xl lg:text-2xl 
                  font-bold text-gray-900 
                  leading-tight mb-2
                  break-words
                ">
                  {selectedProposal?.eventName || 'Proposal Details'}
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base text-gray-600">
                  Review and manage this proposal submission
                </DialogDescription>
              </div>
              {selectedProposal && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
                  <Badge
                    className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${statusColors[selectedProposal.status] || statusColors.pending}`}
                  >
                    {selectedProposal.status?.charAt(0).toUpperCase() + selectedProposal.status?.slice(1)}
                  </Badge>
                  <div className="text-xs sm:text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    ID: {selectedProposal.id}
                  </div>
                  {/* Enhanced Close Button - Always Visible on Mobile */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(false)}
                    className="sm:hidden text-xs px-3 py-2 border-gray-300 hover:bg-gray-50"
                  >
                    ✕ Close
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {selectedProposal && (
            <div className="
              flex-1 overflow-y-auto 
              p-4 sm:p-5 lg:p-6
              bg-gray-50
            ">
              <div className="
                space-y-4 sm:space-y-5 lg:space-y-6 
                max-w-none
                pb-4
              ">
                {/* Event Information Card - Optimized UX Design */}
                <Card className="bg-white shadow-md border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-t-lg p-4 sm:p-5">
                    <CardTitle className="text-lg sm:text-xl font-semibold text-blue-900 flex items-center">
                      <Calendar className="h-5 w-5 mr-3 flex-shrink-0" />
                      Event Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <Label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                            Event Name
                          </Label>
                          <p className="text-base sm:text-lg font-medium text-gray-900 break-words leading-relaxed">
                            {selectedProposal.eventName}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <Label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                            Venue
                          </Label>
                          <p className="text-sm sm:text-base text-gray-900 flex items-start break-words">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                            <span>{selectedProposal.venue}</span>
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <Label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                            Start Date & Time
                          </Label>
                          <p className="text-sm sm:text-base text-gray-900 break-words font-medium">
                            {formatDate(selectedProposal.startDate)} at {formatTime(selectedProposal.timeStart)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <Label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                            Event Type
                          </Label>
                          <p className="text-sm sm:text-base text-gray-900 break-words">{selectedProposal.eventType}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <Label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                            Event Mode
                          </Label>
                          <p className="text-sm sm:text-base text-gray-900 break-words">{selectedProposal.eventMode}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                          <Label className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                            End Date & Time
                          </Label>
                          <p className="text-sm sm:text-base text-gray-900 break-words font-medium">
                            {formatDate(selectedProposal.endDate)} at {formatTime(selectedProposal.timeEnd)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Organization Information Card - Optimized UX Design */}
                <Card className="bg-white shadow-md border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-t-lg p-4 sm:p-5">
                    <CardTitle className="text-lg sm:text-xl font-semibold text-green-900 flex items-center">
                      <Mail className="h-5 w-5 mr-3 flex-shrink-0" />
                      Organization Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 @lg:grid-cols-2 gap-4 @sm:gap-6">
                      <div className="space-y-3 @sm:space-y-4">
                        <div className="bg-gray-50 p-3 @sm:p-4 rounded-lg">
                          <Label className="text-xs @sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Contact Person
                          </Label>
                          <p className="mt-2 text-base @sm:text-lg font-medium text-gray-900 break-words">{selectedProposal.contactPerson}</p>
                        </div>
                        <div className="bg-gray-50 p-3 @sm:p-4 rounded-lg">
                          <Label className="text-xs @sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Email Address
                          </Label>
                          <p className="mt-2 text-sm @sm:text-base text-gray-900 flex items-start break-all">
                            <Mail className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                            <span className="text-blue-600">{selectedProposal.contactEmail}</span>
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3 @sm:space-y-4">
                        <div className="bg-gray-50 p-3 @sm:p-4 rounded-lg">
                          <Label className="text-xs @sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Organization Type
                          </Label>
                          <p className="mt-2 text-sm @sm:text-base text-gray-900 break-words">{selectedProposal.organizationType}</p>
                        </div>
                        <div className="bg-gray-50 p-3 @sm:p-4 rounded-lg">
                          <Label className="text-xs @sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Phone Number
                          </Label>
                          <p className="mt-2 text-sm @sm:text-base text-gray-900 flex items-start break-all">
                            <Phone className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                            <span>{selectedProposal.contactPhone}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Files & Documents Card - Always Visible with Enhanced UX */}
                <Card className="shadow-sm border-l-4 border-l-purple-500">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-t-lg p-4 @sm:p-6">
                    <CardTitle className="text-lg @sm:text-xl font-semibold text-purple-900 flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 @sm:h-5 @sm:w-5 mr-2" />
                        Files & Documents
                      </div>
                      <Badge
                        variant={selectedProposal.hasFiles ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {formatFileCount(selectedProposal.files) || 'Files'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 @sm:p-6">
                    {selectedProposal.hasFiles && selectedProposal.files && getSafeFileCount(selectedProposal.files) > 0 ? (
                      // Show actual files when they exist
                      <div className="grid grid-cols-1 @md:grid-cols-2 gap-3 @sm:gap-4">
                        {Object.entries(selectedProposal.files).map(([fileType, fileInfo]) => (
                          <div
                            key={fileType}
                            className="flex items-center justify-between p-3 @sm:p-4 border-2 border-dashed border-green-200 bg-green-50/30 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                                <FileText className="h-4 w-4 @sm:h-6 @sm:w-6 text-green-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm @sm:text-base break-words">
                                  {fileType === "gpoa" ? "General Plan of Action" :
                                    fileType === "projectProposal" ? "Project Proposal" :
                                      fileType === "accomplishmentReport" ? "Accomplishment Report" :
                                        fileType.charAt(0).toUpperCase() + fileType.slice(1)}
                                </p>
                                <p className="text-xs @sm:text-sm text-gray-500">
                                  {fileInfo.name || 'PDF Document'}
                                  {fileInfo.source && (
                                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                      {fileInfo.source}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(selectedProposal.id, fileType)}
                              className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors flex-shrink-0 ml-2"
                            >
                              <Download className="h-3 w-3 @sm:h-4 @sm:w-4 mr-1 @sm:mr-2" />
                              <span className="hidden @sm:inline">Download</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Show empty state when no files exist
                      <div className="text-center py-6 @sm:py-8">
                        <div className="mx-auto w-16 h-16 @sm:w-20 @sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <FileText className="w-6 h-6 @sm:w-8 @sm:h-8 text-gray-400" />
                        </div>
                        <h3 className="text-base @sm:text-lg font-medium text-gray-700 mb-2">No Files Attached</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">
                          This proposal doesn't have any documents attached yet. Required documents typically include:
                        </p>
                        <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3 max-w-md mx-auto text-left">
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg border">
                            <div className="p-1.5 bg-gray-200 rounded flex-shrink-0 mr-3">
                              <FileText className="h-3 w-3 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">General Plan of Action</p>
                              <p className="text-xs text-gray-500">GPOA Document</p>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg border">
                            <div className="p-1.5 bg-gray-200 rounded flex-shrink-0 mr-3">
                              <FileText className="h-3 w-3 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">Project Proposal</p>
                              <p className="text-xs text-gray-500">Detailed proposal</p>
                            </div>
                          </div>
                        </div>
                        {selectedProposal.status === 'pending' && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>Note:</strong> This proposal is pending review. Documents may be uploaded later or might be stored in a different system.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* File Upload Information */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start space-x-3">
                        <div className="p-1.5 bg-blue-100 rounded-full flex-shrink-0">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs @sm:text-sm font-medium text-gray-700 mb-1">File Upload Information</p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Files can be uploaded during the proposal submission process.
                            Supported formats: PDF, DOC, DOCX. Maximum size: 10MB per file.
                            {selectedProposal.hasFiles ? ' Files are stored securely and can be downloaded by authorized users.' : ' No files have been uploaded for this proposal yet.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Admin Actions Card - Enhanced Responsive Design */}
                {selectedProposal.status === "pending" && (
                  <Card className="shadow-sm border-l-4 border-l-orange-500">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-t-lg p-4 @sm:p-6">
                      <CardTitle className="text-lg @sm:text-xl font-semibold text-orange-900 flex items-center">
                        <CheckCircle className="h-4 w-4 @sm:h-5 @sm:w-5 mr-2" />
                        Administrative Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 @sm:p-6">
                      <div className="flex flex-col @sm:flex-row gap-3 @sm:gap-4">
                        <Button
                          onClick={() => updateProposalStatus(selectedProposal.id, "approved")}
                          disabled={actionLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 @sm:py-3 text-sm @sm:text-base font-medium"
                          size="lg"
                        >
                          <CheckCircle className="h-4 w-4 @sm:h-5 @sm:w-5 mr-2" />
                          {actionLoading ? "Processing..." : "Approve Proposal"}
                        </Button>
                        <Button
                          onClick={() => setShowCommentDialog(true)}
                          disabled={actionLoading}
                          variant="destructive"
                          className="flex-1 py-2.5 @sm:py-3 text-sm @sm:text-base font-medium"
                          size="lg"
                        >
                          <XCircle className="h-4 w-4 @sm:h-5 @sm:w-5 mr-2" />
                          {actionLoading ? "Processing..." : "Deny Proposal"}
                        </Button>
                      </div>
                      <div className="mt-4 p-3 @sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs @sm:text-sm text-yellow-800">
                          <strong>Note:</strong> Once you approve or deny this proposal, the decision cannot be easily
                          reversed. Please review all information carefully before taking action.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admin Comments Card - Enhanced Responsive Design */}
                {selectedProposal.adminComments && (
                  <Card className="shadow-sm border-l-4 border-l-gray-500">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-t-lg p-4 @sm:p-6">
                      <CardTitle className="text-lg @sm:text-xl font-semibold text-gray-900 flex items-center">
                        <FileText className="h-4 w-4 @sm:h-5 @sm:w-5 mr-2" />
                        Admin Comments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 @sm:p-6">
                      <div className="bg-gray-50 p-3 @sm:p-4 rounded-lg border-l-4 border-l-gray-400">
                        <p className="text-gray-800 leading-relaxed text-sm @sm:text-base break-words">{selectedProposal.adminComments}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ Rejection Comment Dialog - Enhanced UX */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="
           w-full max-w-md sm:max-w-lg md:max-w-xl 
           mx-auto mt-20 sm:mt-24
           bg-white rounded-lg shadow-xl
           border border-gray-200
           p-0 overflow-hidden
           max-h-[80vh] sm:max-h-[70vh]
         ">
          <DialogHeader className="
             bg-gradient-to-r from-red-50 to-red-100/50 
             p-4 sm:p-6 border-b border-red-200
           ">
            <DialogTitle className="
               text-lg sm:text-xl font-bold text-red-900 
               flex items-center
             ">
              <XCircle className="h-5 w-5 mr-3 text-red-600" />
              Reject Proposal
            </DialogTitle>
            <DialogDescription className="text-sm text-red-700 mt-2">
              Provide a reason for rejecting: <strong>{selectedProposal?.eventName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-4">
            {/* Proposal Summary */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Event:</strong> {selectedProposal?.eventName}</p>
                <p><strong>Contact:</strong> {selectedProposal?.contactPerson}</p>
                <p><strong>Organization:</strong> {selectedProposal?.organizationType}</p>
                <p><strong>Date:</strong> {formatDate(selectedProposal?.startDate)}</p>
              </div>
            </div>

            {/* Comment Input */}
            <div className="space-y-2">
              <Label htmlFor="rejection-comment" className="text-sm font-semibold text-gray-700">
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-comment"
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Please provide a detailed reason for rejecting this proposal. This comment will be stored in both MySQL and MongoDB databases and linked to the proposal ID."
                className="min-h-[120px] resize-none border-gray-300 focus:border-red-500 focus:ring-red-200"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Required field</span>
                <span>{rejectionComment.length}/500</span>
              </div>
            </div>

            {/* Warning Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-xs text-yellow-800">
                  <p className="font-semibold">Important:</p>
                  <p>This rejection will be saved instantly to both MySQL and MongoDB databases. The decision cannot be easily reversed.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCommentDialog(false)
                  setRejectionComment('')
                }}
                disabled={commentLoading}
                className="flex-1 border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectionWithComment}
                disabled={commentLoading || !rejectionComment.trim()}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                {commentLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Submit Rejection
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
