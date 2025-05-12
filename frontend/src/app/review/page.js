"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Filter, CheckCircle, XCircle, FileText, Download } from "lucide-react"
import { PageHeader } from "@/components/page-header"

// Sample data for proposals
const proposals = [
  {
    id: "PROP-1001",
    title: "Community Outreach Program",
    submitter: {
      name: "Health Department",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "HD",
    },
    category: "Health",
    status: "pending",
    date: "2023-03-15",
    priority: "high",
    type: "internal",
    documents: [
      { name: "Program_Outline.pdf", size: 1.2 },
      { name: "Budget_Breakdown.xlsx", size: 0.8 },
    ],
  },
  {
    id: "PROP-1002",
    title: "HIV Awareness Campaign",
    submitter: {
      name: "XU Medical Center",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "XU",
    },
    category: "Health",
    status: "pending",
    date: "2023-03-14",
    priority: "medium",
    type: "external",
    documents: [
      { name: "Campaign_Proposal.pdf", size: 2.5 },
      { name: "Timeline.pdf", size: 0.5 },
    ],
  },
  {
    id: "PROP-1003",
    title: "Tech Skills Workshop",
    submitter: {
      name: "Lourdes College",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "LC",
    },
    category: "Education",
    status: "pending",
    date: "2023-03-12",
    priority: "low",
    type: "external",
    documents: [{ name: "Workshop_Details.pdf", size: 1.8 }],
  },
  {
    id: "PROP-1004",
    title: "Small Business Development Program",
    submitter: {
      name: "Economic Development Office",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "ED",
    },
    category: "Community",
    status: "pending",
    date: "2023-03-10",
    priority: "medium",
    type: "internal",
    documents: [
      { name: "Program_Details.docx", size: 1.3 },
      { name: "Budget.xlsx", size: 0.7 },
      { name: "Implementation_Plan.pdf", size: 2.1 },
    ],
  },
  {
    id: "PROP-1005",
    title: "Youth Leadership Summit",
    submitter: {
      name: "CSO Organization",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "CO",
    },
    category: "Leadership",
    status: "pending",
    date: "2023-03-08",
    priority: "high",
    type: "external",
    documents: [
      { name: "Summit_Proposal.pdf", size: 3.2 },
      { name: "Speaker_Profiles.pdf", size: 1.5 },
    ],
  },
]

