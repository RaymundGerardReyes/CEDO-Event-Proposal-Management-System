"use client"

import { Badge } from "@/components/dashboard/student/ui/badge";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import Progress from '@/components/dashboard/student/ui/progress'; // Note the plural 'components'
import { Tabs, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs";
import { Calendar, ChevronRight, Clock, FileText, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
// If you have named exports

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("all")

  // Sample data for SDP credits
  const sdpCredits = {
    total: 100,
    earned: 45,
    pending: 15,
    required: 100,
    breakdown: {
      academic: 20,
      leadership: 15,
      volunteerism: 10,
      cultural: 0,
    },
  }

  // Sample data for recent events
  const recentEvents = [
    {
      id: "EVENT-001",
      title: "Leadership Workshop",
      date: "2023-05-15",
      status: "approved",
      type: "leadership",
      credits: 5,
    },
    {
      id: "EVENT-002",
      title: "Community Service Day",
      date: "2023-05-10",
      status: "pending",
      type: "volunteerism",
      credits: 10,
    },
    {
      id: "EVENT-003",
      title: "Academic Seminar",
      date: "2023-05-05",
      status: "approved",
      type: "academic",
      credits: 5,
    },
    {
      id: "EVENT-004",
      title: "Research Symposium",
      date: "2023-04-28",
      status: "rejected",
      type: "academic",
      credits: 0,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Track your Scholars Development Program events and credits</p>
        </div>
        <Link href="/submit-event">
          <Button className="bg-[#001a56] hover:bg-[#001a56]/90">
            <PlusCircle className="h-4 w-4 mr-2" aria-hidden="true" />
            <span>New Event</span>
          </Button>
        </Link>
      </div>

      {/* SDP Credits Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-[#001a56] mb-1">Total SDP Credits</h3>
              <p className="text-3xl font-bold text-[#001a56]">24</p>
            </div>
            <div className="bg-[#001a56]/10 p-3 rounded-full">
              <FileText className="h-6 w-6 text-[#001a56]" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-[#001a56] mb-1">Pending Credits</h3>
              <p className="text-3xl font-bold text-[#f0c14b]">8</p>
            </div>
            <div className="bg-[#f0c14b]/10 p-3 rounded-full">
              <Clock className="h-6 w-6 text-[#001a56]" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-[#001a56] mb-1">Upcoming Events</h3>
              <p className="text-3xl font-bold text-green-600">3</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Progress */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Credit Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex justify-between mb-2">
                <h4 className="font-medium">Overall Progress</h4>
                <span className="text-sm text-muted-foreground">24 of 36 credits</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#f0c14b]">
                <div
                  className="h-2.5 rounded-full bg-[#001a56]"
                  style={{ width: "67%" }}
                  role="progressbar"
                  aria-valuenow="67"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
              <div className="mt-1 text-right text-sm text-muted-foreground">67% complete</div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Leadership</span>
                  <span className="text-sm text-muted-foreground">8 / 12</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Community Service</span>
                  <span className="text-sm text-muted-foreground">10 / 12</span>
                </div>
                <Progress value={83} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Professional Development</span>
                  <span className="text-sm text-muted-foreground">6 / 12</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle>Recent Events</CardTitle>
          <Link href="/events">
            <Button variant="ghost" size="sm" className="gap-1 text-[#001a56]">
              View All
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4 w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
              <TabsTrigger value="all" className="flex-1 sm:flex-initial">
                All Events
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex-1 sm:flex-initial">
                Approved
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex-1 sm:flex-initial">
                Pending
              </TabsTrigger>
              <TabsTrigger value="draft" className="flex-1 sm:flex-initial">
                Draft
              </TabsTrigger>
            </TabsList>

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="text-left text-sm font-medium text-muted-foreground">
                      <th scope="col" className="py-3 pl-4 pr-3 sm:pl-0">
                        Event Title
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Date
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Credits
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentEvents
                      .filter((event) => activeTab === "all" || event.status === activeTab)
                      .map((event) => (
                        <tr key={event.id} className="hover:bg-muted/50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                            {event.title}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(event.date).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <Badge
                              className={
                                event.type === "academic"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  : event.type === "leadership"
                                    ? "bg-[#f0c14b]/20 text-[#001a56] hover:bg-[#f0c14b]/20"
                                    : event.type === "volunteerism"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                              }
                            >
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{event.credits}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <Badge
                              className={
                                event.status === "approved"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                                  : event.status === "pending"
                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200"
                                    : event.status === "rejected"
                                      ? "bg-red-100 text-red-800 hover:bg-red-100 border-red-200"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
                              }
                            >
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                            <Button variant="ghost" size="sm" className="text-[#001a56] hover:text-[#001a56]/70">
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
