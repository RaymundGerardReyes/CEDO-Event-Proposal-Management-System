// frontend/src/components/dashboard/student/sdp-credits-panel.jsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent, // Added for better pagination
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { useState } from "react";

// Sample event data
const eventsData = [
  {
    id: "evt-001",
    name: "Academic Writing Workshop",
    date: "Mar 15, 2025",
    credits: 1,
    participants: [
      { id: "p1", name: "Juan Dela Cruz", school: "Xavier University", program: "BS Biology", year: "2nd" },
      { id: "p2", name: "Maria Santos", school: "Liceo de Cagayan", program: "BS Info Tech", year: "3rd" },
      { id: "p3", name: "Ahmed Alonto", school: "Mindanao State Univ.", program: "BS Pol Sci", year: "4th" },
    ],
  },
  {
    id: "evt-002",
    name: "Leadership Training",
    date: "Apr 02, 2025",
    credits: 1,
    participants: [
      { id: "p4", name: "Elena Reyes", school: "Ateneo de Manila", program: "BS Psychology", year: "2nd" },
      { id: "p5", name: "Carlos Mendoza", school: "De La Salle Univ.", program: "BS Management", year: "3rd" },
    ],
  },
  {
    id: "evt-003",
    name: "Community Outreach",
    date: "Apr 20, 2025",
    credits: 1,
    participants: [
      { id: "p6", name: "Sofia Garcia", school: "University of San Carlos", program: "BS Nursing", year: "4th" },
      { id: "p7", name: "Miguel Torres", school: "Silliman University", program: "BS Marine Biology", year: "3rd" },
      {
        id: "p8",
        name: "Isabella Cruz",
        school: "University of San Jose-Recoletos",
        program: "BS Architecture",
        year: "2nd",
      },
    ],
  },
  // Add more events for testing
  {
    id: "evt-004",
    name: "Tech Seminar Series Part 1",
    date: "May 05, 2025",
    credits: 2,
    participants: [
      { id: "p9", name: "Luis Manzano", school: "Xavier University", program: "BS CompSci", year: "1st" },
      { id: "p10", name: "Ana Rodriguez", school: "Capitol University", program: "BS Engineering", year: "2nd" },
    ],
  },
  {
    id: "evt-005",
    name: "Arts & Crafts Fair",
    date: "May 12, 2025",
    credits: 1,
    participants: Array.from({ length: 15 }, (_, i) => ({
      id: `pac${i + 1}`,
      name: `Participant AC ${i + 1}`,
      school: `School ${String.fromCharCode(65 + (i % 5))}`,
      program: `Program ${String.fromCharCode(88 + (i % 3))}`,
      year: `${(i % 4) + 1}${(i % 4) + 1 === 1 ? 'st' : (i % 4) + 1 === 2 ? 'nd' : (i % 4) + 1 === 3 ? 'rd' : 'th'}`
    }))
  },
];

