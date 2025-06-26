// frontend/src/app/(main)/admin-dashboard/events/[id]/page.jsx
"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, Download, MapPin, Share, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

// Sample event data - using the same data structure from event-calendar.jsx
const events = [
  {
    id: "EVENT-001",
    title: "Science Fair Exhibition",
    startDate: "2023-03-20T09:00:00",
    endDate: "2023-03-20T17:00:00",
    location: "Main Campus Hall",
    attendees: 120,
    category: "academic",
    status: "upcoming",
    description: "Annual science fair showcasing student projects from various departments.",
    organizer: {
      name: "Science Department",
      contact: "science@university.edu",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "SD",
    },
    agenda: [
      { time: "09:00 AM", activity: "Registration and Setup" },
      { time: "10:00 AM", activity: "Opening Ceremony" },
      { time: "10:30 AM", activity: "Project Showcase Begins" },
      { time: "12:30 PM", activity: "Lunch Break" },
      { time: "01:30 PM", activity: "Guest Speaker: Dr. Emily Chen" },
      { time: "02:30 PM", activity: "Judging Period" },
      { time: "04:00 PM", activity: "Awards Ceremony" },
      { time: "05:00 PM", activity: "Closing Remarks" },
    ],
  },
  {
    id: "EVENT-002",
    title: "Leadership Workshop",
    startDate: "2023-03-22T13:00:00",
    endDate: "2023-03-22T16:00:00",
    location: "Conference Room B",
    attendees: 45,
    category: "leadership",
    status: "upcoming",
    description: "Interactive workshop on leadership skills and team management.",
    organizer: {
      name: "Student Council",
      contact: "council@university.edu",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "SC",
    },
    agenda: [
      { time: "01:00 PM", activity: "Welcome and Introduction" },
      { time: "01:15 PM", activity: "Leadership Styles Overview" },
      { time: "02:00 PM", activity: "Team Building Exercise" },
      { time: "02:45 PM", activity: "Break" },
      { time: "03:00 PM", activity: "Conflict Resolution Strategies" },
      { time: "03:45 PM", activity: "Q&A Session" },
      { time: "04:00 PM", activity: "Closing Remarks" },
    ],
  },
  // Additional events would be here
]

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id

  // Find the event with the matching ID
  const event = events.find((e) => e.id === eventId)

  // If event not found, show error state
  if (!event) {
    return (
      <div className="flex-1 bg-[#f8f9fa] p-3 sm:p-4 md:p-6 lg:p-8">
        <PageHeader title="Event Details" subtitle="View detailed information about this event" />

        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-sm sm:text-base">Back to Events</span>
        </Button>

        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-10 lg:py-12">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0c2d6b] mb-2">Event Not Found</h2>
            <p className="text-sm sm:text-base text-muted-foreground text-center px-4">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Button className="mt-4 text-sm sm:text-base" onClick={() => router.push("/events")}>
              View All Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#f8f9fa] p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title={event.title}
          subtitle={`Event details for ${event.id}`}
          className="mb-4 sm:mb-6 lg:mb-8"
        />

        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 sm:mb-6 text-sm sm:text-base"
        >
          <ArrowLeft className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Back to Events
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="border border-[#f0f0f0] shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                      <Badge
                        className={
                          event.category === "academic"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs sm:text-sm"
                            : event.category === "cultural"
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs sm:text-sm"
                              : event.category === "community"
                                ? "bg-green-100 text-green-800 hover:bg-green-100 text-xs sm:text-sm"
                                : event.category === "leadership"
                                  ? "bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs sm:text-sm"
                                  : "bg-red-100 text-red-800 hover:bg-red-100 text-xs sm:text-sm"
                        }
                      >
                        {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="border-[#0c2d6b] text-[#0c2d6b] text-xs sm:text-sm">
                        {event.id}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs sm:text-sm ${event.status === "upcoming"
                          ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
                          }`}
                      >
                        {event.status === "upcoming" ? "Upcoming" : "Past"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      <Share className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Export</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Event Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-[#0c2d6b]">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="font-medium text-sm sm:text-base">Date</span>
                    </div>
                    <span className="ml-6 sm:ml-7 text-sm sm:text-base text-gray-700">
                      {new Date(event.startDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center text-[#0c2d6b]">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="font-medium text-sm sm:text-base">Time</span>
                    </div>
                    <span className="ml-6 sm:ml-7 text-sm sm:text-base text-gray-700">
                      {new Date(event.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(event.endDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="flex flex-col space-y-1 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center text-[#0c2d6b]">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="font-medium text-sm sm:text-base">Location</span>
                    </div>
                    <span className="ml-6 sm:ml-7 text-sm sm:text-base text-gray-700">{event.location}</span>
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-medium text-[#0c2d6b] mb-2 sm:mb-3">
                    Description
                  </h3>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{event.description}</p>
                </div>

                {/* Event Agenda */}
                <div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-medium text-[#0c2d6b] mb-2 sm:mb-3">
                    Event Agenda
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {event.agenda.map((item, index) => (
                      <div key={index} className="flex border-l-2 border-[#0c2d6b] pl-3 sm:pl-4 py-2">
                        <div className="w-16 sm:w-20 lg:w-24 font-medium text-xs sm:text-sm text-[#0c2d6b] flex-shrink-0">
                          {item.time}
                        </div>
                        <div className="text-sm sm:text-base text-gray-700 leading-relaxed">
                          {item.activity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Registration Button */}
                {event.status === "upcoming" && (
                  <div className="flex justify-center pt-4 sm:pt-6">
                    <Button className="bg-[#0c2d6b] hover:bg-[#0c2d6b]/90 w-full sm:w-auto sm:min-w-[200px] text-sm sm:text-base">
                      Register for Event
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Event Details Card */}
            <Card className="border border-[#f0f0f0] shadow-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-[#0c2d6b] text-base sm:text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 mt-1 text-[#0c2d6b] flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm sm:text-base">Expected Attendees</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{event.attendees} people</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="font-medium text-[#0c2d6b] mb-2 sm:mb-3 text-sm sm:text-base">Organizer</p>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-[#0c2d6b] text-white text-xs sm:text-sm">
                        {event.organizer.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{event.organizer.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{event.organizer.contact}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="font-medium text-[#0c2d6b] mb-2 sm:mb-3 text-sm sm:text-base">Resources</p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-xs sm:text-sm">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Event Brochure
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs sm:text-sm">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      Schedule PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Report Card (for past events) */}
            {event.status === "past" && (
              <Card className="border border-[#f0f0f0] shadow-sm">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-[#0c2d6b] text-base sm:text-lg">Event Report</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="bg-muted p-3 sm:p-4 rounded-md text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">Actual Attendees</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0c2d6b]">112</p>
                      </div>
                      <div className="bg-muted p-3 sm:p-4 rounded-md text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">Satisfaction</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0c2d6b]">92%</p>
                      </div>
                    </div>
                    <Button className="w-full bg-[#0c2d6b] hover:bg-[#0c2d6b]/90 text-xs sm:text-sm">
                      View Full Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
