"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { Avatar, AvatarFallback } from "@/components/dashboard/student/ui/avatar";
import { Badge } from "@/components/dashboard/student/ui/badge";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { Input } from "@/components/dashboard/student/ui/input";
import { PageHeader } from "@/components/dashboard/student/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/student/ui/select";
import { Separator } from "@/components/dashboard/student/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/student/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/student/ui/tabs";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  BarChart,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Filter,
  PieChart,
  Search,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Sample data for organizations
const organizations = [
  {
    id: "ORG-001",
    name: "Student Council",
    category: "community",
    region: "North District",
    totalEvents: 12,
    completedEvents: 8,
    pendingEvents: 4,
    members: 45,
    completionRate: 67,
    lastActivity: "2023-04-15",
  },
  {
    id: "ORG-002",
    name: "Environmental Club",
    category: "community",
    region: "East District",
    totalEvents: 8,
    completedEvents: 7,
    pendingEvents: 1,
    members: 32,
    completionRate: 88,
    lastActivity: "2023-04-10",
  },
  {
    id: "ORG-003",
    name: "Science Society",
    category: "institutionalized",
    region: "Central District",
    totalEvents: 15,
    completedEvents: 10,
    pendingEvents: 5,
    members: 60,
    completionRate: 67,
    lastActivity: "2023-04-18",
  },
  {
    id: "ORG-004",
    name: "Arts Association",
    category: "community",
    region: "West District",
    totalEvents: 10,
    completedEvents: 6,
    pendingEvents: 4,
    members: 38,
    completionRate: 60,
    lastActivity: "2023-04-05",
  },
  {
    id: "ORG-005",
    name: "Sports Federation",
    category: "institutionalized",
    region: "South District",
    totalEvents: 20,
    completedEvents: 15,
    pendingEvents: 5,
    members: 75,
    completionRate: 75,
    lastActivity: "2023-04-20",
  },
  {
    id: "ORG-006",
    name: "Technology Club",
    category: "institutionalized",
    region: "North District",
    totalEvents: 9,
    completedEvents: 7,
    pendingEvents: 2,
    members: 40,
    completionRate: 78,
    lastActivity: "2023-04-12",
  },
  {
    id: "ORG-007",
    name: "Debate Society",
    category: "community",
    region: "Central District",
    totalEvents: 6,
    completedEvents: 4,
    pendingEvents: 2,
    members: 25,
    completionRate: 67,
    lastActivity: "2023-04-08",
  },
  {
    id: "ORG-008",
    name: "Music Club",
    category: "community",
    region: "East District",
    totalEvents: 12,
    completedEvents: 9,
    pendingEvents: 3,
    members: 35,
    completionRate: 75,
    lastActivity: "2023-04-17",
  },
  // Add more organizations to reach 41 total
  // ...
]

// Sample data for events
const events = [
  {
    id: "EVENT-001",
    orgId: "ORG-001",
    title: "Community Clean-up Drive",
    date: "2023-04-15",
    status: "completed",
    location: "North District Park",
    expectedParticipants: 30,
    actualParticipants: 28,
    description: "A community initiative to clean up the local park and surrounding areas.",
    category: "community",
    duration: "4 hours",
    impact: "Collected 45 bags of trash and recyclables",
  },
  {
    id: "EVENT-002",
    orgId: "ORG-001",
    title: "Leadership Workshop",
    date: "2023-05-10",
    status: "pending",
    location: "Student Center",
    expectedParticipants: 25,
    actualParticipants: null,
    description: "Workshop focused on developing leadership skills among student representatives.",
    category: "institutionalized",
    duration: "3 hours",
    impact: "Pending",
  },
  {
    id: "EVENT-003",
    orgId: "ORG-002",
    title: "Tree Planting Initiative",
    date: "2023-04-10",
    status: "completed",
    location: "East District Green Belt",
    expectedParticipants: 20,
    actualParticipants: 25,
    description: "Environmental initiative to plant native trees in designated areas.",
    category: "community",
    duration: "5 hours",
    impact: "Planted 100 native trees",
  },
  {
    id: "EVENT-004",
    orgId: "ORG-003",
    title: "Science Fair",
    date: "2023-04-18",
    status: "completed",
    location: "Central District School",
    expectedParticipants: 50,
    actualParticipants: 65,
    description: "Annual science fair showcasing student projects and innovations.",
    category: "institutionalized",
    duration: "8 hours",
    impact: "Engaged 200+ visitors and community members",
  },
  {
    id: "EVENT-005",
    orgId: "ORG-003",
    title: "STEM Workshop",
    date: "2023-05-20",
    status: "pending",
    location: "Science Building",
    expectedParticipants: 40,
    actualParticipants: null,
    description: "Workshop to promote STEM education among high school students.",
    category: "institutionalized",
    duration: "4 hours",
    impact: "Pending",
  },
  // Add more events
  // ...
]

