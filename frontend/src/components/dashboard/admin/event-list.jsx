"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Calendar, Users } from "lucide-react"

// Sample event data - using the same data from event-calendar.jsx
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
  },
  {
    id: "EVENT-003",
    title: "Community Service Day",
    startDate: "2023-03-25T08:00:00",
    endDate: "2023-03-25T14:00:00",
    location: "City Park",
    attendees: 75,
    category: "community",
    status: "upcoming",
    description: "Volunteer day for community service projects around the city.",
    organizer: {
      name: "Community Outreach",
      contact: "outreach@university.edu",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "CO",
    },
  },
  {
    id: "EVENT-004",
    title: "Cultural Festival",
    startDate: "2023-03-15T10:00:00",
    endDate: "2023-03-15T20:00:00",
    location: "University Quad",
    attendees: 350,
    category: "cultural",
    status: "past",
    description: "Annual cultural festival celebrating diversity with food, performances, and exhibits.",
    organizer: {
      name: "Cultural Affairs",
      contact: "culture@university.edu",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "CA",
    },
  },
  {
    id: "EVENT-005",
    title: "Tech Hackathon",
    startDate: "2023-03-10T09:00:00",
    endDate: "2023-03-11T18:00:00",
    location: "Engineering Building",
    attendees: 120,
    category: "technology",
    status: "past",
    description: "24-hour hackathon for students to develop innovative tech solutions.",
    organizer: {
      name: "Tech Club",
      contact: "tech@university.edu",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "TC",
    },
  },
  {
    id: "EVENT-006",
    title: "Alumni Networking Event",
    startDate: "2023-04-05T18:00:00",
    endDate: "2023-04-05T21:00:00",
    location: "Grand Hall",
    attendees: 200,
    category: "leadership",
    status: "upcoming",
    description: "Networking event connecting current students with successful alumni.",
    organizer: {
      name: "Alumni Association",
      contact: "alumni@university.edu",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "AA",
    },
  },
  {
    id: "EVENT-007",
    title: "Research Symposium",
    startDate: "2023-04-12T09:00:00",
    endDate: "2023-04-12T17:00:00",
    location: "Science Center",
    attendees: 150,
    category: "academic",
    status: "upcoming",
    description: "Annual symposium showcasing faculty and student research projects.",
    organizer: {
      name: "Research Department",
      contact: "research@university.edu",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "RD",
    },
  },
]

export function EventList({ filter, searchTerm, categoryFilter }) {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Filter events based on props
  const filteredEvents = events.filter((event) => {
    const matchesFilter = filter === "all" || event.status === filter
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter

    return matchesFilter && matchesSearch && matchesCategory
  })

  // Sort events by date (most recent first)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  })

  const handleViewDetails = (event) => {
    setSelectedEvent(event)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="cedo-table-header">
              <TableRow>
                <TableHead className="font-semibold text-cedo-blue">Event ID</TableHead>
                <TableHead className="font-semibold text-cedo-blue">Title</TableHead>
                <TableHead className="font-semibold text-cedo-blue">Date</TableHead>
                <TableHead className="font-semibold text-cedo-blue">Location</TableHead>
                <TableHead className="font-semibold text-cedo-blue">Category</TableHead>
                <TableHead className="font-semibold text-cedo-blue">Attendees</TableHead>
                <TableHead className="font-semibold text-cedo-blue">Organizer</TableHead>
                <TableHead className="text-right font-semibold text-cedo-blue">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEvents.length > 0 ? (
                sortedEvents.map((event) => (
                  <TableRow key={event.id} className="cedo-table-row">
                    <TableCell className="font-medium">{event.id}</TableCell>
                    <TableCell>
                      <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm font-medium">
                        {event.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{new Date(event.startDate).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {new Date(event.endDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm">
                        {event.location}
                      </div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>
                      <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm text-center">
                        {event.attendees}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs bg-cedo-blue text-white">
                            {event.organizer.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{event.organizer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(event)}
                        className="hover:bg-cedo-blue/5 hover:text-cedo-blue"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Calendar className="h-10 w-10 mb-2" />
                      <h3 className="text-lg font-medium">No events found</h3>
                      <p className="text-sm">Try adjusting your filters or search terms</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-cedo-blue">{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  <Badge
                    className={
                      selectedEvent.category === "academic"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        : selectedEvent.category === "cultural"
                          ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                          : selectedEvent.category === "community"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : selectedEvent.category === "leadership"
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100"
                    }
                  >
                    {selectedEvent.category.charAt(0).toUpperCase() + selectedEvent.category.slice(1)}
                  </Badge>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date & Time</p>
                    <p>{new Date(selectedEvent.startDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date & Time</p>
                    <p>{new Date(selectedEvent.endDate).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p>{selectedEvent.location}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Organizer</p>
                  <div className="flex items-center mt-1">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={selectedEvent.organizer.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-cedo-blue text-white">
                        {selectedEvent.organizer.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedEvent.organizer.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedEvent.organizer.contact}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-cedo-blue" />
                    <span className="text-sm">{selectedEvent.attendees} Expected Attendees</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline">Export Details</Button>
                  <Button className="bg-cedo-blue hover:bg-cedo-blue/90">
                    {selectedEvent.status === "upcoming" ? "Register" : "View Report"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
