"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { ResponsiveContainer } from "@/components/dashboard/admin/responsive-container";
import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { Card, CardContent } from "@/components/dashboard/admin/ui/card";
import { Input } from "@/components/dashboard/admin/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Activity, Calendar, ChevronLeft, Clock, FileText, Search, TrendingUp, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Sample data for proposals
const recentProposals = [
  {
    id: "PROP-1001",
    title: "Sports Festival",
    organization: "USTP Organization",
    submittedOn: "2023-05-15",
    status: "pending",
    assignedTo: "Gerard Reyes",
    description: "A festival to promote sports and healthy activities among students.",
    proposedVenue: "University Gymnasium",
    proposedSchedule: "2024-04-20",
    proposedSpeakers: "Various sports personalities",
    expectedParticipants: "200",
    intendedGoal: "To encourage student participation in sports.",
    requiredResources: "Sports equipment, venue, and refreshments.",
  },
  {
    id: "PROP-1002",
    title: "HIV And Awareness Month",
    organization: "XU Organization",
    submittedOn: "2023-05-12",
    status: "approved",
    assignedTo: "Eva Torres",
    description: "A month-long campaign to raise awareness about HIV and AIDS.",
    location: "City Park",
    schedule: "2024-03-15",
    speakers: "Dr. Emily Carter, HIV Specialist",
    participants: ["John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", "Michael Brown"],
    sponsors: "Global Health Organization, Local NGOs",
    purpose: "To educate the public and reduce the stigma associated with HIV.",
  },
  {
    id: "PROP-1003",
    title: "Tech Conference",
    organization: "Lourdes College Organization",
    submittedOn: "2023-05-10",
    status: "rejected",
    assignedTo: "Mike Johnson",
    description: "A conference focused on the latest trends and innovations in technology.",
    proposedVenue: "Conference Center",
    proposedSchedule: "2024-05-10",
    proposedSpeakers: "Tech industry leaders",
    expectedParticipants: "150",
    intendedGoal: "To provide a platform for tech enthusiasts to learn and network.",
    requiredResources: "Conference venue, speakers, and presentation equipment.",
  },
  {
    id: "PROP-1004",
    title: "Marketing Strategy for Local Business",
    organization: "XU Organization",
    submittedOn: "2023-05-08",
    status: "approved",
    assignedTo: "Khecy Egar",
    description: "A workshop to help local businesses develop effective marketing strategies.",
    location: "Community Hall",
    schedule: "2024-04-01",
    speakers: "Marketing experts",
    participants: ["Alice Johnson", "Bob Williams", "Catherine Davis"],
    sponsors: "Local Business Association",
    purpose: "To support local businesses and promote economic growth.",
  },
  {
    id: "PROP-1005",
    title: "KSB",
    organization: "CSO Organization",
    submittedOn: "2023-05-05",
    status: "pending",
    assignedTo: "Robert Brown",
    description: "A community service project to clean up and beautify the local park.",
    proposedVenue: "City Park",
    proposedSchedule: "2024-03-28",
    proposedSpeakers: "Community leaders",
    expectedParticipants: "75",
    intendedGoal: "To improve the quality of life in the community.",
    requiredResources: "Cleaning supplies, volunteers, and refreshments.",
    signedUpMembers: ["David Lee", "Sarah Kim", "Tom Wilson"],
  },
]

// Sample data for upcoming events
const upcomingEvents = [
  {
    id: "EVENT-001",
    title: "Science Fair Exhibition",
    date: "Mon, Mar 20",
    location: "Main Campus Hall",
    attendees: 120,
  },
  {
    id: "EVENT-002",
    title: "Leadership Workshop",
    date: "Wed, Mar 22",
    location: "Conference Room B",
    attendees: 45,
  },
  {
    id: "EVENT-003",
    title: "Community Service Day",
    date: "Sat, Mar 25",
    location: "City Park",
    attendees: 75,
  },
]

// Define responsive table columns
const proposalColumns = [
  {
    key: "title",
    label: "Title",
    sortable: true,
    render: (value) => (
      <div className="border border-cedo-blue text-cedo-blue px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium">
        {value}
      </div>
    )
  },
  {
    key: "organization",
    label: "Organization",
    className: "hidden sm:table-cell",
    render: (value) => (
      <div className="border border-cedo-blue text-cedo-blue px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm">
        {value}
      </div>
    )
  },
  {
    key: "submittedOn",
    label: "Submitted",
    className: "hidden md:table-cell",
    render: (value) => (
      <div className="border border-cedo-blue text-cedo-blue px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm">
        {value}
      </div>
    )
  },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <Badge
        className={
          value === "approved"
            ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
            : value === "pending"
              ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
              : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
        }
      >
        {value.charAt(0).toUpperCase() + value.slice(1)}
      </Badge>
    )
  },
  {
    key: "assignedTo",
    label: "Assigned To",
    className: "hidden lg:table-cell",
    render: (value) => (
      <div className="border border-cedo-blue text-cedo-blue px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm">
        {value}
      </div>
    )
  }
]