// Sample data for participants
const participants = [
  {
    eventId: "EVENT-001",
    registered: [
      { id: "P001", name: "John Smith", email: "john@example.com", attended: true },
      { id: "P002", name: "Sarah Johnson", email: "sarah@example.com", attended: true },
      { id: "P003", name: "Michael Brown", email: "michael@example.com", attended: false },
      { id: "P004", name: "Emily Davis", email: "emily@example.com", attended: true },
      { id: "P005", name: "David Wilson", email: "david@example.com", attended: true },
      // Add more participants
    ],
  },
  {
    eventId: "EVENT-003",
    registered: [
      { id: "P010", name: "Jessica Lee", email: "jessica@example.com", attended: true },
      { id: "P011", name: "Robert Chen", email: "robert@example.com", attended: true },
      { id: "P012", name: "Amanda Taylor", email: "amanda@example.com", attended: true },
      { id: "P013", name: "Kevin Martinez", email: "kevin@example.com", attended: false },
      { id: "P014", name: "Lisa Rodriguez", email: "lisa@example.com", attended: true },
      // Add more participants
    ],
  },
  {
    eventId: "EVENT-004",
    registered: [
      { id: "P020", name: "Thomas White", email: "thomas@example.com", attended: true },
      { id: "P021", name: "Jennifer Black", email: "jennifer@example.com", attended: true },
      { id: "P022", name: "Daniel Green", email: "daniel@example.com", attended: true },
      { id: "P023", name: "Michelle Gray", email: "michelle@example.com", attended: false },
      { id: "P024", name: "Christopher Blue", email: "chris@example.com", attended: true },
      // Add more participants
    ],
  },
  // Add more event participants
  // ...
]

