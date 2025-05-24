"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/admin/ui/tabs"
import { Badge } from "@/components/dashboard/admin/ui/badge"
import { Button } from "@/components/dashboard/admin/ui/button"
import { Input } from "@/components/dashboard/admin/ui/input"
import { Label } from "@/components/dashboard/admin/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/admin/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/admin/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dashboard/admin/ui/dialog"
import { Textarea } from "@/components/dashboard/admin/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/admin/ui/avatar"
import { Search, Filter, XCircle, FileText, Download, MessageSquare } from "lucide-react"
import { PageHeader } from "@/components/dashboard/admin/page-header"

// Sample data for proposals
const proposals = [
  {
    id: "PROP-1001",
    title: "Annual Science Fair",
    submitter: {
      name: "Alex Johnson",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "AJ",
    },
    category: "Academic",
    status: "pending",
    date: "2023-03-15",
    priority: "high",
    details: {
      purpose: "Submit Event Approval Form",
      organization: {
        description: "Green Campus & Community Outreach Initiative",
        type: ["School-based", "Community-based"],
      },
      schoolEvent: {
        description: "Workshop on campus recycling practices for freshmen.",
        name: "Urban Gardening 101",
        venue: "Campus Greenhouse, Building A",
        startDate: "2025-06-10",
        endDate: "2025-06-10",
        startTime: "09:00 AM",
        endTime: "12:00 PM",
        type: "Workshops/Seminar/Webinar",
        audience: ["1st Year", "All Levels"],
        mode: "Offline",
        credits: 2,
        attachments: {
          gpoa: "GreenCampusClub_GPOA.pdf",
          proposal: "GreenCampusClub_PP.docx",
        },
      },
      communityEvent: {
        description: "Tree-planting drive in barangay Rizal for Earth Day.",
        name: "Barangay Rizal Tree-Planting",
        venue: "Barangay Rizal Community Park",
        startDate: "2025-06-15",
        endDate: "2025-06-15",
        type: ["Academic Enhancement", "Others"],
        audience: ["All Levels", "Leaders", "Alumni"],
        mode: "Offline",
        credits: 1,
        attachments: {
          gpoa: "GreenCampusClub_GPOA.pdf",
          proposal: "GreenCampusClub_PP.docx",
        },
      },
      comments: [
        {
          role: "Admin",
          date: "Apr 10",
          text: "Please clarify your participant recruitment plan.",
        },
        {
          role: "Org",
          date: "Apr 11",
          text: "We will coordinate with student council and barangay offices.",
        },
        {
          role: "Admin",
          date: "Apr 12",
          text: "Understood. Budget summary still missing—please upload.",
        },
        {
          role: "Org",
          date: "Apr 13",
          text: "Uploaded OrganizationName_Budget.xlsx.",
        },
      ],
    },
  },
  // Keep the other proposals but add the details property with similar structure
  {
    id: "PROP-1002",
    title: "Leadership Workshop Series",
    submitter: {
      name: "Maria Garcia",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "MG",
    },
    category: "Development",
    status: "pending",
    date: "2023-03-14",
    priority: "medium",
    details: {
      purpose: "Submit Event Approval Form",
      organization: {
        description: "Student Leadership Development Initiative",
        type: ["School-based"],
      },
      schoolEvent: {
        description: "Series of leadership workshops for student officers.",
        name: "Leadership Excellence Program",
        venue: "Student Center, Room 101",
        startDate: "2025-07-05",
        endDate: "2025-07-26",
        startTime: "01:00 PM",
        endTime: "04:00 PM",
        type: "Workshops/Seminar/Webinar",
        audience: ["Student Leaders", "All Levels"],
        mode: "Offline",
        credits: 3,
        attachments: {
          gpoa: "LeadershipProgram_GPOA.pdf",
          proposal: "LeadershipProgram_PP.docx",
        },
      },
      comments: [],
    },
  },
  // Add similar details to other proposals
  {
    id: "PROP-1003",
    title: "Community Service Day",
    submitter: {
      name: "David Kim",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "DK",
    },
    category: "Community",
    status: "pending",
    date: "2023-03-12",
    priority: "low",
    details: {
      purpose: "Submit Event Approval Form",
      organization: {
        description: "Community Outreach Club",
        type: ["Community-based"],
      },
      communityEvent: {
        description: "Day of service activities in local community centers.",
        name: "Community Service Day",
        venue: "Various Community Centers",
        startDate: "2025-08-15",
        endDate: "2025-08-15",
        type: ["Community Service", "Outreach"],
        audience: ["All Levels", "Alumni"],
        mode: "Offline",
        credits: 2,
        attachments: {
          gpoa: "CommunityService_GPOA.pdf",
          proposal: "CommunityService_PP.docx",
        },
      },
      comments: [],
    },
  },
  {
    id: "PROP-1004",
    title: "Cultural Exchange Program",
    submitter: {
      name: "Sarah Patel",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "SP",
    },
    category: "Cultural",
    status: "pending",
    date: "2023-03-10",
    priority: "medium",
    details: {
      purpose: "Submit Event Approval Form",
      organization: {
        description: "International Students Association",
        type: ["School-based", "Community-based"],
      },
      schoolEvent: {
        description: "Cultural exchange program featuring international cuisines and performances.",
        name: "Global Culture Festival",
        venue: "University Quadrangle",
        startDate: "2025-09-20",
        endDate: "2025-09-20",
        startTime: "10:00 AM",
        endTime: "06:00 PM",
        type: "Cultural Event",
        audience: ["All Levels", "Faculty", "Staff"],
        mode: "Offline",
        credits: 2,
        attachments: {
          gpoa: "CulturalExchange_GPOA.pdf",
          proposal: "CulturalExchange_PP.docx",
        },
      },
      communityEvent: {
        description: "Community cultural exchange program at the local community center.",
        name: "Community Cultural Day",
        venue: "Community Center",
        startDate: "2025-09-27",
        endDate: "2025-09-27",
        type: ["Cultural", "Community Engagement"],
        audience: ["All Levels", "Community Members"],
        mode: "Offline",
        credits: 1,
        attachments: {
          gpoa: "CulturalExchange_GPOA.pdf",
          proposal: "CulturalExchange_PP.docx",
        },
      },
      comments: [],
    },
  },
  {
    id: "PROP-1005",
    title: "Tech Innovation Showcase",
    submitter: {
      name: "James Wilson",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "JW",
    },
    category: "Technology",
    status: "pending",
    date: "2023-03-08",
    priority: "high",
    details: {
      purpose: "Submit Event Approval Form",
      organization: {
        description: "Technology and Innovation Club",
        type: ["School-based"],
      },
      schoolEvent: {
        description: "Showcase of student technology projects and innovations.",
        name: "Tech Innovation Expo",
        venue: "Engineering Building, Main Hall",
        startDate: "2025-10-15",
        endDate: "2025-10-16",
        startTime: "09:00 AM",
        endTime: "05:00 PM",
        type: "Exhibition",
        audience: ["All Levels", "Industry Partners"],
        mode: "Offline",
        credits: 3,
        attachments: {
          gpoa: "TechInnovation_GPOA.pdf",
          proposal: "TechInnovation_PP.docx",
        },
      },
      comments: [],
    },
  },
  {
    id: "PROP-1006",
    title: "Green Campus Initiative",
    submitter: {
      name: "Emily Green",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "EG",
    },
    category: "Environmental",
    status: "approved",
    date: "2023-03-05",
    priority: "high",
    details: {
      purpose: "Submit Event Approval Form",
      organization: {
        description: "Green Campus & Community Outreach Initiative",
        type: ["School-based", "Community-based"],
      },
      schoolEvent: {
        description: "Workshop on campus recycling practices for freshmen.",
        name: "Urban Gardening 101",
        venue: "Campus Greenhouse, Building A",
        startDate: "2025-06-10",
        endDate: "2025-06-10",
        startTime: "09:00 AM",
        endTime: "12:00 PM",
        type: "Workshops/Seminar/Webinar",
        audience: ["1st Year", "All Levels"],
        mode: "Offline",
        credits: 2,
        attachments: {
          gpoa: "GreenCampusClub_GPOA.pdf",
          proposal: "GreenCampusClub_PP.docx",
        },
      },
      communityEvent: {
        description: "Tree-planting drive in barangay Rizal for Earth Day.",
        name: "Barangay Rizal Tree-Planting",
        venue: "Barangay Rizal Community Park",
        startDate: "2025-06-15",
        endDate: "2025-06-15",
        type: ["Academic Enhancement", "Others"],
        audience: ["All Levels", "Leaders", "Alumni"],
        mode: "Offline",
        credits: 1,
        attachments: {
          gpoa: "GreenCampusClub_GPOA.pdf",
          proposal: "GreenCampusClub_PP.docx",
        },
      },
      comments: [
        {
          role: "Admin",
          date: "Apr 10",
          text: "Please clarify your participant recruitment plan.",
        },
        {
          role: "Org",
          date: "Apr 11",
          text: "We will coordinate with student council and barangay offices.",
        },
        {
          role: "Admin",
          date: "Apr 12",
          text: "Understood. Budget summary still missing—please upload.",
        },
        {
          role: "Org",
          date: "Apr 13",
          text: "Uploaded OrganizationName_Budget.xlsx.",
        },
        {
          role: "Admin",
          date: "Apr 14",
          text: "Proposal approved. Please submit documentation after the event.",
        },
      ],
      accomplishmentReport: {
        description: "Event photos and attendance sheet attached.",
        organizationType: ["School-based", "Community-based"],
        organizationName: "Green Campus & Community Outreach Initiative",
        eventName: "Urban Gardening 101 / Barangay Rizal Tree-Planting",
        attachments: {
          report: "GreenCampusClub_AR.pdf",
        },
        submitted: true,
        submittedDate: "2025-06-20",
      },
    },
  },
]

