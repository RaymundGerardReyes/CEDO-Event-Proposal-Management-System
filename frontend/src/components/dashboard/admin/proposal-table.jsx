"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
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
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

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

  // Fetch proposals from API
  const fetchProposals = useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const apiUrl = `/api/admin/proposals?${queryParams}`
      console.log('📋 Fetching proposals from frontend API:', apiUrl)

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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading proposals...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={fetchProposals}
          variant="outline"
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Proposals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Proposals ({pagination.total || 0})</span>
            <Badge variant="outline">
              Page {pagination.page || 1} of {pagination.pages || 1}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proposals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No proposals found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((proposal) => {
                  const StatusIcon = statusIcons[proposal.status] || Clock

                  return (
                    <TableRow key={proposal.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{proposal.eventName}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {proposal.venue}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{proposal.contactPerson}</div>
                          <div className="text-sm text-gray-500">{proposal.organizationType}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {proposal.contactEmail}
                          </div>
                          {proposal.contactPhone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {proposal.contactPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[proposal.status] || statusColors.pending}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(proposal.startDate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Submitted: {formatDate(proposal.submittedAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {proposal.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedProposal(proposal)
                              setShowDetails(true)
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {proposal.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => updateProposalStatus(proposal.id, 'approved')}>
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateProposalStatus(proposal.id, 'denied')}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-600" />
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
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {proposals.length} of {pagination.total} proposals
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrev}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Proposal Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="fixed left-[50%] top-[50%] z-70 grid w-[90vw] max-w-[1200px] h-[90vh] max-h-[800px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg overflow-hidden">
          <DialogHeader className="border-b pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Proposal Details</DialogTitle>
                <DialogDescription className="text-base text-gray-600">
                  Review and manage this proposal submission
                </DialogDescription>
              </div>
              {selectedProposal && (
                <div className="flex items-center gap-3">
                  <Badge
                    className={`px-3 py-1 text-sm font-medium ${statusColors[selectedProposal.status] || statusColors.pending}`}
                  >
                    {selectedProposal.status?.charAt(0).toUpperCase() + selectedProposal.status?.slice(1)}
                  </Badge>
                  <div className="text-sm text-gray-500">ID: {selectedProposal.id}</div>
                </div>
              )}
            </div>
          </DialogHeader>

          {selectedProposal && (
            <div className="overflow-y-auto max-h-[calc(95vh-120px)] pr-2">
              <div className="space-y-8">
                {/* Event Information Card */}
                <Card className="shadow-sm border-l-4 border-l-blue-500">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-t-lg">
                    <CardTitle className="text-xl font-semibold text-blue-900 flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Event Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Event Name
                          </Label>
                          <p className="mt-2 text-lg font-medium text-gray-900">{selectedProposal.eventName}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Venue</Label>
                          <p className="mt-2 text-base text-gray-900 flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedProposal.venue}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Start Date & Time
                          </Label>
                          <p className="mt-2 text-base text-gray-900">
                            {formatDate(selectedProposal.startDate)} at {formatTime(selectedProposal.timeStart)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Event Type
                          </Label>
                          <p className="mt-2 text-base text-gray-900">{selectedProposal.eventType}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Event Mode
                          </Label>
                          <p className="mt-2 text-base text-gray-900">{selectedProposal.eventMode}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            End Date & Time
                          </Label>
                          <p className="mt-2 text-base text-gray-900">
                            {formatDate(selectedProposal.endDate)} at {formatTime(selectedProposal.timeEnd)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Organization Information Card */}
                <Card className="shadow-sm border-l-4 border-l-green-500">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-t-lg">
                    <CardTitle className="text-xl font-semibold text-green-900 flex items-center">
                      <Mail className="h-5 w-5 mr-2" />
                      Organization Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Contact Person
                          </Label>
                          <p className="mt-2 text-lg font-medium text-gray-900">{selectedProposal.contactPerson}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Email Address
                          </Label>
                          <p className="mt-2 text-base text-gray-900 flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedProposal.contactEmail}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Organization Type
                          </Label>
                          <p className="mt-2 text-base text-gray-900">{selectedProposal.organizationType}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <Label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            Phone Number
                          </Label>
                          <p className="mt-2 text-base text-gray-900 flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedProposal.contactPhone}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Attached Files Card */}
                {selectedProposal.files && Object.keys(selectedProposal.files).length > 0 && (
                  <Card className="shadow-sm border-l-4 border-l-purple-500">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-t-lg">
                      <CardTitle className="text-xl font-semibold text-purple-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Attached Files
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(selectedProposal.files).map(([fileType, fileInfo]) => (
                          <div
                            key={fileType}
                            className="flex items-center justify-between p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50/30 transition-all duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <FileText className="h-6 w-6 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {fileType === "gpoa" ? "General Plan of Action" : "Project Proposal"}
                                </p>
                                <p className="text-sm text-gray-500">PDF Document</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadFile(selectedProposal.id, fileType)}
                              className="hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admin Actions Card */}
                {selectedProposal.status === "pending" && (
                  <Card className="shadow-sm border-l-4 border-l-orange-500">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-t-lg">
                      <CardTitle className="text-xl font-semibold text-orange-900 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Administrative Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={() => updateProposalStatus(selectedProposal.id, "approved")}
                          disabled={actionLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium"
                          size="lg"
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          {actionLoading ? "Processing..." : "Approve Proposal"}
                        </Button>
                        <Button
                          onClick={() => updateProposalStatus(selectedProposal.id, "rejected")}
                          disabled={actionLoading}
                          variant="destructive"
                          className="flex-1 py-3 text-base font-medium"
                          size="lg"
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          {actionLoading ? "Processing..." : "Deny Proposal"}
                        </Button>
                      </div>
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> Once you approve or deny this proposal, the decision cannot be easily
                          reversed. Please review all information carefully before taking action.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Admin Comments Card */}
                {selectedProposal.adminComments && (
                  <Card className="shadow-sm border-l-4 border-l-gray-500">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-t-lg">
                      <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                        <FileText className="h-5 w-5 mr-2" />
                        Admin Comments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-l-gray-400">
                        <p className="text-gray-800 leading-relaxed">{selectedProposal.adminComments}</p>
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