// Error Boundary Component
function ErrorBoundary({ children, fallback }) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (error) => {
      console.error('Dashboard Error:', error)
      setHasError(true)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleError)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleError)
    }
  }, [])

  if (hasError) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <button
            onClick={() => {
              setHasError(false)
              window.location.reload()
            }}
            className="px-4 py-2 bg-cedo-blue text-white rounded-md hover:bg-cedo-blue/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return children
}

// Stats Card Component
function StatsCard({ title, value, subtitle, subtitleColor = "text-muted-foreground", icon, iconBg }) {
  return (
    <Card className="cedo-card cedo-hover-lift">
      <CardContent className="cedo-stats-card responsive-padding">
        <div>
          <p className="text-muted-foreground cedo-body-sm">{title}</p>
          <h2 className="cedo-heading-3 mt-1 text-cedo-blue">{value}</h2>
          <p className={`cedo-body-sm ${subtitleColor} mt-1`}>{subtitle}</p>
        </div>
        <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

// Proposal Search Input Component
function ProposalSearchInput() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <div className="relative flex-1 sm:flex-initial">
      <Search className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search proposals..."
        className="pl-7 sm:pl-8 w-full sm:w-[200px] md:w-[250px] h-8 sm:h-10 text-xs sm:text-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  )
}

// Proposals Table Component
function ProposalsTable() {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-muted-foreground text-xs sm:text-sm">Title</th>
              <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-muted-foreground text-xs sm:text-sm hidden sm:table-cell">Organization</th>
              <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-muted-foreground text-xs sm:text-sm hidden md:table-cell">Submitted</th>
              <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-muted-foreground text-xs sm:text-sm">Status</th>
              <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-muted-foreground text-xs sm:text-sm hidden lg:table-cell">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {recentProposals.map((proposal) => (
              <tr key={proposal.id} className="border-b hover:bg-muted/50 transition-colors cursor-pointer">
                <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm">
                  <div className="border border-cedo-blue text-cedo-blue px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium">
                    {proposal.title}
                  </div>
                </td>
                <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm hidden sm:table-cell">
                  <div className="border border-cedo-blue text-cedo-blue px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm">
                    {proposal.organization}
                  </div>
                </td>
                <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm hidden md:table-cell">
                  <div className="border border-cedo-blue text-cedo-blue px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm">
                    {proposal.submittedOn}
                  </div>
                </td>
                <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm">
                  <Badge
                    className={
                      proposal.status === "approved"
                        ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                        : proposal.status === "pending"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                          : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                    }
                  >
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </Badge>
                </td>
                <td className="p-2 sm:p-3 md:p-4 text-xs sm:text-sm hidden lg:table-cell">
                  <div className="border border-cedo-blue text-cedo-blue px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm">
                    {proposal.assignedTo}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="block sm:hidden space-y-3">
        {recentProposals.map((proposal) => (
          <Card key={proposal.id} className="cedo-card-compact cedo-hover-lift cursor-pointer">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <h4 className="cedo-body font-semibold text-cedo-blue truncate mb-1">{proposal.title}</h4>
                  <p className="cedo-body-sm text-muted-foreground truncate mb-2">{proposal.organization}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        proposal.status === "approved"
                          ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                          : proposal.status === "pending"
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                            : "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                      }
                    >
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </Badge>
                    <span className="cedo-body-sm text-muted-foreground">{proposal.submittedOn}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}

// Event Card Component
function EventCard({ title, eventId, date, location, attendees }) {
  return (
    <div className="border border-gray-100 rounded-lg p-3 sm:p-4 hover:border-cedo-blue/30 transition-colors cedo-hover-lift cursor-pointer">
      <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 flex-wrap mb-2">
        <h4 className="cedo-body font-medium text-cedo-blue line-clamp-2">{title}</h4>
        <Badge variant="outline" className="cedo-badge-primary shrink-0">
          {eventId}
        </Badge>
      </div>
      <div className="space-y-1 cedo-body-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {date}
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {location}
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {attendees} attendees
        </div>
      </div>
      <div className="mt-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-cedo-blue hover:text-cedo-blue/70 hover:bg-cedo-blue/5 px-0 transition-colors text-xs sm:text-sm"
        >
          View Details
        </Button>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [expandedProposalId, setExpandedProposalId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [networkError, setNetworkError] = useState(false)

  // Enhanced client-side rendering with network error handling
  useEffect(() => {
    let mounted = true

    const initializeComponent = async () => {
      try {
        // Simulate network check
        if (typeof window !== 'undefined') {
          setIsClient(true)

          // Add a small delay to ensure proper hydration
          await new Promise(resolve => setTimeout(resolve, 100))

          if (mounted) {
            setIsLoading(false)
            setNetworkError(false)
          }
        }
      } catch (error) {
        console.error('Dashboard initialization error:', error)
        if (mounted) {
          setNetworkError(true)
          setIsLoading(false)
        }
      }
    }

    initializeComponent()

    return () => {
      mounted = false
    }
  }, [])

  const toggleExpandProposal = (proposal) => {
    setExpandedProposalId(expandedProposalId === proposal.id ? null : proposal.id)
  }

  // Filter proposals based on search
  const filteredProposals = recentProposals.filter(proposal =>
    proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.organization.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Network error state
  if (networkError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Network Error</h2>
          <p className="text-muted-foreground mb-4">Unable to load dashboard data</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cedo-blue text-white rounded-md hover:bg-cedo-blue/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Prevent rendering until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedo-blue"></div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <ResponsiveContainer size="full" padding="none" className="px-2 sm:px-3 md:px-4 py-3 sm:py-4">
        <div className="mb-4 sm:mb-6">
          <div className="h-6 sm:h-8 w-32 sm:w-40 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-3 sm:h-4 w-48 sm:w-60 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <div className="h-64 sm:h-96 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div>
            <div className="h-64 sm:h-96 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </ResponsiveContainer>
    )
  }

  return (
    <ErrorBoundary>
      <ResponsiveContainer
        size="full"
        padding="none"
        className="w-full max-w-none animate-fade-in bg-[#f8f9fa] min-h-screen px-2 sm:px-3 md:px-4 py-3 sm:py-4"
      >
        {/* Dashboard Header */}
        <div className="mb-4 sm:mb-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-cedo-blue sm:text-2xl md:text-3xl">
              Dashboard
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">Summary</p>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <StatsCard
            title="Pending Review"
            value="23"
            subtitle="5 new since yesterday"
            icon={<Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />}
            iconBg="bg-amber-100"
          />
          <StatsCard
            title="Approved"
            value="86"
            subtitle="72% approval rate"
            icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
            iconBg="bg-green-100"
          />
          <StatsCard
            title="Rejected"
            value="19"
            subtitle="Requires feedback"
            icon={<Activity className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />}
            iconBg="bg-red-100"
          />
          <StatsCard
            title="Total Proposals"
            value="128"
            subtitle="↑ 6%"
            subtitleColor="text-green-600"
            icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />}
            iconBg="bg-blue-100"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Recent Proposals - Takes up 2/3 of the space on large screens */}
          <div className="lg:col-span-2">
            <Card className="cedo-card">
              <CardContent className="responsive-padding">
                <div className="space-y-4 sm:space-y-6">
                  {/* Header */}
                  <div className="responsive-flex-between responsive-gap">
                    <div>
                      <h3 className="cedo-heading-3">Recent Proposals</h3>
                      <p className="cedo-body text-muted-foreground">
                        Latest proposal submissions and their status
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-start items-start gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                      <ProposalSearchInput />
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                        Export
                      </Button>
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="w-full responsive-rounded">
                    <ProposalsTable />
                  </div>

                  {/* Pagination */}
                  <div className="responsive-flex-between responsive-gap pt-2">
                    <div className="cedo-body-sm text-muted-foreground">
                      Showing 5 of 5 proposals
                    </div>
                    <div className="flex flex-col sm:flex-row justify-start items-start gap-2 sm:gap-3 flex-wrap">
                      <Button variant="outline" size="sm" disabled className="text-xs sm:text-sm">
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled className="text-xs sm:text-sm">
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events - Takes up 1/3 of the space on large screens */}
          <div>
            <Card className="cedo-card">
              <CardContent className="responsive-padding">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="cedo-heading-3">Upcoming Events</h3>
                    <p className="cedo-body text-muted-foreground">
                      Events scheduled for the next 7 days
                    </p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {upcomingEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        title={event.title}
                        eventId={event.id}
                        date={event.date}
                        location={event.location}
                        attendees={event.attendees}
                      />
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-cedo-blue hover:text-cedo-blue/70 hover:bg-cedo-blue/5 transition-colors text-xs sm:text-sm"
                    onClick={() => {
                      router.push("/admin-dashboard/events?filter=upcoming&timeframe=7days")
                    }}
                  >
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    View All Events
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ResponsiveContainer>
    </ErrorBoundary>
  )
}
