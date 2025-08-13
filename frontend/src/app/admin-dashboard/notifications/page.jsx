// frontend/src/app/admin-dashboard/notifications/page.jsx

"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { Suspense, useState } from "react"
// Ensure the path to PageHeader is correct for the admin dashboard
import { PageHeader } from "@/components/dashboard/admin/page-header"
import { Badge } from "@/components/dashboard/admin/ui/badge"
import { Button } from "@/components/dashboard/admin/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card"
import { Input } from "@/components/dashboard/admin/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/admin/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertCircle,
  Archive,
  Bell,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Search,
  X
} from "lucide-react"

// Sample notification data (enhanced for variety)
const allNotifications = [
  {
    id: "notif-001", type: "proposal_submitted", title: "New Proposal: Science Fair 2025",
    message: "The Science Department has submitted a proposal for the annual Science Fair.",
    organization: "Science Department", timestamp: "2023-04-23T10:30:00Z",
    status: "unread", actionTag: "Review", icon: <FileText className="h-4 w-4" />,
    iconBg: "bg-blue-100 dark:bg-blue-900", iconColor: "text-blue-600 dark:text-blue-300", category: "organization",
    details: "Proposal includes budget for new equipment and guest speaker fees. Deadline for review: May 1st."
  },
  {
    id: "notif-002", type: "proposal_approved", title: "Approved: Leadership Workshop",
    message: "Student Council's Leadership Workshop proposal has been approved.",
    organization: "Student Council", timestamp: "2023-04-23T08:15:00Z",
    status: "read", actionTag: "Approved", icon: <CheckCircle className="h-4 w-4" />,
    iconBg: "bg-green-100 dark:bg-green-900", iconColor: "text-green-600 dark:text-green-300", category: "organization",
    details: "Funding allocated. Event scheduled for June 10th. Promotion materials can now be prepared."
  },
  {
    id: "notif-003", type: "event_reminder", title: "Reminder: Community Day Tomorrow",
    message: "Community Service Day starts tomorrow at 8:00 AM. Volunteers to gather at main hall.",
    organization: "Community Outreach", timestamp: "2023-04-22T10:30:00Z",
    status: "unread", actionTag: "Reminder", icon: <Calendar className="h-4 w-4" />,
    iconBg: "bg-amber-100 dark:bg-amber-900", iconColor: "text-amber-600 dark:text-amber-300", category: "organization",
    details: "Ensure all team leaders have their volunteer lists and equipment ready."
  },
  {
    id: "admin-notif-001", type: "system_update", title: "System Maintenance Scheduled",
    message: "A system update is scheduled for May 5th, 2 AM - 4 AM. Expect brief downtime.",
    organization: "IT Department", timestamp: "2023-04-24T14:00:00Z",
    status: "unread", actionTag: "System", icon: <AlertCircle className="h-4 w-4" />,
    iconBg: "bg-orange-100 dark:bg-orange-900", iconColor: "text-orange-600 dark:text-orange-300", category: "admin",
    details: "This update includes security patches and performance improvements for the proposal management module."
  },
  {
    id: "admin-notif-002", type: "user_feedback", title: "New User Feedback Received",
    message: "A faculty member submitted feedback regarding the file upload process.",
    organization: "System Feedback", timestamp: "2023-04-24T11:20:00Z",
    status: "unread", actionTag: "Feedback", icon: <MessageSquare className="h-4 w-4" />,
    iconBg: "bg-indigo-100 dark:bg-indigo-900", iconColor: "text-indigo-600 dark:text-indigo-300", category: "admin",
    details: "User suggests increasing the maximum file size for supporting documents. See feedback ID #FDBK-789 for full text."
  },
  {
    id: "student-notif-001", type: "event_cancelled", title: "Event Cancelled: Coding Workshop",
    message: "The Advanced Coding Workshop scheduled for next Monday has been cancelled due to unforeseen circumstances.",
    organization: "Tech Club", timestamp: "2023-04-24T09:00:00Z",
    status: "read", actionTag: "Cancelled", icon: <X className="h-4 w-4" />,
    iconBg: "bg-red-100 dark:bg-red-900", iconColor: "text-red-600 dark:text-red-300", category: "student",
    details: "All registered participants have been notified. We apologize for any inconvenience."
  },
];