export default function ReportsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [eventFilter, setEventFilter] = useState("all")

  // Filter organizations based on search and filters
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || org.category === categoryFilter
    const matchesRegion = regionFilter === "all" || org.region === regionFilter

    return matchesSearch && matchesCategory && matchesRegion
  })

  // Sort organizations
  const sortedOrgs = [...filteredOrgs].sort((a, b) => {
    let comparison = 0

    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name)
    } else if (sortBy === "completionRate") {
      comparison = a.completionRate - b.completionRate
    } else if (sortBy === "totalEvents") {
      comparison = a.totalEvents - b.totalEvents
    } else if (sortBy === "lastActivity") {
      comparison = new Date(a.lastActivity) - new Date(b.lastActivity)
    }

    return sortOrder === "asc" ? comparison : -comparison
  })

  // Get events for selected organization
  const getOrgEvents = (orgId) => {
    return events.filter((event) => event.orgId === orgId)
  }

  // Filter events based on status
  const filterEvents = (events, filter) => {
    if (filter === "all") return events
    return events.filter((event) => event.status === filter)
  }

  // Get participants for an event
  const getEventParticipants = (eventId) => {
    const eventParticipants = participants.find((p) => p.eventId === eventId)
    return eventParticipants ? eventParticipants.registered : []
  }

  // Handle organization click
  const handleOrgClick = (org) => {
    setSelectedOrg(org)
    setIsOrgDialogOpen(true)
  }

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setIsEventDialogOpen(true)
  }

  // Toggle sort order
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader title="Reports" subtitle="Track and manage organization activities and events" />

      <Card className="cedo-card mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="cedo-header">Organization Reports</h2>
              <p className="cedo-subheader">Track volunteer activities and events across all organizations</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-white">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button className="bg-cedo-blue hover:bg-cedo-blue/90">
                <Calendar className="h-4 w-4 mr-2" />
                Generate Monthly Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <Card className="cedo-card">
          <CardHeader>
            <CardTitle>Organization Activity Reports</CardTitle>
            <CardDescription>View and analyze reports from 41 student organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="organizations" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <TabsList>
                  <TabsTrigger value="organizations">Organizations</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <div className="flex w-full sm:w-auto gap-2 flex-wrap sm:flex-nowrap">
                  <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search organizations..."
                      className="pl-8 w-full sm:w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="community">Community-Based</SelectItem>
                      <SelectItem value="institutionalized">Institutionalized</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="North District">North District</SelectItem>
                      <SelectItem value="East District">East District</SelectItem>
                      <SelectItem value="South District">South District</SelectItem>
                      <SelectItem value="West District">West District</SelectItem>
                      <SelectItem value="Central District">Central District</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Time Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <TabsContent value="organizations" className="space-y-4 mt-0">
                <div className="rounded-md border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="cedo-table-header">
                        <TableRow>
                          <TableHead className="font-semibold text-cedo-blue">
                            <div className="flex items-center cursor-pointer" onClick={() => toggleSort("name")}>
                              Organization
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-cedo-blue">Category</TableHead>
                          <TableHead className="font-semibold text-cedo-blue">Region</TableHead>
                          <TableHead className="font-semibold text-cedo-blue">
                            <div className="flex items-center cursor-pointer" onClick={() => toggleSort("totalEvents")}>
                              Total Events
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-cedo-blue">Completed</TableHead>
                          <TableHead className="font-semibold text-cedo-blue">Pending</TableHead>
                          <TableHead className="font-semibold text-cedo-blue">
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => toggleSort("completionRate")}
                            >
                              Completion Rate
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-cedo-blue">
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => toggleSort("lastActivity")}
                            >
                              Last Activity
                              <ArrowUpDown className="ml-2 h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead className="text-right font-semibold text-cedo-blue">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedOrgs.length > 0 ? (
                          sortedOrgs.map((org, index) => (
                            <TableRow key={`${org.id}-${index}`} className="cedo-table-row">
                              <TableCell>
                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm font-medium">
                                  {org.name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    org.category === "community"
                                      ? "bg-green-100 text-green-800 hover:bg-green-100"
                                      : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  }
                                >
                                  {org.category === "community" ? "Community-Based" : "Institutionalized"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm">
                                  {org.region}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm text-center">
                                  {org.totalEvents}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="border border-green-500 text-green-600 px-3 py-1.5 rounded-md text-sm text-center">
                                  {org.completedEvents}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="border border-amber-500 text-amber-600 px-3 py-1.5 rounded-md text-sm text-center">
                                  {org.pendingEvents}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full ${org.completionRate >= 75
                                      ? "bg-green-500"
                                      : org.completionRate >= 50
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                      }`}
                                    style={{ width: `${org.completionRate}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-center mt-1">{org.completionRate}%</div>
                              </TableCell>
                              <TableCell>
                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm">
                                  {new Date(org.lastActivity).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOrgClick(org)}
                                  className="hover:bg-cedo-blue/5 hover:text-cedo-blue"
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-6">
                              <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <Search className="h-10 w-10 mb-2" />
                                <h3 className="text-lg font-medium">No organizations found</h3>
                                <p className="text-sm">Try adjusting your filters or search terms</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-cedo-blue">Events by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="h-60 flex items-center justify-center">
                        <PieChart className="h-40 w-40 text-cedo-blue opacity-20" />
                        {/* In a real implementation, this would be a chart component */}
                      </div>
                      <div className="flex justify-center gap-4 mt-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Community-Based</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-sm">Institutionalized</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-cedo-blue">Completion Rates</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="h-60 flex items-center justify-center">
                        <BarChart className="h-40 w-40 text-cedo-blue opacity-20" />
                        {/* In a real implementation, this would be a chart component */}
                      </div>
                      <div className="flex justify-center gap-4 mt-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Completed</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                          <span className="text-sm">Pending</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-cedo-blue">Events by Region</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="h-60 flex items-center justify-center">
                        <BarChart className="h-40 w-40 text-cedo-blue opacity-20" />
                        {/* In a real implementation, this would be a chart component */}
                      </div>
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-sm">North</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">East</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                          <span className="text-sm">South</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                          <span className="text-sm">West</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span className="text-sm">Central</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-cedo-blue">Overall Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Organizations</p>
                            <p className="text-2xl font-bold text-cedo-blue">41</p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-500" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Events</p>
                            <p className="text-2xl font-bold text-cedo-blue">128</p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-purple-500" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Completed Events</p>
                            <p className="text-2xl font-bold text-green-600">86</p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Pending Events</p>
                            <p className="text-2xl font-bold text-amber-600">42</p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-md font-medium text-cedo-blue mb-3">Overall Completion Rate</h3>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="h-4 rounded-full bg-green-500" style={{ width: "67%" }}></div>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span>0%</span>
                        <span className="font-medium">67% Complete</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details Modal */}
      {isOrgDialogOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOrgDialogOpen(false)}
          />

          {/* Organization details modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="z-10 w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto"
          >
            <Card className="border-cedo-blue/20 shadow-lg">
              <CardHeader className="relative pb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={() => setIsOrgDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl text-cedo-blue flex items-center gap-2">
                  {selectedOrg.name}
                  <Badge
                    className={
                      selectedOrg.category === "community"
                        ? "bg-green-100 text-green-800 hover:bg-green-100 ml-2"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-100 ml-2"
                    }
                  >
                    {selectedOrg.category === "community" ? "Community-Based" : "Institutionalized"}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Events</p>
                          <p className="text-2xl font-bold text-cedo-blue">{selectedOrg.totalEvents}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Completion Rate</p>
                          <p className="text-2xl font-bold text-cedo-blue">{selectedOrg.completionRate}%</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Members</p>
                          <p className="text-2xl font-bold text-cedo-blue">{selectedOrg.members}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Users className="h-5 w-5 text-purple-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-cedo-blue">Event List</h3>
                    <div className="flex gap-2">
                      <Select value={eventFilter} onValueChange={setEventFilter}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Events</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader className="cedo-table-header">
                        <TableRow>
                          <TableHead className="font-semibold text-cedo-blue">Event ID</TableHead>
                          <TableHead className="font-semibold text-cedo-blue">Title</TableHead>
                          <TableHead className="font-semibold text-cedo-blue">Date</TableHead>
                          <TableHead className="font-semibold text-cedo-blue">Status</TableHead>
                          <TableHead className="font-semibold text-cedo-blue">Location</TableHead>
                          <TableHead className="font-semibold text-cedo-blue">Participants</TableHead>
                          <TableHead className="text-right font-semibold text-cedo-blue">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterEvents(getOrgEvents(selectedOrg.id), eventFilter).map((event, index) => (
                          <TableRow key={`${event.id}-${index}`} className="cedo-table-row">
                            <TableCell className="font-medium">{event.id}</TableCell>
                            <TableCell>
                              <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm font-medium">
                                {event.title}
                              </div>
                            </TableCell>
                            <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  event.status === "completed"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                }
                              >
                                {event.status === "completed" ? "Completed" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm">
                                {event.location}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm text-center">
                                  {event.status === "completed" ? event.actualParticipants : event.expectedParticipants}
                                </div>
                                {event.status === "completed" &&
                                  event.actualParticipants > event.expectedParticipants && (
                                    <Badge className="ml-2 bg-green-100 text-green-800">
                                      +{event.actualParticipants - event.expectedParticipants}
                                    </Badge>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEventClick(event)}
                                className="hover:bg-cedo-blue/5 hover:text-cedo-blue"
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filterEvents(getOrgEvents(selectedOrg.id), eventFilter).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-6">
                              <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <Calendar className="h-10 w-10 mb-2" />
                                <h3 className="text-lg font-medium">No events found</h3>
                                <p className="text-sm">Try adjusting your filters</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Event Details Modal */}
      {isEventDialogOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsEventDialogOpen(false)}
          />

          {/* Event details modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="z-10 w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto"
          >
            <Card className="border-cedo-blue/20 shadow-lg">
              <CardHeader className="relative pb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4"
                  onClick={() => setIsEventDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <CardTitle className="text-xl text-cedo-blue flex items-center gap-2">
                  {selectedEvent.title}
                  <Badge
                    className={
                      selectedEvent.status === "completed"
                        ? "bg-green-100 text-green-800 hover:bg-green-100 ml-2"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-100 ml-2"
                    }
                  >
                    {selectedEvent.status === "completed" ? "Completed" : "Pending"}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Event ID</p>
                    <p className="font-medium">{selectedEvent.id}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p>{new Date(selectedEvent.date).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p>{selectedEvent.location}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                  <p>{selectedEvent.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <Badge
                      className={
                        selectedEvent.category === "community"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                      }
                    >
                      {selectedEvent.category === "community" ? "Community-Based" : "Institutionalized"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    <p>{selectedEvent.duration}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Impact</p>
                    <p>{selectedEvent.impact}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <Tabs defaultValue="participants">
                    <TabsList>
                      <TabsTrigger value="participants">Participants</TabsTrigger>
                      <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    </TabsList>
                    <TabsContent value="participants" className="mt-4">
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader className="cedo-table-header">
                            <TableRow>
                              <TableHead className="font-semibold text-cedo-blue">ID</TableHead>
                              <TableHead className="font-semibold text-cedo-blue">Name</TableHead>
                              <TableHead className="font-semibold text-cedo-blue">Email</TableHead>
                              <TableHead className="font-semibold text-cedo-blue">Attendance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getEventParticipants(selectedEvent.id).map((participant, index) => (
                              <TableRow key={`${participant.id}-${index}`} className="cedo-table-row">
                                <TableCell className="font-medium">{participant.id}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs bg-cedo-blue text-white">
                                        {participant.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{participant.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{participant.email}</TableCell>
                                <TableCell>
                                  {participant.attended ? (
                                    <div className="flex items-center text-green-600">
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      <span>Attended</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-red-600">
                                      <UserX className="h-4 w-4 mr-1" />
                                      <span>Absent</span>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                            {getEventParticipants(selectedEvent.id).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-6">
                                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                                    <Users className="h-10 w-10 mb-2" />
                                    <h3 className="text-lg font-medium">No participants found</h3>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    <TabsContent value="attendance" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-md text-cedo-blue">Attendance Summary</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium">Expected Participants</span>
                                  <span className="text-sm font-medium">{selectedEvent.expectedParticipants}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div className="h-2.5 rounded-full bg-blue-500 w-full"></div>
                                </div>
                              </div>

                              {selectedEvent.status === "completed" && (
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Actual Participants</span>
                                    <span className="text-sm font-medium">{selectedEvent.actualParticipants}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className={`h-2.5 rounded-full ${selectedEvent.actualParticipants >= selectedEvent.expectedParticipants
                                        ? "bg-green-500"
                                        : "bg-amber-500"
                                        }`}
                                      style={{
                                        width: `${Math.min(
                                          (selectedEvent.actualParticipants / selectedEvent.expectedParticipants) * 100,
                                          100,
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              )}

                              {selectedEvent.status === "completed" && (
                                <div className="pt-2">
                                  <p className="text-sm font-medium mb-2">Attendance Rate</p>
                                  <div className="flex items-center">
                                    <div className="text-2xl font-bold text-cedo-blue mr-2">
                                      {Math.round(
                                        (selectedEvent.actualParticipants / selectedEvent.expectedParticipants) * 100,
                                      )}
                                      %
                                    </div>
                                    {selectedEvent.actualParticipants >= selectedEvent.expectedParticipants ? (
                                      <Badge className="bg-green-100 text-green-800">Target Met</Badge>
                                    ) : (
                                      <Badge className="bg-amber-100 text-amber-800">Below Target</Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-md text-cedo-blue">Attendance Breakdown</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-40 flex items-center justify-center">
                              <PieChart className="h-32 w-32 text-cedo-blue opacity-20" />
                              {/* In a real implementation, this would be a chart component */}
                            </div>
                            <div className="flex justify-center gap-4 mt-4">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-sm">Attended</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                <span className="text-sm">Absent</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
