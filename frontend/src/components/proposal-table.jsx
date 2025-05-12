"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Filter, Search } from "lucide-react"

// Sample data for proposals
const proposals = [
  {
    id: "PROP-1001",
    title: "Community Outreach Program",
    organization: "City Hall - Health Department",
    submittedOn: "2023-05-15",
    status: "pending",
    assignedTo: "Rue Mon",
    type: "internal",
  },
  {
    id: "PROP-1002",
    title: "HIV Awareness Campaign",
    organization: "XU Medical Center",
    submittedOn: "2023-05-12",
    status: "approved",
    assignedTo: "Eva Torres",
    type: "external",
  },
  {
    id: "PROP-1003",
    title: "Tech Skills Workshop",
    organization: "Lourdes College",
    submittedOn: "2023-05-10",
    status: "rejected",
    assignedTo: "Mike Johnson",
    type: "external",
  },
  {
    id: "PROP-1004",
    title: "Small Business Development Program",
    organization: "City Hall - Economic Development",
    submittedOn: "2023-05-08",
    status: "approved",
    assignedTo: "Khecy Egar",
    type: "internal",
  },
  {
    id: "PROP-1005",
    title: "Youth Leadership Summit",
    organization: "CSO Organization",
    submittedOn: "2023-05-05",
    status: "pending",
    assignedTo: "Robert Brown",
    type: "external",
  },
  {
    id: "PROP-1006",
    title: "Environmental Clean-Up Initiative",
    organization: "Barangay Lapasan",
    submittedOn: "2023-05-03",
    status: "approved",
    assignedTo: "Emily Johnson",
    type: "external",
  },
  {
    id: "PROP-1007",
    title: "AI Education Program",
    organization: "CSO Organization",
    submittedOn: "2023-05-01",
    status: "pending",
    assignedTo: "David Miller",
    type: "external",
  },
]

export function ProposalTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Filter proposals based on search term, status filter, and type filter
  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || proposal.status === statusFilter
    const matchesType = typeFilter === "all" || proposal.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              <SelectItem value="external">External</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#f8f9fa]">
              <TableRow>
                <TableHead className="font-semibold text-[#0c2d6b]">Title</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Organization</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Type</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Submitted On</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Status</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Assigned To</TableHead>
                <TableHead className="text-right font-semibold text-[#0c2d6b]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProposals.map((proposal) => (
                <TableRow key={proposal.id} className="hover:bg-muted/30">
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
                    <Badge
                      className={
                        proposal.type === "internal"
                          ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                      }
                    >
                      {proposal.type.charAt(0).toUpperCase() + proposal.type.slice(1)}
                    </Badge>
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
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{filteredProposals.length}</span> of{" "}
          <span className="font-medium">{proposals.length}</span> proposals
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm">
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
