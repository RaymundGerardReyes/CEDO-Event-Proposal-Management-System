// frontend/src/app/(main)/admin-dashboard/page.jsx
"use client";

import { PageHeader } from "@/components/page-header";
import { ResponsiveGrid } from "@/components/responsive-grid"; // Assuming this is a custom component
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context"; // To get user info
// import { useMobile } from "@/hooks/use-mobile"; // Assuming this is a custom hook
import {
  Calendar,
  ChevronDown, // Changed from ChevronLeft for a dropdown-like filter
  ClockIcon,
  FileText,
  Loader2, // For content loading
  Search,
  Users, // Example icon for a stat
  CheckCircle, // Example icon for a stat
  XCircle, // Example icon for a stat
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

// --- Mock Data (Replace with actual API calls) ---
const fetchAdminDashboardData = async () => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        stats: {
          pendingReview: Math.floor(Math.random() * 30) + 5,
          newSinceYesterday: Math.floor(Math.random() * 10),
          approvedProposals: Math.floor(Math.random() * 100) + 50,
          approvalRate: Math.floor(Math.random() * 30) + 70,
          rejectedProposals: Math.floor(Math.random() * 20) + 5,
          totalProposals: Math.floor(Math.random() * 200) + 100,
          totalUsers: Math.floor(Math.random() * 500) + 50, // Example new stat
        },
        recentProposals: [
          {
            id: "PROP-1001",
            title: "Annual Sports Festival",
            organization: "USTP Student Council",
            submittedOn: "2024-05-15",
            status: "pending",
            assignedTo: "Gerard Reyes",
            description: "A festival to promote sports and healthy activities.",
            proposedVenue: "University Gymnasium",
            proposedSchedule: "2024-08-20",
          },
          {
            id: "PROP-1002",
            title: "Tech Awareness Month",
            organization: "XU Comp. Sci. Society",
            submittedOn: "2024-05-12",
            status: "approved",
            assignedTo: "Eva Torres",
            description: "A month-long campaign for tech awareness.",
            location: "City Park",
            schedule: "2024-07-15",
          },
          {
            id: "PROP-1003",
            title: "Leadership Seminar",
            organization: "Lourdes College Org.",
            submittedOn: "2024-05-10",
            status: "rejected",
            assignedTo: "Mike Johnson",
            description: "Leadership seminar for student leaders.",
            proposedVenue: "Conference Center",
            proposedSchedule: "2024-09-10",
          },
        ],
        upcomingEvents: [
          {
            id: "EVENT-001",
            title: "Admin Training Workshop",
            date: "2024-05-20",
            location: "Admin Conference Room A",
            attendees: 25,
          },
          {
            id: "EVENT-002",
            title: "System Maintenance Review",
            date: "2024-05-22",
            location: "IT Department",
            attendees: 5,
          },
        ],
      });
    }, 1200); // Simulate network delay
  });
};
// --- End Mock Data ---

