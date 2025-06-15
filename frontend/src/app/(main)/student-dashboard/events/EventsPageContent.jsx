// frontend/src/app/(main)/student-dashboard/events/EventsPageContent.jsx

"use client";

import { PageHeader } from "@/components/dashboard/student/page-header";
import { Badge } from "@/components/dashboard/student/ui/badge";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent } from "@/components/dashboard/student/ui/card";
import { Input } from "@/components/dashboard/student/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/student/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs";
import { Calendar, Filter, List, PlusCircle, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function EventsPageContent() {
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [viewMode, setViewMode] = useState("list");

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
    ];

    // Filter events based on search and category
    const filteredEvents = events.filter((event) => {
        const matchesSearch =
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === "all" || event.type === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    // Enhanced Mobile Card Component for Events
    const EventCard = ({ event }) => (
        <Card className="w-full mb-3 sm:mb-4 shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-[#0c2d6b]">
            <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col space-y-3">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base text-[#0c2d6b] truncate">{event.title}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                        </div>
                        <div className="flex flex-row sm:flex-col gap-2 sm:gap-1 sm:items-end">
                            <Badge
                                className={`text-xs px-2 py-1 ${event.status === "approved"
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
                            <Badge
                                className={`text-xs px-2 py-1 ${event.type === "academic"
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                    : event.type === "leadership"
                                        ? "bg-[#f0c14b]/20 text-[#0c2d6b] hover:bg-[#f0c14b]/20"
                                        : event.type === "volunteerism"
                                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                                            : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                                    }`}
                            >
                                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </Badge>
                        </div>
                    </div>

                    {/* Details Row */}
                    <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center space-y-2 xs:space-y-0 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex flex-col xs:flex-row xs:gap-4 space-y-1 xs:space-y-0">
                            <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                            <span>📍 {event.venue}</span>
                        </div>
                        <div className="flex justify-between xs:justify-end items-center gap-3">
                            <span className="font-medium text-[#0c2d6b]">{event.credits} credits</span>
                            <Button variant="ghost" size="sm" className="text-[#0c2d6b] hover:text-[#0c2d6b]/70 h-8 px-3 text-xs">
                                View
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="flex-1 bg-[#f8f9fa] p-3 sm:p-4 md:p-6 lg:p-8">
            <PageHeader title="My Events" subtitle="Manage your SDP event submissions" />

            {/* Enhanced Event Management Card */}
            <Card className="sdp-card mb-4 sm:mb-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 lg:items-center">
                        <div className="space-y-1 sm:space-y-2">
                            <h2 className="sdp-header text-lg sm:text-xl lg:text-2xl font-bold">Event Management</h2>
                            <p className="sdp-subheader text-sm sm:text-base text-muted-foreground">Track your submitted events and their status</p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            <Link href="/student-dashboard/submit-event">
                                <Button className="bg-[#0c2d6b] hover:bg-[#0c2d6b]/90 min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 text-xs sm:text-sm transition-all duration-200">
                                    <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                    <span className="hidden xs:inline">Submit New Event</span>
                                    <span className="xs:hidden">Submit</span>
                                </Button>
                            </Link>
                            <Button
                                variant={viewMode === "list" ? "default" : "outline"}
                                onClick={() => setViewMode("list")}
                                className={`min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 text-xs sm:text-sm transition-all duration-200 ${viewMode === "list" ? "bg-[#0c2d6b] hover:bg-[#0c2d6b]/90" : ""
                                    }`}
                            >
                                <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                <span className="hidden xs:inline">List</span>
                                <span className="xs:hidden">List</span>
                            </Button>
                            <Button
                                variant={viewMode === "calendar" ? "default" : "outline"}
                                onClick={() => setViewMode("calendar")}
                                className={`min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 text-xs sm:text-sm transition-all duration-200 ${viewMode === "calendar" ? "bg-[#0c2d6b] hover:bg-[#0c2d6b]/90" : ""
                                    }`}
                            >
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                <span className="hidden xs:inline">Calendar</span>
                                <span className="xs:hidden">Cal</span>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Enhanced Filter and Tabs Card */}
            <Card className="sdp-card mb-4 sm:mb-6 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
                        {/* Enhanced Tabs */}
                        <Tabs defaultValue="all" className="w-full sm:w-auto">
                            <TabsList className="w-full sm:w-auto grid grid-cols-4 h-auto p-1 sm:h-10">
                                <TabsTrigger
                                    value="all"
                                    className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px]"
                                >
                                    All
                                </TabsTrigger>
                                <TabsTrigger
                                    value="approved"
                                    className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px]"
                                >
                                    Approved
                                </TabsTrigger>
                                <TabsTrigger
                                    value="pending"
                                    className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px]"
                                >
                                    Pending
                                </TabsTrigger>
                                <TabsTrigger
                                    value="draft"
                                    className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px]"
                                >
                                    Drafts
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Enhanced Search and Filter Controls */}
                        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 w-full sm:w-auto gap-2">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search events..."
                                    className="pl-8 sm:pl-9 w-full sm:w-[200px] md:w-[250px] h-9 sm:h-10 text-xs sm:text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="w-full sm:w-[110px] md:w-[130px] h-9 sm:h-10 text-xs sm:text-sm">
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
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                                >
                                    <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Enhanced Events Display Card */}
            <Card className="sdp-card shadow-sm">
                <CardContent className="p-4 sm:p-6">
                    <Tabs defaultValue="all" className="space-y-4">
                        <TabsContent value="all" className="space-y-4 mt-0">
                            {viewMode === "list" ? (
                                <>
                                    {/* Mobile Card View (Hidden on md+) */}
                                    <div className="block md:hidden">
                                        {filteredEvents.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <p className="text-sm">No events found matching your criteria.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {filteredEvents.map((event) => (
                                                    <EventCard key={event.id} event={event} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Desktop Table View (Hidden on sm and below) */}
                                    <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr className="border-b text-xs lg:text-sm text-muted-foreground">
                                                    <th className="text-left font-medium py-3 px-3 lg:px-4">Event Title</th>
                                                    <th className="text-left font-medium py-3 px-3 lg:px-4">Type</th>
                                                    <th className="text-left font-medium py-3 px-3 lg:px-4">Date</th>
                                                    <th className="text-left font-medium py-3 px-3 lg:px-4">Venue</th>
                                                    <th className="text-left font-medium py-3 px-3 lg:px-4">Status</th>
                                                    <th className="text-left font-medium py-3 px-3 lg:px-4">Credits</th>
                                                    <th className="text-right font-medium py-3 px-3 lg:px-4">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {filteredEvents.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="7" className="py-8 text-center text-muted-foreground">
                                                            <p className="text-sm">No events found matching your criteria.</p>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredEvents.map((event) => (
                                                        <tr key={event.id} className="border-b hover:bg-gray-50 transition-colors">
                                                            <td className="py-3 px-3 lg:px-4">
                                                                <div className="border border-[#0c2d6b] text-[#0c2d6b] px-3 py-1.5 rounded-md text-xs lg:text-sm font-medium inline-block">
                                                                    {event.title}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3 lg:px-4">
                                                                <Badge
                                                                    className={`text-xs ${event.type === "academic"
                                                                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                                                        : event.type === "leadership"
                                                                            ? "bg-[#f0c14b]/20 text-[#0c2d6b] hover:bg-[#f0c14b]/20"
                                                                            : event.type === "volunteerism"
                                                                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                                                : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                                                                        }`}
                                                                >
                                                                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-3 px-3 lg:px-4">
                                                                <div className="text-xs lg:text-sm">{new Date(event.date).toLocaleDateString()}</div>
                                                            </td>
                                                            <td className="py-3 px-3 lg:px-4">
                                                                <div className="text-xs lg:text-sm truncate max-w-[120px]">{event.venue}</div>
                                                            </td>
                                                            <td className="py-3 px-3 lg:px-4">
                                                                <Badge
                                                                    className={`text-xs ${event.status === "approved"
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
                                                            </td>
                                                            <td className="py-3 px-3 lg:px-4">
                                                                <div className="text-xs lg:text-sm font-medium">{event.credits}</div>
                                                            </td>
                                                            <td className="py-3 px-3 lg:px-4 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-[#0c2d6b] hover:text-[#0c2d6b]/70 h-8 px-3 text-xs lg:text-sm"
                                                                >
                                                                    View
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-32 text-muted-foreground">
                                    <div className="text-center">
                                        <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm">Calendar view coming soon...</p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
