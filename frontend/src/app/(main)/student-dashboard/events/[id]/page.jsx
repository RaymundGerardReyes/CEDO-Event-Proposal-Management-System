// frontend/src/app/(main)/student-dashboard/events/[id]/page.jsx

"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/dashboard/student/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card"
import { Badge } from "@/components/dashboard/student/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/dashboard/student/ui/avatar"
import { Separator } from "@/components/dashboard/student/ui/separator"
import { ArrowLeft, Calendar, Clock, Download, MapPin, Share, Users } from "lucide-react"
import { PageHeader } from "@/components/dashboard/student/ui/page-header"

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
      <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
        <PageHeader title="Event Details" subtitle="View detailed information about this event" />

        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <h2 className="text-xl font-bold text-[#0c2d6b] mb-2">Event Not Found</h2>
            <p className="text-muted-foreground">The event you're looking for doesn't exist or has been removed.</p>
            <Button className="mt-4" onClick={() => router.push("/events")}>
              View All Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader title={event.title} subtitle={`Event details for ${event.id}`} />

      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-[#f0f0f0] shadow-sm">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge
                      className={
                        event.category === "academic"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          : event.category === "cultural"
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                            : event.category === "community"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : event.category === "leadership"
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                      }
                    >
                      {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="border-[#0c2d6b] text-[#0c2d6b]">
                      {event.id}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`${
                        event.status === "upcoming"
                          ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
                      }`}
                    >
                      {event.status === "upcoming" ? "Upcoming" : "Past"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center text-[#0c2d6b]">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span className="font-medium">Date</span>
                  </div>
                  <span className="ml-7">
                    {new Date(event.startDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center text-[#0c2d6b]">
                    <Clock className="h-5 w-5 mr-2" />
                    <span className="font-medium">Time</span>
                  </div>
                  <span className="ml-7">
                    {new Date(event.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" - "}
                    {new Date(event.endDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center text-[#0c2d6b]">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span className="font-medium">Location</span>
                  </div>
                  <span className="ml-7">{event.location}</span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium text-[#0c2d6b] mb-2">Description</h3>
                <p>{event.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#0c2d6b] mb-2">Event Agenda</h3>
                <div className="space-y-2">
                  {event.agenda.map((item, index) => (
                    <div key={index} className="flex border-l-2 border-[#0c2d6b] pl-4 py-2">
                      <div className="w-24 font-medium">{item.time}</div>
                      <div>{item.activity}</div>
                    </div>
                  ))}
                </div>
              </div>

              {event.status === "upcoming" && (
                <div className="flex justify-center pt-4">
                  <Button className="bg-[#0c2d6b] hover:bg-[#0c2d6b]/90 w-full max-w-xs">Register for Event</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border border-[#f0f0f0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#0c2d6b]">Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-[#0c2d6b]" />
                <div>
                  <p className="font-medium">Expected Attendees</p>
                  <p className="text-sm text-muted-foreground">{event.attendees} people</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="font-medium text-[#0c2d6b] mb-2">Organizer</p>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-[#0c2d6b] text-white">{event.organizer.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{event.organizer.name}</p>
                    <p className="text-sm text-muted-foreground">{event.organizer.contact}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="font-medium text-[#0c2d6b] mb-2">Resources</p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Event Brochure
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Schedule PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {event.status === "past" && (
            <Card className="border border-[#f0f0f0] shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#0c2d6b]">Event Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted p-3 rounded-md text-center">
                      <p className="text-sm text-muted-foreground">Actual Attendees</p>
                      <p className="text-xl font-bold text-[#0c2d6b]">112</p>
                    </div>
                    <div className="bg-muted p-3 rounded-md text-center">
                      <p className="text-sm text-muted-foreground">Satisfaction</p>
                      <p className="text-xl font-bold text-[#0c2d6b]">92%</p>
                    </div>
                  </div>
                  <Button className="w-full bg-[#0c2d6b] hover:bg-[#0c2d6b]/90">View Full Report</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
