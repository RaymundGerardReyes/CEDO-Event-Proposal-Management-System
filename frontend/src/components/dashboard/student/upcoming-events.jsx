// frontend/src/components/dashboard/student/upcoming-events.jsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users } from "lucide-react";
import Link from "next/link"; // Added for "View All Events" button

const upcomingEventsData = [ // Renamed to avoid conflict
  {
    id: "EVENT-001",
    title: "Science Fair Exhibition",
    date: "2023-03-20", // Assuming this date format is intentional for display
    time: "09:00 AM - 05:00 PM", // Added time for more detail
    location: "Main Campus Hall",
    attendees: 120,
  },
  {
    id: "EVENT-002",
    title: "Leadership Workshop",
    date: "2023-03-22",
    time: "01:00 PM - 04:00 PM",
    location: "Conference Room B",
    attendees: 45,
  },
  {
    id: "EVENT-003",
    title: "Community Service Day",
    date: "2023-03-25",
    time: "08:00 AM - 02:00 PM",
    location: "City Park",
    attendees: 75,
  },
];

export function UpcomingEvents() {
  return (
    <div className="space-y-4">
      {upcomingEventsData.length > 0 ? (
        upcomingEventsData.map((event) => (
          <div key={event.id} className="flex flex-col space-y-2 rounded-md border p-4 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-800">{event.title}</h3>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs"> {/* Adjusted badge styling */}
                {event.id}
              </Badge>
            </div>

            <div className="flex flex-col space-y-1.5 text-sm text-muted-foreground"> {/* Increased spacing */}
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                <span>
                  {new Date(event.date).toLocaleDateString("en-US", { // Make sure date is valid for Date constructor
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {event.time && <span className="ml-2 text-xs">({event.time})</span>}
                </span>
              </div>

              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                <span>{event.location}</span>
              </div>

              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-gray-500" />
                <span>{event.attendees} expected attendees</span> {/* Clarified "attendees" */}
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full hover:bg-gray-50">
                View Details
              </Button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No upcoming events.</p>
      )}

      {upcomingEventsData.length > 0 && ( // Show only if there are events
        <Link href="/events" passHref legacyBehavior>
          <Button as="a" variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-700">
            View All Events
          </Button>
        </Link>
      )}
    </div>
  );
}