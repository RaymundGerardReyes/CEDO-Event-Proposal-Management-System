"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, Filter, MapPin, Search } from "lucide-react"
import { formatDate } from "@/lib/utils"

export function EventList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  // In a real app, this data would come from an API
  const events = [
    {
      id: "EVENT-1001",
      title: "HIV Awareness Campaign Kickoff",
      date: "2023-06-15",
      time: "9:00 AM - 12:00 PM",
      location: "XU Medical Center Auditorium",
      type: "campaign",
      organizer: "XU Medical Center",
    },
    {
      id: "EVENT-1002",
      title: "Tech Skills Workshop - Day 1",
      date: "2023-06-20",
      time: "1:00 PM - 5:00 PM",
      location: "Lourdes College Computer Lab",
      type: "workshop",
      organizer: "Lourdes College",
    },
    {
      id: "EVENT-1003",
      title: "Small Business Development Seminar",
      date: "2023-06-25",
      time: "8:30 AM - 4:00 PM",
      location: "City Hall Conference Room",
      type: "seminar",
      organizer: "Economic Development Office",
    },
    {
      id: "EVENT-1004",
      title: "Youth Leadership Summit",
      date: "2023-07-05",
      time: "9:00 AM - 3:00 PM",
      location: "City Gymnasium",
      type: "summit",
      organizer: "CSO Organization",
    },
    {
      id: "EVENT-1005",
      title: "Environmental Clean-Up Drive",
      date: "2023-07-10",
      time: "7:00 AM - 11:00 AM",
      location: "Coastal Area",
      type: "campaign",
      organizer: "Barangay Lapasan",
    },
  ]

  // Filter events based on search term and type filter
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = typeFilter === "all" || event.type === typeFilter

    return matchesSearch && matchesType
  })

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>All Events</CardTitle>
        <CardDescription>View and manage scheduled events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
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
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="seminar">Seminar</SelectItem>
                <SelectItem value="summit">Summit</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-[#f8f9fa]">
              <TableRow>
                <TableHead className="font-semibold text-[#0c2d6b]">Event</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Date & Time</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Location</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Type</TableHead>
                <TableHead className="font-semibold text-[#0c2d6b]">Organizer</TableHead>
                <TableHead className="text-right font-semibold text-[#0c2d6b]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-sm">
                        <Calendar className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        event.type === "campaign"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                          : event.type === "workshop"
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
                            : event.type === "seminar"
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              : "bg-green-100 text-green-800 hover:bg-green-100"
                      }
                    >
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.organizer}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
