"use client"

import { useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

// Sample event data
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

export function EventCalendar({ filter, searchTerm, categoryFilter }) {
  const [currentDate, setCurrentDate] = useState(new Date())
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

  // Get current month and year
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Get first day of the month and total days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  // Previous and next month navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }

  // Generate calendar days
  const calendarDays = []
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-32 border border-gray-200 p-2 bg-gray-50/50"></div>)
  }

  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day)
    const dateString = date.toISOString().split("T")[0]
    const isToday = new Date().toDateString() === date.toDateString()

    // Find events for this day
    const dayEvents = filteredEvents.filter((event) => {
      const eventStartDate = new Date(event.startDate).toISOString().split("T")[0]
      return eventStartDate === dateString
    })

    calendarDays.push(
      <div
        key={day}
        className={`min-h-32 border border-gray-200 p-2 transition-colors ${
          isToday ? "bg-cedo-blue/5 border-cedo-blue/30" : "hover:bg-gray-50"
        }`}
      >
        <div
          className={`font-medium text-sm mb-2 flex justify-between items-center ${isToday ? "text-cedo-blue" : ""}`}
        >
          <span
            className={`flex items-center justify-center ${isToday ? "h-6 w-6 bg-cedo-blue text-white rounded-full" : ""}`}
          >
            {day}
          </span>
          {dayEvents.length > 0 && (
            <span className="text-xs bg-cedo-blue text-white px-1.5 py-0.5 rounded-full">{dayEvents.length}</span>
          )}
        </div>
        <div className="space-y-1.5">
          {dayEvents.map((event) => (
            <div
              key={event.id}
              className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-90 transition-opacity ${
                event.category === "academic"
                  ? "bg-blue-100 text-blue-800"
                  : event.category === "cultural"
                    ? "bg-purple-100 text-purple-800"
                    : event.category === "community"
                      ? "bg-green-100 text-green-800"
                      : event.category === "leadership"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
              }`}
              onClick={() => {
                setSelectedEvent(event)
                setIsDialogOpen(true)
              }}
            >
              <div className="font-medium truncate">{event.title}</div>
              <div className="text-[10px] mt-0.5 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-current mr-1"></span>
                {new Date(event.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      </div>,
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="h-6 w-6 text-cedo-blue" />
          <h2 className="text-xl font-semibold text-cedo-blue">
            {monthNames[currentMonth]} {currentYear}
          </h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 gap-0">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
            <div key={day} className="text-center font-medium py-3 bg-cedo-blue text-white">
              {day}
            </div>
          ))}
          {calendarDays}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mt-4">
        <div className="flex items-center text-xs">
          <span className="w-3 h-3 rounded-full bg-blue-100 mr-1"></span>
          <span>Academic</span>
        </div>
        <div className="flex items-center text-xs">
          <span className="w-3 h-3 rounded-full bg-purple-100 mr-1"></span>
          <span>Cultural</span>
        </div>
        <div className="flex items-center text-xs">
          <span className="w-3 h-3 rounded-full bg-green-100 mr-1"></span>
          <span>Community</span>
        </div>
        <div className="flex items-center text-xs">
          <span className="w-3 h-3 rounded-full bg-amber-100 mr-1"></span>
          <span>Leadership</span>
        </div>
        <div className="flex items-center text-xs">
          <span className="w-3 h-3 rounded-full bg-red-100 mr-1"></span>
          <span>Technology</span>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-cedo-blue">{selectedEvent.title}</DialogTitle>
                <div className="flex items-center gap-2">
                  <DialogDescription className="text-sm text-muted-foreground">
                    Event Category:
                  </DialogDescription>
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
                </div>
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
                  <div className="bg-cedo-blue/10 text-cedo-blue px-2 py-1 rounded-full text-sm">
                    {selectedEvent.attendees} Expected Attendees
                  </div>
                </div>

                <div className="flex justify-between pt-2">
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
