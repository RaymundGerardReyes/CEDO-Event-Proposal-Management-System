// frontend/src/app/admin-dashboard/notifications/NotificationsPageContent.jsx

"use client";

import { PageHeader } from "@/components/dashboard/admin/page-header";
import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card";
import { Input } from "@/components/dashboard/admin/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/admin/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuPortal, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertCircle,
    Bell,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    FileText,
    MessageSquare,
    MoreHorizontal,
    RefreshCw,
    Search,
    X
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

// Sample notification data (enhanced for variety)
const allNotifications = [
    {
        id: "notif-001", type: "proposal_submitted", title: "New Proposal: Science Fair 2025",
        message: "The Science Department has submitted a proposal for the annual Science Fair.",
        organization: "Science Department", timestamp: "2023-04-23T10:30:00Z",
        status: "unread", actionTag: "Review", icon: <FileText className="h-4 w-4" />,
        iconBg: "bg-blue-100 dark:bg-blue-900", iconColor: "text-blue-600 dark:text-blue-300", category: "organization",
        details: "Proposal includes budget for new equipment and guest speaker fees. Deadline for review: May 1st.",
        relativeTime: "2 hours ago"
    },
    {
        id: "notif-002", type: "proposal_approved", title: "Approved: Leadership Workshop",
        message: "Student Council's Leadership Workshop proposal has been approved.",
        organization: "Student Council", timestamp: "2023-04-23T08:15:00Z",
        status: "read", actionTag: "Approved", icon: <CheckCircle className="h-4 w-4" />,
        iconBg: "bg-green-100 dark:bg-green-900", iconColor: "text-green-600 dark:text-green-300", category: "organization",
        details: "Funding allocated. Event scheduled for June 10th. Promotion materials can now be prepared.",
        relativeTime: "4 hours ago"
    },
    {
        id: "notif-003", type: "event_reminder", title: "Reminder: Community Day Tomorrow",
        message: "Community Service Day starts tomorrow at 8:00 AM. Volunteers to gather at main hall.",
        organization: "Community Outreach", timestamp: "2023-04-22T10:30:00Z",
        status: "unread", actionTag: "Reminder", icon: <Calendar className="h-4 w-4" />,
        iconBg: "bg-amber-100 dark:bg-amber-900", iconColor: "text-amber-600 dark:text-amber-300", category: "organization",
        details: "Ensure all team leaders have their volunteer lists and equipment ready.",
        relativeTime: "1 day ago"
    },
    {
        id: "admin-notif-001", type: "system_update", title: "System Maintenance Scheduled",
        message: "A system update is scheduled for May 5th, 2 AM - 4 AM. Expect brief downtime.",
        organization: "IT Department", timestamp: "2023-04-24T14:00:00Z",
        status: "unread", actionTag: "System", icon: <AlertCircle className="h-4 w-4" />,
        iconBg: "bg-orange-100 dark:bg-orange-900", iconColor: "text-orange-600 dark:text-orange-300", category: "admin",
        details: "This update includes security patches and performance improvements for the proposal management module.",
        relativeTime: "30 minutes ago"
    },
    {
        id: "admin-notif-002", type: "user_feedback", title: "New User Feedback Received",
        message: "A faculty member submitted feedback regarding the file upload process.",
        organization: "System Feedback", timestamp: "2023-04-24T11:20:00Z",
        status: "unread", actionTag: "Feedback", icon: <MessageSquare className="h-4 w-4" />,
        iconBg: "bg-indigo-100 dark:bg-indigo-900", iconColor: "text-indigo-600 dark:text-indigo-300", category: "admin",
        details: "User suggests increasing the maximum file size for supporting documents. See feedback ID #FDBK-789 for full text.",
        relativeTime: "3 hours ago"
    },
    {
        id: "student-notif-001", type: "event_cancelled", title: "Event Cancelled: Coding Workshop",
        message: "The Advanced Coding Workshop scheduled for next Monday has been cancelled due to unforeseen circumstances.",
        organization: "Tech Club", timestamp: "2023-04-24T09:00:00Z",
        status: "read", actionTag: "Cancelled", icon: <X className="h-4 w-4" />,
        iconBg: "bg-red-100 dark:bg-red-900", iconColor: "text-red-600 dark:text-red-300", category: "student",
        details: "All registered participants have been notified. We apologize for any inconvenience.",
        relativeTime: "5 hours ago"
    },
];

export default function NotificationsPageContent() {
    const [notifications, setNotifications] = useState(allNotifications);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [expandedNotifications, setExpandedNotifications] = useState(new Set());

    const markAllAsRead = useCallback(() => {
        setNotifications(prev =>
            prev.map((notif) => ({
                ...notif,
                status: "read",
            }))
        );
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map((notif) => (notif.id === id ? { ...notif, status: "read" } : notif))
        );
    }, []);

    const toggleExpand = useCallback((id) => {
        setExpandedNotifications(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const bumpNotification = useCallback((id) => {
        // In a real app, this would call an API to bump the notification
        alert(`Notification ${id} has been bumped to the top of the admin's queue.`);
    }, []);

    const isExpanded = useCallback((id) => expandedNotifications.has(id), [expandedNotifications]);

    // Memoized filtering logic
    const filteredNotifications = useMemo(() => {
        return notifications.filter((notif) => {
            const matchesSearch =
                notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                notif.organization.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || notif.status === statusFilter;
            const matchesType = typeFilter === "all" || notif.type.includes(typeFilter);

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [notifications, searchTerm, statusFilter, typeFilter]);

    // Memoized grouping logic
    const { groupedNotifications, sortedDates } = useMemo(() => {
        const grouped = filteredNotifications.reduce((groups, notif) => {
            const date = new Date(notif.timestamp).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(notif);
            return groups;
        }, {});

        const sorted = Object.keys(grouped).sort((a, b) => {
            return new Date(b) - new Date(a);
        });

        return { groupedNotifications: grouped, sortedDates: sorted };
    }, [filteredNotifications]);

    return (
        <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
            <PageHeader title="Notifications" subtitle="Track all activities and updates" />

            <Card className="mb-6 overflow-visible">
                <CardHeader className="pb-3">
                    <CardTitle>Notification Center</CardTitle>
                </CardHeader>
                <CardContent className="overflow-visible">
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
                            <Button variant="outline" onClick={markAllAsRead}>
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
                                    <div className="space-y-1 rounded-md border overflow-visible">
                                        {groupedNotifications[date].map((notification) => (
                                            <div key={notification.id} className="border-b last:border-b-0">
                                                <div
                                                    className={`flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors ${notification.status === "unread" ? "bg-blue-50/50" : ""
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
                                                                <p className="text-sm font-medium">{notification.title}</p>
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
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        toggleExpand(notification.id);
                                                                    }}
                                                                >
                                                                    {isExpanded(notification.id) ? (
                                                                        <ChevronUp className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6"
                                                                        >
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuPortal>
                                                                        <DropdownMenuContent align="end" className="w-48 z-[100]">
                                                                            <DropdownMenuItem onSelect={() => markAsRead(notification.id)}>
                                                                                Mark as read
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem onSelect={() => bumpNotification(notification.id)}>
                                                                                Bump notification
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenuPortal>
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

                                                {isExpanded(notification.id) && (
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
    );
} 