export default function ReviewPage() {
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [reviewDecision, setReviewDecision] = useState(null)
  const [reviewComment, setReviewComment] = useState("")
  const [complianceChecklist, setComplianceChecklist] = useState({
    budgetApproved: false,
    timelineRealistic: false,
    objectivesAligned: false,
    resourcesAvailable: false,
    documentationComplete: false,
  })

  const handleReviewClick = (proposal) => {
    setSelectedProposal(proposal)
    setReviewDialogOpen(true)
    setReviewDecision(null)
    setReviewComment("")
    setComplianceChecklist({
      budgetApproved: false,
      timelineRealistic: false,
      objectivesAligned: false,
      resourcesAvailable: false,
      documentationComplete: false,
    })
  }

  const handleDocumentsClick = (proposal) => {
    setSelectedProposal(proposal)
    setDocumentDialogOpen(true)
  }

  const handleSubmitReview = () => {
    // In a real app, this would submit the review to an API
    console.log({
      proposalId: selectedProposal?.id,
      decision: reviewDecision,
      comment: reviewComment,
      complianceChecklist,
    })
    setReviewDialogOpen(false)
  }

  const isComplianceComplete = () => {
    return Object.values(complianceChecklist).every((value) => value === true)
  }

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader
        title="Review Partnership Proposals"
        subtitle="Review and approve or reject submitted partnership proposals"
      />

      <Card className="cedo-card">
        <CardHeader>
          <CardTitle className="text-cedo-blue">Proposal Review Queue</CardTitle>
          <CardDescription>Review pending proposals in order of priority</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <TabsList>
                <TabsTrigger value="pending">Pending ({proposals.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved (0)</TabsTrigger>
                <TabsTrigger value="rejected">Rejected (0)</TabsTrigger>
              </TabsList>

              <div className="flex w-full sm:w-auto gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search proposals..." className="pl-8 w-full sm:w-[250px]" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="pending" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="cedo-table-header">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Submitter</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((proposal) => (
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
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              proposal.type === "internal"
                                ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                                : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            }
                          >
                            {proposal.type.charAt(0).toUpperCase() + proposal.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{proposal.category}</TableCell>
                        <TableCell>{new Date(proposal.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              proposal.priority === "high"
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : proposal.priority === "medium"
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                  : "bg-green-100 text-green-800 hover:bg-green-100"
                            }
                          >
                            {proposal.priority.charAt(0).toUpperCase() + proposal.priority.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentsClick(proposal)}
                            className="hover:bg-cedo-blue/5 hover:text-cedo-blue"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            {proposal.documents.length}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReviewClick(proposal)}
                            className="hover:bg-cedo-blue/5 hover:text-cedo-blue"
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="approved">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No approved proposals yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Approved proposals will appear here</p>
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Review Partnership Proposal</DialogTitle>
            <DialogDescription>Review the proposal details and provide your decision</DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Proposal ID</Label>
                  <p className="font-medium">{selectedProposal.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Submission Date</Label>
                  <p>{new Date(selectedProposal.date).toLocaleDateString()}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <p className="font-medium">{selectedProposal.title}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p>{selectedProposal.category}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <p className="capitalize">{selectedProposal.priority}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Submitter</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={selectedProposal.submitter.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs bg-cedo-blue text-white">
                        {selectedProposal.submitter.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span>{selectedProposal.submitter.name}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>CEDO Compliance Checklist</Label>
                <div className="space-y-2 border rounded-md p-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="budgetApproved"
                      checked={complianceChecklist.budgetApproved}
                      onChange={(e) =>
                        setComplianceChecklist({ ...complianceChecklist, budgetApproved: e.target.checked })
                      }
                    />
                    <Label htmlFor="budgetApproved" className="text-sm font-normal">
                      Budget is reasonable and approved
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="timelineRealistic"
                      checked={complianceChecklist.timelineRealistic}
                      onChange={(e) =>
                        setComplianceChecklist({ ...complianceChecklist, timelineRealistic: e.target.checked })
                      }
                    />
                    <Label htmlFor="timelineRealistic" className="text-sm font-normal">
                      Timeline is realistic
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="objectivesAligned"
                      checked={complianceChecklist.objectivesAligned}
                      onChange={(e) =>
                        setComplianceChecklist({ ...complianceChecklist, objectivesAligned: e.target.checked })
                      }
                    />
                    <Label htmlFor="objectivesAligned" className="text-sm font-normal">
                      Objectives align with CEDO goals
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="resourcesAvailable"
                      checked={complianceChecklist.resourcesAvailable}
                      onChange={(e) =>
                        setComplianceChecklist({ ...complianceChecklist, resourcesAvailable: e.target.checked })
                      }
                    />
                    <Label htmlFor="resourcesAvailable" className="text-sm font-normal">
                      Required resources are available
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="documentationComplete"
                      checked={complianceChecklist.documentationComplete}
                      onChange={(e) =>
                        setComplianceChecklist({ ...complianceChecklist, documentationComplete: e.target.checked })
                      }
                    />
                    <Label htmlFor="documentationComplete" className="text-sm font-normal">
                      Documentation is complete
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="decision">Decision</Label>
                <Select value={reviewDecision || ""} onValueChange={(value) => setReviewDecision(value)}>
                  <SelectTrigger id="decision">
                    <SelectValue placeholder="Select your decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Comments</Label>
                <Textarea
                  id="comment"
                  placeholder="Provide feedback or reasons for your decision"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={!reviewDecision || !isComplianceComplete()}
              className={
                reviewDecision === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : reviewDecision === "reject"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
              }
            >
              {reviewDecision === "approve" ? "Approve" : reviewDecision === "reject" ? "Reject" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Supporting Documents</DialogTitle>
            <DialogDescription>
              {selectedProposal?.title} - {selectedProposal?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-4">
              <div className="border rounded-md divide-y">
                {selectedProposal.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-cedo-blue" />
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.size} MB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDocumentDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
