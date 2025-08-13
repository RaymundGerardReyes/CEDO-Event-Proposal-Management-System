// frontend/src/app/admin-dashboard/events/page.jsx

"use client"

import { EventCalendar } from "@/components/dashboard/admin/event-calendar"
import { EventList } from "@/components/dashboard/admin/event-list"
import { PageHeader } from "@/components/dashboard/admin/page-header"
import { Button } from "@/components/dashboard/admin/ui/button"
import { Card, CardContent } from "@/components/dashboard/admin/ui/card"
import { Input } from "@/components/dashboard/admin/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/admin/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/admin/ui/tabs"
import { useMobile } from "@/hooks/use-mobile"
import { Calendar, Filter, List, Search } from "lucide-react"
import { useState } from "react"

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [viewMode, setViewMode] = useState("calendar")
  const { isMobile } = useMobile()

  return (
    <div className="zoom-perfect-layout min-h-screen zoom-safe" style={{
      padding: `clamp(1rem, 3vw, 2.5rem)`,
      gap: `clamp(1rem, 2.5vw, 2rem)`,
      background: '#f8f9fa'
    }}>
      {/* Zoom-Perfect Page Header */}
      <div className="zoom-safe" style={{
        marginBottom: `clamp(1.5rem, 3vw, 2.5rem)`
      }}>
        <PageHeader
          title="Event Tracking"
          subtitle="Monitor and manage upcoming and past events"
          className="zoom-safe-text"
        />
      </div>

      {/* Zoom-Perfect Event Management Header Card */}
      <Card className="shadow-sm border-slate-200 bg-white/90 backdrop-blur-sm responsive-rounded zoom-safe">
        <CardContent style={{ padding: `clamp(1.25rem, 3vw, 1.5rem)` }}>
          <div className="responsive-flex-between gap-fluid">
            <div className="zoom-safe-text">
              <h2 style={{
                fontSize: `clamp(1.125rem, 2.5vw, 1.5rem)`,
                fontWeight: 600,
                lineHeight: 1.3,
                marginBottom: `clamp(0.25rem, 1vw, 0.5rem)`
              }} className="text-cedo-blue">Event Management</h2>
              <p style={{
                fontSize: `clamp(0.875rem, 1.8vw, 1rem)`,
                lineHeight: 1.5
              }} className="text-slate-600">Track events, attendance, and outcomes</p>
            </div>

            {/* Zoom-Responsive View Mode Buttons */}
            <div className="flex" style={{
              gap: `clamp(0.5rem, 1vw, 0.75rem)`
            }}>
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                onClick={() => setViewMode("calendar")}
                className={viewMode === "calendar" ? "bg-cedo-blue hover:bg-cedo-blue/90" : "border-slate-300 hover:border-slate-400"}
                style={{
                  fontSize: `clamp(0.875rem, 1.8vw, 1rem)`,
                  padding: `clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)`,
                  minHeight: `clamp(2.25rem, 4.5vw, 2.5rem)`
                }}
              >
                <Calendar style={{
                  width: `clamp(1rem, 2vw, 1.25rem)`,
                  height: `clamp(1rem, 2vw, 1.25rem)`,
                  marginRight: `clamp(0.5rem, 1vw, 0.75rem)`
                }} />
                <span className="zoom-safe-text">Calendar</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-cedo-blue hover:bg-cedo-blue/90" : "border-slate-300 hover:border-slate-400"}
                style={{
                  fontSize: `clamp(0.875rem, 1.8vw, 1rem)`,
                  padding: `clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)`,
                  minHeight: `clamp(2.25rem, 4.5vw, 2.5rem)`
                }}
              >
                <List style={{
                  width: `clamp(1rem, 2vw, 1.25rem)`,
                  height: `clamp(1rem, 2vw, 1.25rem)`,
                  marginRight: `clamp(0.5rem, 1vw, 0.75rem)`
                }} />
                <span className="zoom-safe-text">List</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zoom-Perfect Filter Controls Card */}
      <Card className="shadow-sm border-slate-200 bg-white/90 backdrop-blur-sm responsive-rounded zoom-safe">
        <CardContent style={{ padding: `clamp(1.25rem, 3vw, 1.5rem)` }}>
          <div className="space-y-4 zoom-safe">
            {/* Zoom-Perfect Tabs */}
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid grid-cols-3 zoom-safe" style={{
                gap: `clamp(0.25rem, 1vw, 0.5rem)`,
                padding: `clamp(0.25rem, 1vw, 0.5rem)`,
                borderRadius: `clamp(0.375rem, 1vw, 0.5rem)`
              }}>
                <TabsTrigger
                  value="upcoming"
                  className="zoom-safe-text"
                  style={{
                    fontSize: `clamp(0.875rem, 1.8vw, 1rem)`,
                    padding: `clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)`
                  }}
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger
                  value="past"
                  className="zoom-safe-text"
                  style={{
                    fontSize: `clamp(0.875rem, 1.8vw, 1rem)`,
                    padding: `clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)`
                  }}
                >
                  Past
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="zoom-safe-text"
                  style={{
                    fontSize: `clamp(0.875rem, 1.8vw, 1rem)`,
                    padding: `clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)`
                  }}
                >
                  All Events
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Zoom-Perfect Search and Filter Controls */}
            <div className="responsive-flex gap-fluid">
              <div className="relative flex-1 zoom-safe">
                <Search className="absolute text-slate-400" style={{
                  left: `clamp(0.75rem, 2vw, 1rem)`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: `clamp(1rem, 2vw, 1.25rem)`,
                  height: `clamp(1rem, 2vw, 1.25rem)`
                }} />
                <Input
                  type="search"
                  placeholder="Search events..."
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 zoom-safe-text"
                  style={{
                    paddingLeft: `clamp(2.5rem, 5vw, 3rem)`,
                    paddingRight: `clamp(1rem, 2vw, 1.25rem)`,
                    paddingTop: `clamp(0.75rem, 1.5vw, 1rem)`,
                    paddingBottom: `clamp(0.75rem, 1.5vw, 1rem)`,
                    fontSize: `clamp(0.875rem, 1.8vw, 1rem)`,
                    minWidth: `clamp(200px, 30vw, 320px)`
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Zoom-Perfect Filter Controls */}
              <div className="flex" style={{
                gap: `clamp(0.5rem, 1vw, 0.75rem)`
              }}>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="border-slate-300 zoom-safe-text" style={{
                    fontSize: `clamp(0.875rem, 1.8vw, 1rem)`,
                    padding: `clamp(0.75rem, 1.5vw, 1rem)`,
                    minWidth: isMobile ? '100%' : `clamp(130px, 20vw, 160px)`,
                    minHeight: `clamp(2.5rem, 5vw, 2.75rem)`
                  }}>
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
                  className="border-slate-300 hover:border-slate-400"
                  style={{
                    padding: `clamp(0.75rem, 1.5vw, 1rem)`,
                    minWidth: `clamp(2.5rem, 5vw, 2.75rem)`,
                    minHeight: `clamp(2.5rem, 5vw, 2.75rem)`
                  }}
                >
                  <Filter style={{
                    width: `clamp(1rem, 2vw, 1.25rem)`,
                    height: `clamp(1rem, 2vw, 1.25rem)`
                  }} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zoom-Perfect Main Content Card */}
      <Card className="shadow-sm border-slate-200 bg-white/90 backdrop-blur-sm responsive-rounded zoom-safe flex-1">
        <CardContent style={{
          padding: `clamp(1.25rem, 3vw, 1.5rem)`,
          minHeight: `clamp(400px, 50vh, 600px)`
        }}>
          <Tabs defaultValue="upcoming" className="h-full zoom-safe" style={{
            gap: `clamp(1rem, 2vw, 1.5rem)`
          }}>
            <TabsContent value="upcoming" className="mt-0 h-full zoom-safe">
              {viewMode === "calendar" ? (
                <div className="zoom-safe" style={{ minHeight: `clamp(350px, 45vh, 500px)` }}>
                  <EventCalendar
                    filter="upcoming"
                    searchTerm={searchTerm}
                    categoryFilter={categoryFilter}
                  />
                </div>
              ) : (
                <div className="zoom-safe" style={{ minHeight: `clamp(350px, 45vh, 500px)` }}>
                  <EventList
                    filter="upcoming"
                    searchTerm={searchTerm}
                    categoryFilter={categoryFilter}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-0 h-full zoom-safe">
              {viewMode === "calendar" ? (
                <div className="zoom-safe" style={{ minHeight: `clamp(350px, 45vh, 500px)` }}>
                  <EventCalendar
                    filter="past"
                    searchTerm={searchTerm}
                    categoryFilter={categoryFilter}
                  />
                </div>
              ) : (
                <div className="zoom-safe" style={{ minHeight: `clamp(350px, 45vh, 500px)` }}>
                  <EventList
                    filter="past"
                    searchTerm={searchTerm}
                    categoryFilter={categoryFilter}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-0 h-full zoom-safe">
              {viewMode === "calendar" ? (
                <div className="zoom-safe" style={{ minHeight: `clamp(350px, 45vh, 500px)` }}>
                  <EventCalendar
                    filter="all"
                    searchTerm={searchTerm}
                    categoryFilter={categoryFilter}
                  />
                </div>
              ) : (
                <div className="zoom-safe" style={{ minHeight: `clamp(350px, 45vh, 500px)` }}>
                  <EventList
                    filter="all"
                    searchTerm={searchTerm}
                    categoryFilter={categoryFilter}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}