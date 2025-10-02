// frontend/src/app/admin-dashboard/proposals/[uuid]/page.jsx

"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { addProposalComment, approveProposal, denyProposal, downloadProposalFile, fetchProposalByUuid } from "@/services/admin-proposals.service"
import { getApiUrl, getAuthToken } from "@/utils/api"
import { format } from "date-fns"
import { ArrowLeft, Building, Calendar, CheckCircle, Clock, Download, Eye, FileText, User, XCircle } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProposalDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [proposal, setProposal] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [approveOpen, setApproveOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)
    const [commentOpen, setCommentOpen] = useState(false)
    const [approveComment, setApproveComment] = useState("")
    const [rejectReason, setRejectReason] = useState("")
    const [newComment, setNewComment] = useState("")
    // Preview state
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewUrl, setPreviewUrl] = useState("")
    const [previewType, setPreviewType] = useState("")
    const [previewName, setPreviewName] = useState("")
    const { toast } = useToast?.() || { toast: () => { } }

    const uuid = params.uuid

    const refresh = async () => {
        const response = await fetchProposalByUuid(uuid)
        if (response?.success && response?.proposal) {
            setProposal(response.proposal)
        }
    }

    const handleApprove = async () => {
        if (!uuid || !proposal) return
        try {
            setActionLoading(true)
            const res = await approveProposal(uuid, approveComment || null)
            if (!res?.success) throw new Error(res?.error || "Approve failed")
            await refresh()
            toast({ title: "Proposal approved", description: "Status updated to Approved." })
            setApproveOpen(false)
            setApproveComment("")
        } catch (e) {
            console.error(e)
            toast({ title: "Approval failed", description: e.message || "Please try again.", variant: "destructive" })
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async () => {
        if (!uuid || !proposal) return
        if (!rejectReason || !rejectReason.trim()) {
            toast({ title: "Reason required", description: "Please provide a rejection reason.", variant: "destructive" })
            return
        }
        try {
            setActionLoading(true)
            const res = await denyProposal(uuid, rejectReason.trim())
            if (!res?.success) throw new Error(res?.error || "Reject failed")
            await refresh()
            toast({ title: "Proposal rejected", description: "Status updated to Denied." })
            setRejectOpen(false)
            setRejectReason("")
        } catch (e) {
            console.error(e)
            toast({ title: "Rejection failed", description: e.message || "Please try again.", variant: "destructive" })
        } finally {
            setActionLoading(false)
        }
    }

    const handleAddComment = async () => {
        if (!uuid || !proposal) return
        if (!newComment || !newComment.trim()) {
            toast({ title: "Comment required", description: "Comment cannot be empty.", variant: "destructive" })
            return
        }
        try {
            setActionLoading(true)
            const res = await addProposalComment(uuid, newComment.trim())
            if (!res?.success) throw new Error(res?.error || "Add comment failed")
            await refresh()
            toast({ title: "Comment added", description: "Your comment was saved." })
            setCommentOpen(false)
            setNewComment("")
        } catch (e) {
            console.error(e)
            toast({ title: "Add comment failed", description: e.message || "Please try again.", variant: "destructive" })
        } finally {
            setActionLoading(false)
        }
    }

    const handleDownload = async (fileType, fileName) => {
        try {
            if (!uuid) return
            const url = getApiUrl(`/admin/proposals/${uuid}/download/${fileType}`)
            const token = getAuthToken()
            const resp = await fetch(url, {
                method: 'GET',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                credentials: 'include'
            })
            if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`)

            // Try to read filename from Content-Disposition
            const cd = resp.headers.get('content-disposition') || ''
            let serverName = null
            const match = /filename="?([^";]+)"?/i.exec(cd)
            if (match && match[1]) serverName = decodeURIComponent(match[1])

            const blob = await resp.blob()
            const objectUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = objectUrl
            a.download = serverName || fileName || `${fileType}`
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(objectUrl)
        } catch (e) {
            console.error(e)
            toast({ title: "Download failed", description: e.message || "Please try again.", variant: "destructive" })
        }
    }

    const handlePreview = async (fileType, fileName) => {
        try {
            if (!uuid) return
            const res = await downloadProposalFile(uuid, fileType)
            if (!res?.success || !res?.blob) throw new Error("Preview failed")
            const mime = res.blob.type || "application/octet-stream"
            const url = URL.createObjectURL(res.blob)
            setPreviewUrl(url)
            setPreviewType(mime)
            setPreviewName(fileName || fileType)
            setPreviewOpen(true)
        } catch (e) {
            console.error(e)
            toast({ title: "Preview failed", description: e.message || "Please try again.", variant: "destructive" })
        }
    }

    const closePreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl("")
        setPreviewType("")
        setPreviewName("")
        setPreviewOpen(false)
    }

    useEffect(() => {
        console.log('🔍 ProposalDetailPage useEffect triggered:', {
            uuid,
            uuidType: typeof uuid,
            uuidLength: uuid?.length,
            isValidUuid: uuid && uuid.length === 36
        })

        if (!uuid) {
            console.log('❌ No UUID provided')
            return
        }

        const fetchProposal = async () => {
            try {
                setLoading(true)
                setError(null)

                console.log('🎯 Fetching proposal for UUID:', uuid)

                // Validate UUID format before making request
                const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
                if (!uuidRegex.test(uuid)) {
                    console.error('❌ Invalid UUID format:', uuid)
                    setError('Invalid UUID format')
                    setLoading(false)
                    return
                }

                console.log('✅ UUID format valid, fetching proposal...')
                const response = await fetchProposalByUuid(uuid)
                console.log('📡 API Response:', response)

                if (response?.success && response?.proposal) {
                    console.log('✅ Proposal fetched successfully:', response.proposal)
                    console.log('🔍 File fields debug:', {
                        gpoaFileName: response.proposal.gpoaFileName,
                        projectProposalFileName: response.proposal.projectProposalFileName,
                        gpoa_file_name: response.proposal.gpoa_file_name,
                        project_proposal_file_name: response.proposal.project_proposal_file_name,
                        files: response.proposal.files
                    })
                    setProposal(response.proposal)
                } else {
                    console.error('❌ Proposal not found:', response?.error)
                    setError(response?.error || 'Proposal not found')
                }
            } catch (err) {
                console.error('❌ Error fetching proposal:', err)
                setError(err.message || 'Failed to load proposal')
            } finally {
                setLoading(false)
            }
        }

        fetchProposal()
    }, [uuid])

    const handleBack = () => {
        router.push('/admin-dashboard/proposals')
    }

    if (loading) {
        return (
            <div className="flex-1 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Proposals
                    </Button>
                </div>
                <div className="space-y-4">
                    <div className="h-8 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                </div>
            </div>
        )
    }

    if (error || !proposal) {
        return (
            <div className="flex-1 p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" onClick={handleBack}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Proposals
                    </Button>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <h2 className="text-xl font-semibold mb-2">Proposal Not Found</h2>
                            <p className="text-muted-foreground mb-4">{error || 'The requested proposal could not be found.'}</p>
                            <Button onClick={handleBack}>Return to Proposals</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            case 'denied':
            case 'rejected':
                return 'bg-red-100 text-red-800'
            case 'draft':
                return 'bg-blue-100 text-blue-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="flex-1 p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Proposals
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold">{proposal.eventName}</h1>
                    <p className="text-sm text-muted-foreground">Proposal Details</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Event Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Event Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Event Name</label>
                                    <p className="text-sm">{proposal.eventName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                                    <p className="text-sm">{proposal.eventType || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                                    <p className="text-sm">
                                        {proposal.startDate ? format(new Date(proposal.startDate), 'MMM dd, yyyy') : 'TBD'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">End Date</label>
                                    <p className="text-sm">
                                        {proposal.endDate ? format(new Date(proposal.endDate), 'MMM dd, yyyy') : 'TBD'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Start Time</label>
                                    <p className="text-sm">{proposal.startTime || 'TBD'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">End Time</label>
                                    <p className="text-sm">{proposal.endTime || 'TBD'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground">Venue (Platform or Address)</label>
                                    <p className="text-sm">{proposal.venue || 'TBD'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Event Mode</label>
                                    <p className="text-sm capitalize">{proposal.eventMode || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">SDP Credits</label>
                                    <p className="text-sm">{proposal.sdpCredits || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Organization Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="w-5 h-5" />
                                Organization Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                                    <p className="text-sm">{proposal.organization}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Organization Type</label>
                                    <p className="text-sm">{proposal.organizationType || 'N/A'}</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                    <p className="text-sm">{proposal.organizationDescription || 'No description provided'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                                    <p className="text-sm">{proposal.contact?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                                    <p className="text-sm">{proposal.contact?.email || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                    <p className="text-sm">{proposal.contact?.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Target Audience */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Target Audience
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Target Audience</label>
                                <p className="text-sm">
                                    {proposal.targetAudience && Array.isArray(proposal.targetAudience)
                                        ? proposal.targetAudience.join(', ')
                                        : proposal.targetAudience || 'N/A'
                                    }
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attached Files */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Attached Files
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">GPOA File</label>
                                    <div className="text-sm flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handlePreview('gpoa')}>
                                            <Eye className="w-3 h-3 mr-1" /> Preview
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDownload('gpoa')}>
                                            <Download className="w-3 h-3 mr-1" /> Download
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Project Proposal File</label>
                                    <div className="text-sm flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handlePreview('projectProposal')}>
                                            <Eye className="w-3 h-3 mr-1" /> Preview
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleDownload('projectProposal')}>
                                            <Download className="w-3 h-3 mr-1" /> Download
                                        </Button>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Status
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                                    <div className="mt-1">
                                        <Badge className={`${getStatusColor(proposal.status)} text-xs`}>
                                            {proposal.status?.charAt(0).toUpperCase() + proposal.status?.slice(1) || 'Unknown'}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                                    <p className="text-sm">{proposal.type || 'N/A'}</p>
                                </div>
                                {proposal.submittedAt && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                                        <p className="text-sm">{format(new Date(proposal.submittedAt), 'MMM dd, yyyy HH:mm')}</p>
                                    </div>
                                )}
                                {proposal.approvedAt && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Approved</label>
                                        <p className="text-sm">{format(new Date(proposal.approvedAt), 'MMM dd, yyyy HH:mm')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button className="w-full" variant="outline" onClick={() => setApproveOpen(true)} disabled={actionLoading} aria-label="Approve proposal">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {actionLoading ? 'Processing…' : 'Approve'}
                            </Button>
                            <Button className="w-full" variant="outline" onClick={() => setRejectOpen(true)} disabled={actionLoading} aria-label="Reject proposal">
                                <XCircle className="w-4 h-4 mr-2" />
                                {actionLoading ? 'Processing…' : 'Reject'}
                            </Button>
                            <Button className="w-full" variant="outline" onClick={() => setCommentOpen(true)} disabled={actionLoading} aria-label="Add admin comment">
                                <FileText className="w-4 h-4 mr-2" />
                                {actionLoading ? 'Saving…' : 'Add Comment'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Approve Dialog */}
                    <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Approve proposal</DialogTitle>
                                <DialogDescription>
                                    Optionally add an approval note. This will be saved to admin comments.
                                </DialogDescription>
                            </DialogHeader>
                            <Textarea
                                placeholder="Optional approval note"
                                value={approveComment}
                                onChange={(e) => setApproveComment(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={actionLoading}>Cancel</Button>
                                <Button onClick={handleApprove} disabled={actionLoading}>{actionLoading ? 'Approving…' : 'Approve'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Reject Dialog */}
                    <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Reject proposal</DialogTitle>
                                <DialogDescription>
                                    Please provide a reason. This will be saved to admin comments and may notify the submitter.
                                </DialogDescription>
                            </DialogHeader>
                            <Textarea
                                placeholder="Rejection reason (required)"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={actionLoading}>Cancel</Button>
                                <Button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} variant="destructive">{actionLoading ? 'Rejecting…' : 'Reject'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Add Comment Dialog */}
                    <Dialog open={commentOpen} onOpenChange={setCommentOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add admin comment</DialogTitle>
                                <DialogDescription>
                                    Add an internal note to this proposal. Timestamp will be appended automatically.
                                </DialogDescription>
                            </DialogHeader>
                            <Textarea
                                placeholder="Write a comment"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="min-h-[100px]"
                            />
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCommentOpen(false)} disabled={actionLoading}>Cancel</Button>
                                <Button onClick={handleAddComment} disabled={actionLoading || !newComment.trim()}> {actionLoading ? 'Saving…' : 'Save Comment'}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Additional Information */}
                    {(proposal.budget || proposal.volunteersNeeded || proposal.attendanceCount) && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {proposal.budget && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Budget</label>
                                        <p className="text-sm">${proposal.budget.toLocaleString()}</p>
                                    </div>
                                )}
                                {proposal.volunteersNeeded && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Volunteers Needed</label>
                                        <p className="text-sm">{proposal.volunteersNeeded}</p>
                                    </div>
                                )}
                                {proposal.attendanceCount && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Expected Attendance</label>
                                        <p className="text-sm">{proposal.attendanceCount}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* File Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={(open) => open ? setPreviewOpen(true) : closePreview()}>
                <DialogContent className="max-w-4xl w-full">
                    <DialogHeader>
                        <DialogTitle>Preview: {previewName}</DialogTitle>
                        <DialogDescription>
                            {previewType}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="w-full" style={{ minHeight: 400 }}>
                        {previewType.startsWith('image/') ? (
                            <img src={previewUrl} alt={previewName} className="max-w-full max-h-[70vh] mx-auto" />
                        ) : previewType === 'application/pdf' ? (
                            <iframe src={previewUrl} title={previewName} className="w-full h-[70vh]" />
                        ) : (
                            <div className="text-sm text-muted-foreground">No inline preview available for this file type. Use Download instead.</div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleDownload('document', previewName)}>
                            <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                        <Button onClick={closePreview}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
