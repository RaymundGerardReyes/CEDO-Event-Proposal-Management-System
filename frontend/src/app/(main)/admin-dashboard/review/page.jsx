// frontend/src/app/(main)/admin-dashboard/review/page.jsx

"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/admin/ui/avatar";
import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card";
import { Input } from "@/components/dashboard/admin/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/admin/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/admin/ui/tabs";
import { Filter, Search, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReviewDialog from "./components/ReviewDialog";
import { useReviewDialog } from "./hooks/useReviewDialog";

export default function ReviewPage() {
  // Live proposals pulled from the hybrid backend (MySQL + MongoDB)
  const [proposals, setProposals] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("pending")

  // Use the refactored review dialog hook
  const reviewDialog = useReviewDialog();

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
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        console.log('📊 Fetching proposals from:', `${backendUrl}/api/proposals/admin/proposals?limit=100`);

        const res = await fetch(`${backendUrl}/api/proposals/admin/proposals?limit=100`);

        if (!res.ok) {
          throw new Error(`Failed to fetch proposals: ${res.status}`);
        }

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

          // Debug logging to help identify status issues
          console.log('📊 Proposals loaded:', transformed.length)
          console.log('📊 Status breakdown:', {
            pending: transformed.filter(p => p.status === 'pending').length,
            approved: transformed.filter(p => p.status === 'approved').length,
            rejected: transformed.filter(p => p.status === 'rejected').length,
            denied: transformed.filter(p => p.status === 'denied').length,
            other: transformed.filter(p => !['pending', 'approved', 'rejected', 'denied'].includes(p.status)).length
          })
          console.log('📊 Raw statuses from backend:', [...new Set(transformed.map(p => p.status))])
        } else {
          console.error('Failed to load proposals:', data.error)
        }
      } catch (e) {
        console.error('Network error fetching proposals', e)
      }
    })()
  }, [])

  const handleReviewClick = useCallback((proposal) => {
    reviewDialog.open(proposal)
  }, [reviewDialog]);

  const handleAddComment = useCallback(() => {
    reviewDialog.addComment();
  }, [reviewDialog]);

  const handleSubmitReview = useCallback(() => {
    reviewDialog.submitReview();
  }, [reviewDialog]);

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
                <TabsTrigger value="pending">Pending ({statusCounts.pending})</TabsTrigger>
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

            <TabsContent value="pending">
              {filteredProposals.filter((proposal) => proposal.status === "pending").length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-amber-100 p-3">
                    <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No pending proposals found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search terms' : 'Pending proposals will appear here'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="cedo-table-header">
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Submitter</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProposals
                        .filter((proposal) => proposal.status === "pending")
                        .map((proposal) => (
                          <TableRow key={proposal.id} className="cedo-table-row">
                            <TableCell className="font-medium">{proposal.id}</TableCell>
                            <TableCell>{proposal.title}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={proposal.submitter.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs bg-amber-500 text-white">
                                    {proposal.submitter.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{proposal.submitter.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{proposal.category}</TableCell>
                            <TableCell>{new Date(proposal.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  proposal.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                                    proposal.priority === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                      'bg-green-100 text-green-800 border-green-200'
                                }
                              >
                                {proposal.priority || 'Medium'}
                              </Badge>
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
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

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
              {filteredProposals.filter((proposal) => proposal.status === "rejected").length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="rounded-full bg-red-100 p-3">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No rejected proposals found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm ? 'Try adjusting your search terms' : 'Rejected proposals will appear here'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="cedo-table-header">
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Submitter</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Rejection Reason</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProposals
                        .filter((proposal) => proposal.status === "rejected")
                        .map((proposal) => (
                          <TableRow key={proposal.id} className="cedo-table-row">
                            <TableCell className="font-medium">{proposal.id}</TableCell>
                            <TableCell>{proposal.title}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={proposal.submitter.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs bg-red-500 text-white">
                                    {proposal.submitter.initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{proposal.submitter.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{proposal.category}</TableCell>
                            <TableCell>{new Date(proposal.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="text-sm text-gray-600 truncate">
                                  {proposal.rejectionReason || proposal.reviewComment || 'No reason provided'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReviewClick(proposal)}
                                className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center gap-1"
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
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                  <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Refactored Review Dialog using Compound Component Pattern */}
      <ReviewDialog
        isOpen={reviewDialog.isOpen}
        onClose={reviewDialog.close}
      >
        <ReviewDialog.Header
          proposal={reviewDialog.selectedProposal}
          onClose={reviewDialog.close}
        />

        <ReviewDialog.Content>
          <ReviewDialog.Tabs
            proposal={reviewDialog.selectedProposal}
            activeTab={reviewDialog.activeTab}
            onTabChange={reviewDialog.setActiveTab}
            reviewDecision={reviewDialog.reviewDecision}
            setReviewDecision={reviewDialog.setReviewDecision}
            reviewComment={reviewDialog.reviewComment}
            setReviewComment={reviewDialog.setReviewComment}
            newComment={reviewDialog.newComment}
            setNewComment={reviewDialog.setNewComment}
            onAddComment={handleAddComment}
            isApprovedProposal={reviewDialog.selectedProposal?.status === "approved"}
          />
        </ReviewDialog.Content>

        <ReviewDialog.Footer
          onClose={reviewDialog.close}
          onApprove={() => reviewDialog.setDecisionAndNavigate("approve")}
          onRequestRevision={() => reviewDialog.setDecisionAndNavigate("revision")}
          onReject={() => reviewDialog.setDecisionAndNavigate("reject")}
          canSubmitReview={reviewDialog.canSubmitReview}
        />
      </ReviewDialog>
    </div>
  )
}
