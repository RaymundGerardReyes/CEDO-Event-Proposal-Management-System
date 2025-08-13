// frontend/src/components/dashboard/student/proposal-table.jsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Filter, Search } from "lucide-react"; // Added Chevrons
import { useMemo, useState } from "react"; // Added useMemo

// Sample data for proposals
const proposalsData = [ // Renamed to avoid conflict if proposals is used as state/variable
  {
    id: "PROP-1001",
    title: "Sports Festivalasdasd",
    organization: "USTP Organization",
    submittedOn: "2023-05-15",
    status: "pending",
    assignedTo: "Rue Mon",
  },
  {
    id: "PROP-1002",
    title: "HIV And Awareness Month hcucucuc",
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
    title: "KSBasdasd",
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
  // Add more data for pagination testing
  { id: "PROP-1008", title: "Arts Workshop", organization: "Art Club", submittedOn: "2023-04-28", status: "approved", assignedTo: "Clara Oswald" },
  { id: "PROP-1009", title: "Music Fest", organization: "Music Guild", submittedOn: "2023-04-25", status: "pending", assignedTo: "John Smith" },
  { id: "PROP-1010", title: "Debate Competition", organization: "Debate Society", submittedOn: "2023-04-22", status: "rejected", assignedTo: "Amy Pond" },
  { id: "PROP-1011", title: "Film Screening", organization: "Film Club", submittedOn: "2023-04-20", status: "approved", assignedTo: "Rory Williams" },
  { id: "PROP-1012", title: "Book Fair", organization: "Literary Circle", submittedOn: "2023-04-18", status: "pending", assignedTo: "Donna Noble" },
];

const ITEMS_PER_PAGE = 5;

export function ProposalTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProposals = useMemo(() => {
    return proposalsData.filter((proposal) => {
      const matchesSearch =
        proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || proposal.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredProposals.length / ITEMS_PER_PAGE);
  const paginatedProposals = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProposals.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProposals, currentPage]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1); // Reset to first page on filter change
          }}
          >
            <SelectTrigger className="w-full sm:w-[150px]"> {/* Responsive width */}
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" aria-label="Advanced filter options">
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
                <TableHead className="font-semibold text-[#0c2d6b]">Submitted On</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Status</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Assigned To</TableHead>
                <TableHead className="text-right font-semibold text-[#0c2d6b]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProposals.length > 0 ? (
                paginatedProposals.map((proposal) => (
                  <TableRow key={proposal.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="border border-[#3b82f6] text-[#3b82f6] px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap">
                        {proposal.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="border border-[#3b82f6] text-[#3b82f6] px-3 py-1.5 rounded-md text-sm whitespace-nowrap">
                        {proposal.organization}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="border border-[#3b82f6] text-[#3b82f6] px-3 py-1.5 rounded-md text-sm whitespace-nowrap">
                        {new Date(proposal.submittedOn).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          proposal.status === "approved"
                            ? "bg-green-500 hover:bg-green-600 text-white" // Ensure text is visible
                            : proposal.status === "pending"
                              ? "bg-amber-500 hover:bg-amber-600 text-white" // Ensure text is visible
                              : "bg-red-500 hover:bg-red-600 text-white" // Ensure text is visible
                        }
                      >
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="border border-[#3b82f6] text-[#3b82f6] px-3 py-1.5 rounded-md text-sm whitespace-nowrap">
                        {proposal.assignedTo}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No proposals found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{Math.min(ITEMS_PER_PAGE * (currentPage - 1) + 1, filteredProposals.length)}-{Math.min(ITEMS_PER_PAGE * currentPage, filteredProposals.length)}</span> of{" "}
            <span className="font-medium">{filteredProposals.length}</span> proposals
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}