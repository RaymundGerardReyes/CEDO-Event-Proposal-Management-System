import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Users } from "lucide-react"

const upcomingEvents = [
  {
    id: "EVENT-001",
    title: "Science Fair Exhibition",
    date: "2023-03-20",
    location: "Main Campus Hall",
    attendees: 120,
  },
  {
    id: "EVENT-002",
    title: "Leadership Workshop",
    date: "2023-03-22",
    location: "Conference Room B",
    attendees: 45,
  },
  {
    id: "EVENT-003",
    title: "Community Service Day",
    date: "2023-03-25",
    location: "City Park",
    attendees: 75,
  },
]

export function UpcomingEvents() {
  return (
    <div className="space-y-4">
      {upcomingEvents.map((event) => (
        <div key={event.id} className="flex flex-col space-y-2 rounded-md border p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-medium">{event.title}</h3>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
              {event.id}
            </Badge>
          </div>

          <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span>
                {new Date(event.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              <span>{event.location}</span>
            </div>

            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              <span>{event.attendees} attendees</span>
            </div>
          </div>

          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full">
              View Details
            </Button>
          </div>
        </div>
      ))}

      <Button variant="ghost" size="sm" className="w-full">
        View All Events
      </Button>
    </div>
  )
}
