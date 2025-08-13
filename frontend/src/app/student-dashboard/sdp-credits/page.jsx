"use client"

export const dynamic = 'force-dynamic';

import { Badge } from "@/components/dashboard/student/ui/badge";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { Input } from "@/components/dashboard/student/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/dashboard/student/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronDown, ChevronUp, Download, Filter, HelpCircle, InfoIcon, Search } from "lucide-react";
import { useState } from "react";

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
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header Section - Responsive Typography */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">SDP Credits</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Track your Student Development Program credits and progress</p>
      </div>

      {/* Progress Overview Cards - Responsive Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Overall Progress Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <CardTitle className="text-base sm:text-lg font-medium">Overall Progress</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 sm:h-6 sm:w-6 ml-1 p-0"
                      aria-label="Information about overall progress"
                    >
                      <InfoIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs sm:text-sm">Your progress toward completing all required SDP credits</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {earnedCredits} of {totalCredits} credits earned
            </span>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="h-2 sm:h-2.5 w-full rounded-full bg-[#f0c14b]">
                <div
                  className="h-2 sm:h-2.5 rounded-full bg-[#0A2B70] transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={`${progressPercentage}% of credits completed`}
                ></div>
              </div>
              <div className="mt-1 sm:mt-2 text-right text-xs sm:text-sm text-muted-foreground">{progressPercentage}% complete</div>
            </div>

            {/* Stats Grid - Responsive Layout */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-lg bg-gray-50">
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#0A2B70]">{earnedCredits}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Earned</div>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-gray-50">
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#0A2B70]">{remainingCredits}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Remaining</div>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-gray-50">
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#0A2B70]">{totalCredits}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Required</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credits by Category Card */}
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-medium">Credits by Category</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">Breakdown of credits earned in each category</p>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Leadership Category */}
            <div>
              <div className="mb-1 sm:mb-2 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">Leadership</span>
                <span className="text-xs sm:text-sm text-muted-foreground">8 / 12</span>
              </div>
              <div className="h-1.5 sm:h-2 w-full rounded-full bg-[#f0c14b]">
                <div
                  className="h-1.5 sm:h-2 rounded-full bg-[#0A2B70] transition-all duration-300"
                  style={{ width: "66.7%" }}
                  role="progressbar"
                  aria-valuenow="67"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="67% of leadership credits completed"
                ></div>
              </div>
            </div>

            {/* Community Service Category */}
            <div>
              <div className="mb-1 sm:mb-2 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">Community Service</span>
                <span className="text-xs sm:text-sm text-muted-foreground">10 / 12</span>
              </div>
              <div className="h-1.5 sm:h-2 w-full rounded-full bg-[#f0c14b]">
                <div
                  className="h-1.5 sm:h-2 rounded-full bg-[#0A2B70] transition-all duration-300"
                  style={{ width: "83.3%" }}
                  role="progressbar"
                  aria-valuenow="83"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label="83% of community service credits completed"
                ></div>
              </div>
            </div>

            {/* Professional Development Category */}
            <div>
              <div className="mb-1 sm:mb-2 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium">Professional Development</span>
                <span className="text-xs sm:text-sm text-muted-foreground">6 / 12</span>
              </div>
              <div className="h-1.5 sm:h-2 w-full rounded-full bg-[#f0c14b]">
                <div
                  className="h-1.5 sm:h-2 rounded-full bg-[#0A2B70] transition-all duration-300"
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

      {/* Credit History Card - Enhanced Responsive Design */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-base sm:text-lg font-medium">Credit History</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">Record of your SDP credit activities</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] sm:min-h-[32px] gap-1 w-full sm:w-auto text-xs sm:text-sm"
            aria-label="Export credit history"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="approved" className="w-full">
            {/* Responsive Tab List */}
            <TabsList className="mb-4 w-full grid grid-cols-2 sm:w-auto sm:inline-flex">
              <TabsTrigger value="approved" className="text-xs sm:text-sm">
                Approved
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">
                Pending
              </TabsTrigger>
            </TabsList>

            <TabsContent value="approved">
              {/* Mobile: Card Layout, Desktop: Table Layout */}
              <div className="space-y-3 sm:hidden">
                {/* Mobile Card Layout */}
                {[
                  { name: "Leadership Workshop", date: "April 15, 2025", category: "Leadership", credits: 2 },
                  { name: "Community Clean-up", date: "April 5, 2025", category: "Community Service", credits: 3 },
                  { name: "Career Fair Volunteer", date: "March 20, 2025", category: "Professional Development", credits: 2 },
                  { name: "Student Council Meeting", date: "March 10, 2025", category: "Leadership", credits: 1 },
                ].map((event, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-sm">{event.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          <span className="mr-1" aria-hidden="true">🏆</span>
                          {event.credits}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>{event.date}</p>
                        <p>{event.category}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="text-left text-xs sm:text-sm font-medium text-muted-foreground">
                        <th scope="col" className="py-2 sm:py-3 pl-4 pr-3 sm:pl-0">
                          Event
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3">
                          Date
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3">
                          Category
                        </th>
                        <th scope="col" className="px-2 sm:px-3 py-2 sm:py-3 text-right">
                          Credits
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-muted/50">
                        <td className="whitespace-nowrap py-3 sm:py-4 pl-4 pr-3 text-xs sm:text-sm font-medium text-gray-900 sm:pl-0">
                          Leadership Workshop
                        </td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">April 15, 2025</td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">Leadership</td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 text-right">
                          <Badge variant="outline" className="text-xs font-normal">
                            <span className="mr-1" aria-hidden="true">🏆</span>
                            2
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="whitespace-nowrap py-3 sm:py-4 pl-4 pr-3 text-xs sm:text-sm font-medium text-gray-900 sm:pl-0">
                          Community Clean-up
                        </td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">April 5, 2025</td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">Community Service</td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 text-right">
                          <Badge variant="outline" className="text-xs font-normal">
                            <span className="mr-1" aria-hidden="true">🏆</span>
                            3
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="whitespace-nowrap py-3 sm:py-4 pl-4 pr-3 text-xs sm:text-sm font-medium text-gray-900 sm:pl-0">
                          Career Fair Volunteer
                        </td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">March 20, 2025</td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">Professional Development</td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 text-right">
                          <Badge variant="outline" className="text-xs font-normal">
                            <span className="mr-1" aria-hidden="true">🏆</span>
                            2
                          </Badge>
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/50">
                        <td className="whitespace-nowrap py-3 sm:py-4 pl-4 pr-3 text-xs sm:text-sm font-medium text-gray-900 sm:pl-0">
                          Student Council Meeting
                        </td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">March 10, 2025</td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">Leadership</td>
                        <td className="whitespace-nowrap px-2 sm:px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 text-right">
                          <Badge variant="outline" className="text-xs font-normal">
                            <span className="mr-1" aria-hidden="true">🏆</span>
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
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
                <HelpCircle className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4" aria-hidden="true" />
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No pending credits</h3>
                <p className="text-xs sm:text-base text-muted-foreground max-w-sm sm:max-w-md">
                  You don't have any pending credit activities at the moment. They will appear here once submitted.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Event Participants Section - Enhanced Mobile Support */}
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 space-y-2 sm:space-y-0">
          <div>
            <CardTitle className="text-base sm:text-lg font-medium">Event Participants</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">View participants for each event</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[44px] sm:min-h-[32px] gap-1 flex-1 sm:flex-initial text-xs sm:text-sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Filter</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Responsive Search Filter */}
          {showFilters && (
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search events by name or date..."
                  className="pl-8 sm:pl-9 text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {filteredEvents.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {filteredEvents.map((event) => (
                <div key={event.id} className="border rounded-md overflow-hidden">
                  {/* Event Header - Touch Friendly */}
                  <div
                    className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-muted/50 min-h-[60px] sm:min-h-[auto]"
                    onClick={() => toggleEvent(event.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">{event.name}</h3>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {event.date} • {event.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 ml-3">
                      <Badge variant="outline" className="text-xs font-normal flex-shrink-0">
                        <span className="mr-1" aria-hidden="true">🏆</span>
                        {event.credits}
                      </Badge>
                      {expandedEvent === event.id ? (
                        <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Participants Panel */}
                  {expandedEvent === event.id && (
                    <div className="p-3 sm:p-4 bg-muted/20 border-t">
                      <h4 className="font-medium text-sm sm:text-base mb-3">Participants ({event.participants.length})</h4>

                      {/* Participant Search */}
                      <div className="mb-3">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <Input
                            type="search"
                            placeholder="Search participants by name or school..."
                            className="pl-8 sm:pl-9 text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]"
                            value={participantSearchQuery}
                            onChange={(e) => setParticipantSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Mobile: Card Layout, Desktop: Table Layout */}
                      <div className="space-y-2 sm:hidden">
                        {getFilteredParticipants(event.id).map((participant, index) => (
                          <Card key={index} className="border border-gray-200">
                            <CardContent className="p-3">
                              <h5 className="font-medium text-sm mb-1">{participant.name}</h5>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                <p>{participant.school}</p>
                                <p>{participant.program}</p>
                                <p>{participant.yearLevel}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop Table Layout */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr className="text-left text-xs sm:text-sm font-medium text-muted-foreground">
                              <th scope="col" className="py-2 pl-0 pr-3">
                                Name
                              </th>
                              <th scope="col" className="px-2 sm:px-3 py-2">
                                School
                              </th>
                              <th scope="col" className="px-2 sm:px-3 py-2">
                                Program
                              </th>
                              <th scope="col" className="px-2 sm:px-3 py-2">
                                Year Level
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {getFilteredParticipants(event.id).map((participant, index) => (
                              <tr key={index} className="hover:bg-muted/30">
                                <td className="py-2 pl-0 pr-3 text-xs sm:text-sm font-medium">{participant.name}</td>
                                <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-500">{participant.school}</td>
                                <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-500">{participant.program}</td>
                                <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-500">{participant.yearLevel}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {getFilteredParticipants(event.id).length === 0 && (
                        <div className="py-4 text-center text-xs sm:text-sm text-muted-foreground">
                          No participants match your search criteria
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center px-4">
              <HelpCircle className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4" aria-hidden="true" />
              <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No credits have been awarded yet</h3>
              <p className="text-xs sm:text-base text-muted-foreground max-w-sm sm:max-w-md">
                Submit and get an event approved to start tracking SDP credits.
              </p>
            </div>
          )}

          {/* Responsive Pagination */}
          {filteredEvents.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <Pagination>
                <PaginationContent className="flex justify-center">
                  <PaginationItem>
                    <PaginationPrevious href="#" className="text-xs sm:text-sm" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive className="text-xs sm:text-sm">
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" className="text-xs sm:text-sm">2</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" className="text-xs sm:text-sm">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" className="text-xs sm:text-sm" />
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
