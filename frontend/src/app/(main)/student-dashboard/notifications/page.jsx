"use client"

import { PageHeader } from "@/components/page-header"
import { useEffect, useState } from "react"

export default function NotificationsPage() {
    const [filter, setFilter] = useState("all")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Get the filter from URL on client side after mount
        const params = new URLSearchParams(window.location.search)
        const filterParam = params.get("filter")
        if (filterParam) {
            setFilter(filterParam)
        }

        // Listen for URL changes (back/forward navigation)
        const handleRouteChange = () => {
            const newParams = new URLSearchParams(window.location.search)
            const newFilter = newParams.get("filter") || "all"
            setFilter(newFilter)
        }

        window.addEventListener("popstate", handleRouteChange)
        setIsLoading(false)

        return () => {
            window.removeEventListener("popstate", handleRouteChange)
        }
    }, [])

    // Sample notifications data
    const notifications = [
        { id: 1, title: "New announcement", content: "There will be a meeting tomorrow", type: "announcement" },
        { id: 2, title: "Proposal approved", content: "Your proposal has been approved", type: "proposal" },
        { id: 3, title: "Deadline reminder", content: "Project submission deadline is approaching", type: "reminder" },
    ]

    // Filter notifications based on the filter parameter
    const filteredNotifications =
        filter === "all" ? notifications : notifications.filter((notification) => notification.type === filter)

    if (isLoading) {
        return (
            <div className="container mx-auto py-6">
                <PageHeader heading="Notifications" subheading="View your notifications" />
                <div className="mt-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="border-b pb-4">
                                    <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-6">
            <PageHeader heading="Notifications" subheading="View your notifications" />

            <div className="mt-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Your Notifications</h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => {
                                    setFilter("all")
                                    window.history.pushState({}, "", "?filter=all")
                                }}
                                className={`px-3 py-1 rounded ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => {
                                    setFilter("announcement")
                                    window.history.pushState({}, "", "?filter=announcement")
                                }}
                                className={`px-3 py-1 rounded ${filter === "announcement" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                            >
                                Announcements
                            </button>
                            <button
                                onClick={() => {
                                    setFilter("proposal")
                                    window.history.pushState({}, "", "?filter=proposal")
                                }}
                                className={`px-3 py-1 rounded ${filter === "proposal" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                            >
                                Proposals
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredNotifications.length > 0 ? (
                            filteredNotifications.map((notification) => (
                                <div key={notification.id} className="border-b pb-4">
                                    <h3 className="font-medium">{notification.title}</h3>
                                    <p className="text-muted-foreground">{notification.content}</p>
                                </div>
                            ))
                        ) : (
                            <p>No notifications found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
