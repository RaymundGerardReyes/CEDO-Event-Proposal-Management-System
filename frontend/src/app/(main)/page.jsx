"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ClockIcon, FileText, Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { useAuth } from "@/contexts/auth-context"

// Sample data for proposals
const recentProposals = [
  {
    id: "PROP-1001",
    title: "Community Outreach Program",
    organization: "City Hall - Health Department",
    submittedOn: "2023-05-15",
    status: "pending",
    assignedTo: "Rue Mon",
  },
  {
    id: "PROP-1002",
    title: "HIV Awareness Campaign",
    organization: "XU Organization",
    submittedOn: "2023-05-12",
    status: "approved",
    assignedTo: "Eva Torres",
  },
  {
    id: "PROP-1003",
    title: "Tech Skills Workshop",
    organization: "Lourdes College Organization",
    submittedOn: "2023-05-10",
    status: "rejected",
    assignedTo: "Mike Johnson",
  },
  {
    id: "PROP-1004",
    title: "Small Business Development Program",
    organization: "City Hall - Economic Development",
    submittedOn: "2023-05-08",
    status: "approved",
    assignedTo: "Khecy Egar",
  },
  {
    id: "PROP-1005",
    title: "Youth Leadership Summit",
    organization: "CSO Organization",
    submittedOn: "2023-05-05",
    status: "pending",
    assignedTo: "Robert Brown",
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

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)

    // Simulate data loading
    const timer = setTimeout(() => {
      setIsPageLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Only redirect if component is mounted and auth check is complete
    if (isMounted && !isLoading && !user) {
      console.log("No authenticated user found in dashboard, redirecting to sign-in")
      router.push("/sign-in")
    }
  }, [user, isLoading, isMounted, router])

  // Show loading state while checking authentication or loading page data
  if (!isMounted || isLoading || isPageLoading) {
    return (
      <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cedo-blue mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // If no user and auth check is complete, don't render anything (redirect will happen)
  if (!user) {
    return null
  }

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader title={`Welcome, ${user.name}`} subtitle="Dashboard Summary" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="cedo-card">
          <CardContent className="cedo-stats-card p-6">
            <div>
              <p className="text-muted-foreground text-sm">Pending Review</p>
              <h2 className="text-3xl font-bold mt-1 text-cedo-blue">23</h2>
              <p className="text-xs text-muted-foreground mt-1">5 new since yesterday</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <ClockIcon className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="cedo-card">
          <CardContent className="cedo-stats-card p-6">
            <div>
              <p className="text-muted-foreground text-sm">Approved</p>
              <h2 className="text-3xl font-bold mt-1 text-cedo-blue">86</h2>
              <p className="text-xs text-muted-foreground mt-1">72% approval rate</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-500"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="cedo-card">
          <CardContent className="cedo-stats-card p-6">
            <div>
              <p className="text-muted-foreground text-sm">Rejected</p>
              <h2 className="text-3xl font-bold mt-1 text-cedo-blue">19</h2>
              <p className="text-xs text-muted-foreground mt-1">Requires feedback</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="cedo-card">
          <CardContent className="cedo-stats-card p-6">
            <div>
              <p className="text-muted-foreground text-sm">Total Proposals</p>
              <h2 className="text-3xl font-bold mt-1 text-cedo-blue">128</h2>
              <p className="text-xs text-green-600 mt-1">↑ 6%</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="cedo-card">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-cedo-blue">Recent Proposals</h3>
                    <p className="text-sm text-muted-foreground">Latest proposal submissions and their status</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="search" placeholder="Search proposals..." className="pl-8 w-full sm:w-[250px]" />
                    </div>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                    <div className="border rounded-md px-3 py-1 text-sm flex items-center gap-1">
                      All Statuses
                      <ChevronLeft className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left font-medium py-2 px-2">Title</th>
                        <th className="text-left font-medium py-2 px-2">Organization</th>
                        <th className="text-left font-medium py-2 px-2">Submitted On</th>
                        <th className="text-left font-medium py-2 px-2">Status</th>
                        <th className="text-left font-medium py-2 px-2">Assigned To</th>
                        <th className="text-right font-medium py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentProposals.map((proposal) => (
                        <tr key={proposal.id} className="border-b">
                          <td className="py-3 px-2">
                            <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm font-medium">
                              {proposal.title}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm">
                              {proposal.organization}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm">
                              {proposal.submittedOn}
                            </div>
                          </td>
                          <td className="py-3 px-2">
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
                          <td className="py-3 px-2">
                            <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm">
                              {proposal.assignedTo}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button variant="ghost" size="sm" className="text-cedo-blue hover:text-cedo-blue/70">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground pt-2">
                  <div>Showing 5 of 5 proposals</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="cedo-card">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-cedo-blue">Upcoming Events</h3>
                  <p className="text-sm text-muted-foreground">Events scheduled for the next 7 days</p>
                </div>

                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border border-gray-100 rounded-md p-4 hover:border-cedo-blue/30 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-cedo-blue">{event.title}</h4>
                        <Badge variant="outline" className="border-cedo-blue text-cedo-blue">
                          {event.id}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>{event.date}</div>
                        <div>{event.location}</div>
                        <div>{event.attendees} attendees</div>
                      </div>
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-cedo-blue hover:text-cedo-blue/70 hover:bg-cedo-blue/5 px-0"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="ghost" className="w-full text-cedo-blue hover:text-cedo-blue/70 hover:bg-cedo-blue/5">
                  View All Events
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
