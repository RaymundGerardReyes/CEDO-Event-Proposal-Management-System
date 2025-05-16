"use client"

import { EventCalendar } from "@/components/event-calendar"
import { EventList } from "@/components/event-list"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMobile } from "@/hooks/use-mobile"
import { Calendar, Filter, List, Search } from "lucide-react"
import { useState } from "react"

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [viewMode, setViewMode] = useState("calendar")
  const { isMobile } = useMobile()

  return (
    <div className="flex-1 bg-[#f8f9fa] p-4 sm:p-6 md:p-8 w-full max-w-full mx-auto overflow-x-hidden">
      <PageHeader title="Event Tracking" subtitle="Monitor and manage upcoming and past events" />

      <Card className="cedo-card mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="cedo-header">Event Management</h2>
              <p className="cedo-subheader">Track events, attendance, and outcomes</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                onClick={() => setViewMode("calendar")}
                className={viewMode === "calendar" ? "bg-cedo-blue hover:bg-cedo-blue/90" : ""}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-cedo-blue hover:bg-cedo-blue/90" : ""}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cedo-card mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="w-full sm:w-auto grid grid-cols-3">
                <TabsTrigger value="upcoming" className="flex-1 sm:flex-initial">
                  Upcoming
                </TabsTrigger>
                <TabsTrigger value="past" className="flex-1 sm:flex-initial">
                  Past
                </TabsTrigger>
                <TabsTrigger value="all" className="flex-1 sm:flex-initial">
                  All Events
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
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
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className={isMobile ? "w-full" : "w-[130px]"}>
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
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="cedo-card">
        <CardContent className="p-6">
          <Tabs defaultValue="upcoming" className="space-y-4">
            <TabsContent value="upcoming" className="space-y-4 mt-0">
              {viewMode === "calendar" ? (
                <EventCalendar filter="upcoming" searchTerm={searchTerm} categoryFilter={categoryFilter} />
              ) : (
                <EventList filter="upcoming" searchTerm={searchTerm} categoryFilter={categoryFilter} />
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4 mt-0">
              {viewMode === "calendar" ? (
                <EventCalendar filter="past" searchTerm={searchTerm} categoryFilter={categoryFilter} />
              ) : (
                <EventList filter="past" searchTerm={searchTerm} categoryFilter={categoryFilter} />
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4 mt-0">
              {viewMode === "calendar" ? (
                <EventCalendar filter="all" searchTerm={searchTerm} categoryFilter={categoryFilter} />
              ) : (
                <EventList filter="all" searchTerm={searchTerm} categoryFilter={categoryFilter} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
