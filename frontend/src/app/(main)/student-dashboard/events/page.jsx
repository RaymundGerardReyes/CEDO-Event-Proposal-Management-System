// frontend/src/app/(main)/student-dashboard/events/page.jsx

"use client"

import { PageHeader } from "@/components/dashboard/student/page-header";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent } from "@/components/dashboard/student/ui/card";
import { Input } from "@/components/dashboard/student/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/student/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar, Filter, List, Search } from "lucide-react";
import { lazy, Suspense, useState } from "react";

// ✅ Lazy load heavy components for better performance
const EventCalendar = lazy(() => import("@/components/dashboard/student/event-calendar").then(module => ({ default: module.EventCalendar })));
const EventList = lazy(() => import("@/components/dashboard/student/event-list").then(module => ({ default: module.EventList })));

// Enhanced loading fallback with better responsive design
const EventsLoadingFallback = () => (
  <div className="flex-1 bg-[#f8f9fa] p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-full mx-auto">
    <div className="animate-pulse space-y-4 sm:space-y-6">
      <div className="h-6 sm:h-8 w-48 sm:w-64 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 sm:h-4 w-64 sm:w-96 bg-gray-200 rounded mb-4 sm:mb-6"></div>
      <div className="h-24 sm:h-32 w-full bg-gray-100 rounded"></div>
      <div className="h-48 sm:h-64 w-full bg-gray-100 rounded"></div>
    </div>
  </div>
);

// ✅ Enhanced Memoized content component with better responsive design
const EventsContent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("calendar");
  const isMobile = useIsMobile();

  return (
    <div className="flex-1 bg-[#f8f9fa] p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-full mx-auto overflow-x-hidden">
      <PageHeader title="Event Tracking" subtitle="Monitor and manage upcoming and past events" />

      {/* Enhanced Event Management Card */}
      <Card className="cedo-card mb-4 sm:mb-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0 lg:items-center">
            <div className="space-y-1 sm:space-y-2">
              <h2 className="cedo-header text-lg sm:text-xl lg:text-2xl font-bold">Event Management</h2>
              <p className="cedo-subheader text-sm sm:text-base text-muted-foreground">Track events, attendance, and outcomes</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                onClick={() => setViewMode("calendar")}
                className={`min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 text-xs sm:text-sm transition-all duration-200 ${viewMode === "calendar" ? "bg-cedo-blue hover:bg-cedo-blue/90" : ""
                  }`}
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">Calendar</span>
                <span className="xs:hidden">Cal</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                className={`min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 text-xs sm:text-sm transition-all duration-200 ${viewMode === "list" ? "bg-cedo-blue hover:bg-cedo-blue/90" : ""
                  }`}
              >
                <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden xs:inline">List</span>
                <span className="xs:hidden">List</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Filter and Search Card */}
      <Card className="cedo-card mb-4 sm:mb-6 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
            {/* Enhanced Tabs */}
            <Tabs defaultValue="upcoming" className="w-full sm:w-auto">
              <TabsList className="w-full sm:w-auto grid grid-cols-3 h-auto p-1 sm:h-10">
                <TabsTrigger
                  value="upcoming"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px]"
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger
                  value="past"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px]"
                >
                  Past
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px]"
                >
                  All Events
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
                  <SelectTrigger className={`${isMobile ? "w-full" : "w-[110px] sm:w-[130px]"} h-9 sm:h-10 text-xs sm:text-sm`}>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
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
      <Card className="cedo-card shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsContent value="upcoming" className="space-y-4 mt-0">
              <Suspense fallback={<EventsLoadingFallback />}>
                {viewMode === "calendar" ? (
                  <EventCalendar filter="upcoming" searchTerm={searchTerm} categoryFilter={categoryFilter} />
                ) : (
                  <EventList filter="upcoming" searchTerm={searchTerm} categoryFilter={categoryFilter} />
                )}
              </Suspense>
            </TabsContent>

            <TabsContent value="past" className="space-y-4 mt-0">
              <Suspense fallback={<EventsLoadingFallback />}>
                {viewMode === "calendar" ? (
                  <EventCalendar filter="past" searchTerm={searchTerm} categoryFilter={categoryFilter} />
                ) : (
                  <EventList filter="past" searchTerm={searchTerm} categoryFilter={categoryFilter} />
                )}
              </Suspense>
            </TabsContent>

            <TabsContent value="all" className="space-y-4 mt-0">
              <Suspense fallback={<EventsLoadingFallback />}>
                {viewMode === "calendar" ? (
                  <EventCalendar filter="all" searchTerm={searchTerm} categoryFilter={categoryFilter} />
                ) : (
                  <EventList filter="all" searchTerm={searchTerm} categoryFilter={categoryFilter} />
                )}
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Main export with optimized Suspense wrapper
export default function EventsPage() {
  return (
    <Suspense fallback={<EventsLoadingFallback />}>
      <EventsContent />
    </Suspense>
  );
}