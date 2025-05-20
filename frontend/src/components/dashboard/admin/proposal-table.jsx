"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Filter, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, FileText } from "lucide-react"

// Sample data for proposals
const proposals = [
  {
    id: "PROP-1001",
    title: "Sports Festival",
    organization: "USTP Organization",
    submittedOn: "2023-05-15",
    status: "pending",
    assignedTo: "Rue Mon",
  },
  {
    id: "PROP-1002",
    title: "HIV And Awareness Month",
    organization: "XU Organization",
    submittedOn: "2023-05-12",
    status: "approved",
    assignedTo: "Eva Torres",
  },
  {
    id: "PROP-1003",
    title: "Tech Conference",
    organization: "Lourdes College Organization",
    submittedOn: "2023-05-10",
    status: "rejected",
    assignedTo: "Mike Johnson",
  },
  {
    id: "PROP-1004",
    title: "Marketing Strategy for Local Business ",
    organization: "XU Organization",
    submittedOn: "2023-05-08",
    status: "approved",
    assignedTo: "Khecy Egar",
  },
  {
    id: "PROP-1005",
    title: "KSB",
    organization: "CSO Organization",
    submittedOn: "2023-05-05",
    status: "pending",
    assignedTo: "Robert Brown",
  },
  {
    id: "PROP-1006",
    title: "Clean-Up Drive",
    organization: "Barangay Lapasan Organization",
    submittedOn: "2023-05-03",
    status: "approved",
    assignedTo: "Emily Johnson",
  },
  {
    id: "PROP-1007",
    title: "RISE AI",
    organization: "CSO Organization",
    submittedOn: "2023-05-01",
    status: "pending",
    assignedTo: "David Miller",
  },
]