export default function ReviewPage() {
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewDecision, setReviewDecision] = useState(null)
  const [reviewComment, setReviewComment] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [newComment, setNewComment] = useState("")

  const handleReviewClick = (proposal) => {
    setSelectedProposal(proposal)
    setReviewDialogOpen(true)
    setReviewDecision(null)
    setReviewComment("")
    setActiveTab(proposal.status === "approved" ? "documentation" : "overview")
    setNewComment("")
  }

  const handleAddComment = () => {
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
  }

  const handleSubmitReview = () => {
    // In a real app, this would submit the review to an API
    console.log({
      proposalId: selectedProposal?.id,
      decision: reviewDecision,
      comment: reviewComment,
    })
    setReviewDialogOpen(false)
  }

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader title="Review Proposals" subtitle="Review and approve or reject submitted proposals" />

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
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Priority</TableHead>
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
                    {proposals
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
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>System Review: Event Proposal</DialogTitle>
            <DialogDescription>Review the complete proposal details and provide your decision</DialogDescription>
          </DialogHeader>

          {selectedProposal && (
            <div className="space-y-4">
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="events">Event Details</TabsTrigger>
                  <TabsTrigger value="comments">Comments</TabsTrigger>
                  <TabsTrigger value="decision">Decision</TabsTrigger>
                  {selectedProposal && selectedProposal.status === "approved" && (
                    <TabsTrigger value="documentation">Documentation</TabsTrigger>
                  )}
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-semibold mb-3">1. Submission Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Proposal ID</Label>
                        <p className="font-medium">{selectedProposal.id}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Submission Date</Label>
                        <p>{new Date(selectedProposal.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Purpose of Submission</Label>
                        <p>{selectedProposal.details.purpose}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Category</Label>
                        <p>{selectedProposal.category}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Priority</Label>
                        <p className="capitalize">{selectedProposal.priority}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <Badge variant="outline" className="mt-1">
                          {selectedProposal.status.charAt(0).toUpperCase() + selectedProposal.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-semibold mb-3">2. Organization Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Organization Description</Label>
                        <p>{selectedProposal.details.organization.description}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-muted-foreground">Type of Organization</Label>
                        <p>{selectedProposal.details.organization.type.join(", ")}</p>
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
                  </div>
                </TabsContent>

                {/* Event Details Tab */}
                <TabsContent value="events" className="space-y-4">
                  {selectedProposal.details.schoolEvent && (
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">School-Based Event</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Event/Activity Name</Label>
                          <p className="font-medium">{selectedProposal.details.schoolEvent.name}</p>
                        </div>
                        {selectedProposal.details.schoolEvent.description && (
                          <div className="col-span-2">
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <p>{selectedProposal.details.schoolEvent.description}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs text-muted-foreground">Venue</Label>
                          <p>{selectedProposal.details.schoolEvent.venue}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Mode of Event</Label>
                          <p>{selectedProposal.details.schoolEvent.mode}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Start/End Date</Label>
                          <p>
                            {selectedProposal.details.schoolEvent.startDate} -{" "}
                            {selectedProposal.details.schoolEvent.endDate}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Start/End Time</Label>
                          <p>
                            {selectedProposal.details.schoolEvent.startTime} -{" "}
                            {selectedProposal.details.schoolEvent.endTime}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Type of Event</Label>
                          <p>{selectedProposal.details.schoolEvent.type}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Target Audience</Label>
                          <p>
                            {Array.isArray(selectedProposal.details.schoolEvent.audience)
                              ? selectedProposal.details.schoolEvent.audience.join(", ")
                              : selectedProposal.details.schoolEvent.audience}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Return Service Credit Amount</Label>
                          <p>{selectedProposal.details.schoolEvent.credits}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Attachments</Label>
                          <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>GPOA: {selectedProposal.details.schoolEvent.attachments.gpoa}</span>
                              <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>Project Proposal: {selectedProposal.details.schoolEvent.attachments.proposal}</span>
                              <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProposal.details.communityEvent && (
                    <div className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">Community-Based Event</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Event/Activity Name</Label>
                          <p className="font-medium">{selectedProposal.details.communityEvent.name}</p>
                        </div>
                        {selectedProposal.details.communityEvent.description && (
                          <div className="col-span-2">
                            <Label className="text-xs text-muted-foreground">Description</Label>
                            <p>{selectedProposal.details.communityEvent.description}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs text-muted-foreground">Venue</Label>
                          <p>{selectedProposal.details.communityEvent.venue}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Mode of Event</Label>
                          <p>{selectedProposal.details.communityEvent.mode}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Start/End Date</Label>
                          <p>
                            {selectedProposal.details.communityEvent.startDate} -{" "}
                            {selectedProposal.details.communityEvent.endDate}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Type of Event</Label>
                          <p>
                            {Array.isArray(selectedProposal.details.communityEvent.type)
                              ? selectedProposal.details.communityEvent.type.join(", ")
                              : selectedProposal.details.communityEvent.type}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Target Audience</Label>
                          <p>
                            {Array.isArray(selectedProposal.details.communityEvent.audience)
                              ? selectedProposal.details.communityEvent.audience.join(", ")
                              : selectedProposal.details.communityEvent.audience}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">SDP Credits Amount</Label>
                          <p>{selectedProposal.details.communityEvent.credits}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs text-muted-foreground">Attachments</Label>
                          <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>GPOA: {selectedProposal.details.communityEvent.attachments.gpoa}</span>
                              <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>
                                Project Proposal: {selectedProposal.details.communityEvent.attachments.proposal}
                              </span>
                              <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Comments Tab */}
                <TabsContent value="comments" className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-semibold mb-3">Comment Thread</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4">
                      {selectedProposal.details.comments && selectedProposal.details.comments.length > 0 ? (
                        selectedProposal.details.comments.map((comment, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-md ${comment.role === "Admin" ? "bg-gray-100" : "bg-blue-50"}`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold">{comment.role}</span>
                              <span className="text-xs text-muted-foreground">{comment.date}</span>
                            </div>
                            <p>{comment.text}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No comments yet</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-comment">Add Comment</Label>
                      <Textarea
                        id="new-comment"
                        placeholder="Type your comment here..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <Button onClick={handleAddComment} disabled={!newComment.trim()} className="w-full">
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Decision Tab */}
                <TabsContent value="decision" className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h3 className="text-lg font-semibold mb-3">Review Decision</h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="decision">Decision</Label>
                        <Select value={reviewDecision || ""} onValueChange={(value) => setReviewDecision(value)}>
                          <SelectTrigger id="decision">
                            <SelectValue placeholder="Select your decision" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="approve">Approve</SelectItem>
                            <SelectItem value="revision">Request Revision</SelectItem>
                            <SelectItem value="reject">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="comment">Decision Comments</Label>
                        <Textarea
                          id="comment"
                          placeholder="Provide feedback or reasons for your decision"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="pt-4">
                        <Label className="text-xs text-muted-foreground mb-2 block">Quick Links</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            View GPOA
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            View Project Proposal
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            View Budget
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {selectedProposal && selectedProposal.status === "approved" && (
                  <TabsContent value="documentation" className="space-y-4">
                    <div className="border rounded-md p-4">
                      <h3 className="text-lg font-semibold mb-3">Section 5: Documentation & Accomplishment Reports</h3>

                      {selectedProposal.details.accomplishmentReport ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <Label className="text-xs text-muted-foreground">Description</Label>
                              <p>{selectedProposal.details.accomplishmentReport.description}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Type of Organization</Label>
                              <p>{selectedProposal.details.accomplishmentReport.organizationType.join(", ")}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Name of Organization</Label>
                              <p>{selectedProposal.details.accomplishmentReport.organizationName}</p>
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs text-muted-foreground">
                                Name of Event/Activity Implemented
                              </Label>
                              <p>{selectedProposal.details.accomplishmentReport.eventName}</p>
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs text-muted-foreground">Attachments</Label>
                              <div className="flex flex-col gap-2 mt-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    Accomplishment Report:{" "}
                                    {selectedProposal.details.accomplishmentReport.attachments.report}
                                  </span>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs text-muted-foreground">Submission Status</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-green-100 text-green-800">
                                  Submitted on {selectedProposal.details.accomplishmentReport.submittedDate}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-muted-foreground">No documentation submitted yet</p>
                          <Button className="mt-4">Request Documentation</Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)} className="sm:order-1">
              Cancel
            </Button>

            <div className="flex gap-2 w-full sm:w-auto sm:order-2">
              <Button
                onClick={() => {
                  setReviewDecision("approve")
                  setActiveTab("decision")
                }}
                className="flex-1 sm:flex-auto bg-green-600 hover:bg-green-700"
              >
                Approve
              </Button>
              <Button
                onClick={() => {
                  setReviewDecision("revision")
                  setActiveTab("decision")
                }}
                className="flex-1 sm:flex-auto bg-amber-600 hover:bg-amber-700"
              >
                Request Revision
              </Button>
              <Button
                onClick={() => {
                  if (
                    confirm(
                      "Warning: Rejection will halt the process entirely. Consider requesting revisions instead to keep the proposal active. Are you sure you want to reject?",
                    )
                  ) {
                    setReviewDecision("reject")
                    setActiveTab("decision")
                  }
                }}
                className="flex-1 sm:flex-auto bg-gray-400 hover:bg-gray-500 relative group"
                title="Avoid rejection - request revisions instead"
              >
                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Avoid rejection when possible
                </span>
                Reject
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
