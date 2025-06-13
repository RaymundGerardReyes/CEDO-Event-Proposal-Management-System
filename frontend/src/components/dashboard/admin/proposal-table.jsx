"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

// Safe DOM className utility functions
const safeClassCheck = (element, className) => {
  try {
    if (!element || !className) return false;

    // Check if element has classList (modern approach)
    if (element.classList && typeof element.classList.contains === 'function') {
      return element.classList.contains(className);
    }

    // Fallback for className string check
    if (typeof element.className === 'string') {
      return element.className.includes(className);
    }

    // Handle DOMTokenList
    if (element.className && element.className.toString) {
      return element.className.toString().includes(className);
    }

    return false;
  } catch (error) {
    console.warn('Safe class check error:', error);
    return false;
  }
};

// Safe resolve/reject functions
const safeResolve = (value) => {
  if (currentSignInPromiseActions && currentSignInPromiseActions.resolve) {
    currentSignInPromiseActions.resolve(value);
    currentSignInPromiseActions = null;
  }
};

const safeReject = (error) => {
  if (currentSignInPromiseActions && currentSignInPromiseActions.reject) {
    currentSignInPromiseActions.reject(error);
    currentSignInPromiseActions = null;
  }
};

// Utility functions for error handling
const getGoogleClientId = () => {
  if (typeof window !== 'undefined' && window.__TEST_GOOGLE_CLIENT_ID__) {
    return window.__TEST_GOOGLE_CLIENT_ID__;
  }
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
};

const extractErrorMessage = (response) => {
  if (response.error_description) {
    return response.error_description;
  }
  if (response.error) {
    return `Google OAuth Error: ${response.error}`;
  }
  return 'Unknown Google OAuth error occurred';
};

const getDefaultErrorMessage = () => {
  return 'Google sign-in was cancelled or failed. Please try again.';
};

// Initialize promise actions variable
let currentSignInPromiseActions = null;

