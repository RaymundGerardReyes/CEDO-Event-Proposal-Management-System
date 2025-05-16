"use client"

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  CheckCircle,
  Calendar,
  X,
  AlertCircle,
  Edit,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  RefreshCw,
  Bell,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Sample notification data
const allNotifications = [
  // Organization notifications
  {
    id: "notif-001",
    type: "proposal_submitted",
    title: "New Proposal Submitted",
    message: "Science Fair Exhibition proposal was submitted by Alex Johnson",
    organization: "Science Department",
    timestamp: "2023-04-23T10:30:00",
    relativeTime: "10 minutes ago",
    status: "unread",
    actionTag: "New",
    icon: <FileText className="h-4 w-4" />,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    category: "organization",
  },
  {
    id: "notif-002",
    type: "proposal_approved",
    title: "Proposal Approved",
    message: "Leadership Workshop proposal has been approved",
    organization: "Student Council",
    timestamp: "2023-04-23T08:15:00",
    relativeTime: "2 hours ago",
    status: "read",
    actionTag: "Approved",
    icon: <CheckCircle className="h-4 w-4" />,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    category: "organization",
  },
  {
    id: "notif-003",
    type: "event_reminder",
    title: "Event Reminder",
    message: "Community Service Day starts tomorrow at 8:00 AM",
    organization: "Community Outreach",
    timestamp: "2023-04-22T10:30:00",
    relativeTime: "1 day ago",
    status: "unread",
    actionTag: "Reminder",
    icon: <Calendar className="h-4 w-4" />,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    category: "organization",
  },
  {
    id: "notif-004",
    type: "proposal_rejected",
    title: "Proposal Rejected",
    message: "Tech Conference proposal was rejected. See comments for details.",
    organization: "Tech Club",
    timestamp: "2023-04-22T09:45:00",
    relativeTime: "1 day ago",
    status: "read",
    actionTag: "Rejected",
    icon: <X className="h-4 w-4" />,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    category: "organization",
  },
  {
    id: "notif-005",
    type: "revision_requested",
    title: "Revision Requested",
    message: "Please revise your Cultural Festival proposal based on the feedback",
    organization: "Cultural Affairs",
    timestamp: "2023-04-21T14:20:00",
    relativeTime: "2 days ago",
    status: "read",
    actionTag: "Needs Revision",
    icon: <Edit className="h-4 w-4" />,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    category: "organization",
  },
  {
    id: "notif-006",
    type: "comment_added",
    title: "New Comment",
    message: "Admin has added a comment to your Alumni Networking Event proposal",
    organization: "Alumni Association",
    timestamp: "2023-04-20T11:30:00",
    relativeTime: "3 days ago",
    status: "read",
    actionTag: "Comment",
    icon: <MessageSquare className="h-4 w-4" />,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    category: "organization",
  },
  {
    id: "notif-007",
    type: "concern_raised",
    title: "Concern Raised",
    message: "A concern has been raised about the Research Symposium venue",
    organization: "Research Department",
    timestamp: "2023-04-19T09:15:00",
    relativeTime: "4 days ago",
    status: "read",
    actionTag: "Concern",
    icon: <AlertCircle className="h-4 w-4" />,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    category: "organization",
  },

  // Admin notifications
  {
    id: "admin-notif-001",
    type: "proposal_submitted",
    title: "New Proposal Submitted",
    message: "Annual Sports Tournament proposal submitted by Athletics Department",
    organization: "Athletics Department",
    timestamp: "2023-04-23T10:25:00",
    relativeTime: "5 minutes ago",
    status: "unread",
    actionTag: "New",
    icon: <FileText className="h-4 w-4" />,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    category: "admin",
  },
  {
    id: "admin-notif-002",
    type: "proposal_edited",
    title: "Proposal Updated",
    message: "Music Club has updated their Concert Series proposal",
    organization: "Music Club",
    timestamp: "2023-04-23T10:00:00",
    relativeTime: "30 minutes ago",
    status: "unread",
    actionTag: "Updated",
    icon: <Edit className="h-4 w-4" />,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    category: "admin",
  },
  {
    id: "admin-notif-003",
    type: "concern_raised",
    title: "Student Concern",
    message: "A student has raised a concern about the Debate Competition judging criteria",
    organization: "Debate Society",
    timestamp: "2023-04-23T09:30:00",
    relativeTime: "1 hour ago",
    status: "unread",
    actionTag: "Concern",
    icon: <AlertCircle className="h-4 w-4" />,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    category: "admin",
  },
  {
    id: "admin-notif-004",
    type: "proposal_approved",
    title: "Proposal Approved",
    message: "You approved the Photography Exhibition proposal from Photography Club",
    organization: "Photography Club",
    timestamp: "2023-04-22T15:45:00",
    relativeTime: "1 day ago",
    status: "read",
    actionTag: "Approved",
    icon: <CheckCircle className="h-4 w-4" />,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    category: "admin",
  },
  {
    id: "admin-notif-005",
    type: "proposal_rejected",
    title: "Proposal Rejected",
    message: "You rejected the Off-Campus Trip proposal from Adventure Club",
    organization: "Adventure Club",
    timestamp: "2023-04-22T14:30:00",
    relativeTime: "1 day ago",
    status: "read",
    actionTag: "Rejected",
    icon: <X className="h-4 w-4" />,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    category: "admin",
  },

  // Student notifications
  {
    id: "student-notif-001",
    type: "event_registration",
    title: "Event Registration Confirmed",
    message: "Your registration for the Leadership Workshop has been confirmed",
    organization: "Student Council",
    timestamp: "2023-04-23T09:45:00",
    relativeTime: "45 minutes ago",
    status: "unread",
    actionTag: "Confirmed",
    icon: <CheckCircle className="h-4 w-4" />,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    category: "student",
  },
  {
    id: "student-notif-002",
    type: "event_reminder",
    title: "Event Reminder",
    message: "The Science Fair Exhibition starts tomorrow at 9:00 AM",
    organization: "Science Department",
    timestamp: "2023-04-22T10:30:00",
    relativeTime: "1 day ago",
    status: "read",
    actionTag: "Reminder",
    icon: <Calendar className="h-4 w-4" />,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    category: "student",
  },
  {
    id: "student-notif-003",
    type: "comment_response",
    title: "Response to Your Comment",
    message: "The organizer has responded to your question about the Cultural Festival",
    organization: "Cultural Affairs",
    timestamp: "2023-04-21T15:30:00",
    relativeTime: "2 days ago",
    status: "read",
    actionTag: "Response",
    icon: <MessageSquare className="h-4 w-4" />,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    category: "student",
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(allNotifications)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [expandedNotification, setExpandedNotification] = useState(null)

  const markAllAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({
        ...notif,
        status: "read",
      })),
    )
  }

  const markAsRead = (id) => {
    setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, status: "read" } : notif)))
  }

  const toggleExpand = (id) => {
    setExpandedNotification(expandedNotification === id ? null : id)
  }

  const bumpNotification = (id) => {
    // In a real app, this would call an API to bump the notification
    alert(`Notification ${id} has been bumped to the top of the admin's queue.`)
  }

  // Filter notifications based on search, status, and type
  const filteredNotifications = notifications.filter((notif) => {
    const matchesSearch =
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.organization.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || notif.status === statusFilter
    const matchesType = typeFilter === "all" || notif.type.includes(typeFilter)

    return matchesSearch && matchesStatus && matchesType
  })

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notif) => {
    const date = new Date(notif.timestamp).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(notif)
    return groups
  }, {})

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedNotifications).sort((a, b) => {
    return new Date(b) - new Date(a)
  })

  return (
    <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
      <PageHeader title="Notifications" subtitle="Track all activities and updates" />

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Notification Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Tabs defaultValue="all" className="w-full sm:w-auto">
              <TabsList className="grid w-full sm:w-auto grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex w-full sm:w-auto gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search notifications..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="proposal">Proposals</SelectItem>
                  <SelectItem value="event">Events</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="concern">Concerns</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={markAllAsRead} className="text-black">
                Mark All Read
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {sortedDates.length > 0 ? (
              sortedDates.map((date) => (
                <div key={date} className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-[#f8f9fa] py-1">
                    {date === new Date().toLocaleDateString() ? "Today" : date}
                  </h3>
                  <div className="space-y-1 rounded-md border overflow-hidden">
                    {groupedNotifications[date].map((notification) => (
                      <div key={notification.id} className="border-b last:border-b-0">
                        <div
                          className={`flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors ${
                            notification.status === "unread" ? "bg-blue-50/50" : ""
                          }`}
                        >
                          <div
                            className={`h-10 w-10 rounded-full ${notification.iconBg} flex items-center justify-center ${notification.iconColor} flex-shrink-0`}
                          >
                            {notification.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-black">{notification.title}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[300px] sm:max-w-[400px] md:max-w-full">
                                  {notification.message}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant="outline" className="text-xs h-5">
                                  {notification.actionTag}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{notification.relativeTime}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleExpand(notification.id)}
                                >
                                  {expandedNotification === notification.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                      Mark as read
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => bumpNotification(notification.id)}>
                                      Bump notification
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-xs text-muted-foreground">{notification.organization}</p>
                              {notification.status === "unread" && (
                                <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                              )}
                            </div>
                          </div>
                        </div>

                        {expandedNotification === notification.id && (
                          <div className="p-4 bg-gray-50 border-t animate-in slide-in-from-top duration-300">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-sm font-medium">Details</h4>
                                <p className="text-sm">{notification.message}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium">Organization</h4>
                                  <p className="text-sm text-muted-foreground">{notification.organization}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium">Timestamp</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-cedo-blue"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Mark as read
                                </Button>

                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => bumpNotification(notification.id)}>
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Bump
                                  </Button>
                                  <Button variant="default" size="sm" className="bg-cedo-blue hover:bg-cedo-blue/90">
                                    View Related Item
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="rounded-full bg-gray-100 p-3">
                  <Bell className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium">No notifications found</h3>
                <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or check back later</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
