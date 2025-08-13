// frontend/src/components/dashboard/student/event-list.jsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Calendar, Search, Users } from "lucide-react";
import { useEffect, useState } from "react"; // useEffect was imported but not used, kept it as it was in original

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
];

export function EventList({ filter = "all", initialSearchTerm = "", initialCategoryFilter = "all" }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [categoryFilter, setCategoryFilter] = useState(initialCategoryFilter);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile on mount and window resize
  useEffect(() => { // Changed useState to useEffect as it's for side effects
    const checkMobile = () => {
      const mobileCheck = window.innerWidth < 768;
      setIsMobile(mobileCheck);
      // Default to card view on mobile
      if (mobileCheck) {
        setViewMode("card");
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Filter events based on props
  const filteredEvents = events.filter((event) => {
    const matchesFilter = filter === "all" || event.status === filter;
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || event.category === categoryFilter;

    return matchesFilter && matchesSearch && matchesCategory;
  });

  // Sort events by date (most recent first)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  // Get unique categories for filter
  const categories = ["all", ...new Set(events.map((event) => event.category))];

  return (
    <div className="space-y-4">
      {/* Search and filter controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden md:flex gap-1">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
              className="h-9 w-9"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("card")}
              className="h-9 w-9"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Table view for desktop */}
      {viewMode === "table" && !isMobile && ( // Added !isMobile condition for table view
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
      )}

      {/* Card view */}
      {viewMode === "card" && ( // Removed isMobile condition to allow card view on desktop too
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedEvents.length > 0 ? (
            sortedEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <Badge
                    className={cn(
                      "absolute top-2 right-2",
                      event.category === "academic"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        : event.category === "cultural"
                          ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                          : event.category === "community"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : event.category === "leadership"
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              : "bg-red-100 text-red-800 hover:bg-red-100",
                    )}
                  >
                    {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>{new Date(event.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{event.attendees} Attendees</span>
                    </div>
                    <p className="line-clamp-2 text-sm">{event.description}</p>
                    <div className="flex items-center pt-2">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={event.organizer.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs bg-cedo-blue text-white">
                          {event.organizer.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{event.organizer.name}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" onClick={() => handleViewDetails(event)}>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium">No events found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      )}

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
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-cedo-blue" />
                    <span className="text-sm">{selectedEvent.attendees} Expected Attendees</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-2">
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
  );
}