// Enhanced error boundary for DOM operations
if (typeof window !== 'undefined') {
  // Override problematic DOM operations
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    try {
      return originalAddEventListener.call(this, type, listener, options);
    } catch (error) {
      console.warn('EventListener error handled:', error);
    }
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('className')) {
      event.preventDefault();
      console.warn('DOM className error prevented:', event.reason);
    }
  });
}

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
import { useToast } from "@/hooks/use-toast";
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
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  const { toast } = useToast()

  // Memoized filtered proposals for performance
  const filteredProposals = useMemo(() => {
    if (!searchTerm) return proposals;
    return proposals.filter(proposal =>
      proposal.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.organizationType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [proposals, searchTerm]);

  // Optimized fetch proposals with performance enhancements
  const fetchProposals = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      // Use backend hybrid endpoint that merges MySQL + MongoDB.  Map the
      // UI "rejected" filter → backend enum "denied".
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const mappedStatus = statusFilter === 'rejected' ? 'denied' : statusFilter

      if (mappedStatus !== statusFilter) {
        queryParams.set('status', mappedStatus)
      }

      const apiUrl = `${backendUrl}/api/mongodb-proposals/admin/proposals-hybrid?${queryParams}`
      console.log('�� Fetching proposals from frontend API:', apiUrl)

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 Frontend API response:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Frontend API error:', response.status, response.statusText, errorText)
        throw new Error(`API request failed: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setProposals(data.proposals || [])
        setPagination(data.pagination || {})
        console.log('✅ Proposals fetched successfully:', data.proposals.length)
      } else {
        console.error('❌ Error fetching proposals:', data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to fetch proposals",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ Fetch error:', error)
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, searchTerm, toast])

  // Fetch proposals on component mount and when dependencies change
  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  // Update proposal status using hybrid API for MySQL proposals
  const updateProposalStatus = async (proposalId, newStatus, adminComments = '') => {
    setActionLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/mongodb-proposals/admin/proposals/${proposalId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminComments
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
          variant: "default"
        })
        // Refresh the proposals list
        fetchProposals()
        setShowDetails(false)
      } else {
        throw new Error(data.error || 'Failed to update proposal')
      }
    } catch (error) {
      console.error('❌ Error updating proposal:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update proposal",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Download file from proposal using hybrid API for MySQL proposals
  const downloadFile = async (proposalId, fileType) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/mongodb-proposals/proposals/${proposalId}/download/${fileType}`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${fileType}_${proposalId}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)

        toast({
          title: "Success",
          description: `${fileType} file downloaded successfully`,
          variant: "default"
        })
      } else {
        throw new Error('Failed to download file')
      }
    } catch (error) {
      console.error('❌ Download error:', error)
      toast({
        title: "Error",
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
    if (!timeString) return 'N/A'
    return timeString
  }

  if (loading) {
    return (
      <div className="@container space-y-4 sm:space-y-6">
        {/* Enhanced Loading State with Skeleton */}
        <Card className="border-l-4 border-l-blue-500 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm sm:text-base text-gray-600">Loading proposals...</span>
            </div>
            {/* Skeleton cards for better UX */}
            <div className="mt-6 space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse p-4 border rounded-lg bg-gray-50"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex flex-col @md:flex-row @md:space-x-4 space-y-3 @md:space-y-0">
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
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
    <div className="@container w-full max-w-full overflow-hidden">
      {/* Enhanced Search and Filters - Mobile-First Responsive Design */}
      <div className="space-y-4 sm:space-y-6">
        <Card className="border-l-4 border-l-green-500 shadow-lg">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col space-y-3 @sm:flex-row @sm:items-center @sm:space-y-0 @sm:space-x-4">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <Input
                  placeholder="Search by event, contact, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full text-sm @sm:text-base border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg"
                  aria-label="Search proposals"
                />
              </div>
              <Button
                onClick={fetchProposals}
                variant="outline"
                disabled={loading}
                className="w-full @sm:w-auto @sm:min-w-[120px] px-4 py-2.5 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 rounded-lg flex items-center justify-center"
                aria-label="Refresh proposals list"
              >
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="whitespace-nowrap">Refresh</span>
              </Button>
            </div>
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600 break-words">
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

        {/* Enhanced Responsive Proposals Table */}
        <Card className="border-l-4 border-l-purple-500 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex flex-col space-y-2 @sm:flex-row @sm:items-center @sm:justify-between @sm:space-y-0">
              <span className="text-base @sm:text-lg @lg:text-xl font-bold text-gray-800">
                Proposals ({pagination.total || 0})
              </span>
              <Badge variant="outline" className="w-fit px-2 @sm:px-3 py-1 text-xs @sm:text-sm">
                Page {pagination.page || 1} of {pagination.pages || 1}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 @sm:p-4 @lg:p-6">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-8 @sm:py-12 px-4">
                <div className="mx-auto w-16 h-16 @sm:w-24 @sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 @sm:w-8 @sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-base @sm:text-lg font-medium text-gray-700 mb-2">No proposals found</h3>
                <p className="text-sm @sm:text-base text-gray-500 max-w-sm mx-auto">
                  {searchTerm ? `No proposals match "${searchTerm}"` : "There are no proposals to display"}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View - Hidden on mobile and small tablets */}
                <div className="hidden @lg:block overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="font-semibold text-gray-700 text-sm px-4 py-3">Event Name</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm px-4 py-3">Organization</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm px-4 py-3">Contact</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm px-4 py-3">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm px-4 py-3">Date</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-sm px-4 py-3">Type</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 text-sm px-4 py-3">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProposals.map((proposal) => {
                        const StatusIcon = statusIcons[proposal.status] || Clock

                        return (
                          <TableRow key={proposal.id} className="hover:bg-gray-50/80 transition-colors duration-150 border-b border-gray-100">
                            <TableCell className="font-medium px-4 py-3">
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 truncate max-w-[200px]">{proposal.eventName}</div>
                                <div className="text-xs text-gray-500 flex items-center mt-1">
                                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{proposal.venue}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 truncate max-w-[150px]">{proposal.contactPerson}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[150px]">{proposal.organizationType}</div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center text-xs">
                                  <Mail className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                                  <span className="truncate max-w-[180px] text-blue-600">{proposal.contactEmail}</span>
                                </div>
                                {proposal.contactPhone && (
                                  <div className="flex items-center text-xs text-gray-600">
                                    <Phone className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{proposal.contactPhone}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <Badge className={`${statusColors[proposal.status] || statusColors.pending} text-xs`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3">
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
                            <TableCell className="px-4 py-3">
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {proposal.eventType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right px-4 py-3">
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
                                        onClick={() => updateProposalStatus(proposal.id, 'denied')}
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

                {/* Mobile Card View - Visible on mobile and small tablets */}
                <div className="@lg:hidden space-y-3 p-3 @sm:p-4">
                  {filteredProposals.map((proposal) => {
                    const StatusIcon = statusIcons[proposal.status] || Clock

                    return (
                      <Card key={proposal.id} className="border border-gray-200 hover:shadow-md transition-all duration-200 bg-white">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Header with event name and status */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-sm @sm:text-base leading-tight mb-1 break-words">{proposal.eventName}</h3>
                                <div className="flex items-center text-xs @sm:text-sm text-gray-500">
                                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate">{proposal.venue}</span>
                                </div>
                              </div>
                              <Badge className={`${statusColors[proposal.status] || statusColors.pending} flex-shrink-0 text-xs`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                              </Badge>
                            </div>

                            {/* Organization info */}
                            <div className="border-t pt-3">
                              <div className="grid grid-cols-1 gap-2">
                                <div>
                                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contact Person</span>
                                  <p className="text-sm @sm:text-base font-medium text-gray-900 mt-0.5 break-words">{proposal.contactPerson}</p>
                                  <p className="text-xs text-gray-500 break-words">{proposal.organizationType}</p>
                                </div>
                              </div>
                            </div>

                            {/* Contact details */}
                            <div className="space-y-2">
                              <div className="flex items-start text-xs @sm:text-sm min-w-0">
                                <Mail className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                                <span className="truncate text-blue-600 break-all">{proposal.contactEmail}</span>
                              </div>
                              {proposal.contactPhone && (
                                <div className="flex items-center text-xs @sm:text-sm text-gray-600">
                                  <Phone className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                                  <span className="break-all">{proposal.contactPhone}</span>
                                </div>
                              )}
                            </div>

                            {/* Date and type info */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <div className="flex items-center text-gray-600">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{formatDate(proposal.startDate)}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {proposal.eventType}
                              </Badge>
                              <span className="text-gray-500">
                                Submitted: {formatDate(proposal.submittedAt)}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="border-t pt-3 flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedProposal(proposal)
                                  setShowDetails(true)
                                }}
                                className="flex-1 min-w-fit text-xs @sm:text-sm px-3 py-2"
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
                                    onClick={() => updateProposalStatus(proposal.id, 'denied')}
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

        {/* Enhanced Responsive Pagination */}
        {pagination.pages > 1 && (
          <Card className="border-l-4 border-l-orange-500 shadow-lg">
            <CardContent className="p-3 @sm:p-4 @lg:p-6">
              <div className="flex flex-col space-y-4 @sm:flex-row @sm:items-center @sm:justify-between @sm:space-y-0">
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
                <div className="flex items-center justify-center space-x-2 @sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!pagination.hasPrev || loading}
                    className="px-3 py-2 text-xs @sm:text-sm border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 transition-all duration-200"
                    aria-label="Go to previous page"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden @sm:inline">Previous</span>
                  </Button>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs @sm:text-sm font-medium px-2 @sm:px-3 py-1 @sm:py-2 bg-blue-50 text-blue-700 rounded border">
                      {pagination.page}
                    </span>
                    <span className="text-xs @sm:text-sm text-gray-500">of</span>
                    <span className="text-xs @sm:text-sm font-medium">{pagination.pages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!pagination.hasNext || loading}
                    className="px-3 py-2 text-xs @sm:text-sm border-gray-300 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 transition-all duration-200"
                    aria-label="Go to next page"
                  >
                    <span className="hidden @sm:inline">Next</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
              {/* Page jump for larger pagination */}
              {pagination.pages > 5 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-col @sm:flex-row items-center space-y-2 @sm:space-y-0 @sm:space-x-4">
                    <label className="text-sm font-medium text-gray-700">Jump to page:</label>
                    <div className="flex items-center space-x-2">
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
          grid w-[100vw] h-[100vh] 
          sm:w-[90vw] sm:h-[85vh] sm:max-w-[800px] sm:max-h-[600px]
          md:w-[80vw] md:h-[80vh] md:max-w-[900px] md:max-h-[700px]
          lg:w-[70vw] lg:h-[75vh] lg:max-w-[1000px] lg:max-h-[750px]
          xl:w-[60vw] xl:h-[70vh] xl:max-w-[1200px] xl:max-h-[800px]
          translate-x-[-50%] translate-y-[-50%]
          border-0 sm:border
          bg-white shadow-none sm:shadow-2xl
          rounded-none sm:rounded-xl
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

                {/* Attached Files Card - Enhanced Responsive Design */}
                {selectedProposal.files && Object.keys(selectedProposal.files).length > 0 && (
                  <Card className="shadow-sm border-l-4 border-l-purple-500">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-t-lg p-4 @sm:p-6">
                      <CardTitle className="text-lg @sm:text-xl font-semibold text-purple-900 flex items-center">
                        <FileText className="h-4 w-4 @sm:h-5 @sm:w-5 mr-2" />
                        Attached Files
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 @sm:p-6">
                      <div className="grid grid-cols-1 @md:grid-cols-2 gap-3 @sm:gap-4">
                        {Object.entries(selectedProposal.files).map(([fileType, fileInfo]) => (
                          <div
                            key={fileType}
                            className="flex items-center justify-between p-3 @sm:p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/30 transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                                <FileText className="h-4 w-4 @sm:h-6 @sm:w-6 text-purple-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm @sm:text-base break-words">
                                  {fileType === "gpoa" ? "General Plan of Action" : "Project Proposal"}
                                </p>
                                <p className="text-xs @sm:text-sm text-gray-500">PDF Document</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(selectedProposal.id, fileType)}
                              className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors flex-shrink-0 ml-2"
                            >
                              <Download className="h-3 w-3 @sm:h-4 @sm:w-4 mr-1 @sm:mr-2" />
                              <span className="hidden @sm:inline">Download</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                          onClick={() => updateProposalStatus(selectedProposal.id, "rejected")}
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
    </div>
  )
}
