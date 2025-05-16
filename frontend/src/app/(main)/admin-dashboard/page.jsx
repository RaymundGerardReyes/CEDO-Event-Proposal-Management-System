"use client"

import { PageHeader } from "@/components/page-header"
import { ResponsiveGrid } from "@/components/responsive-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useMobile } from "@/hooks/use-mobile"
import { Calendar, ChevronLeft, ClockIcon, FileText, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"

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

export default function DashboardPage() {
  const router = useRouter()
  const { isMobile } = useMobile()
  const [expandedProposalId, setExpandedProposalId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const toggleExpandProposal = (id) => {
    setExpandedProposalId(expandedProposalId === id ? null : id)
  }

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8 animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-40 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-60 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
          <div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader title="Dashboard" subtitle="Summary" />

      <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} className="mb-8">
        <Card className="hover-card-effect">
          <CardContent className="cedo-stats-card">
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

        <Card className="hover-card-effect">
          <CardContent className="cedo-stats-card">
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

        <Card className="hover-card-effect">
          <CardContent className="cedo-stats-card">
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

        <Card className="hover-card-effect">
          <CardContent className="cedo-stats-card">
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
      </ResponsiveGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="cedo-card">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="cedo-header">Recent Proposals</h3>
                    <p className="cedo-subheader">Latest proposal submissions and their status</p>
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
                  <table className="w-full cedo-table">
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
                        <React.Fragment key={proposal.id}>
                          <tr className="border-b hover:bg-gray-50 transition-colors">
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-cedo-blue hover:text-cedo-blue/70 hover:bg-cedo-blue/5 transition-colors"
                                onClick={() => toggleExpandProposal(proposal.id)}
                              >
                                {expandedProposalId === proposal.id ? "Hide" : "View"}
                              </Button>
                            </td>
                          </tr>
                          {expandedProposalId === proposal.id && (
                            <tr className="bg-gray-50">
                              <td colSpan={6} className="p-0">
                                <div className="p-4 custom-slide-in">
                                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                    <div className="flex justify-between items-start mb-4">
                                      <div>
                                        <h3 className="text-lg font-medium text-cedo-blue">{proposal.title}</h3>
                                        <p className="text-sm text-muted-foreground">{proposal.organization}</p>
                                      </div>
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
                                    </div>

                                    {proposal.status === "approved" ? (
                                      <div className="space-y-4">
                                        <div>
                                          <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                            ✅ Accomplishment Details
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-sm font-medium">Event Description</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.description ||
                                                  "A successful event that achieved its intended goals and objectives."}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">Location</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.location || "Main Campus Auditorium"}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">Schedule</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.schedule || `${proposal.submittedOn}, 9:00 AM - 4:00 PM`}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">Speaker(s)</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.speakers || "Dr. Jane Smith, Industry Expert"}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        <div>
                                          <h4 className="text-sm font-medium text-cedo-blue mb-2">Participants</h4>
                                          {proposal.participants ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                              {(
                                                proposal.participants || [
                                                  "John Doe",
                                                  "Jane Smith",
                                                  "Robert Johnson",
                                                  "Emily Davis",
                                                  "Michael Brown",
                                                ]
                                              ).map((participant, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                  <div className="h-6 w-6 rounded-full bg-cedo-blue/10 flex items-center justify-center text-cedo-blue">
                                                    {participant
                                                      .split(" ")
                                                      .map((name) => name[0])
                                                      .join("")}
                                                  </div>
                                                  <span>{participant}</span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-sm text-muted-foreground">
                                              No participants have been recorded yet.
                                            </p>
                                          )}
                                        </div>

                                        <div>
                                          <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                            Additional Information
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-sm font-medium">Sponsors</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.sponsors || "University Alumni Association, TechCorp Inc."}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">Purpose</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.purpose ||
                                                  "To enhance student knowledge and provide networking opportunities."}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-4">
                                        <div>
                                          <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                            🕒 Pending Event Information
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-sm font-medium">Event Description</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.description ||
                                                  "An upcoming event designed to engage students and faculty."}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">Proposed Venue</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.proposedVenue || "Main Campus Auditorium"}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">Proposed Schedule</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.proposedSchedule ||
                                                  `${new Date(proposal.submittedOn).toLocaleDateString()}, 9:00 AM - 4:00 PM`}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">Proposed Speaker(s)</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.proposedSpeakers || "To be confirmed"}
                                              </p>
                                            </div>
                                          </div>
                                        </div>

                                        <div>
                                          <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                            Expected Participants
                                          </h4>
                                          <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-cedo-blue/10 flex items-center justify-center text-cedo-blue font-medium">
                                              {proposal.expectedParticipants || "50"}
                                            </div>
                                            <span className="text-sm">estimated students</span>
                                          </div>

                                          {proposal.signedUpMembers ? (
                                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                              {(
                                                proposal.signedUpMembers || ["John Doe", "Jane Smith", "Robert Johnson"]
                                              ).map((member, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                  <div className="h-6 w-6 rounded-full bg-cedo-blue/10 flex items-center justify-center text-cedo-blue">
                                                    {member
                                                      .split(" ")
                                                      .map((name) => name[0])
                                                      .join("")}
                                                  </div>
                                                  <span>{member}</span>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-sm text-muted-foreground mt-2">
                                              No members have signed up yet.
                                            </p>
                                          )}
                                        </div>

                                        <div>
                                          <h4 className="text-sm font-medium text-cedo-blue mb-2">
                                            Additional Information
                                          </h4>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <p className="text-sm font-medium">Intended Goal</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.intendedGoal ||
                                                  "To provide educational and networking opportunities for students."}
                                              </p>
                                            </div>
                                            <div>
                                              <p className="text-sm font-medium">Required Resources</p>
                                              <p className="text-sm text-muted-foreground">
                                                {proposal.requiredResources ||
                                                  "Projector, sound system, seating for 50 people."}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex justify-end mt-4">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-cedo-blue hover:bg-cedo-blue/5 transition-colors"
                                        onClick={() => toggleExpandProposal(proposal.id)}
                                      >
                                        Close
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
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
                  <h3 className="cedo-header">Upcoming Events</h3>
                  <p className="cedo-subheader">Events scheduled for the next 7 days</p>
                </div>

                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border border-gray-100 rounded-md p-4 hover:border-cedo-blue/30 transition-colors hover-card-effect"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-cedo-blue">{event.title}</h4>
                        <Badge variant="outline" className="cedo-badge-primary">
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
                          className="text-cedo-blue hover:text-cedo-blue/70 hover:bg-cedo-blue/5 px-0 transition-colors"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-cedo-blue hover:text-cedo-blue/70 hover:bg-cedo-blue/5 transition-colors"
                  onClick={() => {
                    router.push("/events?filter=upcoming&timeframe=7days")
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
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
