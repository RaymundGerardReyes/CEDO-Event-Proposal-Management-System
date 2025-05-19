"use client"

import { InfoIcon, Download, HelpCircle, Search, ChevronDown, ChevronUp, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function SDPCreditsPage() {
  const [expandedEvent, setExpandedEvent] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [participantSearchQuery, setParticipantSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const toggleEvent = (eventId) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null)
    } else {
      setExpandedEvent(eventId)
      setParticipantSearchQuery("")
    }
  }

  // Sample data
  const events = [
    {
      id: 1,
      name: "Leadership Workshop",
      date: "April 15, 2025",
      category: "Leadership",
      credits: 2,
      participants: [
        { name: "Juan Dela Cruz", school: "Xavier University", program: "BS Biology", yearLevel: "2nd Year" },
        { name: "Maria Santos", school: "Liceo de Cagayan", program: "BS Information Tech.", yearLevel: "3rd Year" },
        {
          name: "Ahmed Alonto",
          school: "Mindanao State University",
          program: "BS Political Science",
          yearLevel: "4th Year",
        },
      ],
    },
    {
      id: 2,
      name: "Community Clean-up",
      date: "April 5, 2025",
      category: "Community Service",
      credits: 3,
      participants: [
        { name: "Juan Dela Cruz", school: "Xavier University", program: "BS Biology", yearLevel: "2nd Year" },
        { name: "Maria Santos", school: "Liceo de Cagayan", program: "BS Information Tech.", yearLevel: "3rd Year" },
      ],
    },
    {
      id: 3,
      name: "Career Fair Volunteer",
      date: "March 20, 2025",
      category: "Professional Development",
      credits: 2,
      participants: [
        {
          name: "Ahmed Alonto",
          school: "Mindanao State University",
          program: "BS Political Science",
          yearLevel: "4th Year",
        },
      ],
    },
    {
      id: 4,
      name: "Student Council Meeting",
      date: "March 10, 2025",
      category: "Leadership",
      credits: 1,
      participants: [
        { name: "Juan Dela Cruz", school: "Xavier University", program: "BS Biology", yearLevel: "2nd Year" },
      ],
    },
  ]

  // Calculate total credits
  const totalCredits = 36
  const earnedCredits = 24
  const remainingCredits = totalCredits - earnedCredits
  const progressPercentage = Math.round((earnedCredits / totalCredits) * 100)

  // Filter events based on search query
  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.date.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Get participants for the expanded event and filter them
  const getFilteredParticipants = (eventId) => {
    const event = events.find((e) => e.id === eventId)
    if (!event) return []

    return event.participants.filter(
      (participant) =>
        participant.name.toLowerCase().includes(participantSearchQuery.toLowerCase()) ||
        participant.school.toLowerCase().includes(participantSearchQuery.toLowerCase()) ||
        participant.program.toLowerCase().includes(participantSearchQuery.toLowerCase()) ||
        participant.yearLevel.toLowerCase().includes(participantSearchQuery.toLowerCase()),
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">SDP Credits</h1>
        <p className="text-muted-foreground">Track your Student Development Program credits and progress</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex items-center">
              <CardTitle className="text-lg font-medium">Overall Progress</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1 p-0"
                      aria-label="Information about overall progress"
                    >
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Your progress toward completing all required SDP credits</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-muted-foreground">
              {earnedCredits} of {totalCredits} credits earned
            </span>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <div className="h-2.5 w-full rounded-full bg-[#f0c14b]">
                <div
                  className="h-2.5 rounded-full bg-[#0A2B70]"
                  style={{ width: `${progressPercentage}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={`${progressPercentage}% of credits completed`}
                ></div>
              </div>
              <div className="mt-2 text-right text-sm text-muted-foreground">{progressPercentage}% complete</div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="text-3xl font-bold text-[#0A2B70]">{earnedCredits}</div>
                <div className="text-sm text-muted-foreground">Earned</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="text-3xl font-bold text-[#0A2B70]">{remainingCredits}</div>
                <div className="text-sm text-muted-foreground">Remaining</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <div className="text-3xl font-bold text-[#0A2B70]">{totalCredits}</div>
                <div className="text-sm text-muted-foreground">Required</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Credits by Category</CardTitle>
            <p className="text-sm text-muted-foreground">Breakdown of credits earned in each category</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">Leadership</span>
                <span className="text-sm text-muted-foreground">8 / 12</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#f0c14b]">
                <div
                  className="h-2 rounded-full bg-[#0A2B70]"
                  style={{ width: "66.7%" }}
                  role="progressbar"
                  aria-valuenow="67"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="67% of leadership credits completed"
                ></div>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">Community Service</span>
                <span className="text-sm text-muted-foreground">10 / 12</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#f0c14b]">
                <div
                  className="h-2 rounded-full bg-[#0A2B70]"
                  style={{ width: "83.3%" }}
                  role="progressbar"
                  aria-valuenow="83"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="83% of community service credits completed"
                ></div>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">Professional Development</span>
                <span className="text-sm text-muted-foreground">6 / 12</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#f0c14b]">
                <div
                  className="h-2 rounded-full bg-[#0A2B70]"
                  style={{ width: "50%" }}
                  role="progressbar"
                  aria-valuenow="50"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="50% of professional development credits completed"
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <CardTitle className="text-lg font-medium">Credit History</CardTitle>
            <p className="text-sm text-muted-foreground">Record of your SDP credit activities</p>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1" aria-label="Export credit history">
            <Download className="h-4 w-4" aria-hidden="true" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="approved" className="w-full">
            <TabsList className="mb-4 w-full sm:w-auto">
              <TabsTrigger value="approved" className="flex-1 sm:flex-initial">
                Approved
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1 sm:flex-initial">
                Pending
              </TabsTrigger>
            </TabsList>
            <TabsContent value="approved">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="text-left text-sm font-medium text-muted-foreground">
                        <th scope="col" className="py-3 pl-4 pr-3 sm:pl-0">
                          Event
                        </th>
                        <th scope="col" className="px-3 py-3">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-3">
                          Category
                        </th>
                        <th scope="col" className="px-3 py-3 text-right">
                          Credits
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-muted/50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          Leadership Workshop
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">April 15, 2025</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Leadership</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                          <Badge variant="outline" className="font-normal">
                            <span className="mr-1" aria-hidden="true">
                              🏆
                            </span>{" "}
                            2
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          Community Clean-up
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">April 5, 2025</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Community Service</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                          <Badge variant="outline" className="font-normal">
                            <span className="mr-1" aria-hidden="true">
                              🏆
                            </span>{" "}
                            3
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          Career Fair Volunteer
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">March 20, 2025</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Professional Development</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                          <Badge variant="outline" className="font-normal">
                            <span className="mr-1" aria-hidden="true">
                              🏆
                            </span>{" "}
                            2
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                          Student Council Meeting
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">March 10, 2025</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Leadership</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                          <Badge variant="outline" className="font-normal">
                            <span className="mr-1" aria-hidden="true">
                              🏆
                            </span>{" "}
                            1
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="pending">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <HelpCircle className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
                <h3 className="text-lg font-medium mb-1">No pending credits</h3>
                <p className="text-muted-foreground max-w-md">
                  You don't have any pending credit activities at the moment. They will appear here once submitted.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Event Participants Section */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <CardTitle className="text-lg font-medium">Event Participants</CardTitle>
            <p className="text-sm text-muted-foreground">View participants for each event</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showFilters && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search events by name or date..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {filteredEvents.length > 0 ? (
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <div key={event.id} className="border rounded-md overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleEvent(event.id)}
                  >
                    <div>
                      <h3 className="font-medium">{event.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        {event.date} • {event.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-normal">
                        <span className="mr-1" aria-hidden="true">
                          🏆
                        </span>{" "}
                        {event.credits}
                      </Badge>
                      {expandedEvent === event.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {expandedEvent === event.id && (
                    <div className="p-4 bg-muted/20 border-t">
                      <h4 className="font-medium mb-3">Participants ({event.participants.length})</h4>

                      {/* Mini search box for participants */}
                      <div className="mb-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="search"
                            placeholder="Search participants by name or school..."
                            className="pl-8"
                            value={participantSearchQuery}
                            onChange={(e) => setParticipantSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr className="text-left text-sm font-medium text-muted-foreground">
                              <th scope="col" className="py-2 pl-0 pr-3">
                                Name
                              </th>
                              <th scope="col" className="px-3 py-2">
                                School
                              </th>
                              <th scope="col" className="px-3 py-2">
                                Program
                              </th>
                              <th scope="col" className="px-3 py-2">
                                Year Level
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {getFilteredParticipants(event.id).map((participant, index) => (
                              <tr key={index} className="hover:bg-muted/30">
                                <td className="py-2 pl-0 pr-3 text-sm font-medium">{participant.name}</td>
                                <td className="px-3 py-2 text-sm text-gray-500">{participant.school}</td>
                                <td className="px-3 py-2 text-sm text-gray-500">{participant.program}</td>
                                <td className="px-3 py-2 text-sm text-gray-500">{participant.yearLevel}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {getFilteredParticipants(event.id).length === 0 && (
                          <div className="py-4 text-center text-muted-foreground">
                            No participants match your search criteria
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium mb-1">No credits have been awarded yet</h3>
              <p className="text-muted-foreground max-w-md">
                Submit and get an event approved to start tracking SDP credits.
              </p>
            </div>
          )}

          {filteredEvents.length > 0 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