export function ProposalTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState(null)

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Filter proposals based on search term and status filter
  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredProposals.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage)

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="w-full sm:w-[250px] h-10 bg-gray-200 rounded"></div>
          <div className="flex items-center gap-2">
            <div className="w-[130px] h-10 bg-gray-200 rounded"></div>
            <div className="w-10 h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="rounded-md border overflow-hidden">
          <div className="h-[400px] bg-gray-100"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="w-[200px] h-5 bg-gray-200 rounded"></div>
          <div className="flex space-x-2">
            <div className="w-20 h-10 bg-gray-200 rounded"></div>
            <div className="w-20 h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
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
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f8f9fa]">
              <TableRow>
                <TableHead className="font-semibold text-[#0c2d6b]">Title</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Organization</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Submitted On</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Status</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Assigned To</TableHead>
                <TableHead className="text-right font-semibold text-[#0c2d6b]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((proposal) => (
                <TableRow key={proposal.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="border border-[#3b82f6] text-[#3b82f6] px-3 py-1.5 rounded-md text-sm font-medium">
                      {proposal.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="border border-[#3b82f6] text-[#3b82f6] px-3 py-1.5 rounded-md text-sm">
                      {proposal.organization}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="border border-[#3b82f6] text-[#3b82f6] px-3 py-1.5 rounded-md text-sm">
                      {proposal.submittedOn}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        proposal.status === "approved"
                          ? "bg-green-500 hover:bg-green-500"
                          : proposal.status === "pending"
                            ? "bg-amber-500 hover:bg-amber-500"
                            : "bg-red-500 hover:bg-red-500"
                      }
                    >
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="border border-[#3b82f6] text-[#3b82f6] px-3 py-1.5 rounded-md text-sm">
                      {proposal.assignedTo}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-cedo-blue/5 hover:text-cedo-blue transition-colors"
                      onClick={() => {
                        setSelectedProposal(proposal)
                        setViewDialogOpen(true)
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {currentItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Search className="h-10 w-10 mb-2" />
                      <h3 className="text-lg font-medium">No proposals found</h3>
                      <p className="text-sm">Try adjusting your filters or search terms</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{currentItems.length}</span> of{" "}
          <span className="font-medium">{filteredProposals.length}</span> proposals
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPage}
            disabled={currentPage === 1}
            className="transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            className="transition-colors"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      {/* Proposal Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-cedo-blue">
              {selectedProposal?.title} - {selectedProposal?.id}
            </DialogTitle>
            <DialogDescription>
              Submitted by {selectedProposal?.organization} on {selectedProposal?.submittedOn}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-0">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-6">
                  {/* Section 1 */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold text-cedo-blue mb-2">Section 1 of 5: Purpose</h3>
                    <p className="text-sm text-gray-600 mb-2">I am here to...</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">Submit Event Approval Form</p>
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold text-cedo-blue mb-2">Section 2 of 5: Organization Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Description</p>
                        <p className="text-sm">{selectedProposal?.organization} description here</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Type of Organization</p>
                        <p className="font-medium">Academic Organization</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 3 */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold text-cedo-blue mb-2">
                      Section 3 of 5: School-Based Event Information
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Event/Activity Name</p>
                          <p className="font-medium">{selectedProposal?.title}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Venue</p>
                          <p className="font-medium">University Auditorium</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Start Date</p>
                          <p className="font-medium">May 15, 2023</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">End Date</p>
                          <p className="font-medium">May 16, 2023</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Time Start</p>
                          <p className="font-medium">9:00 AM</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Time End</p>
                          <p className="font-medium">5:00 PM</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Type of Event</p>
                          <p className="font-medium">Workshops/Seminar/Webinar</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Target Audience</p>
                          <p className="font-medium">All Levels</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Mode of Event</p>
                          <p className="font-medium">Hybrid</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Number of Return Service Credit</p>
                          <p className="font-medium">2</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Attached Files</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm flex items-center">
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            GPOA Document
                          </div>
                          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm flex items-center">
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            Project Proposal
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4 */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold text-cedo-blue mb-2">
                      Section 4 of 5: Community-Based Event Information
                    </h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm italic text-gray-500">Not applicable for this proposal</p>
                    </div>
                  </div>

                  {/* Section 5 */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold text-cedo-blue mb-2">
                      Section 5 of 5: Documentation & Accomplishment Reports
                    </h3>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm italic text-gray-500">
                        This section will be available after the event is completed and approved
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="details">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-sm text-gray-500">Proposal ID</h3>
                      <p>{selectedProposal?.id}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-500">Status</h3>
                      <Badge
                        className={
                          selectedProposal?.status === "approved"
                            ? "bg-green-500 hover:bg-green-500"
                            : selectedProposal?.status === "pending"
                              ? "bg-amber-500 hover:bg-amber-500"
                              : "bg-red-500 hover:bg-red-500"
                        }
                      >
                        {selectedProposal?.status?.charAt(0).toUpperCase() + selectedProposal?.status?.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Assigned To</h3>
                    <p>{selectedProposal?.assignedTo}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-gray-500">Timeline</h3>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-start gap-2">
                        <div className="h-4 w-4 rounded-full bg-blue-500 mt-1"></div>
                        <div>
                          <p className="font-medium">Submitted</p>
                          <p className="text-sm text-gray-500">{selectedProposal?.submittedOn}</p>
                        </div>
                      </div>
                      {selectedProposal?.status !== "pending" && (
                        <div className="flex items-start gap-2">
                          <div className="h-4 w-4 rounded-full bg-green-500 mt-1"></div>
                          <div>
                            <p className="font-medium">Reviewed</p>
                            <p className="text-sm text-gray-500">May 18, 2023</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="documents">
              <ScrollArea className="h-[60vh] pr-4">
                <div className="space-y-4">
                  <div className="border rounded-md p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">General Plan of Action (GPOA)</p>
                        <p className="text-sm text-gray-500">
                          PDF Document • Uploaded on {selectedProposal?.submittedOn}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <div className="border rounded-md p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">Project Proposal</p>
                        <p className="text-sm text-gray-500">
                          PDF Document • Uploaded on {selectedProposal?.submittedOn}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
