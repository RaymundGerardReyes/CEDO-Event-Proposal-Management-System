"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

export function EventCalendar() {
  const [date, setDate] = useState(new Date())

  // In a real app, this data would come from an API
  const events = [
    {
      id: "EVENT-1001",
      title: "HIV Awareness Campaign Kickoff",
      date: new Date(2023, 5, 15), // June 15, 2023
      time: "9:00 AM - 12:00 PM",
      location: "XU Medical Center Auditorium",
      type: "campaign",
    },
    {
      id: "EVENT-1002",
      title: "Tech Skills Workshop - Day 1",
      date: new Date(2023, 5, 20), // June 20, 2023
      time: "1:00 PM - 5:00 PM",
      location: "Lourdes College Computer Lab",
      type: "workshop",
    },
    {
      id: "EVENT-1003",
      title: "Small Business Development Seminar",
      date: new Date(2023, 5, 25), // June 25, 2023
      time: "8:30 AM - 4:00 PM",
      location: "City Hall Conference Room",
      type: "seminar",
    },
  ]

  // Filter events for the selected date
  const selectedDateEvents = events.filter((event) => event.date.toDateString() === date.toDateString())

  // Get dates with events for highlighting in the calendar
  const eventDates = events.map((event) => event.date)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-1 border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>View and select event dates</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => newDate && setDate(newDate)}
            className="rounded-md border"
            highlightedDates={eventDates}
          />
        </CardContent>
      </Card>

      <Card className="md:col-span-2 border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Events for {formatDate(date)}</CardTitle>
          <CardDescription>
            {selectedDateEvents.length === 0
              ? "No events scheduled for this date"
              : `${selectedDateEvents.length} event(s) scheduled`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDateEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">No events scheduled for this date.</p>
              <Button variant="outline" className="mt-4">
                Create Event
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateEvents.map((event) => (
                <div key={event.id} className="rounded-lg border p-4">
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
                      <span className="font-medium">Time:</span>
                      <span className="ml-2">{event.time}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Location:</span>
                      <span className="ml-2">{event.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