export function SdpCreditsPanel({ onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participantSearchTerm, setParticipantSearchTerm] = useState("");
  const [expandedEvents, setExpandedEvents] = useState({});
  const [currentEventPage, setCurrentEventPage] = useState(1); // For events list
  const [currentParticipantPage, setCurrentParticipantPage] = useState(1); // For participants list

  const ITEMS_PER_PAGE = 5; // For events
  const PARTICIPANTS_PER_PAGE = 10; // For participants

  // Filter events based on search term
  const filteredEvents = eventsData.filter((event) => event.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Paginate Events
  const totalEventPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentEventPage - 1) * ITEMS_PER_PAGE,
    currentEventPage * ITEMS_PER_PAGE
  );


  const toggleEventExpansion = (eventId) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const viewParticipants = (event) => {
    setSelectedEvent(event);
    setParticipantSearchTerm("");
    setCurrentParticipantPage(1);
  };

  const filteredParticipants =
    selectedEvent?.participants.filter(
      (participant) =>
        participant.name.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
        participant.school.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
        participant.program.toLowerCase().includes(participantSearchTerm.toLowerCase()) ||
        participant.year.toLowerCase().includes(participantSearchTerm.toLowerCase()),
    ) || [];

  // Paginate Participants
  const totalParticipantPages = Math.ceil(filteredParticipants.length / PARTICIPANTS_PER_PAGE);
  const currentParticipants = filteredParticipants.slice(
    (currentParticipantPage - 1) * PARTICIPANTS_PER_PAGE,
    currentParticipantPage * PARTICIPANTS_PER_PAGE
  );

  const backToEvents = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-xl"> {/* Added shadow */}
      <div className="border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 id="panel-title" className="text-lg font-semibold text-gray-800">
              SDP Credits
            </h2>
            <p className="text-sm text-muted-foreground">Approved events & participants</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
            <X className="h-5 w-5 text-gray-600 hover:text-gray-800" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {selectedEvent ? (
          /* Participants View */
          <div className="flex flex-col h-full">
            <div className="border-b p-4 sticky top-0 bg-white z-10">
              <Button
                variant="ghost"
                className="mb-2 pl-0 flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                onClick={backToEvents}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Events
              </Button>
              <h3 className="text-base font-medium text-gray-700">{selectedEvent.name}</h3>
              <p className="text-xs text-muted-foreground">{selectedEvent.date} - {selectedEvent.credits} credit(s)</p>
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search participants by name, school, program, or year…"
                  className="pl-8"
                  value={participantSearchTerm}
                  onChange={(e) => {
                    setParticipantSearchTerm(e.target.value);
                    setCurrentParticipantPage(1);
                  }}
                />
              </div>

              {filteredParticipants.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-medium text-gray-600">Name</TableHead>
                        <TableHead className="font-medium text-gray-600">School</TableHead>
                        <TableHead className="font-medium text-gray-600">Program</TableHead>
                        <TableHead className="font-medium text-gray-600">Year</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentParticipants.map((participant) => (
                        <TableRow key={participant.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium py-3">{participant.name}</TableCell>
                          <TableCell className="py-3">{participant.school}</TableCell>
                          <TableCell className="py-3">{participant.program}</TableCell>
                          <TableCell className="py-3">{participant.year}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No participants found matching your search for this event.
                </div>
              )}

              {totalParticipantPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); setCurrentParticipantPage((prev) => Math.max(prev - 1, 1)); }}
                          disabled={currentParticipantPage === 1}
                          isActive={currentParticipantPage === 1}
                        />
                      </PaginationItem>
                      {/* Simple page numbers for now, can be expanded */}
                      {[...Array(totalParticipantPages).keys()].map(num => (
                        <PaginationItem key={`participant-page-${num + 1}`}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentParticipantPage(num + 1); }}
                            isActive={currentParticipantPage === num + 1}>
                            {num + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); setCurrentParticipantPage((prev) => Math.min(prev + 1, totalParticipantPages)); }}
                          disabled={currentParticipantPage === totalParticipantPages}
                          isActive={currentParticipantPage === totalParticipantPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Events List View */
          <div className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search events by name…"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentEventPage(1);
                }}
              />
            </div>

            {filteredEvents.length > 0 ? (
              <>
                <div className="space-y-2">
                  {paginatedEvents.map((event) => (
                    <div key={event.id} className="border rounded-md overflow-hidden mb-3 hover:shadow-md transition-shadow">
                      <div
                        className="flex items-start justify-between p-3 cursor-pointer hover:bg-slate-50"
                        onClick={() => toggleEventExpansion(event.id)}
                        aria-expanded={!!expandedEvents[event.id]}
                        aria-controls={`event-details-${event.id}`}
                      >
                        <div className="flex items-start">
                          {expandedEvents[event.id] ? (
                            <ChevronDown className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
                          ) : (
                            <ChevronRight className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-gray-500" />
                          )}
                          <div>
                            <div className="font-medium text-gray-700">{event.name}</div>
                            <div className="text-sm text-muted-foreground mt-1">{event.date}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {event.credits} credit{event.credits !== 1 ? "s" : ""}
                        </Badge>
                      </div>

                      {expandedEvents[event.id] && (
                        <div id={`event-details-${event.id}`} className="px-4 pb-3 pt-0 border-t border-gray-100 bg-slate-25">
                          <Button
                            variant="link" // Changed to link for less visual weight
                            size="sm"
                            className="mt-3 w-full flex justify-start text-blue-600 hover:text-blue-800 px-0"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent toggling expansion
                              viewParticipants(event);
                            }}
                          >
                            <span>View Participants ({event.participants.length})</span>
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {totalEventPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentEventPage((prev) => Math.max(prev - 1, 1)); }}
                            disabled={currentEventPage === 1}
                          />
                        </PaginationItem>
                        {[...Array(totalEventPages).keys()].map(num => (
                          <PaginationItem key={`event-page-${num + 1}`}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => { e.preventDefault(); setCurrentEventPage(num + 1); }}
                              isActive={currentEventPage === num + 1}>
                              {num + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentEventPage((prev) => Math.min(prev + 1, totalEventPages)); }}
                            disabled={currentEventPage === totalEventPages}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No SDP credits awarded yet. Approved events will appear here.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}