// Utility to format date for display (e.g., "April 23, 2023")
const formatDateHeading = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Utility to format time for display (e.g., "10:30 AM")
const formatTime = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Fallback for PageHeader if it uses useSearchParams or takes time to load
const PageHeaderFallback = () => (
  <div className="mb-6 animate-pulse">
    <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

function NotificationsContent() {
  const [notifications, setNotifications] = useState(allNotifications);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedNotification, setExpandedNotification] = useState(null);

  // If PageHeader needs useSearchParams, it must be a client component.
  // And it's good practice to import useSearchParams here if this component *also* used it.
  // import { useSearchParams } from 'next/navigation';
  // const searchParams = useSearchParams(); 

  const handleMarkAsRead = (id) => {
    setNotifications(
      notifications.map((notif) =>
        notif.id === id ? { ...notif, status: "read" } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(
      notifications.map((notif) => ({ ...notif, status: "read" }))
    );
  };

  const handleDeleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
    // Consider adding a toast notification for deletion using your useToast hook
  };

  const toggleExpand = (id) => {
    setExpandedNotification(expandedNotification === id ? null : id);
  };

  const filteredNotifications = notifications.filter((notif) => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const matchesSearch =
      notif.title.toLowerCase().includes(lowerSearchTerm) ||
      notif.message.toLowerCase().includes(lowerSearchTerm) ||
      notif.organization.toLowerCase().includes(lowerSearchTerm);
    const matchesStatus = statusFilter === "all" || notif.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || notif.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const groupedNotifications = filteredNotifications.reduce((groups, notif) => {
    const dateKey = new Date(notif.timestamp).toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(notif);
    return groups;
  }, {});

  const sortedDateKeys = Object.keys(groupedNotifications).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      {/* Wrap PageHeader in its own Suspense boundary.
        This is crucial if PageHeader itself uses useSearchParams or other client hooks.
        Ensure PageHeader component file (e.g., @/components/dashboard/admin/page-header.jsx)
        has "use client"; at the top.
      */}
      <Suspense fallback={<PageHeaderFallback />}>
        <PageHeader title="Notifications" subtitle="Track all activities and updates across the system" />
      </Suspense>

      <Card className="mb-6 border dark:border-gray-700 shadow-sm rounded-lg">
        <CardHeader className="pb-4 border-b dark:border-gray-700">
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">Notification Center</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full md:flex-grow md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="search"
                placeholder="Search notifications..."
                className="pl-10 w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[150px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleMarkAllAsRead} className="w-full sm:w-auto border-gray-300 dark:border-gray-600">
                Mark All Read
              </Button>
            </div>
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-10">
              <Bell className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? "No notifications match your current filters."
                  : "You're all caught up!"}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {sortedDateKeys.map((dateKey) => (
              <div key={dateKey}>
                <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 py-2 my-2 border-b dark:border-gray-700">
                  {formatDateHeading(dateKey)}
                </h3>
                <ul className="space-y-1">
                  {groupedNotifications[dateKey].map((notification) => (
                    <li key={notification.id} className={`rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/50 border dark:border-gray-700 ${notification.status === "unread" ? "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-500" : "bg-white dark:bg-gray-800/50"}`}>
                      <div className="flex items-start gap-3 p-3">
                        <div className={`mt-1 h-8 w-8 rounded-full ${notification.iconBg} flex items-center justify-center ${notification.iconColor} flex-shrink-0`}>
                          {notification.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <Badge variant={notification.status === "unread" ? "default" : "outline"} className={`text-xs h-5 whitespace-nowrap ${notification.status === "unread" ? "bg-blue-500 text-white dark:bg-blue-600 dark:text-blue-50" : "dark:border-gray-600"}`}>
                                {notification.actionTag}
                              </Badge>
                              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatTime(notification.timestamp)}</span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => toggleExpand(notification.id)}>
                                    {expandedNotification === notification.id ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                                    {expandedNotification === notification.id ? "Hide Details" : "Show Details"}
                                  </DropdownMenuItem>
                                  {notification.status === "unread" && (
                                    <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                      <CheckCircle className="mr-2 h-4 w-4" /> Mark as read
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem>
                                    <Archive className="mr-2 h-4 w-4" /> Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600 dark:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/50 focus:text-red-700 dark:focus:text-red-400" onClick={() => handleDeleteNotification(notification.id)}>
                                    <X className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-full">{notification.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{notification.organization}</p>
                        </div>
                      </div>
                      {expandedNotification === notification.id && (
                        <div className="p-3 ml-11 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-b-md">
                          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">Details:</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{notification.details || "No additional details."}</p>
                          <div className="mt-2 flex gap-2">
                            <Button size="xs" variant="outline" className="dark:border-gray-600">View Related Item</Button>
                            {notification.category === "admin" && notification.type === "user_feedback" && (
                              <Button size="xs" variant="outline" className="dark:border-gray-600">Respond to Feedback</Button>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Fallback component for Suspense, used when the main content is loading
function NotificationsPageLoading() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8 animate-pulse">
      <PageHeaderFallback /> {/* Use the specific fallback for PageHeader */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-6 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="h-10 w-full md:w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-gray-100 dark:bg-gray-700/50">
                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-3 w-full bg-gray-200 dark:bg-gray-500 rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-500 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminNotificationsPage() {
  return (
    <Suspense fallback={<NotificationsPageLoading />}>
      <NotificationsContent />
    </Suspense>
  );
}