export default function AdminDashboardPage() {
  const { user } = useAuth(); // Get authenticated user details for display
  const router = useRouter();
  // const { isMobile } = useMobile(); // Assuming you have this custom hook

  const [dashboardData, setDashboardData] = useState(null);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [expandedProposalId, setExpandedProposalId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const loadData = async () => {
      setIsContentLoading(true);
      try {
        const data = await fetchAdminDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch admin dashboard data:", error);
        // Optionally set an error state and display an error message
      } finally {
        setIsContentLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleExpandProposal = (id) => {
    setExpandedProposalId(expandedProposalId === id ? null : id);
  };

  const filteredProposals = dashboardData?.recentProposals?.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          proposal.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          proposal.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || proposal.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  }) || [];


  if (isContentLoading || !dashboardData) {
    return (
      <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-16 w-16 animate-spin text-cedo-blue" />
          <p className="text-xl font-medium text-cedo-blue">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  // Destructure data for easier access
  const { stats, upcomingEvents } = dashboardData;

  return (
    <div className="flex-1 bg-[#f8f9fa] p-4 sm:p-6 md:p-8">
      <PageHeader
        title={`Admin Dashboard`}
        subtitle={user ? `Welcome, ${user.name || 'Admin'}!` : "Overview and Management"}
      />

      {/* Statistics Section */}
      <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} className="mb-6 md:mb-8">
        <Card className="shadow hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <h2 className="text-3xl font-bold text-cedo-blue">{stats.pendingReview}</h2>
              <p className="text-xs text-muted-foreground mt-1">{stats.newSinceYesterday} new since yesterday</p>
            </div>
            <div className="p-3 rounded-full bg-amber-100 text-amber-500">
              <ClockIcon className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <h2 className="text-3xl font-bold text-cedo-blue">{stats.approvedProposals}</h2>
              <p className="text-xs text-muted-foreground mt-1">{stats.approvalRate}% approval rate</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejected</p>
              <h2 className="text-3xl font-bold text-cedo-blue">{stats.rejectedProposals}</h2>
              <p className="text-xs text-muted-foreground mt-1">Requires feedback</p>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <XCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <h2 className="text-3xl font-bold text-cedo-blue">{stats.totalUsers}</h2>
              <p className="text-xs text-green-600 mt-1">↑ 2% this month</p>
            </div>
            <div className="p-3 rounded-full bg-sky-100 text-sky-600">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </ResponsiveGrid>

      {/* Main Content Area: Proposals and Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Proposals Section */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-cedo-blue">Recent Proposals</h3>
                  <p className="text-sm text-muted-foreground">Latest submissions and their status.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search proposals..." className="pl-8 w-full sm:w-[200px] md:w-[250px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  {/* Filter dropdown could be implemented here if needed */}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground uppercase">
                      <th className="text-left font-medium py-3 px-2">Title</th>
                      <th className="text-left font-medium py-3 px-2">Organization</th>
                      <th className="text-left font-medium py-3 px-2">Submitted</th>
                      <th className="text-left font-medium py-3 px-2">Status</th>
                      <th className="text-left font-medium py-3 px-2">Assigned To</th>
                      <th className="text-right font-medium py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProposals.length > 0 ? filteredProposals.map((proposal) => (
                      <React.Fragment key={proposal.id}>
                        <tr className="border-b hover:bg-gray-50/50 transition-colors text-sm">
                          <td className="py-3 px-2 font-medium text-cedo-dark-blue">{proposal.title}</td>
                          <td className="py-3 px-2 text-muted-foreground">{proposal.organization}</td>
                          <td className="py-3 px-2 text-muted-foreground">{proposal.submittedOn}</td>
                          <td className="py-3 px-2">
                            <Badge
                              variant={
                                proposal.status === "approved" ? "success" :
                                proposal.status === "pending" ? "warning" : "destructive"
                              }
                            >
                              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-muted-foreground">{proposal.assignedTo}</td>
                          <td className="py-3 px-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-cedo-blue hover:text-cedo-blue/80"
                              onClick={() => toggleExpandProposal(proposal.id)}
                            >
                              {expandedProposalId === proposal.id ? "Hide" : "View"}
                            </Button>
                          </td>
                        </tr>
                        {expandedProposalId === proposal.id && (
                          <tr className="bg-slate-50">
                            <td colSpan={6} className="p-0">
                              <div className="p-4 border-t border-slate-200"> {/* Added border for separation */}
                                <h4 className="text-md font-semibold text-cedo-dark-blue mb-2">Proposal Details: {proposal.title}</h4>
                                <p className="text-sm text-muted-foreground mb-1"><strong>Description:</strong> {proposal.description}</p>
                                <p className="text-sm text-muted-foreground mb-1"><strong>Proposed Venue:</strong> {proposal.proposedVenue}</p>
                                <p className="text-sm text-muted-foreground"><strong>Proposed Schedule:</strong> {proposal.proposedSchedule}</p>
                                {/* Add more details as needed */}
                                <div className="flex justify-end mt-3">
                                  <Button variant="outline" size="sm" onClick={() => router.push(`/admin-dashboard/reviews/${proposal.id}`)}>Review Proposal</Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No proposals found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination could be added here */}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events Section */}
        <div>
          <Card className="shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-cedo-blue">Upcoming Events</h3>
                <p className="text-sm text-muted-foreground">Key events scheduled soon.</p>
              </div>
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
                  <div key={event.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-cedo-dark-blue">{event.title}</h4>
                      <Badge variant="outline" className="text-xs">{event.id}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                      <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {event.attendees} attendees</div>
                      <p className="text-xs pt-1">{event.location}</p>
                    </div>
                    <div className="mt-3">
                      <Button variant="link" size="sm" className="text-cedo-blue hover:text-cedo-blue/80 p-0 h-auto" onClick={() => router.push(`/admin-dashboard/events/${event.id}`)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                )) : (
                   <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
                )}
              </div>
              {upcomingEvents.length > 0 && (
                <Button variant="ghost" className="w-full text-cedo-blue hover:text-cedo-blue/80 mt-4" onClick={() => router.push("/admin-dashboard/events")}>
                  <Calendar className="h-4 w-4 mr-2" /> View All Events
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
