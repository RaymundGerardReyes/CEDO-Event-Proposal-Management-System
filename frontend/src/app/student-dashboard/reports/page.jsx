"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { Badge } from "@/components/dashboard/student/ui/badge";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { Input } from "@/components/dashboard/student/ui/input";
import { PageHeader } from "@/components/dashboard/student/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/student/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/student/ui/table";
import { useAuth } from "@/contexts/auth-context";
import {
  AlertCircle,
  ArrowUpDown,
  CheckCircle2,
  Clock4,
  FileText,
  Search,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Status mapping for better display
const getStatusInfo = (status) => {
  switch (status) {
    case 'approved':
      return {
        label: 'Approved',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle2,
        description: 'Proposal has been approved'
      };
    case 'denied':
      return {
        label: 'Denied',
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        description: 'Proposal has been denied'
      };
    case 'pending':
      return {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock4,
        description: 'Proposal is under review'
      };
    case 'draft':
      return {
        label: 'Draft',
        color: 'bg-gray-100 text-gray-800',
        icon: FileText,
        description: 'Proposal is in draft status'
      };
    case 'revision_requested':
      return {
        label: 'Revision Requested',
        color: 'bg-orange-100 text-orange-800',
        icon: AlertCircle,
        description: 'Proposal requires revisions'
      };
    default:
      return {
        label: 'Unknown',
        color: 'bg-gray-100 text-gray-800',
        icon: AlertCircle,
        description: 'Status unknown'
      };
  }
};

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    denied: 0,
    draft: 0
  });

  // Fetch proposals from database
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch proposals for the current user
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/proposals/user-proposals`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('cedo_token') || ''}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch proposals: ${response.status}`);
        }

        const data = await response.json();
        console.log('📋 Reports: Fetched proposals:', data);

        if (data.success && data.proposals) {
          setProposals(data.proposals);

          // Calculate stats
          const stats = {
            total: data.proposals.length,
            approved: data.proposals.filter(p => p.proposal_status === 'approved').length,
            pending: data.proposals.filter(p => p.proposal_status === 'pending').length,
            denied: data.proposals.filter(p => p.proposal_status === 'denied').length,
            draft: data.proposals.filter(p => p.proposal_status === 'draft').length
          };
          setStats(stats);
        } else {
          console.warn('⚠️ Reports: No proposals data received');
          setProposals([]);
        }
      } catch (err) {
        console.error('❌ Reports: Error fetching proposals:', err);
        setError(err.message);
        setProposals([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProposals();
    }
  }, [user]);

  // Filter proposals based on search and filters
  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch =
      proposal.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.uuid?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || proposal.proposal_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort proposals
  const sortedProposals = [...filteredProposals].sort((a, b) => {
    let comparison = 0;

    if (sortBy === "created_at") {
      comparison = new Date(a.created_at) - new Date(b.created_at);
    } else if (sortBy === "event_name") {
      comparison = (a.event_name || '').localeCompare(b.event_name || '');
    } else if (sortBy === "proposal_status") {
      comparison = (a.proposal_status || '').localeCompare(b.proposal_status || '');
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Toggle sort order
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Handle proposal click
  const handleProposalClick = (proposal) => {
    // Navigate to the proposal details or reporting page
    if (proposal.mysql_id) {
      router.push(`/student-dashboard/submit-event/${proposal.uuid}/reporting?draftId=${proposal.mysql_id}`);
    } else {
      console.warn('⚠️ Reports: No MySQL ID found for proposal:', proposal);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
        <PageHeader title="Reports" subtitle="Track and manage your proposals" />
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
        <PageHeader title="Reports" subtitle="Track and manage your proposals" />
        <Card className="cedo-card">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Reports</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader title="Reports" subtitle="Track and manage your proposals" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="cedo-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Proposals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cedo-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cedo-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock4 className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cedo-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Denied</p>
                <p className="text-2xl font-bold text-red-600">{stats.denied}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="cedo-card mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="denied">Denied</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="revision_requested">Revision Requested</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Proposals Table */}
      <Card className="cedo-card">
        <CardHeader>
          <CardTitle>Your Proposals</CardTitle>
          <CardDescription>
            Track the status and progress of your submitted proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedProposals.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("event_name")}
                        className="h-8 flex items-center gap-1"
                      >
                        Event Name
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("proposal_status")}
                        className="h-8 flex items-center gap-1"
                      >
                        Status
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("created_at")}
                        className="h-8 flex items-center gap-1"
                      >
                        Submitted
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>MySQL ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProposals.map((proposal) => {
                    const statusInfo = getStatusInfo(proposal.proposal_status);
                    const StatusIcon = statusInfo.icon;

                    return (
                      <TableRow
                        key={proposal.id || proposal.mysql_id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleProposalClick(proposal)}
                      >
                        <TableCell className="font-medium">
                          {proposal.event_name || 'Untitled Event'}
                        </TableCell>
                        <TableCell>
                          {proposal.organization_name || 'Unknown Organization'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {proposal.created_at ? new Date(proposal.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {proposal.mysql_id || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Proposals Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'No proposals match your current filters.'
                  : 'You haven\'t submitted any proposals yet.'
                }
              </p>
              <Button onClick={() => router.push('/student-dashboard/submit-event')}>
                Submit Your First Proposal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
