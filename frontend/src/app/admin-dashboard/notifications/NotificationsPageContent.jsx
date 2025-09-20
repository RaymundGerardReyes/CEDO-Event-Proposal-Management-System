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
    Building,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    FileText,
    MessageSquare,
    MoreHorizontal,
    RefreshCw,
    Search,
    Shield,
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 -m-4 sm:-m-6 md:-m-8 lg:-m-10">
            {/* Enhanced Page Header with responsive spacing */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <PageHeader
                        title="Notifications"
                        subtitle="Track all activities and updates across the system"
                    />
                </div>
            </div>

            {/* Main content with enhanced responsive grid layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <Card className="border border-gray-200/60 shadow-lg rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl overflow-visible">
                    <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 border-b border-gray-200/60">
                        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-cedo-blue mb-3 flex items-center gap-3">
                            <div className="p-2 sm:p-3 rounded-xl bg-cedo-blue/10">
                                <Bell className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-cedo-blue" />
                            </div>
                            <div>
                                <span>Notification Center</span>
                                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 font-normal">
                                    Stay updated with all system activities and important updates
                                </p>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8 overflow-visible">
                        {/* Enhanced responsive tabs and filters grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
                            {/* Left column - Tabs */}
                            <div className="xl:col-span-1">
                                <Tabs defaultValue="all" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 bg-white/50 backdrop-blur-sm border border-gray-200/60 shadow-sm rounded-xl h-auto">
                                        <TabsTrigger
                                            value="all"
                                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                                        >
                                            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">All</span>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="unread"
                                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                                        >
                                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">Unread</span>
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="admin"
                                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg transition-all duration-300 hover:scale-105 active:scale-95"
                                        >
                                            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="hidden sm:inline">Admin</span>
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {/* Right column - Search and filters */}
                            <div className="xl:col-span-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {/* Search bar */}
                                    <div className="sm:col-span-2 lg:col-span-2">
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                            <Input
                                                type="search"
                                                placeholder="Search notifications..."
                                                className="pl-12 pr-4 h-12 sm:h-14 text-sm sm:text-base border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue/20 rounded-xl"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Status filter */}
                                    <div className="sm:col-span-1 lg:col-span-1">
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="h-12 sm:h-14 text-sm sm:text-base border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue/20 rounded-xl">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="unread">Unread</SelectItem>
                                                <SelectItem value="read">Read</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Type filter */}
                                    <div className="sm:col-span-1 lg:col-span-1">
                                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                                            <SelectTrigger className="h-12 sm:h-14 text-sm sm:text-base border-gray-300 focus:border-cedo-blue focus:ring-cedo-blue/20 rounded-xl">
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
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 sm:mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={markAllAsRead}
                                        className="h-12 sm:h-14 text-sm sm:text-base border-cedo-blue/30 text-cedo-blue hover:bg-cedo-blue hover:text-white rounded-xl transition-all duration-300"
                                    >
                                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                        Mark All Read
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-12 sm:h-14 text-sm sm:text-base border-gray-300 text-gray-600 hover:border-cedo-blue hover:text-cedo-blue rounded-xl transition-all duration-300"
                                    >
                                        <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                        Refresh
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced notifications list with responsive grid */}
                        <div className="space-y-6 sm:space-y-8">
                            {sortedDates.length > 0 ? (
                                sortedDates.map((date) => (
                                    <div key={date} className="space-y-4 sm:space-y-6">
                                        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 py-3 sm:py-4">
                                            <h3 className="text-lg sm:text-xl font-bold text-cedo-blue flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-cedo-blue/10">
                                                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                                                </div>
                                                {date === new Date().toLocaleDateString() ? "Today" : date}
                                            </h3>
                                        </div>
                                        <div className="space-y-3 sm:space-y-4">
                                            {groupedNotifications[date].map((notification) => (
                                                <div key={notification.id} className="border border-gray-200/60 rounded-xl bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 overflow-visible">
                                                    <div
                                                        className={`flex items-start gap-4 sm:gap-6 p-4 sm:p-6 hover:bg-gradient-to-r hover:from-cedo-blue/5 hover:to-transparent transition-all duration-300 ${notification.status === "unread" ? "bg-gradient-to-r from-blue-50/80 to-transparent border-l-4 border-l-cedo-blue" : ""
                                                            }`}
                                                    >
                                                        <div
                                                            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl ${notification.iconBg} flex items-center justify-center ${notification.iconColor} flex-shrink-0 shadow-sm`}
                                                        >
                                                            {notification.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                                                {/* Main content */}
                                                                <div className="lg:col-span-8">
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-base sm:text-lg font-semibold text-gray-900">{notification.title}</h4>
                                                                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                                                                            {notification.message}
                                                                        </p>
                                                                        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500">
                                                                            <span className="flex items-center gap-1">
                                                                                <Building className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                                {notification.organization}
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                                {notification.relativeTime}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Actions and status */}
                                                                <div className="lg:col-span-4">
                                                                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 items-start sm:items-center lg:items-end">
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="text-xs sm:text-sm px-3 py-1 border-cedo-blue/30 text-cedo-blue bg-cedo-blue/10"
                                                                            >
                                                                                {notification.actionTag}
                                                                            </Badge>
                                                                            {notification.status === "unread" && (
                                                                                <div className="h-3 w-3 rounded-full bg-cedo-blue animate-pulse"></div>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-8 w-8 p-0 hover:bg-cedo-blue/10 hover:text-cedo-blue"
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
                                                                                        size="sm"
                                                                                        className="h-8 w-8 p-0 hover:bg-cedo-blue/10 hover:text-cedo-blue"
                                                                                    >
                                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuPortal>
                                                                                    <DropdownMenuContent align="end" className="w-48 z-[100] border border-gray-200/60 shadow-lg rounded-xl">
                                                                                        <DropdownMenuItem
                                                                                            onSelect={(e) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                markAsRead(notification.id);
                                                                                            }}
                                                                                            className="cursor-pointer"
                                                                                        >
                                                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                                                            Mark as read
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem
                                                                                            onSelect={(e) => {
                                                                                                e.preventDefault();
                                                                                                e.stopPropagation();
                                                                                                bumpNotification(notification.id);
                                                                                            }}
                                                                                            className="cursor-pointer"
                                                                                        >
                                                                                            <RefreshCw className="h-4 w-4 mr-2" />
                                                                                            Bump notification
                                                                                        </DropdownMenuItem>
                                                                                    </DropdownMenuContent>
                                                                                </DropdownMenuPortal>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isExpanded(notification.id) && (
                                                        <div className="p-4 sm:p-6 bg-gradient-to-r from-gray-50/80 to-white/60 border-t border-gray-200/60 animate-in slide-in-from-top duration-300">
                                                            <div className="space-y-4 sm:space-y-6">
                                                                <div className="space-y-3">
                                                                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-cedo-blue" />
                                                                        Additional Details
                                                                    </h4>
                                                                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed bg-white/60 p-4 rounded-lg border border-gray-200/60">
                                                                        {notification.details}
                                                                    </p>
                                                                </div>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                                    <div className="bg-white/60 p-4 rounded-lg border border-gray-200/60">
                                                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                                            <Building className="h-4 w-4 text-cedo-blue" />
                                                                            Organization
                                                                        </h4>
                                                                        <p className="text-sm text-gray-600">{notification.organization}</p>
                                                                    </div>
                                                                    <div className="bg-white/60 p-4 rounded-lg border border-gray-200/60">
                                                                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                                                            <Calendar className="h-4 w-4 text-cedo-blue" />
                                                                            Timestamp
                                                                        </h4>
                                                                        <p className="text-sm text-gray-600">
                                                                            {new Date(notification.timestamp).toLocaleString()}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200/60">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="text-xs border-gray-300 text-gray-600"
                                                                        >
                                                                            {notification.category}
                                                                        </Badge>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`text-xs ${notification.status === 'unread' ? 'border-cedo-blue text-cedo-blue bg-cedo-blue/10' : 'border-gray-300 text-gray-600'}`}
                                                                        >
                                                                            {notification.status}
                                                                        </Badge>
                                                                    </div>

                                                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="text-cedo-blue border-cedo-blue/30 hover:bg-cedo-blue hover:text-white"
                                                                            onClick={() => markAsRead(notification.id)}
                                                                        >
                                                                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                                            Mark as read
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => bumpNotification(notification.id)}
                                                                            className="border-gray-300 text-gray-600 hover:border-cedo-blue hover:text-cedo-blue"
                                                                        >
                                                                            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                                                            Bump
                                                                        </Button>
                                                                        <Button
                                                                            variant="default"
                                                                            size="sm"
                                                                            className="bg-cedo-blue hover:bg-cedo-blue/90 text-white"
                                                                        >
                                                                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
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
                                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                                    <div className="rounded-full bg-gradient-to-br from-gray-100 to-gray-200 p-6 sm:p-8 shadow-lg">
                                        <Bell className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                                    </div>
                                    <h3 className="mt-6 text-xl sm:text-2xl font-semibold text-gray-900">No notifications found</h3>
                                    <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-md">
                                        Try adjusting your filters or check back later for new updates
                                    </p>
                                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSearchTerm('');
                                                setStatusFilter('all');
                                                setTypeFilter('all');
                                            }}
                                            className="border-cedo-blue/30 text-cedo-blue hover:bg-cedo-blue hover:text-white"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Clear Filters
                                        </Button>
                                        <Button
                                            variant="default"
                                            className="bg-cedo-blue hover:bg-cedo-blue/90 text-white"
                                        >
                                            <Bell className="h-4 w-4 mr-2" />
                                            Refresh Notifications
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 