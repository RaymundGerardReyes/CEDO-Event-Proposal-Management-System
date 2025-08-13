// frontend/src/app/student-dashboard/notifications/NotificationsPageContent.jsx

"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Bell,
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    RefreshCw,
    Search
} from "lucide-react";
import { useState } from "react";

// Sample notification data
const allNotifications = [
    // ... (copy the allNotifications array from page.jsx)
];

export default function NotificationsPageContent() {
    const [notifications, setNotifications] = useState(allNotifications);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [expandedNotification, setExpandedNotification] = useState(null);

    const markAllAsRead = () => {
        setNotifications(
            notifications.map((notif) => ({
                ...notif,
                status: "read",
            }))
        );
    };

    const markAsRead = (id) => {
        setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, status: "read" } : notif)));
    };

    const toggleExpand = (id) => {
        setExpandedNotification(expandedNotification === id ? null : id);
    };

    const bumpNotification = (id) => {
        // In a real app, this would call an API to bump the notification
        alert(`Notification ${id} has been bumped to the top of the admin's queue.`);
    };

    // Filter notifications based on search, status, and type
    const filteredNotifications = notifications.filter((notif) => {
        const matchesSearch =
            notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notif.organization.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || notif.status === statusFilter;
        const matchesType = typeFilter === "all" || notif.type.includes(typeFilter);

        return matchesSearch && matchesStatus && matchesType;
    });

    // Group notifications by date
    const groupedNotifications = filteredNotifications.reduce((groups, notif) => {
        const date = new Date(notif.timestamp).toLocaleDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(notif);
        return groups;
    }, {});

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedNotifications).sort((a, b) => {
        return new Date(b) - new Date(a);
    });

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
                                    <div className="space-y-1 rounded-md border overflow-hidden">
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
    );
} 