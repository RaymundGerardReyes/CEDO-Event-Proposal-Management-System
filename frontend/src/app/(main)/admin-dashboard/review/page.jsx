// frontend/src/app/(main)/admin-dashboard/review/page.jsx

"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Filter, Search, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import CommentsPanel from "./comments";
import DecisionPanel from "./decision";
import EventDetails from "./EventDetails";

export default function ReviewPage() {
  // Live proposals pulled from the hybrid backend (MySQL + MongoDB)
  const [proposals, setProposals] = useState([])
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewDecision, setReviewDecision] = useState(null)
  const [reviewComment, setReviewComment] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [newComment, setNewComment] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("approved")

  // Memoized filtered proposals for performance
  const filteredProposals = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return proposals.filter((proposal) => {
      // Normalise strings safely (fallback to empty string)
      const titleStr = (proposal.title || proposal.eventName || '').toLowerCase()
      const submitterStr = (proposal.submitter?.name || proposal.contactPerson || '').toLowerCase()

      const matchesSearch = !term || titleStr.includes(term) || submitterStr.includes(term)

      // Backend may send "denied" while UI uses "rejected"
      const normalisedStatus = proposal.status ? (proposal.status === 'denied' ? 'rejected' : proposal.status) : 'pending'
      const matchesStatus = filterStatus === 'all' || normalisedStatus === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [proposals, searchTerm, filterStatus])

  // Memoized status counts
  const statusCounts = useMemo(() => ({
    pending: proposals.filter(p => p.status === "pending").length,
    approved: proposals.filter(p => p.status === "approved").length,
    rejected: proposals.filter(p => p.status === "rejected" || p.status === 'denied').length,
  }), [proposals]);

  // Fetch proposals once on mount
  useEffect(() => {
    (async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'
        const res = await fetch(`${backendUrl}/api/mongodb-proposals/admin/proposals-hybrid?limit=100`)
        const data = await res.json()
        if (data.success) {
          const transformed = (data.proposals || []).map((p) => {
            const nameFallback = p.contactPerson || p.organizationName || 'Unknown'
            const initials = nameFallback
              .split(/\s+/)
              .map((n) => n[0] || '')
              .join('')
              .slice(0, 2)
              .toUpperCase()

            const normalisedStatus = p.status ? (p.status === 'denied' ? 'rejected' : p.status) : 'pending'

            // Build synthetic event detail blocks from flat MySQL columns so the
            // UI tabs have something to display.

            const buildSchoolEvent = () => {
              if (!p.school_event_type && p.organizationType !== 'school-based') return undefined

              const audienceRaw = p.school_target_audience ? (() => {
                try { return JSON.parse(p.school_target_audience) } catch { return p.school_target_audience }
              })() : []

              return {
                name: p.eventName || '',
                description: p.description || '',
                venue: p.venue || p.event_venue || '',
                startDate: p.startDate || p.event_start_date || '',
                endDate: p.endDate || p.event_end_date || '',
                startTime: p.timeStart || p.event_start_time || '',
                endTime: p.timeEnd || p.event_end_time || '',
                type: p.school_event_type || '',
                audience: audienceRaw,
                mode: p.eventMode || p.event_mode || 'offline',
                credits: p.school_return_service_credit || '',
                attachments: {
                  gpoa: p.school_gpoa_file_name || '—',
                  proposal: p.school_proposal_file_name || '—',
                },
              }
            }

            const buildCommunityEvent = () => {
              if (!p.community_event_type && p.organizationType !== 'community-based') return undefined

              const audienceRaw = p.community_target_audience ? (() => {
                try { return JSON.parse(p.community_target_audience) } catch { return p.community_target_audience }
              })() : []

              return {
                name: p.eventName || '',
                description: p.description || '',
                venue: p.venue || p.event_venue || '',
                startDate: p.startDate || p.event_start_date || '',
                endDate: p.endDate || p.event_end_date || '',
                type: p.community_event_type || '',
                audience: audienceRaw,
                mode: p.eventMode || p.event_mode || 'offline',
                credits: p.community_sdp_credits || '',
                attachments: {
                  gpoa: p.community_gpoa_file_name || '—',
                  proposal: p.community_proposal_file_name || '—',
                },
              }
            }

            const schoolEvent = buildSchoolEvent()
            const communityEvent = buildCommunityEvent()

            return {
              ...p,
              status: normalisedStatus,
              priority: p.priority || 'medium',
              title: p.title || p.eventName || 'Untitled Event',
              date: p.submittedAt || p.created_at || p.createdAt || new Date().toISOString(),
              category: p.category || p.organizationType || 'General',
              submitter: {
                name: nameFallback,
                avatar: p.submitter?.avatar || null,
                initials,
              },
              details: p.details || {
                purpose: p.purpose || p.category || 'Event Proposal',
                organization: {
                  description: p.description || p.organizationDescription || '',
                  type: [p.organizationType || 'unknown'],
                },
                ...(schoolEvent ? { schoolEvent } : {}),
                ...(communityEvent ? { communityEvent } : {}),
                comments: [],
              },
            }
          })

          setProposals(transformed)
        } else {
          console.error('Failed to load proposals:', data.error)
        }
      } catch (e) {
        console.error('Network error fetching proposals', e)
      }
    })()
  }, [])

  const handleReviewClick = useCallback((proposal) => {
    setSelectedProposal(proposal)
    setReviewDialogOpen(true)
    setReviewDecision(null)
    setReviewComment("")
    setActiveTab(proposal.status === "approved" ? "documentation" : "overview")
    setNewComment("")
  }, []);

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) return

    // In a real app, this would send the comment to an API
    console.log({
      proposalId: selectedProposal?.id,
      comment: newComment,
    })

    // For demo purposes, we'll add it to the local state
    if (selectedProposal && selectedProposal.details.comments) {
      selectedProposal.details.comments.push({
        role: "Admin",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        text: newComment,
      })
      setNewComment("")
    }
  }, [newComment, selectedProposal]);

  const handleSubmitReview = useCallback(() => {
    // In a real app, this would submit the review to an API
    console.log({
      proposalId: selectedProposal?.id,
      decision: reviewDecision,
      comment: reviewComment,
    })
    setReviewDialogOpen(false)
  }, [selectedProposal, reviewDecision, reviewComment]);

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">


      <Card className="cedo-card">
        <CardHeader>
          <CardTitle className="text-cedo-blue">Proposal Review Queue</CardTitle>
          <CardDescription>Review pending proposals in order of priority</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filterStatus} onValueChange={setFilterStatus} className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="approved">Approved ({statusCounts.approved})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({statusCounts.rejected})</TabsTrigger>
              </TabsList>

              <div className="flex w-full sm:w-auto gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search proposals..."
                    className="pl-8 w-full sm:w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="approved">
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="cedo-table-header">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Submitter</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Documentation</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals
                      .filter((proposal) => proposal.status === "approved")
                      .map((proposal) => (
                        <TableRow key={proposal.id} className="cedo-table-row">
                          <TableCell className="font-medium">{proposal.id}</TableCell>
                          <TableCell>{proposal.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={proposal.submitter.avatar || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs bg-cedo-blue text-white">
                                  {proposal.submitter.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{proposal.submitter.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{proposal.category}</TableCell>
                          <TableCell>{new Date(proposal.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {proposal.details.accomplishmentReport?.submitted ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                Submitted
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReviewClick(proposal)}
                              className="hover:bg-cedo-blue/5 hover:text-cedo-blue flex items-center gap-1"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-1"
                              >
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                              </svg>
                              Monitor Progress
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="rejected">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-full bg-red-100 p-3">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No rejected proposals yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Rejected proposals will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="
          fixed left-[50%] top-[50%] z-50 
          w-[98vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[1200px] xl:max-w-[1400px]
          h-[95vh] max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh]
          translate-x-[-50%] translate-y-[-50%]
          flex flex-col
          border border-gray-200/80 bg-white shadow-2xl
          duration-300 ease-out
          data-[state=open]:animate-in data-[state=closed]:animate-out 
          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 
          data-[state=closed]:zoom-out-[0.98] data-[state=open]:zoom-in-[0.98]
          data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]
          data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]
          rounded-none sm:rounded-lg md:rounded-xl
          overflow-hidden
          backdrop-blur-sm
        ">
          {/* Enhanced Header with better visual hierarchy */}
          <div className="
            sticky top-0 z-20 
            bg-white/95 backdrop-blur-sm border-b border-gray-200/60
            px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6
            shadow-sm
          ">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                <div className="flex items-start justify-between sm:justify-start">
                  <DialogTitle className="
                    text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 
                    leading-tight tracking-tight break-words pr-2
                  ">
                    System Review: Event Proposal
                  </DialogTitle>
                  {/* Mobile close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setReviewDialogOpen(false)}
                    className="sm:hidden h-8 w-8 rounded-full hover:bg-gray-100"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                <DialogDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Review the complete proposal details and provide your decision
                </DialogDescription>
              </div>

              {/* Enhanced status and ID display */}
              {selectedProposal && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:flex-col sm:items-end">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`
                        px-3 py-1.5 text-sm font-semibold rounded-full
                        ${selectedProposal.status === 'approved'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : selectedProposal.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }
                      `}
                    >
                      {selectedProposal.status?.charAt(0).toUpperCase() + selectedProposal.status?.slice(1)}
                    </Badge>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                    ID: {selectedProposal.id}
                  </div>
                  {/* Desktop close button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewDialogOpen(false)}
                    className="hidden sm:flex items-center gap-2 text-sm px-3 py-1.5"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Content Area */}
          {selectedProposal && (
            <div className="flex-1 overflow-y-auto bg-gray-50/30">
              <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <div className="max-w-none space-y-6 sm:space-y-8">
                  <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Enhanced Tab Navigation */}
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-1 mb-6 shadow-sm">
                      <TabsList className="grid w-full grid-cols-4 h-12 bg-transparent p-0">
                        <TabsTrigger
                          value="overview"
                          className="
                            text-sm font-medium rounded-md transition-all duration-200
                            data-[state=active]:bg-cedo-blue data-[state=active]:text-white data-[state=active]:shadow-sm
                            hover:bg-gray-100 data-[state=active]:hover:bg-cedo-blue
                          "
                        >
                          Overview
                        </TabsTrigger>
                        <TabsTrigger
                          value="events"
                          className="
                            text-sm font-medium rounded-md transition-all duration-200
                            data-[state=active]:bg-cedo-blue data-[state=active]:text-white data-[state=active]:shadow-sm
                            hover:bg-gray-100 data-[state=active]:hover:bg-cedo-blue
                          "
                        >
                          Event Details
                        </TabsTrigger>
                        <TabsTrigger
                          value="comments"
                          className="
                            text-sm font-medium rounded-md transition-all duration-200
                            data-[state=active]:bg-cedo-blue data-[state=active]:text-white data-[state=active]:shadow-sm
                            hover:bg-gray-100 data-[state=active]:hover:bg-cedo-blue
                          "
                        >
                          Comments
                        </TabsTrigger>
                        <TabsTrigger
                          value="decision"
                          className="
                            text-sm font-medium rounded-md transition-all duration-200
                            data-[state=active]:bg-cedo-blue data-[state=active]:text-white data-[state=active]:shadow-sm
                            hover:bg-gray-100 data-[state=active]:hover:bg-cedo-blue
                          "
                        >
                          Decision
                        </TabsTrigger>
                        {selectedProposal && selectedProposal.status === "approved" && (
                          <TabsTrigger
                            value="documentation"
                            className="
                              text-sm font-medium rounded-md transition-all duration-200
                              data-[state=active]:bg-cedo-blue data-[state=active]:text-white data-[state=active]:shadow-sm
                              hover:bg-gray-100 data-[state=active]:hover:bg-cedo-blue
                            "
                          >
                            Documentation
                          </TabsTrigger>
                        )}
                      </TabsList>
                    </div>

                    {/* Overview Tab - Enhanced Cards */}
                    <TabsContent value="overview" className="space-y-6">
                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <div className="w-2 h-2 bg-cedo-blue rounded-full mr-3"></div>
                            Submission Overview
                          </h3>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Proposal ID</Label>
                              <p className="mt-2 text-base font-semibold text-gray-900">{selectedProposal.id}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Submission Date</Label>
                              <p className="mt-2 text-base text-gray-900">{new Date(selectedProposal.date).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Purpose</Label>
                              <p className="mt-2 text-base text-gray-900">{selectedProposal.details.purpose}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Category</Label>
                              <p className="mt-2 text-base text-gray-900">{selectedProposal.category}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Priority</Label>
                              <p className="mt-2 text-base text-gray-900 capitalize">{selectedProposal.priority}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</Label>
                              <Badge variant="outline" className="mt-2 font-medium">
                                {selectedProposal.status.charAt(0).toUpperCase() + selectedProposal.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <div className="w-2 h-2 bg-cedo-blue rounded-full mr-3"></div>
                            Organization Information
                          </h3>
                        </div>
                        <div className="p-6 space-y-6">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Description</Label>
                            <p className="mt-2 text-base text-gray-900 leading-relaxed">{selectedProposal.details.organization.description}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Organization Type</Label>
                              <p className="mt-2 text-base text-gray-900">{selectedProposal.details.organization.type.join(", ")}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Submitter</Label>
                              <div className="flex items-center gap-3 mt-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={selectedProposal.submitter.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs bg-cedo-blue text-white font-medium">
                                    {selectedProposal.submitter.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-base text-gray-900 font-medium">{selectedProposal.submitter.name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Event Details Tab */}
                    <TabsContent value="events" className="space-y-6">
                      <EventDetails selectedProposal={selectedProposal} />
                    </TabsContent>

                    {/* Comments Tab */}
                    <TabsContent value="comments" className="space-y-6">
                      <CommentsPanel
                        selectedProposal={selectedProposal}
                        newComment={newComment}
                        setNewComment={setNewComment}
                        handleAddComment={handleAddComment}
                      />
                    </TabsContent>

                    {/* Decision Tab */}
                    <TabsContent value="decision" className="space-y-6">
                      <DecisionPanel
                        reviewDecision={reviewDecision}
                        setReviewDecision={setReviewDecision}
                        reviewComment={reviewComment}
                        setReviewComment={setReviewComment}
                      />
                    </TabsContent>

                    {selectedProposal && selectedProposal.status === "approved" && (
                      <TabsContent value="documentation" className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-green-50 to-green-100/50 px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                              Documentation & Accomplishment Reports
                            </h3>
                          </div>
                          <div className="p-6">
                            {selectedProposal.details.accomplishmentReport ? (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Description</Label>
                                      <p className="mt-2 text-base text-gray-900">{selectedProposal.details.accomplishmentReport.description}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Organization Type</Label>
                                      <p className="mt-2 text-base text-gray-900">{selectedProposal.details.accomplishmentReport.organizationType.join(", ")}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Organization Name</Label>
                                      <p className="mt-2 text-base text-gray-900">{selectedProposal.details.accomplishmentReport.organizationName}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                      <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Event Name</Label>
                                      <p className="mt-2 text-base text-gray-900">{selectedProposal.details.accomplishmentReport.eventName}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                  <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 block">Attachments</Label>
                                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                      <FileText className="h-5 w-5 text-gray-500" />
                                      <span className="text-base text-gray-900 font-medium">
                                        Accomplishment Report: {selectedProposal.details.accomplishmentReport.attachments.report}
                                      </span>
                                    </div>
                                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                                      <Download className="h-4 w-4" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                  <Label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Submission Status</Label>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge className="bg-green-100 text-green-800 border-green-300">
                                      ✓ Submitted on {selectedProposal.details.accomplishmentReport.submittedDate}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                                <h4 className="text-lg font-medium text-gray-900 mb-2">No documentation submitted yet</h4>
                                <p className="text-gray-600 mb-4">Documentation will appear here once submitted</p>
                                <Button className="bg-cedo-blue hover:bg-cedo-blue/90">Request Documentation</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Footer */}
          <div className="
            sticky bottom-0 z-20 
            bg-white/95 backdrop-blur-sm border-t border-gray-200/60
            px-4 sm:px-6 lg:px-8 py-4 sm:py-5
            shadow-lg
          ">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
                className="order-2 sm:order-1 px-6 py-2.5 font-medium"
              >
                Cancel
              </Button>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 order-1 sm:order-2">
                <Button
                  onClick={() => {
                    setReviewDecision("approve")
                    setActiveTab("decision")
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 font-medium shadow-sm"
                >
                  ✓ Approve Proposal
                </Button>
                <Button
                  onClick={() => {
                    setReviewDecision("revision")
                    setActiveTab("decision")
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 font-medium shadow-sm"
                >
                  📝 Request Revision
                </Button>
                <Button
                  onClick={() => {
                    if (
                      confirm(
                        "Warning: Rejection will halt the process entirely. Consider requesting revisions instead to keep the proposal active. Are you sure you want to reject?"
                      )
                    ) {
                      setReviewDecision("reject")
                      setActiveTab("decision")
                    }
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 font-medium shadow-sm relative group"
                  title="Avoid rejection - request revisions instead"
                >
                  <span className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    ⚠️ Consider revision instead
                  </span>
                  ✗ Reject Proposal
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
