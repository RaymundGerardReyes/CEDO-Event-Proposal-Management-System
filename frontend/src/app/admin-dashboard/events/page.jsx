// frontend/src/app/admin-dashboard/events/page.jsx

"use client"

import { EventDetailsModal } from "@/components/dashboard/admin/event-details-modal"
import { EventsCalendar } from "@/components/dashboard/admin/events-calendar"
import { Button } from "@/components/dashboard/admin/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card"
import { Input } from "@/components/dashboard/admin/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/admin/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/admin/ui/tabs"
import { useMobile } from "@/hooks/use-mobile"
import { Calendar, CalendarDays, Calendar as CalendarIcon, Clock, Filter, List, MapPin, RefreshCw, Search, Tag, User, Users } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [viewMode, setViewMode] = useState("calendar")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { isMobile } = useMobile()

  // Memoized event handlers
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleCategoryChange = useCallback((value) => {
    setCategoryFilter(value)
  }, [])

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode)
  }, [])

  const handleTabChange = useCallback((value) => {
    setActiveTab(value)
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }, [])

  const handleEventSelect = useCallback((event) => {
    setSelectedEvent(event.resource)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }, [])

  // Memoized filter options
  const categoryOptions = useMemo(() => [
    { value: "all", label: "All Categories" },
    { value: "academic", label: "Academic" },
    { value: "cultural", label: "Cultural" },
    { value: "community", label: "Community" },
    { value: "leadership", label: "Leadership" },
    { value: "technology", label: "Technology" }
  ], [])

  // Static dummy data for events
  const dummyEvents = useMemo(() => {
    const now = new Date()
    const upcomingEvents = [
      {
        id: 1,
        title: "Annual Leadership Summit 2024",
        description: "Join us for the premier leadership development conference featuring industry experts and networking opportunities.",
        category: "leadership",
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        time: "09:00 AM - 05:00 PM",
        location: "CEDO Conference Center",
        attendees: 150,
        maxAttendees: 200,
        status: "upcoming",
        organizer: "CEDO Leadership Team",
        image: "/api/placeholder/400/200",
        tags: ["leadership", "networking", "development"]
      },
      {
        id: 2,
        title: "Technology Innovation Workshop",
        description: "Explore the latest trends in technology and innovation with hands-on workshops and expert presentations.",
        category: "technology",
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        time: "10:00 AM - 04:00 PM",
        location: "Tech Lab Building",
        attendees: 75,
        maxAttendees: 100,
        status: "upcoming",
        organizer: "CEDO Tech Department",
        image: "/api/placeholder/400/200",
        tags: ["technology", "innovation", "workshop"]
      },
      {
        id: 3,
        title: "Cultural Heritage Festival",
        description: "Celebrate our diverse cultural heritage with performances, food, and traditional activities.",
        category: "cultural",
        date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        time: "11:00 AM - 08:00 PM",
        location: "Main Campus Grounds",
        attendees: 300,
        maxAttendees: 500,
        status: "upcoming",
        organizer: "Cultural Affairs Committee",
        image: "/api/placeholder/400/200",
        tags: ["cultural", "festival", "community"]
      },
      {
        id: 4,
        title: "Academic Excellence Symposium",
        description: "Showcase of academic achievements and research presentations from students and faculty.",
        category: "academic",
        date: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        time: "08:30 AM - 06:00 PM",
        location: "Academic Hall",
        attendees: 120,
        maxAttendees: 150,
        status: "upcoming",
        organizer: "Academic Affairs",
        image: "/api/placeholder/400/200",
        tags: ["academic", "research", "presentation"]
      },
      {
        id: 5,
        title: "Community Service Day",
        description: "Join us for a day of community service and volunteer activities to make a positive impact.",
        category: "community",
        date: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
        time: "08:00 AM - 05:00 PM",
        location: "Various Locations",
        attendees: 200,
        maxAttendees: 300,
        status: "upcoming",
        organizer: "Community Outreach",
        image: "/api/placeholder/400/200",
        tags: ["community", "volunteer", "service"]
      },
      {
        id: 6,
        title: "Digital Transformation Conference",
        description: "Learn about digital transformation strategies and implementation best practices.",
        category: "technology",
        date: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000), // 42 days from now
        time: "09:30 AM - 05:30 PM",
        location: "Digital Innovation Center",
        attendees: 90,
        maxAttendees: 120,
        status: "upcoming",
        organizer: "Digital Strategy Team",
        image: "/api/placeholder/400/200",
        tags: ["digital", "transformation", "strategy"]
      }
    ]

    const pastEvents = [
      {
        id: 7,
        title: "Spring Leadership Retreat",
        description: "Annual leadership retreat focusing on team building and strategic planning.",
        category: "leadership",
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        time: "09:00 AM - 05:00 PM",
        location: "Mountain Resort",
        attendees: 45,
        maxAttendees: 50,
        status: "completed",
        organizer: "Executive Team",
        image: "/api/placeholder/400/200",
        tags: ["leadership", "retreat", "planning"],
        feedback: "Excellent event with great team building activities"
      },
      {
        id: 8,
        title: "Research Methodology Workshop",
        description: "Comprehensive workshop on research methodologies and data analysis techniques.",
        category: "academic",
        date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        time: "10:00 AM - 04:00 PM",
        location: "Research Center",
        attendees: 60,
        maxAttendees: 80,
        status: "completed",
        organizer: "Research Department",
        image: "/api/placeholder/400/200",
        tags: ["research", "methodology", "workshop"],
        feedback: "Very informative and well-structured"
      },
      {
        id: 9,
        title: "Cultural Diversity Celebration",
        description: "Celebration of cultural diversity with performances and traditional cuisine.",
        category: "cultural",
        date: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        time: "12:00 PM - 09:00 PM",
        location: "Cultural Center",
        attendees: 180,
        maxAttendees: 250,
        status: "completed",
        organizer: "Cultural Committee",
        image: "/api/placeholder/400/200",
        tags: ["cultural", "diversity", "celebration"],
        feedback: "Amazing performances and delicious food"
      },
      {
        id: 10,
        title: "Community Health Fair",
        description: "Free health screenings and wellness information for the community.",
        category: "community",
        date: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000), // 28 days ago
        time: "09:00 AM - 03:00 PM",
        location: "Community Center",
        attendees: 250,
        maxAttendees: 300,
        status: "completed",
        organizer: "Health Services",
        image: "/api/placeholder/400/200",
        tags: ["health", "community", "wellness"],
        feedback: "Great turnout and valuable health information"
      },
      {
        id: 11,
        title: "AI and Machine Learning Seminar",
        description: "Introduction to artificial intelligence and machine learning applications.",
        category: "technology",
        date: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
        time: "02:00 PM - 06:00 PM",
        location: "Computer Lab",
        attendees: 85,
        maxAttendees: 100,
        status: "completed",
        organizer: "Computer Science Department",
        image: "/api/placeholder/400/200",
        tags: ["AI", "machine learning", "technology"],
        feedback: "Excellent introduction to AI concepts"
      },
      {
        id: 12,
        title: "Student Leadership Conference",
        description: "Conference for student leaders to develop leadership skills and network.",
        category: "leadership",
        date: new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000), // 42 days ago
        time: "08:30 AM - 06:30 PM",
        location: "Student Union",
        attendees: 120,
        maxAttendees: 150,
        status: "completed",
        organizer: "Student Affairs",
        image: "/api/placeholder/400/200",
        tags: ["student", "leadership", "conference"],
        feedback: "Inspiring and educational experience"
      }
    ]

    return {
      upcoming: upcomingEvents,
      past: pastEvents,
      all: [...upcomingEvents, ...pastEvents]
    }
  }, [])

  // Filter events based on current tab and filters
  const filteredEvents = useMemo(() => {
    let events = dummyEvents[activeTab] || []

    // Apply search filter
    if (searchTerm) {
      events = events.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      events = events.filter(event => event.category === categoryFilter)
    }

    return events
  }, [dummyEvents, activeTab, searchTerm, categoryFilter])

  // Update quick stats based on filtered data
  const quickStats = useMemo(() => {
    const upcoming = dummyEvents.upcoming.length
    const thisWeek = dummyEvents.upcoming.filter(event => {
      const eventDate = new Date(event.date)
      const now = new Date()
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return eventDate <= weekFromNow
    }).length
    const total = dummyEvents.all.length

    return { upcoming, thisWeek, total }
  }, [dummyEvents])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 -m-4 sm:-m-6 md:-m-8 lg:-m-10">
      {/* Enhanced Page Header with responsive spacing */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-cedo-blue">Event Management</h1>
              <p className="mt-2 text-sm sm:text-base lg:text-lg text-gray-600">
                Monitor and manage upcoming and past events across the organization
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-cedo-blue/30 text-cedo-blue hover:bg-cedo-blue hover:text-white"
                title="Refresh events data"
              >
                <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
          {isRefreshing && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Refreshing events data...
            </div>
          )}
        </div>
      </div>

      {/* Main content with enhanced responsive grid layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8">
          {/* Left column - View controls and filters */}
          <div className="xl:col-span-1 space-y-6">
            {/* View Mode Controls */}
            <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 border-b border-gray-200/60">
                <CardTitle className="text-lg sm:text-xl font-bold text-cedo-blue flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cedo-blue/10">
                    <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                  </div>
                  View Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={viewMode === "calendar" ? "default" : "outline"}
                    onClick={() => handleViewModeChange("calendar")}
                    className={`h-12 sm:h-14 text-sm sm:text-base rounded-xl transition-all duration-300 ${viewMode === "calendar"
                      ? "bg-cedo-blue hover:bg-cedo-blue/90 text-white"
                      : "border-gray-300 text-gray-600 hover:border-cedo-blue hover:text-cedo-blue"
                      }`}
                  >
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Calendar
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    onClick={() => handleViewModeChange("list")}
                    className={`h-12 sm:h-14 text-sm sm:text-base rounded-xl transition-all duration-300 ${viewMode === "list"
                      ? "bg-cedo-blue hover:bg-cedo-blue/90 text-white"
                      : "border-gray-300 text-gray-600 hover:border-cedo-blue hover:text-cedo-blue"
                      }`}
                  >
                    <List className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    List
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-gradient-to-br from-cedo-blue/5 to-cedo-blue/10 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-bold text-cedo-blue flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cedo-blue/10">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                  </div>
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-gray-200/60">
                    <div className="text-2xl sm:text-3xl font-bold text-cedo-blue">{quickStats.upcoming}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Upcoming</div>
                  </div>
                  <div className="text-center p-4 bg-white/60 rounded-lg border border-gray-200/60">
                    <div className="text-2xl sm:text-3xl font-bold text-cedo-blue">{quickStats.thisWeek}</div>
                    <div className="text-xs sm:text-sm text-gray-600">This Week</div>
                  </div>
                </div>
                <div className="text-center p-4 bg-white/60 rounded-lg border border-gray-200/60">
                  <div className="text-2xl sm:text-3xl font-bold text-cedo-blue">{quickStats.total}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Events</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Main content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Enhanced Filter Controls */}
            <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 border-b border-gray-200/60">
                <CardTitle className="text-lg sm:text-xl font-bold text-cedo-blue flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cedo-blue/10">
                    <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                  </div>
                  Filter & Search
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  {/* Enhanced Tabs */}
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm border border-gray-200/60 shadow-sm rounded-xl h-auto">
                      <TabsTrigger
                        value="upcoming"
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Upcoming</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="past"
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">Past</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="all"
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                      >
                        <List className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden sm:inline">All Events</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  {/* Search and Filter Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Search bar */}
                    <div className="sm:col-span-2 lg:col-span-2">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        <Input
                          type="search"
                          placeholder="Search events..."
                          className="pl-12 pr-4 h-12 sm:h-14 text-sm sm:text-base border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue/20 rounded-xl"
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />
                      </div>
                    </div>

                    {/* Category filter */}
                    <div className="sm:col-span-1 lg:col-span-1">
                      <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="h-12 sm:h-14 text-sm sm:text-base border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue/20 rounded-xl">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Events Display */}
            <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
              <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 border-b border-gray-200/60">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-cedo-blue mb-3 flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-xl bg-cedo-blue/10">
                    <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-cedo-blue" />
                  </div>
                  <div>
                    <span>Events Display</span>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-normal">
                      {viewMode === "calendar" ? "Calendar view of events" : "List view of events"}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full">
                  <TabsContent value="upcoming" className="mt-0 h-full">
                    <div className="min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
                      {viewMode === "calendar" ? (
                        <EventsCalendar
                          events={filteredEvents}
                          onEventSelect={handleEventSelect}
                        />
                      ) : (
                        <div className="space-y-4">
                          {filteredEvents.map((event) => (
                            <div key={event.id} className="border border-gray-200/60 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{event.title}</h3>
                                    <span className={`px-3 py-1 text-xs rounded-full ${event.category === 'leadership' ? 'bg-blue-100 text-blue-800' :
                                      event.category === 'technology' ? 'bg-purple-100 text-purple-800' :
                                        event.category === 'cultural' ? 'bg-green-100 text-green-800' :
                                          event.category === 'academic' ? 'bg-orange-100 text-orange-800' :
                                            'bg-gray-100 text-gray-800'
                                      }`}>
                                      {event.category}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">{event.description}</p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="h-4 w-4" />
                                      <span>{event.date.toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      <span>{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      <span>{event.attendees}/{event.maxAttendees}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                                    <User className="h-4 w-4" />
                                    <span>Organized by {event.organizer}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="past" className="mt-0 h-full">
                    <div className="min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
                      {viewMode === "calendar" ? (
                        <EventsCalendar
                          events={filteredEvents}
                          onEventSelect={handleEventSelect}
                        />
                      ) : (
                        <div className="space-y-4">
                          {filteredEvents.map((event) => (
                            <div key={event.id} className="border border-gray-200/60 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 p-4 sm:p-6 opacity-75">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{event.title}</h3>
                                    <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800">Completed</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">{event.description}</p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="h-4 w-4" />
                                      <span>{event.date.toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      <span>{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      <span>{event.attendees} attended</span>
                                    </div>
                                  </div>

                                  {event.feedback && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200/60">
                                      <div className="flex items-start gap-2 text-sm text-gray-600">
                                        <Tag className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span className="italic">"{event.feedback}"</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="all" className="mt-0 h-full">
                    <div className="min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
                      {viewMode === "calendar" ? (
                        <EventsCalendar
                          events={filteredEvents}
                          onEventSelect={handleEventSelect}
                        />
                      ) : (
                        <div className="space-y-4">
                          {filteredEvents.map((event) => (
                            <div key={event.id} className={`border border-gray-200/60 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 p-4 sm:p-6 ${event.status === 'completed' ? 'opacity-75' : ''
                              }`}>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{event.title}</h3>
                                    <span className={`px-3 py-1 text-xs rounded-full ${event.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                      {event.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">{event.description}</p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                      <CalendarIcon className="h-4 w-4" />
                                      <span>{event.date.toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      <span>{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      <span>{event.status === 'completed' ? `${event.attendees} attended` : `${event.attendees}/${event.maxAttendees}`}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                                    <User className="h-4 w-4" />
                                    <span>Organized by {event.organizer}</span>
                                  </div>

                                  {event.feedback && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200/60">
                                      <div className="flex items-start gap-2 text-sm text-gray-600">
                                        <Tag className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span className="italic">"{event.feedback}"</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  )
}