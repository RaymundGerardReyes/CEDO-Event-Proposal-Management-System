<<<<<<< HEAD
=======
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter, List, Search, PlusCircle } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [viewMode, setViewMode] = useState("list")

  // Sample events data
  const events = [
    {
      id: "EVENT-001",
      title: "Leadership Workshop",
      date: "2023-05-15",
      venue: "Main Auditorium",
      type: "leadership",
      status: "approved",
      credits: 5,
      description: "A workshop focused on developing leadership skills among students.",
    },
    {
      id: "EVENT-002",
      title: "Community Service Day",
      date: "2023-05-10",
      venue: "City Park",
      type: "volunteerism",
      status: "pending",
      credits: 10,
      description: "A day dedicated to community service activities in the local area.",
    },
    {
      id: "EVENT-003",
      title: "Academic Seminar",
      date: "2023-05-05",
      venue: "Conference Room A",
      type: "academic",
      status: "approved",
      credits: 5,
      description: "A seminar on recent academic developments in various fields.",
    },
    {
      id: "EVENT-004",
      title: "Research Symposium",
      date: "2023-04-28",
      venue: "Science Building",
      type: "academic",
      status: "rejected",
      credits: 0,
      description: "A symposium showcasing student research projects.",
    },
    {
      id: "EVENT-005",
      title: "Cultural Festival",
      date: "2023-06-10",
      venue: "University Quad",
      type: "cultural",
      status: "draft",
      credits: 0,
      description: "A festival celebrating cultural diversity with performances and exhibits.",
    },
  ]

  // Filter events based on search and category
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || event.type === categoryFilter

    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader title="My Events" subtitle="Manage your SDP event submissions" />

      <Card className="sdp-card mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="sdp-header">Event Management</h2>
              <p className="sdp-subheader">Track your submitted events and their status</p>
            </div>
            <div className="flex gap-2">
              <Link href="/submit-event">
                <Button className="bg-[#0c2d6b] hover:bg-[#0c2d6b]/90">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Submit New Event
                </Button>
              </Link>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-[#0c2d6b] hover:bg-[#0c2d6b]/90" : ""}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                onClick={() => setViewMode("calendar")}
                className={viewMode === "calendar" ? "bg-[#0c2d6b] hover:bg-[#0c2d6b]/90" : ""}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="sdp-card mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="all" className="flex-1 sm:flex-initial">
                  All Events
                </TabsTrigger>
                <TabsTrigger value="approved" className="flex-1 sm:flex-initial">
                  Approved
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex-1 sm:flex-initial">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="draft" className="flex-1 sm:flex-initial">
                  Drafts
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex w-full sm:w-auto gap-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search events..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="leadership">Leadership</SelectItem>
                  <SelectItem value="volunteerism">Volunteerism</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="sdp-card">
        <CardContent className="p-6">
          <Tabs defaultValue="all" className="space-y-4">
            <TabsContent value="all" className="space-y-4 mt-0">
              {viewMode === "list" ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-xs text-muted-foreground">
                        <th className="text-left font-medium py-2 px-2">Event Title</th>
                        <th className="text-left font-medium py-2 px-2">Type</th>
                        <th className="text-left font-medium py-2 px-2">Date</th>
                        <th className="text-left font-medium py-2 px-2">Venue</th>
                        <th className="text-left font-medium py-2 px-2">Status</th>
                        <th className="text-left font-medium py-2 px-2">Credits</th>
                        <th className="text-right font-medium py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => (
                        <tr key={event.id} className="border-b">
                          <td className="py-3 px-2">
                            <div className="border border-[#0c2d6b] text-[#0c2d6b] px-3 py-1.5 rounded-md text-sm font-medium">
                              {event.title}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge
                              className={
                                event.type === "academic"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  : event.type === "leadership"
                                    ? "bg-[#f0c14b]/20 text-[#0c2d6b] hover:bg-[#f0c14b]/20"
                                    : event.type === "volunteerism"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                              }
                            >
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-sm">{new Date(event.date).toLocaleDateString()}</div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-sm">{event.venue}</div>
                          </td>
                          <td className="py-3 px-2">
                            <Badge
                              className={
                                event.status === "approved"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                                  : event.status === "pending"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                                    : event.status === "rejected"
                                      ? "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
                              }
                            >
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-sm font-medium">{event.credits}</div>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button variant="ghost" size="sm" className="text-[#0c2d6b] hover:text-[#0c2d6b]/70">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEvents.map((event) => (
                    <Card key={event.id} className="overflow-hidden">
                      <div
                        className={`h-2 ${
                          event.status === "approved"
                            ? "bg-green-500"
                            : event.status === "pending"
                              ? "bg-amber-500"
                              : event.status === "rejected"
                                ? "bg-red-500"
                                : "bg-gray-500"
                        }`}
                      />
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-[#0c2d6b]">{event.title}</h3>
                          <Badge
                            className={
                              event.type === "academic"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : event.type === "leadership"
                                  ? "bg-[#f0c14b]/20 text-[#0c2d6b] hover:bg-[#f0c14b]/20"
                                  : event.type === "volunteerism"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                            }
                          >
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                          <div>Date: {new Date(event.date).toLocaleDateString()}</div>
                          <div>Venue: {event.venue}</div>
                          <div>Credits: {event.credits}</div>
                          <div>
                            Status:
                            <Badge
                              className={`ml-2 ${
                                event.status === "approved"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                                  : event.status === "pending"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                                    : event.status === "rejected"
                                      ? "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
                              }`}
                            >
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                        <Button variant="outline" size="sm" className="w-full text-[#0c2d6b]">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Other tabs content omitted for brevity */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
>>>>>>> f1ac8f1 (Add client admin dashboard and iniital student dashboard)
