"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin } from "lucide-react"
import { formatDate } from "@/lib/utils"

export function UpcomingEvents() {
  // In a real app, this data would come from an API
  const events = [
    {
      id: "EVENT-1001",
      title: "HIV Awareness Campaign Kickoff",
      date: "2023-06-15",
      time: "9:00 AM - 12:00 PM",
      location: "XU Medical Center Auditorium",
      type: "campaign",
    },
    {
      id: "EVENT-1002",
      title: "Tech Skills Workshop - Day 1",
      date: "2023-06-20",
      time: "1:00 PM - 5:00 PM",
      location: "Lourdes College Computer Lab",
      type: "workshop",
    },
    {
      id: "EVENT-1003",
      title: "Small Business Development Seminar",
      date: "2023-06-25",
      time: "8:30 AM - 4:00 PM",
      location: "City Hall Conference Room",
      type: "seminar",
    },
  ]

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Scheduled events for the next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <Badge
                    className={
                      event.type === "campaign"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100 mt-1"
                        : event.type === "workshop"
                          ? "bg-purple-100 text-purple-800 hover:bg-purple-100 mt-1"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100 mt-1"
                    }
                  >
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </Badge>
                </div>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-3.5 w-3.5" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="mr-2 h-3.5 w-3.5" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="mr-2 h-3.5 w-3.5" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
